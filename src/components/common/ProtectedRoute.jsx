import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '@patternfly/react-core';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const [showTimeout, setShowTimeout] = useState(false);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || !profile) {
        console.warn('ProtectedRoute: Loading timeout reached');
        setShowTimeout(true);
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timer);
  }, [loading, profile]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: '16px'
      }}>
        <Spinner size="xl" />
        {showTimeout && (
          <div style={{ textAlign: 'center' }}>
            <p>Taking longer than expected...</p>
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                marginTop: '8px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If we have a user but no profile after loading is done, show error with refresh option
  if (!profile) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: '16px'
      }}>
        <Spinner size="xl" />
        {showTimeout && (
          <div style={{ textAlign: 'center' }}>
            <p>Unable to load profile...</p>
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                marginTop: '8px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

