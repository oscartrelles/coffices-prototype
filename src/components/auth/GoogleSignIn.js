import { useState } from 'react';
import { signInWithGoogle } from '../../firebaseConfig';
import { Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import colors from '../../styles/colors';
import analyticsService from '../../services/analyticsService';

const GoogleSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    analyticsService.trackSignInInitiated('google');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      analyticsService.trackSignInCompleted('google');
    } catch (error) {
      console.error('Google sign-in error:', error);
      analyticsService.trackError('sign_in_error', error.message, { method: 'google' });
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      startIcon={<GoogleIcon />}
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      fullWidth
      sx={{
        backgroundColor: colors.background.paper,
        color: colors.text.secondary,
        textTransform: 'none',
        border: `1px solid ${colors.border}`,
        '&:hover': {
          backgroundColor: colors.background.main,
        },
        '&:disabled': {
          color: colors.text.disabled,
        }
      }}
    >
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
};

export default GoogleSignIn;