import { useState } from 'react';
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

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

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

      if (!paymentFile) {
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

      // Generate receipt number
      const receiptNumber = generateReceiptNumber();

      // Upload payment screenshot
      const paymentScreenshotUrl = await uploadPaymentScreenshot(paymentFile, receiptNumber);

      // Create booking
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .insert([
          {
            employee_id: user.id,
            booking_date: bookingDate,
            meal_type: mealType,
            payment_status: BOOKING_STATUS.PENDING,
            payment_screenshot_url: paymentScreenshotUrl,
            receipt_number: receiptNumber,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSuccess(`Booking created successfully! Your receipt number is: ${receiptNumber}`);
      
      // Reset form
      setMealType(MEAL_TYPES.VEG);
      setBookingDate('');
      setPaymentFile(null);
      setPaymentFilename('');
      setPaymentFileValue('');
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
            Book your meal for tomorrow. Please complete payment via UPI and upload the screenshot.
          </p>

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
                label="Vegetarian"
                isChecked={mealType === MEAL_TYPES.VEG}
                onChange={() => setMealType(MEAL_TYPES.VEG)}
              />
              <Radio
                id="non-veg"
                name="meal-type"
                label="Non-Vegetarian"
                isChecked={mealType === MEAL_TYPES.NON_VEG}
                onChange={() => setMealType(MEAL_TYPES.NON_VEG)}
              />
            </FormGroup>

            <FormGroup
              label="Payment Instructions"
              fieldId="payment-info"
              style={{ marginBottom: '16px' }}
            >
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
            </FormGroup>

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

