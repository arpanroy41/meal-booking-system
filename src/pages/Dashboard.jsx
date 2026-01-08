import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  ChartLineIcon, 
  UsersIcon,
  CalendarAltIcon, 
  ListIcon,
  CalendarCheckIcon
} from '@patternfly/react-icons';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/common/Layout';

// Admin components
import ApprovalManagement from '../components/admin/ApprovalManagement';
import DailySummary from '../components/admin/DailySummary';
import UserManagement from '../components/admin/UserManagement';
import DateManagement from '../components/admin/DateManagement';

// Employee components
import BookingForm from '../components/booking/BookingForm';
import MyBookings from '../components/booking/MyBookings';

// Vendor components
import UpcomingBookings from '../components/vendor/UpcomingBookings';

const Dashboard = () => {
  const { profile, isAdmin, isVendor, isEmployee } = useAuth();

  // Define navigation items based on role
  const getNavItems = () => {
    if (isAdmin) {
      return [
        {
          path: '/dashboard/approvals',
          label: 'Pending Approvals',
          icon: <CheckCircleIcon />,
        },
        {
          path: '/dashboard/summary',
          label: 'Daily Summary',
          icon: <ChartLineIcon />,
        },
        {
          path: '/dashboard/dates',
          label: 'Date Management',
          icon: <CalendarCheckIcon />,
        },
        {
          path: '/dashboard/users',
          label: 'User Management',
          icon: <UsersIcon />,
        },
        {
          path: '/dashboard/bookings',
          label: 'All Bookings',
          icon: <ListIcon />,
        },
        {
          path: '/dashboard/book',
          label: 'Book My Meal',
          icon: <CalendarAltIcon />,
        },
        {
          path: '/dashboard/my-bookings',
          label: 'My Bookings',
          icon: <ListIcon />,
        },
      ];
    } else if (isVendor) {
      return [
        {
          path: '/dashboard/bookings',
          label: 'All Bookings',
          icon: <ListIcon />,
        },
      ];
    } else {
      // Employee
      return [
        {
          path: '/dashboard/book',
          label: 'Book Meal',
          icon: <CalendarAltIcon />,
        },
        {
          path: '/dashboard/my-bookings',
          label: 'My Bookings',
          icon: <ListIcon />,
        },
      ];
    }
  };

  // Define default route based on role
  const getDefaultRoute = () => {
    if (isAdmin) {
      return <Navigate to="/dashboard/approvals" replace />;
    } else if (isVendor) {
      return <Navigate to="/dashboard/bookings" replace />;
    } else {
      return <Navigate to="/dashboard/book" replace />;
    }
  };

  return (
    <Layout navItems={getNavItems()}>
      <Routes>
        <Route path="/" element={getDefaultRoute()} />
        
        {/* Admin routes */}
        {isAdmin && (
          <>
            <Route path="/approvals" element={<ApprovalManagement />} />
            <Route path="/summary" element={<DailySummary />} />
            <Route path="/dates" element={<DateManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/bookings" element={<UpcomingBookings />} />
            <Route path="/book" element={<BookingForm />} />
            <Route path="/my-bookings" element={<MyBookings />} />
          </>
        )}

        {/* Vendor routes */}
        {isVendor && (
          <>
            <Route path="/bookings" element={<UpcomingBookings />} />
          </>
        )}

        {/* Employee routes */}
        {isEmployee && (
          <>
            <Route path="/book" element={<BookingForm />} />
            <Route path="/my-bookings" element={<MyBookings />} />
          </>
        )}

        {/* Fallback - redirect to appropriate default */}
        <Route path="*" element={getDefaultRoute()} />
      </Routes>
    </Layout>
  );
};

export default Dashboard;

