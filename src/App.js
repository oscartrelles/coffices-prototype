import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, handleRedirectResult, logAnalyticsEvent } from './firebaseConfig';
import EmailSignIn from './components/auth/EmailSignIn';
import GoogleSignIn from './components/auth/GoogleSignIn';
import Modal from './components/Modal';
import Header from './components/Header';
import Footer from './components/Footer';
import Box from '@mui/material/Box';
import SearchBar from './components/SearchBar';
import Map from './components/Map';
import PlaceDetails from './components/PlaceDetails';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        // Wait for auth state to be determined
        await new Promise(resolve => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            unsubscribe();
            resolve();
          });
        });

        // Wait for geolocation if available
        if ("geolocation" in navigator) {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setUserLocation({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                });
                resolve();
              },
              (error) => {
                console.error('Error getting location:', error);
                resolve(); // Resolve anyway to continue app initialization
              }
            );
          });
        }

      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (window.google) {
      console.log('Google Maps already loaded');
      setIsMapLoaded(true);
      return;
    }

    console.log('Loading Google Maps script');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Define the callback function
    window.initMap = () => {
      console.log('Google Maps loaded successfully');
      setIsMapLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      delete window.initMap;
    };
  }, []);

  useEffect(() => {
    logAnalyticsEvent('app_loaded');
  }, []);

  const handleSignInClick = () => {
    logAnalyticsEvent('sign_in_started');
    setShowAuthModal(true);
  };

  const handleModalClose = () => {
    console.log('Modal closing');
    setShowAuthModal(false);
  };

  const handleLocationSelect = useCallback((location) => {
    logAnalyticsEvent('location_selected', {
      lat: location.lat,
      lng: location.lng,
      fromSearch: location.fromSearch || false
    });
    setSelectedLocation(location);
  }, []);

  const handleUserLocation = useCallback((location) => {
    setUserLocation(location);
  }, []);

  const handleLocationClick = useCallback(() => {
    console.log('Location click handler called', { map, userLocation });
    if (!map) {
      console.log('Waiting for map to be ready...');
      return;
    }
    
    if (!userLocation) {
      console.log('No user location available');
      return;
    }

    handleLocationSelect({
      ...userLocation,
      fromSearch: true
    }, map);
  }, [map, userLocation, handleLocationSelect]);

  const handleAuthSuccess = () => {
    logAnalyticsEvent('login_success');
    handleModalClose();
  };

  const handleSignOut = () => {
    logAnalyticsEvent('user_signed_out');
  };

  if (isLoading) return <LoadingSpinner />;

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
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <Header 
              user={user} 
              onSignInClick={handleSignInClick} 
              setUser={setUser}
            />
            
            {isMapLoaded && (
              <>
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
                    map={map}
                    onLocationClick={handleLocationClick}
                  />
                </Box>
                
                <Map 
                  user={user} 
                  onSignInClick={handleSignInClick} 
                  selectedLocation={selectedLocation}
                  onMapInstance={setMap}
                  onUserLocation={handleUserLocation}
                />
              </>
            )}
            
            <Footer />
            
            <Modal
              open={showAuthModal}
              onClose={handleModalClose}
            >
              <div style={styles.authContainer}>
                <EmailSignIn 
                  onSuccess={handleAuthSuccess} 
                  setUser={setUser}
                />
                <div style={styles.divider} />
                <GoogleSignIn 
                  onSuccess={handleAuthSuccess}
                  setUser={setUser}
                />
              </div>
            </Modal>
          </>
        )}
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

