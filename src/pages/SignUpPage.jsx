import { Fragment, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LoginPage as PFLoginPage,
  LoginForm,
  LoginMainFooterBandItem,
  LoginFooterItem,
  ListItem,
  ListVariant,
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  AlertActionCloseButton,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useAuth } from '../contexts/AuthContext';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
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
        employee_id: formData.email, // Use email as employee_id
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
    <Fragment>
      <PFLoginPage
        footerListVariants={ListVariant.inline}
        textContent="Join our workplace meal booking system. Create an account to start ordering delicious meals with ease."
        loginTitle="Create your account"
        loginSubtitle={`Enter your details to sign up. Email must be from ${companyDomain}`}
        signUpForAccountMessage={
          <LoginMainFooterBandItem>
            Already have an account? <Link to="/login">Sign in.</Link>
          </LoginMainFooterBandItem>
        }
      >
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
            actionClose={<AlertActionCloseButton onClose={() => setSuccess('')} />}
          />
        )}

        <Form onSubmit={handleSubmit}>
          <FormGroup label="Full Name" isRequired fieldId="name">
            <TextInput
              isRequired
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="John Doe"
            />
          </FormGroup>

          <FormGroup
            label="Email"
            isRequired
            fieldId="email"
            helperText={`Must be a valid ${companyDomain} email. This will be used as your Employee ID.`}
          >
            <TextInput
              isRequired
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder={`yourname@${companyDomain}`}
            />
          </FormGroup>

          <FormGroup 
            label="Password" 
            isRequired 
            fieldId="password"
            helperText="Must be at least 6 characters"
          >
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
        </Form>
      </PFLoginPage>
    </Fragment>
  );
};

export default SignUpPage;

