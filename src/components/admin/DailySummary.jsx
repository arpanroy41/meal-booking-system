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
  Button,
} from '@patternfly/react-core';
import { SyncAltIcon } from '@patternfly/react-icons';
import { supabase, TABLES, BOOKING_STATUS, MEAL_TYPES } from '../../services/supabase';
import { format } from 'date-fns';
import vegIcon from '../../assets/veg.png';
import nonVegIcon from '../../assets/non_veg.png';

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

    // Subscribe to real-time updates for bookings
    const subscription = supabase
      .channel('bookings_summary_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.BOOKINGS,
        },
        (payload) => {
          // Refresh summary if the change affects the selected date
          if (payload.new?.booking_date === selectedDate || 
              payload.old?.booking_date === selectedDate) {
            fetchSummary();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedDate]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('booking_date', selectedDate);

      if (error) {
        console.error('Error fetching summary:', error);
        throw error;
      }

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

  const StatCard = ({ title, value, color = '#0066cc', icon = null }) => (
    <Card>
      <CardBody>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#6a6e73', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {icon && <img src={icon} alt={title} style={{ width: '14px', height: '14px' }} />}
            <span>{title}</span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <Title headingLevel="h1" size="2xl">
              Daily Summary
            </Title>
            <Button 
              variant="secondary" 
              icon={<SyncAltIcon />}
              onClick={fetchSummary}
              isDisabled={loading}
            >
              Refresh
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
            <StatCard title="Veg" value={summary.vegCount} color="#3e8635" icon={vegIcon} />
          </GridItem>
          <GridItem span={6} md={6}>
            <StatCard title="Non-Veg" value={summary.nonVegCount} color="#c9190b" icon={nonVegIcon} />
          </GridItem>
        </Grid>
      )}
    </PageSection>
  );
};

export default DailySummary;

