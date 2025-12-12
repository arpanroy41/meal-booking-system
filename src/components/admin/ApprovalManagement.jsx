import { useState, useEffect } from 'react';
import {
  PageSection,
  Card,
  CardBody,
  Title,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalVariant,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Badge,
  Alert,
} from '@patternfly/react-core';
import {
  Table,
  TableText,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { supabase, TABLES, BOOKING_STATUS } from '../../services/supabase';
import { format } from 'date-fns';

const ApprovalManagement = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchPendingBookings();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.BOOKINGS,
          filter: `payment_status=eq.${BOOKING_STATUS.PENDING}`,
        },
        () => {
          fetchPendingBookings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPendingBookings = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select(`
          *,
          employee:employees(name, email, employee_id)
        `)
        .eq('payment_status', BOOKING_STATUS.PENDING)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingBookings(data || []);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from(TABLES.BOOKINGS)
        .update({ payment_status: BOOKING_STATUS.APPROVED })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'Booking approved successfully',
      });
      setIsModalOpen(false);
      fetchPendingBookings();
    } catch (error) {
      console.error('Error approving booking:', error);
      setNotification({
        type: 'danger',
        message: 'Failed to approve booking',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this booking?')) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from(TABLES.BOOKINGS)
        .update({ payment_status: BOOKING_STATUS.REJECTED })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      setNotification({
        type: 'warning',
        message: 'Booking rejected',
      });
      setIsModalOpen(false);
      fetchPendingBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      setNotification({
        type: 'danger',
        message: 'Failed to reject booking',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getMealTypeLabel = (type) => {
    return type === 'veg' ? '🥗 Vegetarian' : '🍗 Non-Vegetarian';
  };

  const columnNames = {
    employee: 'Employee',
    employeeId: 'Employee ID',
    date: 'Booking Date',
    mealType: 'Meal Type',
    receiptNumber: 'Receipt Number',
    submittedAt: 'Submitted At',
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
            Pending Approvals
            {pendingBookings.length > 0 && (
              <Badge style={{ marginLeft: '12px' }}>{pendingBookings.length}</Badge>
            )}
          </Title>

          {notification && (
            <Alert
              variant={notification.type}
              title={notification.message}
              style={{ marginBottom: '16px' }}
              actionClose={
                <Button variant="plain" onClick={() => setNotification(null)}>
                  ×
                </Button>
              }
            />
          )}
        </CardBody>

        {pendingBookings.length === 0 ? (
          <CardBody>
            <EmptyState variant="sm" icon={CheckCircleIcon} titleText="No pending approvals" headingLevel="h4">
              <EmptyStateBody>
                All bookings have been processed. New bookings will appear here.
              </EmptyStateBody>
            </EmptyState>
          </CardBody>
        ) : (
          <Table aria-label="Pending approvals table" variant='compact'>
            <Thead>
              <Tr>
                <Th>{columnNames.employee}</Th>
                <Th>{columnNames.employeeId}</Th>
                <Th>{columnNames.date}</Th>
                <Th>{columnNames.mealType}</Th>
                <Th>{columnNames.receiptNumber}</Th>
                <Th>{columnNames.submittedAt}</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pendingBookings.map((booking) => (
                <Tr key={booking.id}>
                  <Td dataLabel={columnNames.employee}>
                    <strong>{booking.employee?.name}</strong>
                  </Td>
                  <Td dataLabel={columnNames.employeeId}>
                    {booking.employee?.employee_id}
                  </Td>
                  <Td dataLabel={columnNames.date}>
                    {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                  </Td>
                  <Td dataLabel={columnNames.mealType}>
                    {getMealTypeLabel(booking.meal_type)}
                  </Td>
                  <Td dataLabel={columnNames.receiptNumber}>
                    {booking.receipt_number}
                  </Td>
                  <Td dataLabel={columnNames.submittedAt}>
                    {format(new Date(booking.created_at), 'MMM dd, HH:mm')}
                  </Td>
                  <Td dataLabel="Actions" modifier="fitContent" hasAction>
                    <TableText>
                      <Button
                        variant="primary"
                        onClick={() => handleViewDetails(booking)}
                      >
                        Review
                      </Button>
                    </TableText>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        variant={ModalVariant.medium}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="review-booking-modal-title"
        aria-describedby="review-booking-modal-body"
      >
        <ModalHeader title="Review Booking" labelId="review-booking-modal-title" />
        <ModalBody id="review-booking-modal-body">
          {selectedBooking && (
            <div>
              <h3>Employee Details</h3>
              <p><strong>Name:</strong> {selectedBooking.employee?.name}</p>
              <p><strong>Email:</strong> {selectedBooking.employee?.email}</p>
              <p><strong>Employee ID:</strong> {selectedBooking.employee?.employee_id}</p>

              <h3 style={{ marginTop: '24px' }}>Booking Details</h3>
              <p><strong>Receipt Number:</strong> {selectedBooking.receipt_number}</p>
              <p><strong>Date:</strong> {format(new Date(selectedBooking.booking_date), 'MMMM dd, yyyy')}</p>
              <p><strong>Meal Type:</strong> {getMealTypeLabel(selectedBooking.meal_type)}</p>
              <p><strong>Submitted:</strong> {format(new Date(selectedBooking.created_at), 'MMM dd, yyyy HH:mm')}</p>

              {selectedBooking.payment_screenshot_url && (
                <div style={{ marginTop: '16px' }}>
                  <strong>Payment Screenshot:</strong>
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={selectedBooking.payment_screenshot_url}
                      alt="Payment screenshot"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '400px', 
                        border: '1px solid #d2d2d2',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            key="approve"
            variant="primary"
            onClick={handleApprove}
            isDisabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Approve'}
          </Button>
          <Button
            key="reject"
            variant="danger"
            onClick={handleReject}
            isDisabled={actionLoading}
          >
            Reject
          </Button>
          <Button
            key="close"
            variant="link"
            onClick={() => setIsModalOpen(false)}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};

export default ApprovalManagement;

