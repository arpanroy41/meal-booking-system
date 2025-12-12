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
} from '@patternfly/react-core';
import { supabase, TABLES, BOOKING_STATUS, MEAL_TYPES } from '../../services/supabase';
import { format } from 'date-fns';

const DailySummary = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [summary, setSummary] = useState({
    totalBookings: 0,
    approvedBookings: 0,
    pendingBookings: 0,
    vegCount: 0,
    nonVegCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [selectedDate]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('booking_date', selectedDate);

      if (error) throw error;

      const bookings = data || [];
      
      const summary = {
        totalBookings: bookings.length,
        approvedBookings: bookings.filter(b => b.payment_status === BOOKING_STATUS.APPROVED).length,
        pendingBookings: bookings.filter(b => b.payment_status === BOOKING_STATUS.PENDING).length,
        vegCount: bookings.filter(b => 
          b.meal_type === MEAL_TYPES.VEG && 
          b.payment_status === BOOKING_STATUS.APPROVED
        ).length,
        nonVegCount: bookings.filter(b => 
          b.meal_type === MEAL_TYPES.NON_VEG && 
          b.payment_status === BOOKING_STATUS.APPROVED
        ).length,
      };

      setSummary(summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, color = '#0066cc' }) => (
    <Card>
      <CardBody>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#6a6e73', marginBottom: '8px' }}>
            {title}
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color }}>
            {value}
          </div>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <PageSection>
      <Card style={{ marginBottom: '24px' }}>
        <CardBody>
          <Title headingLevel="h1" size="2xl" style={{ marginBottom: '24px' }}>
            Daily Summary
          </Title>

          <div style={{ maxWidth: '300px' }}>
            <DatePicker
              value={selectedDate}
              onChange={(e, str) => setSelectedDate(str)}
              placeholder="YYYY-MM-DD"
              dateFormat={(date) => format(date, 'yyyy-MM-dd')}
              dateParse={(str) => new Date(str)}
            />
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner size="xl" />
        </div>
      ) : (
        <Grid hasGutter>
          <GridItem span={6} md={4}>
            <StatCard title="Total Bookings" value={summary.totalBookings} color="#0066cc" />
          </GridItem>
          <GridItem span={6} md={4}>
            <StatCard title="Approved" value={summary.approvedBookings} color="#3e8635" />
          </GridItem>
          <GridItem span={6} md={4}>
            <StatCard title="Pending" value={summary.pendingBookings} color="#f0ab00" />
          </GridItem>
          <GridItem span={6} md={6}>
            <StatCard title="🥗 Vegetarian" value={summary.vegCount} color="#3e8635" />
          </GridItem>
          <GridItem span={6} md={6}>
            <StatCard title="🍗 Non-Vegetarian" value={summary.nonVegCount} color="#c9190b" />
          </GridItem>
        </Grid>
      )}
    </PageSection>
  );
};

export default DailySummary;

