import React, { useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { components } from '../styles';

function Header({ user, onSignInClick, setUser }) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = useMemo(() => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Guest';
  }, [user?.displayName, user?.email]);

  return (
    <header style={components.header.container}>
      <div style={components.header.leftSection}>
        <h1 style={components.header.title}>Find a Coffice!</h1>
      </div>
      
      <div style={components.header.rightSection}>
        {user && (
          <div style={components.header.userInfo}>
            <span style={components.header.statusDot} />
            <span style={components.header.userName}>
              Hi, {displayName}!
            </span>
          </div>
        )}
        <button
          onClick={user ? handleSignOut : onSignInClick}
          style={components.header.authButton}
        >
          {user ? 'Sign Out' : 'Sign In'}
        </button>
      </div>
    </header>
  );
}

export default Header; 