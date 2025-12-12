import { useState, useEffect } from 'react';
import {
  PageSection,
  Card,
  CardBody,
  Title,
  Button,
  Grid,
  GridItem,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  Checkbox,
  Spinner,
  EmptyState,
  EmptyStateBody,
} from '@patternfly/react-core';
import { SearchIcon, PrintIcon } from '@patternfly/react-icons';
import { supabase, TABLES, BOOKING_STATUS, MEAL_TYPES } from '../../services/supabase';
import { format } from 'date-fns';

const TodaysBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ veg: 0, nonVeg: 0, total: 0 });

  useEffect(() => {
    fetchTodaysBookings();
  }, []);

  const fetchTodaysBookings = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select(`
          *,
          employee:employees(name, employee_id)
        `)
        .eq('booking_date', today)
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

  const handleMarkServed = async (bookingId) => {
    try {
      const { error } = await supabase
        .from(TABLES.BOOKINGS)
        .update({ payment_status: BOOKING_STATUS.SERVED })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, payment_status: BOOKING_STATUS.SERVED } : b
      ));
    } catch (error) {
      console.error('Error marking as served:', error);
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
          <title>Today's Meal Bookings - ${format(new Date(), 'MMM dd, yyyy')}</title>
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
          <div class="date">${format(new Date(), 'EEEE, MMMM dd, yyyy')}</div>
          
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
      <Grid hasGutter>
        {/* Summary Cards */}
        <GridItem span={12}>
          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title headingLevel="h1" size="2xl">
                  Today's Bookings - {format(new Date(), 'MMM dd, yyyy')}
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
            </CardBody>
          </Card>
        </GridItem>

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

        {/* Bookings List */}
        <GridItem span={12}>
          <Card>
            <CardBody>
              <Title headingLevel="h2" size="xl" style={{ marginBottom: '16px' }}>
                Booking Details
              </Title>

              {bookings.length === 0 ? (
                <EmptyState variant="sm" icon={SearchIcon} titleText="No bookings for today" headingLevel="h4">
                  <EmptyStateBody>
                    There are no approved meal bookings for today.
                  </EmptyStateBody>
                </EmptyState>
              ) : (
                <DataList aria-label="Today's bookings">
                  {bookings.map((booking) => (
                    <DataListItem key={booking.id}>
                      <DataListItemRow>
                        <DataListItemCells
                          dataListCells={[
                            <DataListCell key="checkbox" width={1}>
                              <Checkbox
                                id={`served-${booking.id}`}
                                isChecked={booking.payment_status === BOOKING_STATUS.SERVED}
                                onChange={() => handleMarkServed(booking.id)}
                                label=""
                              />
                            </DataListCell>,
                            <DataListCell key="receipt" width={2}>
                              <strong>{booking.receipt_number}</strong>
                            </DataListCell>,
                            <DataListCell key="employee" width={3}>
                              {booking.employee?.name}
                              <div style={{ fontSize: '0.9rem', color: '#6a6e73' }}>
                                {booking.employee?.employee_id}
                              </div>
                            </DataListCell>,
                            <DataListCell key="meal-type" width={2}>
                              {booking.meal_type === MEAL_TYPES.VEG ? '🥗 Vegetarian' : '🍗 Non-Vegetarian'}
                            </DataListCell>,
                            <DataListCell key="status" width={2}>
                              {booking.payment_status === BOOKING_STATUS.SERVED ? 
                                '✅ Served' : '⏳ Pending'}
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
        </GridItem>
      </Grid>
    </PageSection>
  );
};

export default TodaysBookings;

