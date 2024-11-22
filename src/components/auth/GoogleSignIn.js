import { useState } from 'react';
import { signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import colors from '../../styles/colors';

const GoogleSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Google sign-in error:', error);
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