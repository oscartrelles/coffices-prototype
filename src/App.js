import { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import { auth, db, logAnalyticsEvent } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import analyticsService from './services/analyticsService';
import { HelmetProvider } from 'react-helmet-async';
import getApiKeys from './config/apiKeys';
import ErrorBoundary from './components/ErrorBoundary';
import EmailSignIn from './components/auth/EmailSignIn';
import GoogleSignIn from './components/auth/GoogleSignIn';
import Modal from './components/Modal';
import Header from './components/Header';
import Footer from './components/Footer';
import Box from '@mui/material/Box';
import SearchBar from './components/SearchBar';
import Map from './components/Map';
import LoadingSpinner from './components/common/LoadingSpinner';
import AdminRoute from './components/auth/AdminRoute';
import CofficePage from './components/CofficePage';

// Lazy load profile page for code splitting
const ProfilePage = lazy(() => import('./components/ProfilePage'));

// Lazy load admin components for code splitting
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [shouldRedirectToProfile, setShouldRedirectToProfile] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            unsubscribe();
            resolve();
          });
        });

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
                resolve();
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
      setIsMapLoaded(true);
      return;
    }

    const loadGoogleMaps = async () => {
      try {
        const { mapsApiKey } = getApiKeys();
        
        // Use async loading with proper error handling
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places&loading=async`;
          script.async = true;
          script.defer = true;
          
          script.onload = resolve;
          script.onerror = reject;
          
          document.head.appendChild(script);
        });
        
        // Wait for Google Maps to be fully loaded
        await new Promise((resolve) => {
          const checkGoogleMaps = () => {
            if (window.google && window.google.maps) {
              resolve();
            } else {
              setTimeout(checkGoogleMaps, 100);
            }
          };
          checkGoogleMaps();
        });
        
        setIsMapLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        // Fallback: try traditional callback method
        const script = document.createElement('script');
        const { mapsApiKey } = getApiKeys();
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        
        window.initMap = () => {
          setIsMapLoaded(true);
        };
        
        document.head.appendChild(script);
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    analyticsService.trackAppLoaded();
    // Track first step of main funnel
    analyticsService.trackFunnelStep('main_user_journey', 'app_loaded', 1, 6);

    // Track page load performance
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        analyticsService.trackPageLoadPerformance(
          perfData.loadEventEnd - perfData.loadEventStart,
          perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          perfData.domContentLoadedEventEnd - perfData.fetchStart
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      analyticsService.trackPageView('map_view');
    }
  }, [isLoading]);

  // Track session end when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      analyticsService.trackSessionEnd();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleSignInClick = () => {
    logAnalyticsEvent('sign_in_started');
    setShowAuthModal(true);
  };

  const handleModalClose = () => {
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

  const clearSelectedLocation = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  const handleUserLocation = useCallback((location) => {
    setUserLocation(location);
  }, []);

  const handleLocationClick = useCallback(() => {
    if (!map) {
      return;
    }
    
    if (!userLocation) {
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



  // Check if user has a profile and redirect if they don't
  const checkUserProfile = useCallback(async (currentUser) => {
    if (!currentUser?.uid) return;
    
    try {
      const profileRef = doc(db, 'profiles', currentUser.uid);
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) {
        // User doesn't have a profile, set flag to redirect
        console.log('New user detected, will redirect to profile page');
        setShouldRedirectToProfile(true);
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    } finally {
      setHasCheckedProfile(true);
    }
  }, []);

  // Check profile when user changes
  useEffect(() => {
    if (user && !hasCheckedProfile) {
      checkUserProfile(user);
    }
  }, [user, hasCheckedProfile, checkUserProfile]);

  // Handle redirect to profile page
  useEffect(() => {
    if (shouldRedirectToProfile && hasCheckedProfile) {
      // Don't redirect if already on profile page
      if (window.location.pathname === '/profile') {
        setShouldRedirectToProfile(false);
        return;
      }
      
      console.log('Redirecting to profile page');
      window.location.href = '/profile';
    }
  }, [shouldRedirectToProfile, hasCheckedProfile]);

  // Reset redirect flag when user signs out
  useEffect(() => {
    if (!user) {
      setShouldRedirectToProfile(false);
      setHasCheckedProfile(false);
    }
  }, [user]);

  if (isLoading) return <LoadingSpinner />;

  return (
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
                  userLocation={userLocation}
                />
              </Box>
              <Map 
                user={user} 
                onSignInClick={handleSignInClick} 
                selectedLocation={selectedLocation}
                onMapInstance={setMap}
                onUserLocation={handleUserLocation}
                onClearSelectedLocation={clearSelectedLocation}
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

function MainRouter() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/coffice/:placeId" element={<CofficePageWrapper />} />
            <Route path="/profile/:userId?" element={<ProfilePageWrapper />} />
            <Route path="/admin" element={
              <AdminRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminDashboard />
                </Suspense>
              </AdminRoute>
            } />
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

function CofficePageWrapper() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { placeId } = useParams();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      analyticsService.trackPageView('coffice_details', {
        place_id: placeId
      });
    }
  }, [isLoading, placeId]);

  const handleSignInClick = () => {
    // For deep links, we'll redirect to the main app for sign in
    window.location.href = '/';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CofficePage user={user} onSignInClick={handleSignInClick} />
    </Suspense>
  );
}

function ProfilePageWrapper() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userId } = useParams();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      analyticsService.trackPageView('profile', {
        user_id: userId || 'current_user'
      });
    }
  }, [isLoading, userId]);

  const handleSignInClick = () => {
    // For deep links, we'll redirect to the main app for sign in
    window.location.href = '/';
  };

  // Validate userId if provided
  useEffect(() => {
    if (!isLoading && userId) {
      // Check if userId is a valid Firebase UID format (28 characters, alphanumeric)
      const isValidUid = /^[a-zA-Z0-9]{28}$/.test(userId);
      if (!isValidUid) {
        console.error('Invalid user ID format:', userId);
        // Redirect to main app for invalid user IDs
        window.location.href = '/';
        return;
      }
    }
  }, [userId, isLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfilePage user={user} onSignInClick={handleSignInClick} />
    </Suspense>
  );
}

export default MainRouter;
