import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, handleRedirectResult } from './firebaseConfig';
import EmailSignIn from './components/auth/EmailSignIn';
import GoogleSignIn from './components/auth/GoogleSignIn';
import Modal from './components/Modal';
import MapLoader from './components/MapLoader';
import Header from './components/Header';
import Footer from './components/Footer';
import Box from '@mui/material/Box';
import SearchBar from './components/SearchBar';
import Map from './components/Map';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setShowAuthModal(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignInClick = () => {
    console.log('Sign in clicked');
    setShowAuthModal(true);
  };

  const handleModalClose = () => {
    console.log('Modal closing');
    setShowAuthModal(false);
  };

  const handleLocationSelect = (place) => {
    console.log('Location selected in App:', place);
    if (place.geometry) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        name: place.name,
        formatted_address: place.formatted_address
      };
      setSelectedLocation(location);
    }
  };

  const handleMapLoaded = useCallback((loaded) => {
    console.log('Map loaded status:', loaded);
    setIsMapLoaded(loaded);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        position: 'fixed',
        width: '100%',
        top: 0,
        left: 0
      }}>
        <Header 
          user={user} 
          onSignInClick={handleSignInClick} 
        />
        
        <Box sx={{ 
          position: 'absolute', 
          top: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '90%',
          maxWidth: '600px'
        }}>
          <SearchBar 
            onLocationSelect={handleLocationSelect}
            isMapLoaded={isMapLoaded}
          />
        </Box>
        
        <MapLoader onMapLoaded={handleMapLoaded}>
          <Map 
            user={user} 
            onSignInClick={handleSignInClick} 
            selectedLocation={selectedLocation}
          />
        </MapLoader>
        
        <Footer />
        
        <Modal
          open={showAuthModal}
          onClose={handleModalClose}
        >
          <div style={styles.authContainer}>
            <EmailSignIn onSuccess={handleModalClose} />
            <div style={styles.divider} />
            <GoogleSignIn onSuccess={handleModalClose} />
          </div>
        </Modal>
      </Box>
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

