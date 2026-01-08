import { useState, useEffect } from 'react';
import {
  PageSection,
  Card,
  CardBody,
  Title,
  Form,
  FormGroup,
  Radio,
  DatePicker,
  Button,
  Alert,
  FileUpload,
} from '@patternfly/react-core';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, TABLES, MEAL_TYPES, BOOKING_STATUS } from '../../services/supabase';
import { format, addDays, isWeekend } from 'date-fns';
import vegIcon from '../../assets/veg.png';
import nonVegIcon from '../../assets/non_veg.png';

const BookingForm = () => {
  const { user, profile } = useAuth();
  const [mealType, setMealType] = useState(MEAL_TYPES.VEG);
  const [bookingDate, setBookingDate] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentFilename, setPaymentFilename] = useState('');
  const [paymentFileValue, setPaymentFileValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDateConfig, setSelectedDateConfig] = useState(null);

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  // Fetch available dates
  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from(TABLES.AVAILABLE_DATES)
        .select('*')
        .gte('date', today)
        .eq('is_available', true)
        .order('date', { ascending: true });

      if (error) throw error;
      setAvailableDates(data || []);
    } catch (err) {
      console.error('Error fetching available dates:', err);
    }
  };

  // Check if a date is in the available dates list
  const isDateAvailable = (dateStr) => {
    return availableDates.some(d => d.date === dateStr);
  };

  // Update selected date config when date changes
  useEffect(() => {
    if (bookingDate) {
      const config = availableDates.find(d => d.date === bookingDate);
      setSelectedDateConfig(config || null);
    } else {
      setSelectedDateConfig(null);
    }
  }, [bookingDate, availableDates]);

  const dateValidator = (date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Must be at least tomorrow
    if (selectedDate <= today) {
      return 'Please select a future date';
    }
    
    // Cannot book on weekends
    if (isWeekend(selectedDate)) {
      return 'Booking not available on weekends';
    }
    
    // Check if date is in available dates list
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (!isDateAvailable(dateStr)) {
      return 'This date is not available for booking';
    }
    
    return '';
  };

  const handleFileInputChange = (_, file) => {
    setPaymentFile(file);
    setPaymentFilename(file.name);
  };

  const handleClearClick = () => {
    setPaymentFile(null);
    setPaymentFilename('');
    setPaymentFileValue('');
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RCP${timestamp}${random}`;
  };

  const uploadPaymentScreenshot = async (file, receiptNumber) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${receiptNumber}.${fileExt}`;
    const filePath = `payment-screenshots/${fileName}`;

    const { data, error } = await supabase.storage
      .from('bookings')
      .upload(filePath, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('bookings')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Validation
      if (!bookingDate) {
        throw new Error('Please select a booking date');
      }

      const validationError = dateValidator(bookingDate);
      if (validationError) {
        throw new Error(validationError);
      }

      // Check if this is a free meal day
      const isFreeMeal = selectedDateConfig?.is_free_meal || false;

      // If not a free meal, payment screenshot is required
      if (!isFreeMeal && !paymentFile) {
        throw new Error('Please upload payment screenshot');
      }

      // Check if booking already exists for this date
      const { data: existingBooking, error: checkError } = await supabase
        .from(TABLES.BOOKINGS)
        .select('id')
        .eq('employee_id', user.id)
        .eq('booking_date', bookingDate)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingBooking) {
        throw new Error('You already have a booking for this date');
      }

      let paymentScreenshotUrl = null;
      let receiptNumber = null;

      // Only process payment if not a free meal
      if (!isFreeMeal) {
        // Generate receipt number
        receiptNumber = generateReceiptNumber();

        // Upload payment screenshot
        paymentScreenshotUrl = await uploadPaymentScreenshot(paymentFile, receiptNumber);
      } else {
        // For free meals, generate a special receipt number
        receiptNumber = `FREE${Date.now()}${Math.floor(Math.random() * 1000)}`;
      }

      // Create booking
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .insert([
          {
            employee_id: user.id,
            booking_date: bookingDate,
            meal_type: mealType,
            payment_status: isFreeMeal ? BOOKING_STATUS.APPROVED : BOOKING_STATUS.PENDING,
            payment_screenshot_url: paymentScreenshotUrl,
            receipt_number: receiptNumber,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const successMsg = isFreeMeal 
        ? `Free meal booking created successfully! Your receipt number is: ${receiptNumber}. No payment required.`
        : `Booking created successfully! Your receipt number is: ${receiptNumber}`;
      
      setSuccess(successMsg);
      
      // Reset form
      setMealType(MEAL_TYPES.VEG);
      setBookingDate('');
      setPaymentFile(null);
      setPaymentFilename('');
      setPaymentFileValue('');
      setSelectedDateConfig(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageSection>
      <Card>
        <CardBody>
          <Title headingLevel="h1" size="2xl" style={{ marginBottom: '24px' }}>
            Book Your Meal
          </Title>

          <p style={{ marginBottom: '24px' }}>
            Book your meal for available dates. Please complete payment via UPI and upload the screenshot.
            {availableDates.length > 0 && (
              <span style={{ display: 'block', marginTop: '8px', color: '#0066cc', fontWeight: 'bold' }}>
                📅 {availableDates.length} date(s) available for booking
              </span>
            )}
          </p>

          {selectedDateConfig?.is_free_meal && (
            <Alert 
              variant="success" 
              title="🎉 This is a free meal day!" 
              style={{ marginBottom: '16px' }} 
              isInline
            >
              <p>
                No payment is required for this date. 
                {selectedDateConfig.reason && ` Reason: ${selectedDateConfig.reason}`}
              </p>
            </Alert>
          )}

          {availableDates.length === 0 && (
            <Alert 
              variant="warning" 
              title="No available dates" 
              style={{ marginBottom: '16px' }} 
              isInline
            >
              <p>
                Currently, no dates are available for booking. Please check back later or contact admin.
              </p>
            </Alert>
          )}

          {error && (
            <Alert variant="danger" title={error} style={{ marginBottom: '16px' }} />
          )}

          {success && (
            <Alert variant="success" title={success} style={{ marginBottom: '16px' }} />
          )}

          <Form onSubmit={handleSubmit}>
            <FormGroup label="Select Date" isRequired fieldId="booking-date">
              <DatePicker
                id="booking-date"
                value={bookingDate}
                onChange={(e, str) => setBookingDate(str)}
                placeholder="YYYY-MM-DD"
                validators={[dateValidator]}
                dateFormat={(date) => format(date, 'yyyy-MM-dd')}
                dateParse={(str) => new Date(str)}
              />
            </FormGroup>

            <FormGroup label="Meal Type" isRequired fieldId="meal-type">
              <Radio
                id="veg"
                name="meal-type"
                label={
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <img src={vegIcon} alt="Veg" style={{ width: '14px', height: '14px' }} />
                    <span>Veg</span>
                  </div>
                }
                isChecked={mealType === MEAL_TYPES.VEG}
                onChange={() => setMealType(MEAL_TYPES.VEG)}
              />
              <Radio
                id="non-veg"
                name="meal-type"
                label={
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <img src={nonVegIcon} alt="Non-Veg" style={{ width: '16px', height: '16px' }} />
                    <span>Non-Veg</span>
                  </div>
                }
                isChecked={mealType === MEAL_TYPES.NON_VEG}
                onChange={() => setMealType(MEAL_TYPES.NON_VEG)}
              />
            </FormGroup>

            <FormGroup
              label="Payment Instructions"
              fieldId="payment-info"
              style={{ marginBottom: '16px' }}
            >
              {selectedDateConfig?.is_free_meal ? (
                <div style={{ 
                  border: '2px solid #3e8635', 
                  padding: '16px', 
                  borderRadius: '4px',
                  backgroundColor: '#f3faf2'
                }}>
                  <p style={{ marginBottom: '8px', fontWeight: 'bold', color: '#3e8635' }}>
                    🎉 Free Meal - No Payment Required
                  </p>
                  <p style={{ fontSize: '14px', color: '#1e4f18' }}>
                    This is a special day! You can book your meal without any payment.
                  </p>
                </div>
              ) : (
                <div style={{ 
                  border: '1px solid #d2d2d2', 
                  padding: '16px', 
                  borderRadius: '4px',
                  backgroundColor: '#f0f0f0'
                }}>
                  <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                    Please complete payment before submitting booking
                  </p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Note: Admin needs to add UPI QR code here. 
                    For now, upload any payment screenshot to proceed.
                  </p>
                </div>
              )}
            </FormGroup>

            {!selectedDateConfig?.is_free_meal && (
              <FormGroup
                label="Upload Payment Screenshot"
                isRequired
                fieldId="payment-screenshot"
              >
                <FileUpload
                  id="payment-screenshot"
                  value={paymentFileValue}
                  filename={paymentFilename}
                  onFileInputChange={handleFileInputChange}
                  onClearClick={handleClearClick}
                  hideDefaultPreview
                  browseButtonText="Upload"
                  filenamePlaceholder="Drag and drop a file or upload one"
                  accept="image/*"
                />
              </FormGroup>
            )}

            <Button
              variant="primary"
              type="submit"
              isDisabled={isLoading}
              isLoading={isLoading}
              style={{ marginTop: '16px' }}
            >
              {isLoading ? 'Submitting...' : 'Submit Booking'}
            </Button>
          </Form>
        </CardBody>
      </Card>
    </PageSection>
  );
};

export default BookingForm;

