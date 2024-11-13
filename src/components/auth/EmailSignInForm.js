import { useState } from 'react';

const EmailSignInForm = ({ onSignIn, onSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignUp) {
      await onSignUp(email, password, name || email.split('@')[0]);
    } else {
      await onSignIn(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {isSignUp && (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        style={{
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        style={{
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}
      />
      <button 
        type="submit"
        style={{
          padding: '8px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </button>
      <button 
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        style={{
          padding: '8px',
          backgroundColor: 'transparent',
          color: '#4285f4',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
      </button>
    </form>
  );
};

export default EmailSignInForm; 