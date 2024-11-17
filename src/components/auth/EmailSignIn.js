import { useState } from 'react';
import { auth } from '../../firebaseConfig';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import colors from '../../styles/colors';

const EmailSignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (showResetForm) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Reset Password</h2>
        {resetSent ? (
          <p style={styles.successMessage}>Password reset email sent! Check your inbox.</p>
        ) : (
          <form onSubmit={handlePasswordReset} style={styles.form}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <button type="submit" style={styles.primaryButton}>
              Send Reset Link
            </button>
          </form>
        )}
        <button 
          onClick={() => setShowResetForm(false)}
          style={styles.linkButton}
        >
          Back to Sign In
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.primaryButton}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      
      <div style={styles.buttonGroup}>
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          style={styles.linkButton}
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
        
        <button 
          onClick={() => setShowResetForm(true)}
          style={styles.linkButton}
        >
          Forgot Password?
        </button>
      </div>
      
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
  },
  title: {
    textAlign: 'center',
    color: colors.text.primary,
    margin: '0 0 20px 0',
    fontSize: '24px',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '4px',
    border: `1px solid ${colors.border}`,
    fontSize: '14px',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: colors.primary.main,
      outline: 'none',
    }
  },
  primaryButton: {
    padding: '10px 12px',
    backgroundColor: colors.primary.main,
    color: colors.background.paper,
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: colors.primary.dark,
    }
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: colors.primary.main,
    cursor: 'pointer',
    fontSize: '13px',
    padding: '4px',
    ':hover': {
      textDecoration: 'underline',
    }
  },
  error: {
    color: colors.status.error,
    textAlign: 'center',
    marginTop: '12px',
    fontSize: '13px',
  },
  successMessage: {
    color: colors.status.success,
    textAlign: 'center',
    marginBottom: '16px',
    fontSize: '14px',
  }
};

export default EmailSignIn; 