import { useState, useEffect } from 'react';
import {
  PageSection,
  Card,
  CardBody,
  Title,
  DatePicker,
  Button,
  Alert,
  Form,
  FormGroup,
  Checkbox,
  TextArea,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalVariant,
  Spinner,
  ActionList,
  ActionListItem,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { EditIcon, TrashIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { supabase, TABLES } from '../../services/supabase';
import { format, parseISO, addDays, startOfMonth, endOfMonth, isBefore, startOfDay } from 'date-fns';

const DateManagement = () => {
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFreeMeal, setIsFreeMeal] = useState(false);
  const [reason, setReason] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailableDates();
  }, [currentMonth]);

  const fetchAvailableDates = async () => {
    setLoading(true);
    try {
      const startDate = format(startOfMonth(new Date(currentMonth)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(addDays(new Date(currentMonth), 60)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from(TABLES.AVAILABLE_DATES)
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;

      setAvailableDates(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dateConfig = null) => {
    if (dateConfig) {
      // Editing existing date
      setEditingId(dateConfig.id);
      setSelectedDate(dateConfig.date);
      setIsAvailable(dateConfig.is_available);
      setIsFreeMeal(dateConfig.is_free_meal);
      setReason(dateConfig.reason || '');
    } else {
      // Adding new date
      setEditingId(null);
      setSelectedDate('');
      setIsAvailable(true);
      setIsFreeMeal(false);
      setReason('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedDate('');
    setIsAvailable(true);
    setIsFreeMeal(false);
    setReason('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!selectedDate) {
        throw new Error('Please select a date');
      }

      const dateConfig = {
        date: selectedDate,
        is_available: isAvailable,
        is_free_meal: isFreeMeal,
        reason: reason.trim() || null,
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from(TABLES.AVAILABLE_DATES)
          .update(dateConfig)
          .eq('id', editingId);

        if (error) throw error;
        setSuccess('Date configuration updated successfully');
      } else {
        // Insert new
        const { error } = await supabase
          .from(TABLES.AVAILABLE_DATES)
          .insert([dateConfig]);

        if (error) throw error;
        setSuccess('Date configuration added successfully');
      }

      handleCloseModal();
      fetchAvailableDates();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this date configuration?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLES.AVAILABLE_DATES)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Date configuration deleted successfully');
      fetchAvailableDates();
    } catch (err) {
      setError(err.message);
    }
  };

  const getDateLabel = (dateConfig) => {
    if (!dateConfig.is_available) {
      return <span style={{ color: '#c9190b'}}>Unavailable</span>;
    }
    if (dateConfig.is_free_meal) {
      return <span style={{ color: '#3e8635'}}>Free Meal</span>;
    }
    return <span style={{ color: '#0066cc' }}>Available</span>;
  };

  const isPastDate = (dateStr) => {
    const date = parseISO(dateStr);
    const today = startOfDay(new Date());
    return isBefore(date, today);
  };

  const handleBulkAddWeekdays = async () => {
    if (!confirm('Add all weekdays for the next 30 days as available dates?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const dates = [];
      const today = new Date();
      
      for (let i = 1; i <= 30; i++) {
        const date = addDays(today, i);
        const dayOfWeek = date.getDay();
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          dates.push({
            date: format(date, 'yyyy-MM-dd'),
            is_available: true,
            is_free_meal: false,
            reason: null,
          });
        }
      }

      // Use upsert to avoid conflicts
      const { error } = await supabase
        .from(TABLES.AVAILABLE_DATES)
        .upsert(dates, { onConflict: 'date', ignoreDuplicates: false });

      if (error) throw error;

      setSuccess(`Added ${dates.length} weekdays as available dates`);
      fetchAvailableDates();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageSection>
      <Card>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <Title headingLevel="h1" size="2xl">
              Date Management
            </Title>
            <ActionList>
              <ActionListItem>
                <Button
                  variant="secondary"
                  icon={<PlusCircleIcon />}
                  onClick={handleBulkAddWeekdays}
                  isDisabled={isSubmitting}
                >
                  Auto-Add 30 Days
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button
                  variant="primary"
                  icon={<PlusCircleIcon />}
                  onClick={() => handleOpenModal()}
                >
                  Add Date Configuration
                </Button>
              </ActionListItem>
            </ActionList>
          </div>

          <p style={{ marginBottom: '24px', color: '#6a6e73' }}>
            Control which dates employees can book meals. Mark dates as unavailable for holidays, 
            or set them as free meal days where no payment is required.
          </p>

          {error && (
            <Alert variant="danger" title={error} style={{ marginBottom: '16px' }} isInline />
          )}

          {success && (
            <Alert variant="success" title={success} style={{ marginBottom: '16px' }} isInline />
          )}

          <div style={{ marginBottom: '16px', maxWidth: '300px', position: 'relative', zIndex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Filter by Month
            </label>
            <DatePicker
              value={`${currentMonth}-01`}
              onChange={(e, str) => {
                if (str) {
                  // Extract year-month from the selected date
                  const yearMonth = str.substring(0, 7);
                  setCurrentMonth(yearMonth);
                }
              }}
              placeholder="YYYY-MM-DD"
              appendTo={() => document.body}
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Spinner size="xl" />
            </div>
          ) : (
            <Table aria-label="Available dates table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Reason</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {availableDates.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                      No date configurations found. Add dates to control booking availability.
                    </Td>
                  </Tr>
                ) : (
                  availableDates.map((dateConfig) => {
                    const isDisabled = isPastDate(dateConfig.date);
                    return (
                      <Tr key={dateConfig.id}>
                        <Td>
                          {format(parseISO(dateConfig.date), 'EEE, MMM dd, yyyy')}
                        </Td>
                        <Td>{getDateLabel(dateConfig)}</Td>
                        <Td>{dateConfig.reason || '-'}</Td>
                        <Td>
                          <Button
                            variant="plain"
                            icon={<EditIcon />}
                            onClick={() => handleOpenModal(dateConfig)}
                            aria-label="Edit"
                            isDisabled={isDisabled}
                          />
                          <Button
                            variant="plain"
                            icon={<TrashIcon />}
                            onClick={() => handleDelete(dateConfig.id)}
                            aria-label="Delete"
                            isDanger
                            isDisabled={isDisabled}
                          />
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="date-config-modal-title"
        aria-describedby="date-config-modal-body"
      >
        <ModalHeader 
          title={editingId ? 'Edit Date Configuration' : 'Add Date Configuration'}
          labelId="date-config-modal-title"
        />
        <ModalBody id="date-config-modal-body">
          <Form>
            <FormGroup label="Select Date" isRequired fieldId="date-picker">
              <DatePicker
                id="date-picker"
                value={selectedDate}
                onChange={(e, str) => setSelectedDate(str)}
                placeholder="YYYY-MM-DD"
                dateFormat={(date) => format(date, 'yyyy-MM-dd')}
                dateParse={(str) => new Date(str)}
                appendTo={() => document.body}
              />
            </FormGroup>

            <FormGroup fieldId="is-available">
              <Checkbox
                id="is-available"
                label="Date is available for booking"
                isChecked={isAvailable}
                onChange={(e, checked) => {
                  setIsAvailable(checked);
                  if (!checked) {
                    setIsFreeMeal(false); // Can't be free meal if unavailable
                  }
                }}
              />
            </FormGroup>

            {isAvailable && (
              <FormGroup fieldId="is-free-meal">
                <Checkbox
                  id="is-free-meal"
                  label="This is a free meal day (no payment required)"
                  isChecked={isFreeMeal}
                  onChange={(e, checked) => setIsFreeMeal(checked)}
                />
              </FormGroup>
            )}

            <FormGroup label="Reason (optional)" fieldId="reason">
              <TextArea
                id="reason"
                value={reason}
                onChange={(e, value) => setReason(value)}
                placeholder="e.g., Company Anniversary, Holiday, etc."
                rows={3}
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            key="save"
            variant="primary"
            onClick={handleSubmit}
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
          <Button key="cancel" variant="link" onClick={handleCloseModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};

export default DateManagement;
