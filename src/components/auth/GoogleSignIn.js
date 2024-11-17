import { signInWithGoogle } from '../../firebaseConfig';

const GoogleSignIn = () => {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <button 
      onClick={handleGoogleSignIn}
      style={styles.button}
    >
      <img 
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
        alt="Google logo" 
        style={styles.icon} 
      />
      Sign in with Google
    </button>
  );
};

const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f5f5f5',
    }
  },
  icon: {
    width: '18px',
    height: '18px'
  }
};

export default GoogleSignIn;