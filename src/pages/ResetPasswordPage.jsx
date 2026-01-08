import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  PageSection,
  Card,
  CardBody,
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  AlertActionCloseButton,
  Title,
} from '@patternfly/react-core';
import { supabase } from '../services/supabase';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', session); // Debug log
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event detected!'); // Debug log
        // User has clicked the reset link and is authenticated
        setHasValidToken(true);
        setIsCheckingToken(false);
      } else if (event === 'SIGNED_IN' && session) {
        console.log('SIGNED_IN event detected'); // Debug log
        // Also handle if already signed in
        setHasValidToken(true);
        setIsCheckingToken(false);
      }
    });

    // Check if already authenticated (for page refresh)
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Existing session check:', session); // Debug log
      
      if (session) {
        setHasValidToken(true);
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.');
        setHasValidToken(false);
      }
      setIsCheckingToken(false);
    };

    // Small delay to let auth state change event fire first
    const timer = setTimeout(checkExistingSession, 500);

    // Cleanup
    return () => {
      clearTimeout(timer);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      setSuccess('Password has been reset successfully! Redirecting to login...');
      
      // Sign out and redirect to login after 2 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <Page>
        <PageSection variant="light" isFilled>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <Card style={{ maxWidth: '500px', width: '100%' }}>
              <CardBody>
                <Title headingLevel="h1" size="2xl" style={{ marginBottom: '24px', textAlign: 'center' }}>
                  Verifying Reset Link...
                </Title>
              </CardBody>
            </Card>
          </div>
        </PageSection>
      </Page>
    );
  }

  if (!hasValidToken) {
    return (
      <Page>
        <PageSection variant="light" isFilled>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <Card style={{ maxWidth: '500px', width: '100%' }}>
              <CardBody>
                <Title headingLevel="h1" size="2xl" style={{ marginBottom: '24px', textAlign: 'center' }}>
                  Reset Password
                </Title>

                {error && (
                  <Alert 
                    variant="danger" 
                    title={error} 
                    style={{ marginBottom: '16px' }}
                    actionClose={<AlertActionCloseButton onClose={() => setError('')} />}
                  />
                )}

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/login')}
                  >
                    Back to Login
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page>
      <PageSection variant="light" isFilled>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%' }}>
            <CardBody>
              <Title headingLevel="h1" size="2xl" style={{ marginBottom: '24px', textAlign: 'center' }}>
                Reset Your Password
              </Title>

              {error && (
                <Alert 
                  variant="danger" 
                  title={error} 
                  style={{ marginBottom: '16px' }}
                  actionClose={<AlertActionCloseButton onClose={() => setError('')} />}
                />
              )}

              {success && (
                <Alert 
                  variant="success" 
                  title={success} 
                  style={{ marginBottom: '16px' }}
                />
              )}

              {hasValidToken && !success && (
                <Form onSubmit={handleSubmit}>
                  <FormGroup 
                    label="New Password" 
                    isRequired 
                    fieldId="new-password"
                    helperText="Must be at least 6 characters long"
                  >
                    <TextInput
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e, value) => setNewPassword(value)}
                      isRequired
                    />
                  </FormGroup>

                  <FormGroup 
                    label="Confirm New Password" 
                    isRequired 
                    fieldId="confirm-password"
                  >
                    <TextInput
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e, value) => setConfirmPassword(value)}
                      isRequired
                    />
                  </FormGroup>

                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isLoading}
                      isDisabled={isLoading}
                    >
                      Reset Password
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => navigate('/login')}
                      isDisabled={isLoading}
                    >
                      Back to Login
                    </Button>
                  </div>
                </Form>
              )}
            </CardBody>
          </Card>
        </div>
      </PageSection>
    </Page>
  );
};

export default ResetPasswordPage;
