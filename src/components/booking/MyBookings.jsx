import { useState, useEffect } from 'react';
import {
  PageSection,
  Card,
  CardBody,
  Title,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
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
  EmptyStateFooter,
  EmptyStateActions,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, TABLES, BOOKING_STATUS } from '../../services/supabase';
import { format } from 'date-fns';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [user]);

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
    return type === 'veg' ? '🥗 Vegetarian' : '🍗 Non-Vegetarian';
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLES.BOOKINGS)
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.filter((b) => b.id !== bookingId));
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error canceling booking:', error);
      alert('Failed to cancel booking');
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
            <DataList aria-label="My bookings list">
              {bookings.map((booking) => (
                <DataListItem key={booking.id}>
                  <DataListItemRow>
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell key="date" width={2}>
                          <strong>Date:</strong> {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                        </DataListCell>,
                        <DataListCell key="meal-type" width={2}>
                          {getMealTypeLabel(booking.meal_type)}
                        </DataListCell>,
                        <DataListCell key="receipt" width={2}>
                          <strong>Receipt:</strong> {booking.receipt_number}
                        </DataListCell>,
                        <DataListCell key="status" width={2}>
                          <Badge screenReaderText={booking.payment_status}>
                            {booking.payment_status.toUpperCase()}
                          </Badge>
                        </DataListCell>,
                        <DataListCell key="actions" width={2}>
                          <Button
                            variant="link"
                            onClick={() => handleViewDetails(booking)}
                          >
                            View Details
                          </Button>
                        </DataListCell>,
                      ]}
                    />
                  </DataListItemRow>
                </DataListItem>
              ))}
            </DataList>
          )}
        </CardBody>
      </Card>

      {/* Details Modal */}
      <Modal
        variant={ModalVariant.medium}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="booking-details-modal-title"
        aria-describedby="booking-details-modal-body"
      >
        <ModalHeader title="Booking Details" labelId="booking-details-modal-title" />
        <ModalBody id="booking-details-modal-body">
          {selectedBooking && (
            <div>
              <p><strong>Receipt Number:</strong> {selectedBooking.receipt_number}</p>
              <p><strong>Date:</strong> {format(new Date(selectedBooking.booking_date), 'MMMM dd, yyyy')}</p>
              <p><strong>Meal Type:</strong> {getMealTypeLabel(selectedBooking.meal_type)}</p>
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
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button key="close" variant="primary" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
          {selectedBooking?.payment_status === BOOKING_STATUS.PENDING && (
            <Button
              key="cancel"
              variant="danger"
              onClick={() => handleCancelBooking(selectedBooking.id)}
            >
              Cancel Booking
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};

export default MyBookings;

