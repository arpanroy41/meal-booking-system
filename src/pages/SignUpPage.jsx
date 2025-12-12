import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Title,
} from '@patternfly/react-core';
import { useAuth } from '../contexts/AuthContext';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    employeeId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const companyDomain = import.meta.env.VITE_COMPANY_DOMAIN || 'yourcompany.com';

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleChange = (field) => (e, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const validateEmail = (email) => {
    return email.endsWith(`@${companyDomain}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validation
    if (!validateEmail(formData.email)) {
      setError(`Email must be a valid ${companyDomain} email address`);
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp(formData.email, formData.password, {
        name: formData.name,
        employee_id: formData.employeeId,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      setSuccess('Account created successfully! Please check your email to verify your account.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <PageSection
        variant="light"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Card style={{ maxWidth: '500px', width: '100%' }}>
          <CardBody>
            <Title headingLevel="h1" size="2xl" style={{ marginBottom: '24px' }}>
              Create Account
            </Title>

            {error && (
              <Alert variant="danger" title={error} style={{ marginBottom: '16px' }} />
            )}

            {success && (
              <Alert variant="success" title={success} style={{ marginBottom: '16px' }} />
            )}

            <Form onSubmit={handleSubmit}>
              <FormGroup label="Full Name" isRequired fieldId="name">
                <TextInput
                  isRequired
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange('name')}
                />
              </FormGroup>

              <FormGroup label="Employee ID" isRequired fieldId="employeeId">
                <TextInput
                  isRequired
                  type="text"
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange('employeeId')}
                />
              </FormGroup>

              <FormGroup
                label="Email"
                isRequired
                fieldId="email"
                helperText={`Must be a valid ${companyDomain} email`}
              >
                <TextInput
                  isRequired
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                />
              </FormGroup>

              <FormGroup label="Password" isRequired fieldId="password">
                <TextInput
                  isRequired
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                />
              </FormGroup>

              <FormGroup label="Confirm Password" isRequired fieldId="confirmPassword">
                <TextInput
                  isRequired
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                />
              </FormGroup>

              <Button
                variant="primary"
                type="submit"
                isBlock
                isDisabled={isLoading}
                style={{ marginTop: '16px' }}
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                Already have an account? <Link to="/login">Sign in</Link>
              </div>
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    </Page>
  );
};

export default SignUpPage;

