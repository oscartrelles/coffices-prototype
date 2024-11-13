import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import RatingForm from './RatingForm';
import EmailSignInForm from './components/auth/EmailSignInForm';
import { 
  onAuthStateChanged,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider
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
import { auth, db } from './firebaseConfig';
import { signInWithGoogle } from './firebaseConfig';
import { createRoot } from 'react-dom/client';

// Create providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

const libraries = ["places"];
const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};
const defaultCenter = {
  lat: 36.7213,
  lng: -4.4216,
};
const defaultZoom = 17;

const Map = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [coffeeShops, setCoffeeShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [user, setUser] = useState(null);
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

  const mapOptions = {
    mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID,
  };

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
    console.log('Validating rating submission...', ratings);

    // Validate all ratings are provided
    const missingRatings = Object.entries(ratings)
      .filter(([key, value]) => key !== 'comment' && value === 0)
      .map(([key]) => key);

    if (missingRatings.length > 0) {
      setError(`Please provide ratings for: ${missingRatings.join(', ')}`);
      return;
    }

    try {
      console.log('Starting rating submission...', { ratings, user, selectedShop });
      
      if (!user) {
        console.error('No user logged in');
        setError('Please log in to submit a rating');
        return;
      }

      if (!selectedShop) {
        console.error('No shop selected');
        setError('No shop selected for rating');
        return;
      }

      // First, create the rating document
      const ratingData = {
        userId: user.uid,
        userName: userName,
        shopId: selectedShop.id,
        shopName: selectedShop.name,
        wifi: ratings.wifi,
        power: ratings.power,
        noise: ratings.noise,
        coffee: ratings.coffee,
        comment: ratings.comment,
        createdAt: serverTimestamp()
      };

      console.log('Creating rating document with data:', ratingData);

      // Add to ratings collection
      const ratingsRef = collection(db, 'ratings');
      const newRatingRef = await addDoc(ratingsRef, ratingData);
      console.log('Rating document created with ID:', newRatingRef.id);

      // Update shop document
      const shopRef = doc(db, 'shops', selectedShop.id);
      console.log('Updating shop document:', selectedShop.id);

      try {
        await runTransaction(db, async (transaction) => {
          const shopDoc = await transaction.get(shopRef);
          
          if (!shopDoc.exists()) {
            console.log('Shop document does not exist, creating new one');
            // Create new shop document
            const newShopData = {
              name: selectedShop.name,
              address: selectedShop.formatted_address,
              location: {
                lat: selectedShop.lat,
                lng: selectedShop.lng
              },
              placeId: selectedShop.id,
              ratings: [newRatingRef.id],
              averages: {
                wifi: ratings.wifi,
                power: ratings.power,
                noise: ratings.noise,
                coffee: ratings.coffee
              },
              totalRatings: 1,
              updatedAt: serverTimestamp()
            };
            console.log('Creating new shop document with data:', newShopData);
            transaction.set(shopRef, newShopData);
          } else {
            console.log('Shop document exists, updating averages');
            const shopData = shopDoc.data();
            const oldAverages = shopData.averages || {
              wifi: 0, power: 0, noise: 0, coffee: 0
            };
            const totalRatings = (shopData.totalRatings || 0) + 1;

            const newAverages = {
              wifi: (oldAverages.wifi * (totalRatings - 1) + ratings.wifi) / totalRatings,
              power: (oldAverages.power * (totalRatings - 1) + ratings.power) / totalRatings,
              noise: (oldAverages.noise * (totalRatings - 1) + ratings.noise) / totalRatings,
              coffee: (oldAverages.coffee * (totalRatings - 1) + ratings.coffee) / totalRatings
            };

            console.log('Calculated new averages:', newAverages);
            transaction.update(shopRef, {
              ratings: arrayUnion(newRatingRef.id),
              averages: newAverages,
              totalRatings: totalRatings,
              updatedAt: serverTimestamp()
            });
          }
        });

        console.log('Transaction completed successfully');

        // Show success message
        setError(null);
        setSuccessMessage('Rating submitted successfully!');
        setTimeout(() => setSuccessMessage(null), 3000); // Clear after 3 seconds

        setShowRatingForm(false);
        
        // Immediately update the selected shop with new ratings
        const updatedShopDoc = await getDoc(shopRef);
        if (updatedShopDoc.exists()) {
          const updatedShopData = updatedShopDoc.data();
          setSelectedShop(prev => ({
            ...prev,
            averages: updatedShopData.averages,
            userHasRated: true // Add this flag
          }));
        }

      } catch (transactionError) {
        console.error('Transaction failed:', transactionError);
        throw transactionError;
      }

    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating: ' + error.message);
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

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapCentered) return;

    console.log('Searching for coffee shops at:', mapCenter);
    
    const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
    const request = {
      location: mapCenter,
      radius: '500',
      keyword: 'coffee shop wifi laptop',
      type: ['cafe']
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        console.log('Found coffee shops:', results);
        setCoffeeShops(results);
      } else {
        console.error('Places search failed:', status);
      }
    });
  }, [mapCenter]);

  useEffect(() => {
    console.log('Markers effect running', {
      mapInstance: mapInstanceRef.current,
      coffeeShops,
    });

    if (!mapInstanceRef.current || !coffeeShops?.length) {
      console.log('Missing map instance or coffee shops');
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    coffeeShops.forEach(shop => {
      //console.log('Creating marker for shop:', shop.name);
      
      const position = {
        lat: shop.geometry.location.lat(),
        lng: shop.geometry.location.lng()
      };
      
      //console.log('Marker position:', position);

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: shop.name
      });

      marker.addListener('click', () => handleMarkerClick(shop));
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [coffeeShops, handleMarkerClick]);

  // Add an effect to log when coffee shops change
  useEffect(() => {
    //console.log('Coffee shops updated:', coffeeShops);
  }, [coffeeShops]);

  const handleEmailSignIn = async (email, password) => {
    try {
      console.log('Attempting sign in with:', email);
      await signInWithEmailAndPassword(auth, email, password);
      // Don't set states here, let the auth state listener handle it
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
    }
  };

  const handleEmailSignUp = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user name to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: name,
        email: email,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message);
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
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error.message);
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

      const content = showRatingForm ? `
        <div style="padding: 12px; min-width: 300px;">
          <div id="ratingFormContainer">
            <!-- Rating form will be rendered here -->
          </div>
        </div>
      ` : `
        <div style="padding: 12px; min-width: 300px;">
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
              background-color: #4285f4;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 8px;
            "
          >
            ${user ? 'Rate Coffice' : 'Sign in to Rate'}
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
          // Render rating form
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
          if (actionButton) {
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
    } else if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [selectedShop, showRatingForm, user, error, successMessage, userLocation, setShowAuthForm, setShowRatingForm, handleRatingSubmit]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <CircularProgress />;

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
        <button
          onClick={signInWithGoogle}
          style={{
            padding: "8px 16px",
            backgroundColor: "red",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          DEBUG SIGN IN
        </button>
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
        <Modal onClose={() => setShowAuthForm(false)}>
          <h2>Sign in to Rate Coffices</h2>
          {error && (
            <div style={{ 
              color: 'red', 
              marginBottom: '10px',
              padding: '8px',
              backgroundColor: '#ffebee',
              borderRadius: '4px'
            }}>
              {error}
              <button 
                onClick={() => setError(null)}
                style={{
                  float: 'right',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          )}
          <EmailSignInForm 
            onSignIn={handleEmailSignIn}
            onSignUp={handleEmailSignUp}
          />
          <div className="auth-divider">
            <span>or continue with</span>
          </div>
          <button 
            className="auth-button google"
            onClick={handleGoogleSignIn}
          >
            Sign in with Google
          </button>
          <button 
            className="auth-button facebook"
            onClick={handleFacebookSignIn}
          >
            Sign in with Facebook
          </button>
          <button 
            className="close-modal"
            onClick={() => setShowAuthForm(false)}
          >
            ×
          </button>
        </Modal>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default Map;