import { useState, useEffect } from 'react';
import {
  PageSection,
  Card,
  CardBody,
  Title,
  DatePicker,
  Grid,
  GridItem,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Button,
  Alert,
  Radio,
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import { SearchIcon, PrintIcon, DownloadIcon } from '@patternfly/react-icons';
import { CSVLink } from 'react-csv';
import { supabase, TABLES, BOOKING_STATUS, MEAL_TYPES } from '../../services/supabase';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import vegIcon from '../../assets/veg.png';
import nonVegIcon from '../../assets/non_veg.png';

const UpcomingBookings = () => {
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'range'
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ veg: 0, nonVeg: 0, total: 0 });
  const [dateRangeError, setDateRangeError] = useState('');

  const columnNames = {
    bookingDate: 'Booking Date',
    receiptNumber: 'Receipt Number',
    employeeName: 'Employee Name',
    employeeId: 'Employee ID',
    mealType: 'Meal Type',
  };

  useEffect(() => {
    if (viewMode === 'single') {
      fetchBookingsForDate();
    } else {
      fetchBookingsForDateRange();
    }
  }, [selectedDate, startDate, endDate, viewMode]);

  const validateDateRange = (start, end) => {
    if (!start || !end) return false;
    
    const startDateObj = parseISO(start);
    const endDateObj = parseISO(end);
    const daysDiff = differenceInDays(endDateObj, startDateObj);
    
    if (daysDiff < 0) {
      setDateRangeError('End date must be after start date');
      return false;
    }
    
    if (daysDiff > 60) {
      setDateRangeError('Date range cannot exceed 60 days');
      return false;
    }
    
    setDateRangeError('');
    return true;
  };

  const fetchBookingsForDate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select(`
          *,
          employee:employees(name, employee_id)
        `)
        .eq('booking_date', selectedDate)
        .eq('payment_status', BOOKING_STATUS.APPROVED)
        .order('meal_type', { ascending: true });

      if (error) throw error;

      const bookingData = data || [];
      setBookings(bookingData);

      // Calculate summary
      const veg = bookingData.filter(b => b.meal_type === MEAL_TYPES.VEG).length;
      const nonVeg = bookingData.filter(b => b.meal_type === MEAL_TYPES.NON_VEG).length;
      
      setSummary({
        veg,
        nonVeg,
        total: veg + nonVeg,
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsForDateRange = async () => {
    if (!validateDateRange(startDate, endDate)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select(`
          *,
          employee:employees(name, employee_id)
        `)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .eq('payment_status', BOOKING_STATUS.APPROVED)
        .order('booking_date', { ascending: true })
        .order('meal_type', { ascending: true });

      if (error) throw error;

      const bookingData = data || [];
      setBookings(bookingData);

      // Calculate summary
      const veg = bookingData.filter(b => b.meal_type === MEAL_TYPES.VEG).length;
      const nonVeg = bookingData.filter(b => b.meal_type === MEAL_TYPES.NON_VEG).length;
      
      setSummary({
        veg,
        nonVeg,
        total: veg + nonVeg,
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    
    const vegBookings = bookings.filter(b => b.meal_type === MEAL_TYPES.VEG);
    const nonVegBookings = bookings.filter(b => b.meal_type === MEAL_TYPES.NON_VEG);
    
    const dateRangeTitle = viewMode === 'single' 
      ? format(new Date(selectedDate), 'MMM dd, yyyy')
      : `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`;
    
    const dateRangeDisplay = viewMode === 'single'
      ? format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')
      : `${format(new Date(startDate), 'MMMM dd, yyyy')} - ${format(new Date(endDate), 'MMMM dd, yyyy')}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Meal Bookings - ${dateRangeTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 10px; }
            .date { text-align: center; color: #666; margin-bottom: 30px; }
            .summary { 
              background: #f5f5f5; 
              padding: 15px; 
              margin-bottom: 30px; 
              border-radius: 5px;
            }
            .summary-item { display: inline-block; margin-right: 30px; }
            .section { margin-bottom: 40px; }
            .section h2 { 
              background: #0066cc; 
              color: white; 
              padding: 10px; 
              margin-bottom: 10px;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .checkbox { width: 30px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>🍽️ Meal Booking List</h1>
          <div class="date">${dateRangeDisplay}</div>
          
          <div class="summary">
            <strong>Summary:</strong>
            <div class="summary-item">Veg: <strong>${summary.veg}</strong></div>
            <div class="summary-item">Non-Veg: <strong>${summary.nonVeg}</strong></div>
            <div class="summary-item">Total: <strong>${summary.total}</strong></div>
          </div>

          <div class="section">
            <h2>Veg (${summary.veg})</h2>
            <table>
              <thead>
                <tr>
                  <th class="checkbox">☐</th>
                  ${viewMode === 'range' ? '<th>Date</th>' : ''}
                  <th>Receipt #</th>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                </tr>
              </thead>
              <tbody>
                ${vegBookings.map(b => `
                  <tr>
                    <td class="checkbox">☐</td>
                    ${viewMode === 'range' ? `<td>${format(new Date(b.booking_date), 'MMM dd, yyyy')}</td>` : ''}
                    <td>${b.receipt_number}</td>
                    <td>${b.employee?.name || 'N/A'}</td>
                    <td>${b.employee?.employee_id || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Non-Veg (${summary.nonVeg})</h2>
            <table>
              <thead>
                <tr>
                  <th class="checkbox">☐</th>
                  ${viewMode === 'range' ? '<th>Date</th>' : ''}
                  <th>Receipt #</th>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                </tr>
              </thead>
              <tbody>
                ${nonVegBookings.map(b => `
                  <tr>
                    <td class="checkbox">☐</td>
                    ${viewMode === 'range' ? `<td>${format(new Date(b.booking_date), 'MMM dd, yyyy')}</td>` : ''}
                    <td>${b.receipt_number}</td>
                    <td>${b.employee?.name || 'N/A'}</td>
                    <td>${b.employee?.employee_id || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Prepare CSV data
  const csvHeaders = [
    ...(viewMode === 'range' ? [{ label: 'Booking Date', key: 'booking_date' }] : []),
    { label: 'Receipt Number', key: 'receipt_number' },
    { label: 'Employee Name', key: 'employee_name' },
    { label: 'Employee ID', key: 'employee_id' },
    { label: 'Meal Type', key: 'meal_type' },
    { label: 'Status', key: 'status' },
    { label: 'Created At', key: 'created_at' },
  ];

  const csvData = bookings.map(booking => ({
    ...(viewMode === 'range' ? { booking_date: format(new Date(booking.booking_date), 'yyyy-MM-dd') } : {}),
    receipt_number: booking.receipt_number,
    employee_name: booking.employee?.name || 'N/A',
    employee_id: booking.employee?.employee_id || 'N/A',
    meal_type: booking.meal_type === MEAL_TYPES.VEG ? 'Veg' : 'Non-Veg',
    status: booking.payment_status.toUpperCase(),
    created_at: format(new Date(booking.created_at), 'yyyy-MM-dd HH:mm:ss'),
  }));

  const csvFilename = viewMode === 'single'
    ? `meal-bookings-${selectedDate}.csv`
    : `meal-bookings-${startDate}-to-${endDate}.csv`;

  return (
    <PageSection>
      <Grid hasGutter>
        <GridItem span={12}>
          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title headingLevel="h1" size="2xl">
                  All Bookings
                </Title>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={csvFilename}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button
                      variant="secondary"
                      icon={<DownloadIcon />}
                      isDisabled={bookings.length === 0}
                    >
                      Export CSV
                    </Button>
                  </CSVLink>
                  <Button
                    variant="primary"
                    icon={<PrintIcon />}
                    onClick={handlePrint}
                    isDisabled={bookings.length === 0}
                  >
                    Print List
                  </Button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  <Radio
                    id="single-date"
                    name="view-mode"
                    label="Single Date"
                    isChecked={viewMode === 'single'}
                    onChange={() => setViewMode('single')}
                  />
                  <Radio
                    id="date-range"
                    name="view-mode"
                    label="Date Range (up to 60 days)"
                    isChecked={viewMode === 'range'}
                    onChange={() => setViewMode('range')}
                  />
                </div>

                {dateRangeError && (
                  <Alert variant="danger" title={dateRangeError} style={{ marginBottom: '12px' }} isInline />
                )}

                {viewMode === 'single' ? (
                  <div style={{ maxWidth: '300px', position: 'relative', zIndex: 1 }}>
                    <DatePicker
                      value={selectedDate}
                      onChange={(e, str, date) => {
                        if (str) {
                          setSelectedDate(str);
                        }
                      }}
                      placeholder="YYYY-MM-DD"
                      appendTo={() => document.body}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: '200px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Start Date
                      </label>
                      <DatePicker
                        value={startDate}
                        onChange={(e, str, date) => {
                          if (str) {
                            setStartDate(str);
                            validateDateRange(str, endDate);
                          }
                        }}
                        placeholder="YYYY-MM-DD"
                        appendTo={() => document.body}
                      />
                    </div>
                    <div style={{ minWidth: '200px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        End Date
                      </label>
                      <DatePicker
                        value={endDate}
                        onChange={(e, str, date) => {
                          if (str) {
                            setEndDate(str);
                            validateDateRange(startDate, str);
                          }
                        }}
                        placeholder="YYYY-MM-DD"
                        appendTo={() => document.body}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </GridItem>

        {loading ? (
          <GridItem span={12}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Spinner size="xl" />
            </div>
          </GridItem>
        ) : (
          <>
            <GridItem span={4}>
              <Card>
                <CardBody style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: '#6a6e73', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <img src={vegIcon} alt="Veg" style={{ width: '14px', height: '14px' }} />
                    <span>Veg</span>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3e8635' }}>
                    {summary.veg}
                  </div>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem span={4}>
              <Card>
                <CardBody style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: '#6a6e73', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <img src={nonVegIcon} alt="Non-Veg" style={{ width: '14px', height: '14px' }} />
                    <span>Non-Veg</span>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#c9190b' }}>
                    {summary.nonVeg}
                  </div>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem span={4}>
              <Card>
                <CardBody style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: '#6a6e73', marginBottom: '8px' }}>
                    📊 Total
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0066cc' }}>
                    {summary.total}
                  </div>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem span={12}>
              <Card>
                <CardBody>
                  <Title headingLevel="h2" size="xl" style={{ marginBottom: '16px' }}>
                    Booking Details
                  </Title>
                </CardBody>

                {bookings.length === 0 ? (
                  <CardBody>
                    <EmptyState variant="sm" icon={SearchIcon} titleText="No bookings found" headingLevel="h4">
                      <EmptyStateBody>
                        {viewMode === 'single' 
                          ? 'There are no approved meal bookings for this date.'
                          : 'There are no approved meal bookings for this date range.'}
                      </EmptyStateBody>
                    </EmptyState>
                  </CardBody>
                ) : (
                  <Table aria-label="Upcoming bookings table" variant='compact'>
                    <Thead>
                      <Tr>
                        {viewMode === 'range' && <Th>{columnNames.bookingDate}</Th>}
                        <Th>{columnNames.receiptNumber}</Th>
                        <Th>{columnNames.employeeName}</Th>
                        <Th>{columnNames.employeeId}</Th>
                        <Th>{columnNames.mealType}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {bookings.map((booking) => (
                        <Tr key={booking.id}>
                          {viewMode === 'range' && (
                            <Td dataLabel={columnNames.bookingDate}>
                              {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                            </Td>
                          )}
                          <Td dataLabel={columnNames.receiptNumber}>
                            <strong>{booking.receipt_number}</strong>
                          </Td>
                          <Td dataLabel={columnNames.employeeName}>
                            {booking.employee?.name}
                          </Td>
                          <Td dataLabel={columnNames.employeeId}>
                            {booking.employee?.employee_id}
                          </Td>
                          <Td dataLabel={columnNames.mealType}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img 
                                src={booking.meal_type === MEAL_TYPES.VEG ? vegIcon : nonVegIcon} 
                                alt={booking.meal_type === MEAL_TYPES.VEG ? 'Veg' : 'Non-Veg'}
                                style={{ width: '14px', height: '14px' }}
                              />
                              <span>{booking.meal_type === MEAL_TYPES.VEG ? 'Veg' : 'Non-Veg'}</span>
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Card>
            </GridItem>
          </>
        )}
      </Grid>
    </PageSection>
  );
};

export default UpcomingBookings;

