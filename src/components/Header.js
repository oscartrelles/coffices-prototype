import colors from '../styles/colors';

const Header = ({ user, onSignInClick, onSignOut }) => {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>Find the Perfect Coffice!</h1>
      <div style={styles.authSection}>
        {user ? (
          <>
            <span style={styles.userEmail}>{user.email}</span>
            <button 
              onClick={onSignOut}
              style={styles.authButton}
            >
              Sign Out
            </button>
          </>
        ) : (
          <button 
            onClick={onSignInClick}
            style={styles.authButton}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

const styles = {
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: colors.background.paper,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    boxShadow: `0 2px 4px ${colors.background.overlay}`,
    zIndex: 1000,
  },
  title: {
    color: colors.primary.main,
    fontSize: '24px',
    fontWeight: '500',
    margin: 0,
  },
  authSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userEmail: {
    color: colors.text.secondary,
    fontSize: '14px',
  },
  authButton: {
    padding: '8px 16px',
    backgroundColor: colors.primary.main,
    color: colors.background.paper,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: colors.primary.dark,
    }
  },
};

export default Header; 