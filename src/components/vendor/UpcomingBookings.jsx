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
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import { SearchIcon, PrintIcon } from '@patternfly/react-icons';
import { supabase, TABLES, BOOKING_STATUS, MEAL_TYPES } from '../../services/supabase';
import { format, addDays } from 'date-fns';

const UpcomingBookings = () => {
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ veg: 0, nonVeg: 0, total: 0 });

  const columnNames = {
    receiptNumber: 'Receipt Number',
    employeeName: 'Employee Name',
    employeeId: 'Employee ID',
    mealType: 'Meal Type',
  };

  useEffect(() => {
    fetchBookingsForDate();
  }, [selectedDate]);

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

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    
    const vegBookings = bookings.filter(b => b.meal_type === MEAL_TYPES.VEG);
    const nonVegBookings = bookings.filter(b => b.meal_type === MEAL_TYPES.NON_VEG);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Meal Bookings - ${format(new Date(selectedDate), 'MMM dd, yyyy')}</title>
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
          <div class="date">${format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}</div>
          
          <div class="summary">
            <strong>Summary:</strong>
            <div class="summary-item">🥗 Vegetarian: <strong>${summary.veg}</strong></div>
            <div class="summary-item">🍗 Non-Vegetarian: <strong>${summary.nonVeg}</strong></div>
            <div class="summary-item">📊 Total: <strong>${summary.total}</strong></div>
          </div>

          <div class="section">
            <h2>🥗 Vegetarian (${summary.veg})</h2>
            <table>
              <thead>
                <tr>
                  <th class="checkbox">☐</th>
                  <th>Receipt #</th>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                </tr>
              </thead>
              <tbody>
                ${vegBookings.map(b => `
                  <tr>
                    <td class="checkbox">☐</td>
                    <td>${b.receipt_number}</td>
                    <td>${b.employee?.name || 'N/A'}</td>
                    <td>${b.employee?.employee_id || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>🍗 Non-Vegetarian (${summary.nonVeg})</h2>
            <table>
              <thead>
                <tr>
                  <th class="checkbox">☐</th>
                  <th>Receipt #</th>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                </tr>
              </thead>
              <tbody>
                ${nonVegBookings.map(b => `
                  <tr>
                    <td class="checkbox">☐</td>
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

  return (
    <PageSection>
      <Grid hasGutter>
        <GridItem span={12}>
          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title headingLevel="h1" size="2xl">
                  Upcoming Bookings
                </Title>
                <Button
                  variant="primary"
                  icon={<PrintIcon />}
                  onClick={handlePrint}
                  isDisabled={bookings.length === 0}
                >
                  Print List
                </Button>
              </div>

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
                  <div style={{ fontSize: '0.9rem', color: '#6a6e73', marginBottom: '8px' }}>
                    🥗 Vegetarian
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
                  <div style={{ fontSize: '0.9rem', color: '#6a6e73', marginBottom: '8px' }}>
                    🍗 Non-Vegetarian
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
                        There are no approved meal bookings for this date.
                      </EmptyStateBody>
                    </EmptyState>
                  </CardBody>
                ) : (
                  <Table aria-label="Upcoming bookings table" variant='compact'>
                    <Thead>
                      <Tr>
                        <Th>{columnNames.receiptNumber}</Th>
                        <Th>{columnNames.employeeName}</Th>
                        <Th>{columnNames.employeeId}</Th>
                        <Th>{columnNames.mealType}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {bookings.map((booking) => (
                        <Tr key={booking.id}>
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
                            {booking.meal_type === MEAL_TYPES.VEG ? '🥗 Vegetarian' : '🍗 Non-Vegetarian'}
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

