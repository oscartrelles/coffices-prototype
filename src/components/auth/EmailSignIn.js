import { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { components } from '../../styles';

const EmailSignIn = ({ onSuccess, setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  useEffect(() => {
    console.log('Auth state:', auth.currentUser);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    console.log('Attempting sign in/up:', { 
      isSignUp, 
      email, 
      passwordLength: password.length 
    });
    
    try {
      if (isSignUp) {
        console.log('Creating new user...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        console.log('User created, updating profile...');
        await updateProfile(userCredential.user, {
          displayName: name
        });
        console.log('Profile updated successfully');
        setUser(userCredential.user);
        onSuccess?.();
      } else {
        console.log('Signing in existing user...');
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in successful:', result.user.email);
        setUser(result.user);
        onSuccess?.();
      }
    } catch (err) {
      console.error('Auth error:', err);
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
      <div style={components.emailSignIn.container}>
        <h2 style={components.emailSignIn.title}>Reset Password</h2>
        {resetSent ? (
          <p style={components.emailSignIn.successMessage}>
            Password reset email sent! Check your inbox.
          </p>
        ) : (
          <form onSubmit={handlePasswordReset} style={components.emailSignIn.form}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={components.emailSignIn.input}
              required
            />
            <button type="submit" style={components.emailSignIn.primaryButton}>
              Send Reset Link
            </button>
          </form>
        )}
        <button 
          onClick={() => setShowResetForm(false)}
          style={components.emailSignIn.linkButton}
        >
          Back to Sign In
        </button>
        {error && <p style={components.emailSignIn.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={components.emailSignIn.container}>
      <h2 style={components.emailSignIn.title}>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleSubmit} style={components.emailSignIn.form}>
        {isSignUp && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={components.emailSignIn.input}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={components.emailSignIn.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={components.emailSignIn.input}
          required
        />
        <button type="submit" style={components.emailSignIn.primaryButton}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      
      <div style={components.emailSignIn.buttonGroup}>
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          style={components.emailSignIn.linkButton}
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
        
        <button 
          onClick={() => setShowResetForm(true)}
          style={components.emailSignIn.linkButton}
        >
          Forgot Password?
        </button>
      </div>
      
      {error && <p style={components.emailSignIn.error}>{error}</p>}
    </div>
  );
};

export default EmailSignIn; 