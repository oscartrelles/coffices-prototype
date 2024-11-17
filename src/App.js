import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, handleRedirectResult } from './firebaseConfig';
import EmailSignIn from './components/auth/EmailSignIn';
import GoogleSignIn from './components/auth/GoogleSignIn';
import Modal from './components/Modal';
import MapLoader from './components/MapLoader';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    handleRedirectResult();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <MapLoader user={user} onSignInClick={() => setShowAuthModal(true)} />
      
      {showAuthModal && !user && (
        <Modal onClose={() => user && setShowAuthModal(false)}>
          <div style={styles.authContainer}>
            <EmailSignIn />
            <div style={styles.divider} />
            <GoogleSignIn />
          </div>
        </Modal>
      )}
    </BrowserRouter>
  );
}

const styles = {
  authContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  divider: {
    width: '100%',
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '4px 0'
  }
};

export default App;

