import { Fragment, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LoginPage as PFLoginPage,
  LoginForm,
  LoginMainFooterBandItem,
  LoginFooterItem,
  ListItem,
  ListVariant,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRememberMeChecked, setIsRememberMeChecked] = useState(false);

  const handleEmailChange = (_event, value) => {
    setEmail(value);
    setIsValidEmail(true);
  };

  const handlePasswordChange = (_event, value) => {
    setPassword(value);
    setIsValidPassword(true);
  };

  const onRememberMeClick = () => {
    setIsRememberMeChecked(!isRememberMeChecked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    const emailValid = !!email;
    const passwordValid = !!password;
    setIsValidEmail(emailValid);
    setIsValidPassword(passwordValid);
    
    if (!emailValid || !passwordValid) {
      setError('Please enter both email and password.');
      return;
    }

    console.log('=== LOGIN ATTEMPT STARTED ===');
    setError('');
    setIsLoading(true);

    try {
      console.log('Calling signIn...');
      const { data, error } = await signIn(email, password);
      console.log('SignIn response:', { data: data?.user?.id, error });
      
      if (error) {
        setError(error.message);
        setIsLoading(false);
        setIsValidEmail(false);
        setIsValidPassword(false);
        return;
      }

      if (data.user) {
        console.log('Login successful, user:', data.user.id);
        
        // Fetch the user profile to determine role
        const { data: profileData, error: profileError } = await supabase
          .from('employees')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        console.log('Profile fetch result:', { profileData, profileError });

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setError(`Could not load user profile: ${profileError.message}`);
          setIsLoading(false);
          return;
        }

        if (!profileData) {
          console.error('No profile data found for user');
          setError('Profile not found. Please contact administrator.');
          setIsLoading(false);
          return;
        }

        // Redirect to unified dashboard
        const role = profileData.role || 'employee';
        console.log('Redirecting to dashboard for role:', role);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const signUpForAccountMessage = (
    <LoginMainFooterBandItem>
      Need an account? <Link to="/signup">Sign up.</Link>
    </LoginMainFooterBandItem>
  );

  const forgotCredentials = (
    <LoginMainFooterBandItem>
      <a href="#forgot-password">Forgot username or password?</a>
    </LoginMainFooterBandItem>
  );

  const listItem = (
    <Fragment>
      <ListItem>
        <LoginFooterItem href="#terms">Terms of Use</LoginFooterItem>
      </ListItem>
      <ListItem>
        <LoginFooterItem href="#help">Help</LoginFooterItem>
      </ListItem>
      <ListItem>
        <LoginFooterItem href="#privacy">Privacy Policy</LoginFooterItem>
      </ListItem>
    </Fragment>
  );

  const loginForm = (
    <LoginForm
      showHelperText={!!error}
      helperText={error || 'Invalid login credentials.'}
      helperTextIcon={<ExclamationCircleIcon />}
      usernameLabel="Email"
      usernameValue={email}
      onChangeUsername={handleEmailChange}
      isValidUsername={isValidEmail}
      passwordLabel="Password"
      passwordValue={password}
      isShowPasswordEnabled
      onChangePassword={handlePasswordChange}
      isValidPassword={isValidPassword}
      rememberMeLabel="Keep me logged in for 30 days."
      isRememberMeChecked={isRememberMeChecked}
      onChangeRememberMe={onRememberMeClick}
      onLoginButtonClick={handleSubmit}
      loginButtonLabel={isLoading ? 'Signing in...' : 'Log in'}
      isLoginButtonDisabled={isLoading}
    />
  );

  return (
    <PFLoginPage
      footerListVariants={ListVariant.inline}
      brandImgSrc="🍽️"
      brandImgAlt="Meal Booking System"
      footerListItems={listItem}
      textContent="Streamline your workplace meal bookings with our easy-to-use system. Book meals in advance, track your orders, and manage your preferences all in one place."
      loginTitle="Log in to your account"
      loginSubtitle="Enter your email and password to access the meal booking system."
      signUpForAccountMessage={signUpForAccountMessage}
      forgotCredentials={forgotCredentials}
    >
      {loginForm}
    </PFLoginPage>
  );
};

export default LoginPage;

