import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import RatingForm from './RatingForm';
import EmailSignInForm from './components/auth/EmailSignInForm';
import { 
  onAuthStateChanged,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  getAuth
} from 'firebase/auth';
import SearchBar from "./SearchBar";
import CircularProgress from "@mui/material/CircularProgress";
import Modal from './components/Modal';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  arrayUnion,
  runTransaction,
  getDocs,
  query,
  where,
  limit
} from 'firebase/firestore';
import { auth, db, signInWithGoogle, checkAuthRedirect } from './firebaseConfig';
import { createRoot } from 'react-dom/client';
import { Dialog, DialogTitle, DialogContent, Button, Typography, Box, Divider, TextField } from '@mui/material';
import debounce from 'lodash/debounce';

// Create providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};
const defaultCenter = {
  lat: 36.7213,
  lng: -4.4216,
};
const defaultZoom = 17;

// Add this SVG component at the top of your file
const GoogleIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 48 48" 
    width="24px" 
    height="24px"
    style={{ marginRight: '10px' }}
  >
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

// Add this Facebook icon component
const FacebookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
    style={{ marginRight: '10px' }}
  >
    <path fill="#3F51B5" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"/>
    <path fill="#FFF" d="M34.368,25H31v13h-5V25h-3v-4h3v-2.41c0.002-3.508,1.459-5.59,5.592-5.59H35v4h-2.287C31.104,17,31,17.6,31,18.723V21h4L34.368,25z"/>
  </svg>
);

// Add these imports if you're using SVG icons
const RatedCoffeeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M2 21h18v-2H2v2zM20 8h-2V5h2v3zm0-5H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm-4 12c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V5h10v10zm4-5h-2V7h2v3z" fill="#4CAF50"/>
    <circle cx="18" cy="4" r="6" fill="#FFC107"/>
    <text x="18" y="6" textAnchor="middle" fontSize="8" fill="#000">★</text>
  </svg>
);

const UnratedCoffeeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M2 21h18v-2H2v2zM20 8h-2V5h2v3zm0-5H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm-4 12c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V5h10v10zm4-5h-2V7h2v3z" fill="#757575"/>
  </svg>
);

