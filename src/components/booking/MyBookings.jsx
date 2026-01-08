import { useState, useEffect } from 'react';
import {
  PageSection,
  Card,
  CardBody,
  Title,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalVariant,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Alert,
  Form,
  FormGroup,
  Radio,
  FileUpload,
  DatePicker,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, TABLES, BOOKING_STATUS, MEAL_TYPES } from '../../services/supabase';
import { format, differenceInDays, parseISO, isWeekend, addDays } from 'date-fns';
import vegIcon from '../../assets/veg.png';
import nonVegIcon from '../../assets/non_veg.png';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Edit form states
  const [editMealType, setEditMealType] = useState('');
  const [editBookingDate, setEditBookingDate] = useState('');
  const [editPaymentFile, setEditPaymentFile] = useState(null);
  const [editPaymentFilename, setEditPaymentFilename] = useState('');
  const [editPaymentFileValue, setEditPaymentFileValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    fetchBookings();
    fetchAvailableDates();
  }, [user]);

  const fetchAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.AVAILABLE_DATES)
        .select('*')
        .eq('is_available', true)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;
      setAvailableDates(data || []);
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('employee_id', user.id)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if booking can be edited (must be at least 2 days before)
  const canEditBooking = (bookingDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mealDate = parseISO(bookingDate);
    const daysUntilMeal = differenceInDays(mealDate, today);
    return daysUntilMeal >= 2; // At least 2 days before
  };

  // Check if category can be edited (must be at least 2 days before)
  const canEditCategory = (bookingDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mealDate = parseISO(bookingDate);
    const daysUntilMeal = differenceInDays(mealDate, today);
    return daysUntilMeal >= 2;
  };

  // Check if date can be changed (must be at least 2 days before AND not a free meal)
  const canChangeDate = (bookingDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mealDate = parseISO(bookingDate);
    const daysUntilMeal = differenceInDays(mealDate, today);
    
    // Check if it's a free meal day
    const dateConfig = availableDates.find(d => d.date === bookingDate);
    if (dateConfig && dateConfig.is_free_meal) {
      return false; // Free meals cannot change date
    }
    
    return daysUntilMeal >= 2;
  };

  // Check if booking is for a free meal
  const isFreeMeal = (bookingDate) => {
    const dateConfig = availableDates.find(d => d.date === bookingDate);
    return dateConfig && dateConfig.is_free_meal;
  };

  // Check if a date is available for booking
  const isDateAvailable = (dateStr) => {
    return availableDates.some(d => d.date === dateStr && d.is_available);
  };

  // Date validator for DatePicker
  const dateValidator = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Must be future date
    if (date <= today) {
      return 'Please select a future date';
    }
    
    // Must not be weekend
    if (isWeekend(date)) {
      return 'Weekends are not available';
    }
    
    // Must be in available dates
    if (!isDateAvailable(dateStr)) {
      return 'This date is not available for booking';
    }
    
    return '';
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case BOOKING_STATUS.APPROVED:
        return 'success';
      case BOOKING_STATUS.REJECTED:
        return 'danger';
      case BOOKING_STATUS.SERVED:
        return 'info';
      default:
        return 'warning';
    }
  };

  const getMealTypeLabel = (type) => {
    return type === 'veg' ? 'Veg' : 'Non-Veg';
  };

  const getMealTypeIcon = (type) => {
    const isVeg = type === 'veg';
    return (
      <img 
        src={isVeg ? vegIcon : nonVegIcon} 
        alt={isVeg ? 'Veg' : 'Non-Veg'}
        style={{ width: '14px', height: '14px', display: 'inline-block', verticalAlign: 'middle' }}
      />
    );
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsEditMode(false);
    setEditMealType(booking.meal_type);
    setEditBookingDate(booking.booking_date);
    setEditPaymentFile(null);
    setEditPaymentFilename('');
    setEditPaymentFileValue('');
    setEditError('');
    setIsModalOpen(true);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditMealType(selectedBooking.meal_type);
    setEditBookingDate(selectedBooking.booking_date);
    setEditPaymentFile(null);
    setEditPaymentFilename('');
    setEditPaymentFileValue('');
    setEditError('');
  };

  const handleFileInputChange = (_, file) => {
    setEditPaymentFile(file);
    setEditPaymentFilename(file.name);
  };

  const handleClearFile = () => {
    setEditPaymentFile(null);
    setEditPaymentFilename('');
    setEditPaymentFileValue('');
  };

  const uploadPaymentScreenshot = async (file, receiptNumber) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${receiptNumber}_updated.${fileExt}`;
    const filePath = `payment-screenshots/${fileName}`;

    const { data, error } = await supabase.storage
      .from('bookings')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('bookings')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleResubmit = async () => {
    setEditError('');
    setIsSubmitting(true);

    try {
      const updates = {};
      let hasChanges = false;

      // Check if date was changed and if it's allowed
      if (editBookingDate !== selectedBooking.booking_date) {
        if (!canChangeDate(selectedBooking.booking_date)) {
          throw new Error('Date can only be changed at least 2 days before the current meal date.');
        }
        if (!isDateAvailable(editBookingDate)) {
          throw new Error('The selected date is not available for booking.');
        }
        updates.booking_date = editBookingDate;
        hasChanges = true;
      }

      // Check if category was changed and if it's allowed
      if (editMealType !== selectedBooking.meal_type) {
        if (!canEditCategory(selectedBooking.booking_date)) {
          throw new Error('Category can only be changed at least 2 days before the meal date.');
        }
        updates.meal_type = editMealType;
        hasChanges = true;
      }

      // Upload new payment screenshot if provided
      if (editPaymentFile) {
        const paymentScreenshotUrl = await uploadPaymentScreenshot(
          editPaymentFile,
          selectedBooking.receipt_number
        );
        updates.payment_screenshot_url = paymentScreenshotUrl;
        hasChanges = true;
      }

      if (!hasChanges) {
        throw new Error('No changes detected. Please modify date, category, or upload a new payment screenshot.');
      }

      // Reset status to pending when resubmitting
      updates.payment_status = BOOKING_STATUS.PENDING;

      const { error } = await supabase
        .from(TABLES.BOOKINGS)
        .update(updates)
        .eq('id', selectedBooking.id);

      if (error) {
        // Check for duplicate booking constraint violation
        if (error.code === '23505' || error.message.includes('duplicate key value')) {
          throw new Error('You already have a booking for this date. Please choose a different date.');
        }
        throw error;
      }

      // Refresh bookings list
      await fetchBookings();

      // Update selected booking
      setSelectedBooking({ ...selectedBooking, ...updates });
      setIsEditMode(false);
      setEditPaymentFile(null);
      setEditPaymentFilename('');
      setEditPaymentFileValue('');
      
      alert('Booking updated successfully! Status has been reset to PENDING for admin review.');
    } catch (err) {
      setEditError(err.message || 'Failed to update booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageSection>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner size="xl" />
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Card>
        <CardBody>
          <Title headingLevel="h1" size="2xl" style={{ marginBottom: '24px' }}>
            My Bookings
          </Title>

          {bookings.length === 0 ? (
            <EmptyState variant="sm">
              <EmptyState icon={SearchIcon} titleText="No bookings found" headingLevel="h4" />
              <EmptyStateBody>
                You haven't made any meal bookings yet. Click on "Book Meal" to create your first booking.
              </EmptyStateBody>
            </EmptyState>
          ) : (
            <Table aria-label="My bookings table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Category</Th>
                  <Th>Receipt Number</Th>
                  <Th>Status</Th>
                  <Th width={20}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {bookings.map((booking) => (
                  <Tr 
                    key={booking.id}
                    isClickable
                    onRowClick={() => handleViewDetails(booking)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Td dataLabel="Date">
                      {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                    </Td>
                    <Td dataLabel="Category">
                      {getMealTypeIcon(booking.meal_type)} {getMealTypeLabel(booking.meal_type)}
                    </Td>
                    <Td dataLabel="Receipt Number">
                      {booking.receipt_number}
                    </Td>
                    <Td dataLabel="Status">
                      <Badge isRead={booking.payment_status === BOOKING_STATUS.SERVED}>
                        {booking.payment_status.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td dataLabel="Actions">
                      <Button
                        variant="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(booking);
                          handleEditClick();
                        }}
                        isDisabled={
                          !canEditBooking(booking.booking_date) ||
                          booking.payment_status === BOOKING_STATUS.SERVED ||
                          booking.payment_status === BOOKING_STATUS.REJECTED
                        }
                      >
                        Edit
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Details/Edit Modal */}
      <Modal
        variant={ModalVariant.medium}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
        }}
        aria-labelledby="booking-details-modal-title"
        aria-describedby="booking-details-modal-body"
      >
        <ModalHeader 
          title={isEditMode ? 'Edit Booking' : 'Booking Details'} 
          labelId="booking-details-modal-title" 
        />
        <ModalBody id="booking-details-modal-body">
          {selectedBooking && (
            <div>
              {editError && (
                <Alert 
                  variant="danger" 
                  title={editError} 
                  style={{ marginBottom: '16px' }} 
                  isInline 
                />
              )}

              {isEditMode ? (
                // Edit Mode
                <Form>
                  {isFreeMeal(selectedBooking.booking_date) && (
                    <Alert 
                      variant="success" 
                      title="Free Meal" 
                      style={{ marginBottom: '16px' }} 
                      isInline
                    >
                      <p>This is a free meal. You can only change the meal category (Veg/Non-Veg), not the date or payment details.</p>
                    </Alert>
                  )}                  

                  <FormGroup label="Receipt Number" fieldId="receipt">
                    <p>{selectedBooking.receipt_number}</p>
                  </FormGroup>

                  <FormGroup label="Booking Date" isRequired fieldId="booking-date">
                    {canChangeDate(selectedBooking.booking_date) ? (
                      <DatePicker
                        value={editBookingDate}
                        onChange={(e, str) => {
                          if (str) {
                            setEditBookingDate(str);
                          }
                        }}
                        validators={[dateValidator]}
                        placeholder="YYYY-MM-DD"
                        appendTo={() => document.body}
                      />
                    ) : (
                      <div>
                        <p>{format(new Date(selectedBooking.booking_date), 'MMMM dd, yyyy')}</p>
                        {isFreeMeal(selectedBooking.booking_date) && (
                          <Alert variant="info" title="Date cannot be changed for free meals" isInline style={{ marginTop: '8px' }} />
                        )}
                      </div>
                    )}
                  </FormGroup>

                  <FormGroup label="Status" fieldId="status">
                    <Badge>{selectedBooking.payment_status.toUpperCase()}</Badge>
                  </FormGroup>

                  <FormGroup label="Category" isRequired fieldId="category">
                    <Radio
                      id="edit-veg"
                      name="edit-meal-type"
                      label={
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <img src={vegIcon} alt="Veg" style={{ width: '20px', height: '20px' }} />
                          <span>Veg</span>
                        </div>
                      }
                      isChecked={editMealType === MEAL_TYPES.VEG}
                      onChange={() => setEditMealType(MEAL_TYPES.VEG)}
                    />
                    <Radio
                      id="edit-non-veg"
                      name="edit-meal-type"
                      label={
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <img src={nonVegIcon} alt="Non-Veg" style={{ width: '20px', height: '20px' }} />
                          <span>Non-Veg</span>
                        </div>
                      }
                      isChecked={editMealType === MEAL_TYPES.NON_VEG}
                      onChange={() => setEditMealType(MEAL_TYPES.NON_VEG)}
                    />
                  </FormGroup>

                  {!isFreeMeal(selectedBooking.booking_date) && (
                    <>
                      {selectedBooking.payment_status === BOOKING_STATUS.APPROVED ? (
                        // Show payment screenshot as read-only for approved bookings
                        <FormGroup label="Payment Screenshot" fieldId="current-screenshot">
                          <Alert 
                            variant="info" 
                            title="Payment already approved" 
                            style={{ marginBottom: '8px' }} 
                            isInline
                          >
                            <p>Payment has been approved. Screenshot cannot be changed.</p>
                          </Alert>
                          {selectedBooking.payment_screenshot_url && (
                            <img
                              src={selectedBooking.payment_screenshot_url}
                              alt="Approved payment screenshot"
                              style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #d2d2d2' }}
                            />
                          )}
                        </FormGroup>
                      ) : (
                        // Allow payment screenshot update for pending/rejected bookings
                        <>
                          <FormGroup
                            label="Update Payment Screenshot (Optional)"
                            fieldId="payment-screenshot"
                          >
                            <FileUpload
                              id="edit-payment-screenshot"
                              value={editPaymentFileValue}
                              filename={editPaymentFilename}
                              onFileInputChange={handleFileInputChange}
                              onClearClick={handleClearFile}
                              hideDefaultPreview
                              browseButtonText="Upload New Screenshot"
                              filenamePlaceholder="Drag and drop a file or upload one"
                              accept="image/*"
                            />
                            {selectedBooking.payment_screenshot_url && !editPaymentFile && (
                              <div style={{ marginTop: '8px' }}>
                                <p style={{ fontSize: '14px', color: '#666' }}>
                                  Current screenshot will be kept if you don't upload a new one.
                                </p>
                              </div>
                            )}
                          </FormGroup>

                          {selectedBooking.payment_screenshot_url && (
                            <FormGroup label="Current Payment Screenshot" fieldId="current-screenshot">
                              <img
                                src={selectedBooking.payment_screenshot_url}
                                alt="Current payment screenshot"
                                style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #d2d2d2' }}
                              />
                            </FormGroup>
                          )}
                        </>
                      )}
                    </>
                  )}
                </Form>
              ) : (
                // View Mode
                <>
                  <p><strong>Receipt Number:</strong> {selectedBooking.receipt_number}</p>
                  <p><strong>Date:</strong> {format(new Date(selectedBooking.booking_date), 'MMMM dd, yyyy')}</p>
                  <p><strong>Category:</strong> {getMealTypeIcon(selectedBooking.meal_type)} {getMealTypeLabel(selectedBooking.meal_type)}</p>
                  <p><strong>Status:</strong> <Badge>{selectedBooking.payment_status.toUpperCase()}</Badge></p>
                  <p><strong>Created:</strong> {format(new Date(selectedBooking.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  
                  {selectedBooking.payment_screenshot_url && (
                    <div style={{ marginTop: '16px' }}>
                      <strong>Payment Screenshot:</strong>
                      <div style={{ marginTop: '8px' }}>
                        <img
                          src={selectedBooking.payment_screenshot_url}
                          alt="Payment screenshot"
                          style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid #d2d2d2' }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {isEditMode ? (
            <>
              <Button 
                key="resubmit" 
                variant="primary" 
                onClick={handleResubmit}
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Resubmit'}
              </Button>
              <Button 
                key="cancel-edit" 
                variant="link" 
                onClick={handleCancelEdit}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button key="close" variant="primary" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              {selectedBooking && 
               selectedBooking.payment_status !== BOOKING_STATUS.SERVED &&
               selectedBooking.payment_status !== BOOKING_STATUS.REJECTED && (
                <Button
                  key="edit"
                  variant="secondary"
                  onClick={handleEditClick}
                >
                  Edit
                </Button>
              )}
            </>
          )}
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};

export default MyBookings;

