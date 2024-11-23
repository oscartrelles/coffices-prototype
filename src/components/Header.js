import React, { useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import colors from '../styles/colors';

function Header({ user, onSignInClick }) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = useMemo(() => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];  // Get the part before @
    }
    return 'Guest';
  }, [user?.displayName, user?.email]);

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <h1 style={styles.title}>Find the Perfect Coffice!</h1>
        <div style={styles.greeting}>
        </div>
      </div>
      <div style={styles.rightSection}>
        {user && (
          <div style={styles.userInfo}>
            <span style={styles.dot} />
            <span style={styles.userName}>Welcome back, {displayName}</span>
          </div>
        )}
        <button
          onClick={user ? handleSignOut : onSignInClick}
          style={styles.authButton}
        >
          {user ? 'Sign Out' : 'Sign In'}
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: colors.background.paper,
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 1000,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
    color: colors.text.primary,
  },
  greeting: {
    fontSize: '14px',
    color: colors.text.secondary,
    '@media (max-width: 480px)': {
      display: 'none', // Hide greeting on very small screens
    },
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#4caf50', // Green dot for active status
  },
  userName: {
    fontSize: '14px',
    color: colors.text.secondary,
    '@media (max-width: 600px)': {
      display: 'none', // Hide username on small screens
    },
  },
  authButton: {
    padding: '8px 16px',
    backgroundColor: colors.background.paper,
    color: colors.text.primary,
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: colors.background.main,
    }
  }
};

export default Header; 