const Map = ({ user: initialUser }) => {
  const [user, setUser] = useState(initialUser);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [coffeeShops, setCoffeeShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [infoWindowPosition, setInfoWindowPosition] = useState(null);
  const [isInfoWindowReady, setIsInfoWindowReady] = useState(false);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const mapInstanceRef = useRef(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userName, setUserName] = useState(null);
  const [isMapCentered, setIsMapCentered] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState(null);
  const auth = getAuth();

  const mapOptions = {
    mapId: process.env.REACT_APP_GOOGLE_MAPS_ID,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  };

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Observe user authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser);
      setUser(currentUser);
      
      if (currentUser) {
        let name = null;
        
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().name) {
            name = userDoc.data().name;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }

        if (!name) {
          name = currentUser.displayName || currentUser.email.split('@')[0];
        }

        setUserName(name);

        if (showAuthForm) {
          setShowAuthForm(false);
          setShowRatingForm(true);
        }
      } else {
        setUserName(null);
      }
    });

    return () => unsubscribe();
  }, [showAuthForm]);

  const handleRatingSubmit = async (ratings) => {
    try {
      // Check again before submitting
      const hasRated = await checkExistingRating(selectedShop.place_id || selectedShop.id, user.uid);
      if (hasRated) {
        setError('You have already rated this coffice');
        setShowRatingForm(false);
        return;
      }

      // Prepare the rating data
      const ratingData = {
        ...ratings,
        userId: user.uid,
        shopId: selectedShop.place_id || selectedShop.id,
        shopName: selectedShop.name,
        timestamp: serverTimestamp(),
        userEmail: user.email
      };

      // Add the rating to Firestore
      const ratingsRef = collection(db, 'ratings');
      await addDoc(ratingsRef, ratingData);

      // Update shop averages
      await updateShopAverages(selectedShop.place_id || selectedShop.id);

      setShowRatingForm(false);
      setSuccessMessage('Rating submitted successfully!');
      
      // Refresh the shop data to show updated ratings
      if (selectedShop) {
        const updatedShop = await fetchShopData(selectedShop.place_id || selectedShop.id);
        setSelectedShop(updatedShop);
      }

    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating. Please try again.');
    }
  };

  const handleMarkerClick = useCallback(async (shop) => {
    console.log('Original shop data:', shop);
    
    const transformedShop = {
      id: shop.place_id || shop.id,
      name: shop.name,
      formatted_address: shop.formatted_address || shop.vicinity,
      lat: shop.geometry ? shop.geometry.location.lat() : shop.lat,
      lng: shop.geometry ? shop.geometry.location.lng() : shop.lng,
    };
    
    console.log('Transformed shop data:', transformedShop);

    try {
      // Get shop ratings
      const shopRef = doc(db, 'shops', transformedShop.id);
      const shopDoc = await getDoc(shopRef);
      
      if (shopDoc.exists()) {
        const shopData = shopDoc.data();
        console.log('Found shop data in Firestore:', shopData);
        transformedShop.averages = shopData.averages;
        transformedShop.totalRatings = shopData.totalRatings;
      }

      // Check if current user has rated this shop
      if (user) {
        const ratingsRef = collection(db, 'ratings');
        const q = query(
          ratingsRef,
          where('userId', '==', user.uid),
          where('shopId', '==', transformedShop.id),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        transformedShop.userHasRated = !querySnapshot.empty;
        console.log('User has rated:', transformedShop.userHasRated);
      }

    } catch (error) {
      console.error('Error fetching shop data:', error);
    }

    console.log('Final shop data being set:', transformedShop);
    setSelectedShop(transformedShop);
  }, [user]);

  const onMapLoad = useCallback((map) => {
    console.log('Map loaded');
    mapInstanceRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow({
      pixelOffset: new window.google.maps.Size(0, -30)
    });
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(userLocation);
          map.panTo(userLocation);
          setIsMapCentered(true);
        },
        (error) => {
          console.error("Error getting user location:", error);
          setIsMapCentered(true); // Still set to true so searches can proceed
        }
      );
    } else {
      setIsMapCentered(true); // Still set to true so searches can proceed
    }
  }, []);

  // Debounced search with increased timing
  const debouncedSearch = useCallback(
    debounce((center) => {
      console.log('Debounced search triggered at:', center);
      searchNearby(center);
    }, 1500), // 1.5s debounce
    []
  );

  // Map movement handler
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const handleMapIdle = () => {
      const center = mapInstanceRef.current.getCenter();
      const centerObj = {
        lat: center.lat(),
        lng: center.lng()
      };
      
      console.log('Map idle at center:', centerObj);
      debouncedSearch(centerObj);
    };

    // Initial search
    handleMapIdle();

    // Add listener
    const idleListener = mapInstanceRef.current.addListener('idle', handleMapIdle);

    // Cleanup
    return () => {
      if (idleListener) {
        window.google.maps.event.removeListener(idleListener);
      }
      debouncedSearch.cancel();
    };
  }, [mapInstanceRef, debouncedSearch]);

  // Function to check if a shop has ratings
  const checkShopRatings = async (placeId) => {
    try {
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('placeId', '==', placeId));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking ratings:', error);
      return false;
    }
  };

  // Update the marker creation in the useEffect
  useEffect(() => {
    if (!mapInstanceRef.current || !coffeeShops.length) {
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    const createMarkers = async () => {
      const newMarkers = await Promise.all(coffeeShops.map(async (shop) => {
        const position = shop.geometry.location;
        const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
        const lng = typeof position.lng === 'function' ? position.lng() : position.lng;

        // Check if shop has ratings
        const hasRatings = await checkShopRatings(shop.place_id);

        // Create marker icon
        const icon = {
          url: `data:image/svg+xml,${encodeURIComponent(
            hasRatings ? RatedCoffeeIcon() : UnratedCoffeeIcon()
          )}`,
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32),
        };

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          title: shop.name,
          icon: icon,
          animation: window.google.maps.Animation.DROP
        });

        marker.addListener('click', () => {
          const transformedShop = {
            id: shop.place_id,
            name: shop.name,
            formatted_address: shop.vicinity,
            lat: lat,
            lng: lng,
            hasRatings: hasRatings
          };
          setSelectedShop(transformedShop);
        });

        return marker;
      }));

      markersRef.current = newMarkers;
    };

    createMarkers();
  }, [mapInstanceRef, coffeeShops]);

  const searchNearby = async (center) => {
    if (!mapInstanceRef.current) return;

    try {
      setIsLoading(true);
      const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
      
      const request = {
        location: new window.google.maps.LatLng(center.lat, center.lng),
        radius: '1000',
        type: ['cafe'],
        keyword: 'coffee'
      };

      service.nearbySearch(request, (results, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          console.log('Found coffee shops:', results.length);
          setCoffeeShops(results);
        } else {
          console.error('Places search failed:', status);
          if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setCoffeeShops([]);
          }
        }
      });
    } catch (error) {
      console.error('Error searching for coffee shops:', error);
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Close the auth form on success
      setShowAuthForm(false);
      setEmail('');
      setPassword('');
      setIsEmailMode(false);
    } catch (error) {
      console.error('Auth error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setAuthError('An account with this email already exists');
          break;
        case 'auth/invalid-email':
          setAuthError('Please enter a valid email address');
          break;
        case 'auth/weak-password':
          setAuthError('Password should be at least 6 characters');
          break;
        case 'auth/user-not-found':
          setAuthError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setAuthError('Incorrect password');
          break;
        default:
          setAuthError('An error occurred. Please try again.');
      }
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Auth handlers
  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting sign-in process from Map...');
      setShowAuthForm(false);
      
      const result = await signInWithGoogle();
      console.log('Sign-in completed:', result.user.email);
    } catch (error) {
      console.error('Sign-in error in Map:', error);
      setError(error.message);
      setShowAuthForm(true);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await signInWithRedirect(auth, facebookProvider);
    } catch (error) {
      console.error('Facebook sign in error:', error);
      setError(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error.message);
    }
  };

  const handlePlaceSelected = useCallback((place) => {
    console.log('Selected place:', place); // Debug log
    if (place.geometry?.location) {
      const transformedPlace = {
        id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        rating: place.rating,
        business_status: place.business_status
      };
      setSelectedShop(transformedPlace);
      
      const location = {
        lat: transformedPlace.lat,
        lng: transformedPlace.lng
      };
      setMapCenter(location);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(location);
        mapInstanceRef.current.setZoom(15);
      }
    }
  }, []);

  // Add logging to track state changes
  useEffect(() => {
    console.log('State changed:', {
      selectedShop,
      showAuthForm,
      showRatingForm,
      user
    });
  }, [selectedShop, showAuthForm, showRatingForm, user]);

  // Get user location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Error getting location:', error)
      );
    }
  }, []);

  useEffect(() => {
    if (selectedShop && mapInstanceRef.current && infoWindowRef.current) {
      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const d = R * c;
        return d.toFixed(1);
      };

      const deg2rad = (deg) => {
        return deg * (Math.PI/180);
      };

      const renderInfoWindow = async () => {
        let hasRated = false;
        if (user) {
          hasRated = await checkExistingRating(selectedShop.place_id || selectedShop.id, user.uid);
        }

        let distanceText = '';
        if (userLocation && selectedShop.lat && selectedShop.lng) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            selectedShop.lat,
            selectedShop.lng
          );
          distanceText = `
            <p style="margin: 4px 0; color: #666;">
              <span style="color: #4285f4;">📍</span> ${distance}km away
            </p>
          `;
        }

        const buttonStyle = hasRated ? 
          'background-color: #ccc; cursor: not-allowed;' : 
          'background-color: #4285f4; cursor: pointer;';

        const content = showRatingForm ? `
          <div style="padding: 12px; min-width: 300px; background-color: white; border-radius: 8px;">
            <div id="ratingFormContainer"></div>
          </div>
        ` : `
          <div style="padding: 12px; min-width: 300px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 8px 0;">${selectedShop.name}</h3>
            <p style="margin: 0 0 8px 0; color: #666;">
              ${selectedShop.formatted_address || selectedShop.vicinity || 'No address available'}
            </p>
            ${distanceText}
            ${selectedShop.averages ? `
              <div style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px;">
                <p style="margin: 0;">⚡ Wifi: ${selectedShop.averages.wifi.toFixed(1)}/5</p>
                <p style="margin: 0;">🔌 Power: ${selectedShop.averages.power.toFixed(1)}/5</p>
                <p style="margin: 0;">🔊 Noise: ${selectedShop.averages.noise.toFixed(1)}/5</p>
                <p style="margin: 0;">☕ Coffee: ${selectedShop.averages.coffee.toFixed(1)}/5</p>
              </div>
            ` : ''}
            <button 
              id="actionButton"
              style="
                width: 100%;
                padding: 8px 16px;
                color: white;
                border: none;
                border-radius: 4px;
                margin-top: 8px;
                ${buttonStyle}
              "
              ${hasRated ? 'disabled' : ''}
            >
              ${user ? (hasRated ? 'Already Rated' : 'Rate Coffice') : 'Sign in to Rate'}
            </button>
          </div>
        `;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.setPosition({
          lat: selectedShop.lat,
          lng: selectedShop.lng
        });

        window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
          if (showRatingForm) {
            const container = document.getElementById('ratingFormContainer');
            if (container) {
              const root = createRoot(container);
              root.render(
                <RatingForm 
                  onSubmit={handleRatingSubmit}
                  onCancel={() => setShowRatingForm(false)}
                />
              );
            }
          } else {
            const actionButton = document.getElementById('actionButton');
            if (actionButton && (!user || !hasRated)) {
              actionButton.addEventListener('click', () => {
                if (user) {
                  setShowRatingForm(true);
                } else {
                  setShowAuthForm(true);
                }
              });
            }
          }
        });

        infoWindowRef.current.open(mapInstanceRef.current);
      };

      renderInfoWindow();

      return () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
      };
    }
  }, [selectedShop, showRatingForm, user, error, successMessage, userLocation, setShowAuthForm, setShowRatingForm, handleRatingSubmit]);

  // Add this near your other utility functions
  const checkExistingRating = async (shopId, userId) => {
    try {
      console.log('Checking rating for shop:', shopId, 'user:', userId);
      const ratingsRef = collection(db, 'ratings');
      const q = query(
        ratingsRef,
        where('shopId', '==', shopId),
        where('userId', '==', userId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking existing rating:', error);
      return false;
    }
  };

  const updateShopAverages = async (shopId) => {
    try {
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('shopId', '==', shopId));
      const querySnapshot = await getDocs(q);
      
      let totals = {
        wifi: 0,
        power: 0,
        noise: 0,
        coffee: 0,
        count: 0
      };

      querySnapshot.forEach((doc) => {
        const rating = doc.data();
        totals.wifi += rating.wifi;
        totals.power += rating.power;
        totals.noise += rating.noise;
        totals.coffee += rating.coffee;
        totals.count++;
      });

      const averages = {
        wifi: totals.count > 0 ? totals.wifi / totals.count : 0,
        power: totals.count > 0 ? totals.power / totals.count : 0,
        noise: totals.count > 0 ? totals.noise / totals.count : 0,
        coffee: totals.count > 0 ? totals.coffee / totals.count : 0,
        totalRatings: totals.count
      };

      // Update or create shop document with new averages
      const shopRef = doc(db, 'shops', shopId);
      await setDoc(shopRef, { averages }, { merge: true });

    } catch (error) {
      console.error('Error updating shop averages:', error);
      throw error;
    }
  };

  const fetchShopData = async (shopId) => {
    try {
      const shopRef = doc(db, 'shops', shopId);
      const shopDoc = await getDoc(shopRef);
      
      if (shopDoc.exists()) {
        return {
          ...selectedShop,
          averages: shopDoc.data().averages
        };
      }
      
      return selectedShop;
    } catch (error) {
      console.error('Error fetching shop data:', error);
      return selectedShop;
    }
  };

  // Use the user prop to show/hide appropriate UI elements
  useEffect(() => {
    console.log('User state in Map:', user);
  }, [user]);

  // Update useEffect to handle user changes
  useEffect(() => {
    console.log('User state changed in Map:', user);
    
    // If user signs out, reset the form state
    if (!user) {
      setShowRatingForm(false);
      // Optionally, if you want to keep the InfoWindow open but show login prompt
      if (selectedShop) {
        setShowAuthForm(true);
      }
    }
  }, [user]);

  return (
    <div className="map-container">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef'
      }}>
        {userName && (
          <div style={{ 
            color: '#495057',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>👋 Welcome back, {userName}</span>
            <button
              onClick={handleSignOut}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Sign Out
            </button>
          </div>
        )}
        <SearchBar onPlaceSelected={handlePlaceSelected} />
      </div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={defaultZoom}
        center={mapCenter}
        onLoad={onMapLoad}
        options={mapOptions}
      >
        {coffeeShops.map((shop) => {
          //console.log('Rendering marker for shop:', shop); // Debug log
          const position = shop.geometry ? {
            lat: shop.geometry.location.lat(),
            lng: shop.geometry.location.lng()
          } : {
            lat: shop.lat,
            lng: shop.lng
          };

          return (
            <Marker
              key={shop.place_id || shop.id}
              position={position}
              onClick={() => handleMarkerClick(shop)}
            />
          );
        })}
      </GoogleMap>

      {showAuthForm && (
        <Dialog 
          open={showAuthForm} 
          onClose={() => {
            setShowAuthForm(false);
            setIsEmailMode(false);
            setEmail('');
            setPassword('');
          }}
          PaperProps={{
            sx: {
              borderRadius: 2,
              maxWidth: '400px',
              width: '90%'
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center',
            pb: 1
          }}>
            Sign In Required
          </DialogTitle>
          <DialogContent>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 2
            }}>
              <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
                Please sign in to rate and review coffee shops
              </Typography>
              
              {!isEmailMode ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleGoogleSignIn}
                    startIcon={<GoogleIcon />}
                    fullWidth
                    sx={{
                      backgroundColor: '#fff',
                      color: '#757575',
                      textTransform: 'none',
                      border: '1px solid #dadce0',
                      borderRadius: '4px',
                      padding: '10px 24px',
                      '&:hover': {
                        backgroundColor: '#f8f9fa',
                        boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
                      }
                    }}
                  >
                    Sign in with Google
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => alert('Facebook sign in coming soon!')}
                    startIcon={<FacebookIcon />}
                    fullWidth
                    sx={{
                      backgroundColor: '#1877F2',
                      color: '#fff',
                      textTransform: 'none',
                      borderRadius: '4px',
                      padding: '10px 24px',
                      '&:hover': {
                        backgroundColor: '#166FE5',
                        boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
                      }
                    }}
                  >
                    Sign in with Facebook
                  </Button>

                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', my: 2 }}>
                    <Divider sx={{ flex: 1 }} />
                    <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
                      or
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Box>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setIsEmailMode(true)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '4px',
                      padding: '10px 24px'
                    }}
                  >
                    Continue with Email
                  </Button>
                </>
              ) : (
                <form onSubmit={handleEmailAuth} style={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      error={!!authError}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      fullWidth
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      error={!!authError}
                      helperText={authError}
                    />
                    
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{
                        mt: 1,
                        textTransform: 'none',
                        borderRadius: '4px',
                        padding: '10px 24px'
                      }}
                    >
                      {isSignUp ? 'Sign Up' : 'Sign In'}
                    </Button>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Button
                        variant="text"
                        onClick={() => setIsSignUp(!isSignUp)}
                        sx={{
                          textTransform: 'none',
                          color: 'text.secondary'
                        }}
                      >
                        {isSignUp ? 'Already have an account?' : 'Need an account?'}
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => setIsEmailMode(false)}
                        sx={{
                          textTransform: 'none',
                          color: 'text.secondary'
                        }}
                      >
                        Back to all options
                      </Button>
                    </Box>
                  </Box>
                </form>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000
        }}>
          <CircularProgress size={20} />
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
};

export default Map;