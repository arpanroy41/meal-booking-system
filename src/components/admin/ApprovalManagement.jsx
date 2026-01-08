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
  DatePicker,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
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
import { format, addDays, parseISO, isBefore, startOfDay } from 'date-fns';
import vegIcon from '../../assets/veg.png';
import nonVegIcon from '../../assets/non_veg.png';

const ApprovalManagement = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [recentSelectedRowIndex, setRecentSelectedRowIndex] = useState(null);
  const [shifting, setShifting] = useState(false);

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
  }, [selectedDate]);

  const fetchPendingBookings = async () => {
    setLoading(true);
    setSelectedBookingIds([]); // Clear selection when fetching new data
    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select(`
          *,
          employee:employees(name, email, employee_id)
        `)
        .eq('payment_status', BOOKING_STATUS.PENDING)
        .eq('booking_date', selectedDate)
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

  // Check if date is in the past
  const isDateDisabled = (date) => {
    const bookingDate = startOfDay(parseISO(date));
    const today = startOfDay(new Date());
    return isBefore(bookingDate, today);
  };

  // Check if booking is selectable (not past date)
  const isBookingSelectable = (booking) => !isDateDisabled(booking.booking_date);
  
  // Get all selectable bookings
  const selectableBookings = pendingBookings.filter(isBookingSelectable);

  // Check if booking is selected
  const isBookingSelected = (booking) => selectedBookingIds.includes(booking.id);

  // Set booking selected/unselected
  const setBookingSelected = (booking, isSelecting = true) => {
    setSelectedBookingIds((prevSelected) => {
      const otherSelectedIds = prevSelected.filter((id) => id !== booking.id);
      return isSelecting && isBookingSelectable(booking) ? [...otherSelectedIds, booking.id] : otherSelectedIds;
    });
  };

  // Select/Deselect all bookings
  const selectAllBookings = (isSelecting = true) => {
    setSelectedBookingIds(isSelecting ? selectableBookings.map((b) => b.id) : []);
  };

  // Check if all selectable bookings are selected
  const areAllBookingsSelected = selectedBookingIds.length === selectableBookings.length && selectableBookings.length > 0;

  // Handle individual row selection with shift+click support
  const onSelectBooking = (booking, rowIndex, isSelecting) => {
    // If the user is shift + selecting the checkboxes, then all intermediate checkboxes should be selected
    if (shifting && recentSelectedRowIndex !== null) {
      const numberSelected = rowIndex - recentSelectedRowIndex;
      const intermediateIndexes =
        numberSelected > 0
          ? Array.from(new Array(numberSelected + 1), (_x, i) => i + recentSelectedRowIndex)
          : Array.from(new Array(Math.abs(numberSelected) + 1), (_x, i) => i + rowIndex);
      intermediateIndexes.forEach((index) => setBookingSelected(pendingBookings[index], isSelecting));
    } else {
      setBookingSelected(booking, isSelecting);
    }
    setRecentSelectedRowIndex(rowIndex);
  };

  // Listen for shift key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Shift') {
        setShifting(true);
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'Shift') {
        setShifting(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Bulk approve selected bookings
  const handleBulkApprove = async () => {
    if (selectedBookingIds.length === 0) {
      setNotification({
        type: 'warning',
        message: 'Please select at least one booking to approve',
      });
      return;
    }

    if (!confirm(`Are you sure you want to approve ${selectedBookingIds.length} booking(s)?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from(TABLES.BOOKINGS)
        .update({ payment_status: BOOKING_STATUS.APPROVED })
        .in('id', selectedBookingIds);

      if (error) throw error;

      setNotification({
        type: 'success',
        message: `${selectedBookingIds.length} booking(s) approved successfully`,
      });
      setSelectedBookingIds([]);
      fetchPendingBookings();
    } catch (error) {
      console.error('Error bulk approving bookings:', error);
      setNotification({
        type: 'danger',
        message: 'Failed to approve bookings',
      });
    } finally {
      setBulkActionLoading(false);
    }
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
    const isVeg = type === 'veg';
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <img 
          src={isVeg ? vegIcon : nonVegIcon} 
          alt={isVeg ? 'Veg' : 'Non-Veg'}
          style={{ width: '14px', height: '14px' }}
        />
        <span>{isVeg ? 'Veg' : 'Non-Veg'}</span>
      </div>
    );
  };

  const columnNames = {
    employee: 'Employee Name',
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

          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <DatePicker
                  value={selectedDate}
                  onChange={(e, str) => setSelectedDate(str)}
                  placeholder="Select date"
                  dateFormat={(date) => format(date, 'yyyy-MM-dd')}
                  dateParse={(str) => new Date(str)}
                  style={{ maxWidth: '250px' }}
                  appendTo={() => document.body}
                />
              </ToolbarItem>
              {selectedBookingIds.length > 0 && (
                <ToolbarItem>
                  <Button
                    variant="primary"
                    onClick={handleBulkApprove}
                    isDisabled={bulkActionLoading}
                    isLoading={bulkActionLoading}
                  >
                    {bulkActionLoading ? 'Approving...' : `Approve Selected (${selectedBookingIds.length})`}
                  </Button>
                </ToolbarItem>
              )}
            </ToolbarContent>
          </Toolbar>
        </CardBody>

        {loading ? (
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Spinner size="xl" />
            </div>
          </CardBody>
        ) : pendingBookings.length === 0 ? (
          <CardBody>
            <EmptyState variant="sm" icon={CheckCircleIcon} titleText="No pending approvals" headingLevel="h4">
              <EmptyStateBody>
                No pending bookings for {format(new Date(selectedDate), 'MMM dd, yyyy')}. Try selecting a different date.
              </EmptyStateBody>
            </EmptyState>
          </CardBody>
        ) : (
          <Table aria-label="Pending approvals table">
            <Thead>
              <Tr>
                <Th
                  select={{
                    onSelect: (_event, isSelecting) => selectAllBookings(isSelecting),
                    isSelected: areAllBookingsSelected,
                  }}
                  aria-label="Select all bookings"
                />
                <Th>{columnNames.employee}</Th>
                <Th>{columnNames.employeeId}</Th>
                <Th>{columnNames.date}</Th>
                <Th>{columnNames.mealType}</Th>
                <Th>{columnNames.receiptNumber}</Th>
                <Th>{columnNames.submittedAt}</Th>
                <Th screenReaderText="Actions"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {pendingBookings.map((booking, rowIndex) => {
                const isDisabled = !isBookingSelectable(booking);
                return (
                  <Tr key={booking.id}>
                    <Td
                      select={{
                        rowIndex,
                        onSelect: (_event, isSelecting) => onSelectBooking(booking, rowIndex, isSelecting),
                        isSelected: isBookingSelected(booking),
                        isDisabled: isDisabled,
                      }}
                    />
                    <Td 
                      dataLabel={columnNames.employee}
                      modifier={isDisabled ? 'fitContent' : undefined}
                    >
                      <span style={{ opacity: isDisabled ? 0.5 : 1 }}>
                        {booking.employee?.name}
                      </span>
                      {isDisabled && (
                        <Badge style={{ marginLeft: '8px' }} isRead>Past Date</Badge>
                      )}
                    </Td>
                    <Td dataLabel={columnNames.employeeId} modifier={isDisabled ? 'fitContent' : undefined}>
                      <span style={{ opacity: isDisabled ? 0.5 : 1 }}>
                        {booking.employee?.employee_id}
                      </span>
                    </Td>
                    <Td dataLabel={columnNames.date} modifier={isDisabled ? 'fitContent' : undefined}>
                      <span style={{ opacity: isDisabled ? 0.5 : 1 }}>
                        {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                      </span>
                    </Td>
                    <Td dataLabel={columnNames.mealType} modifier={isDisabled ? 'fitContent' : undefined}>
                      <span style={{ opacity: isDisabled ? 0.5 : 1 }}>
                        {getMealTypeLabel(booking.meal_type)}
                      </span>
                    </Td>
                    <Td dataLabel={columnNames.receiptNumber} modifier={isDisabled ? 'fitContent' : undefined}>
                      <span style={{ opacity: isDisabled ? 0.5 : 1 }}>
                        {booking.receipt_number}
                      </span>
                    </Td>
                    <Td dataLabel={columnNames.submittedAt} modifier={isDisabled ? 'fitContent' : undefined}>
                      <span style={{ opacity: isDisabled ? 0.5 : 1 }}>
                        {format(new Date(booking.created_at), 'MMM dd, HH:mm')}
                      </span>
                    </Td>
                    <Td dataLabel="Actions" modifier="fitContent" isActionCell>
                      <Button
                        variant="primary"
                        onClick={() => handleViewDetails(booking)}
                        isDisabled={isDisabled}
                      >
                        Review
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
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

