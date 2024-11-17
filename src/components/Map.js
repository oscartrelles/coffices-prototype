import React, { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar from './SearchBar';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import colors from '../styles/colors';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import Header from './Header';
import RatingForm from '../RatingForm';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const DEFAULT_LOCATION = { lat: 36.7213028, lng: -4.4216366 }; // Málaga
const DEFAULT_ZOOM = 14;
const SEARCH_RADIUS = 1500; // meters

function Map({ user, onSignInClick }) {
  const DEFAULT_LOCATION = {
    lat: 36.7213028,
    lng: -4.4216366
  };

  // Define marker styles
  const markerStyles = {
    default: {
      path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
      fillColor: colors.primary.main,
      fillOpacity: 0.9,
      scale: 8,
      strokeColor: colors.background.paper,
      strokeWeight: 2,
    },
    selected: {
      path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
      fillColor: colors.primary.dark,
      fillOpacity: 1,
      scale: 12,
      strokeColor: colors.background.paper,
      strokeWeight: 3,
    }
  };

  // Define map styles
  const mapStyles = [
    {
      elementType: "geometry",
      stylers: [{ color: colors.background.main }]
    },
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: colors.primary.light }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: colors.background.paper }]
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: colors.text.secondary }]
    },
    {
      featureType: "administrative",
      elementType: "labels.text.fill",
      stylers: [{ color: colors.text.primary }]
    }
  ];

  const [mapInstance, setMapInstance] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [coffeeShops, setCoffeeShops] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [cofficeRatings, setCofficeRatings] = useState(null);
  const [userRating, setUserRating] = useState(null);

  const mapRef = useRef(null);
  const markersRef = useRef({});
  const clustererRef = useRef(null);

  // Add state for showing comments
  const [showComments, setShowComments] = useState(false);

  // Add a function to handle marker selection
  const handleMarkerClick = useCallback((marker, shop) => {
    console.log('Marker clicked:', shop.name);
    
    // Reset previous selected marker if exists
    if (selectedMarker) {
      selectedMarker.setIcon(markerStyles.default);
    }

    // Update new selected marker
    marker.setIcon(markerStyles.selected);
    setSelectedMarker(marker);
    setSelectedShop(shop);
  }, [selectedMarker, markerStyles]);

  // Update the markers creation
  const updateMarkers = useCallback(() => {
    if (!mapInstance || !coffeeShops.length) {
      console.log('Cannot create markers:', { hasMap: !!mapInstance, shopCount: coffeeShops.length });
      return;
    }

    console.log('Updating markers for', coffeeShops.length, 'shops');
    
    const bounds = new window.google.maps.LatLngBounds();
    
    // Clear existing markers only if they're different shops
    if (Object.keys(markersRef.current).length !== coffeeShops.length) {
      Object.values(markersRef.current).forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = {};
    }
    
    coffeeShops.forEach(shop => {
      // Only create marker if it doesn't exist
      if (!markersRef.current[shop.place_id]) {
        const marker = new window.google.maps.Marker({
          position: shop.geometry.location,
          map: mapInstance,
          title: shop.name,
          animation: window.google.maps.Animation.DROP,
          icon: shop.place_id === selectedShop?.place_id ? 
            markerStyles.selected : markerStyles.default
        });

        marker.addListener('click', () => handleMarkerClick(marker, shop));
        bounds.extend(shop.geometry.location);
        markersRef.current[shop.place_id] = marker;
      }
    });

    if (coffeeShops.length > 1 && !selectedShop) {
      mapInstance.fitBounds(bounds);
    }
  }, [mapInstance, coffeeShops, selectedShop, handleMarkerClick, markerStyles]);

  // Add effect to update marker icons when selection changes
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([placeId, marker]) => {
      marker.setIcon(
        placeId === selectedShop?.place_id ? 
          markerStyles.selected : markerStyles.default
      );
    });
  }, [selectedShop, markerStyles]);

  // 2. Then declare searchNearby
  const searchNearby = useCallback(async (location) => {
    if (!mapInstance) return;

    try {
      console.log('Searching nearby location:', location);
      const service = new window.google.maps.places.PlacesService(mapInstance);
      
      const request = {
        location: location,
        radius: 1500,
        type: ['cafe']
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          console.log('Found coffee shops:', results.length);
          setCoffeeShops(results);
        } else {
          console.error('Places search failed:', status);
        }
      });
    } catch (error) {
      console.error('Error in searchNearby:', error);
    }
  }, [mapInstance]);

  // Separate effect for updating markers
  useEffect(() => {
    if (coffeeShops.length > 0) {
      updateMarkers();
    }
  }, [coffeeShops, updateMarkers]);

  // 3. Then declare handleLocationSelect
  const handleLocationSelect = useCallback((place) => {
    if (!mapInstance) return;

    console.log('Location selected:', place);
    
    // If we receive a place object (from SearchBar)
    if (place.geometry) {
      const newLocation = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      setCurrentLocation(newLocation);
      mapInstance.setCenter(newLocation);
      mapInstance.setZoom(15);
      searchNearby(newLocation);
    } 
    // If we receive a location object (from current location)
    else {
      setCurrentLocation(place);
      mapInstance.setCenter(place);
      mapInstance.setZoom(15);
      searchNearby(place);
    }
  }, [mapInstance, searchNearby]);

  // Initial map setup effect
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    console.log('Initializing map');
    const map = new window.google.maps.Map(mapRef.current, {
      center: currentLocation,
      zoom: 15,
      styles: mapStyles,
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: 'greedy',
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER
      },
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false
    });

    setMapInstance(map);

    // Only get geolocation if we're at the default location
    if (currentLocation === DEFAULT_LOCATION && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Got user location:', userLocation);
          setCurrentLocation(userLocation);
          map.setCenter(userLocation);
          // Search nearby after getting user location
          const service = new window.google.maps.places.PlacesService(map);
          const request = {
            location: userLocation,
            radius: 1500,
            type: ['cafe']
          };
          service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              console.log('Found initial coffee shops:', results.length);
              setCoffeeShops(results);
            }
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // If geolocation fails, search at default location
          const service = new window.google.maps.places.PlacesService(map);
          const request = {
            location: DEFAULT_LOCATION,
            radius: 1500,
            type: ['cafe']
          };
          service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              console.log('Found initial coffee shops:', results.length);
              setCoffeeShops(results);
            }
          });
        }
      );
    } else {
      // If not at default location, search at current location
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        location: currentLocation,
        radius: 1500,
        type: ['cafe']
      };
      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          console.log('Found initial coffee shops:', results.length);
          setCoffeeShops(results);
        }
      });
    }
  }, []);

  // Add idle listener to search when map stops moving
  useEffect(() => {
    if (!mapInstance) return;

    const handleIdle = () => {
      const center = mapInstance.getCenter();
      if (!center) return;

      const newLocation = {
        lat: center.lat(),
        lng: center.lng()
      };

      // Only search if we've moved significantly from the last search
      if (currentLocation && (
        Math.abs(currentLocation.lat - newLocation.lat) > 0.01 ||
        Math.abs(currentLocation.lng - newLocation.lng) > 0.01
      )) {
        console.log('Map idle at new location:', newLocation);
        setCurrentLocation(newLocation);
        searchNearby(newLocation);
      }
    };

    const idleListener = mapInstance.addListener('idle', handleIdle);

    return () => {
      if (idleListener) {
        window.google.maps.event.removeListener(idleListener);
      }
    };
  }, [mapInstance, currentLocation, searchNearby]);

  // Update rating handling for multiple categories
  const handleRating = useCallback(async (ratings) => {
    if (!user || !selectedShop) return;

    try {
      const ratingRef = doc(db, 'ratings', `${selectedShop.place_id}_${user.uid}`);
      const shopRef = doc(db, 'shops', selectedShop.place_id);

      // Save individual rating with all categories
      await setDoc(ratingRef, {
        userId: user.uid,
        placeId: selectedShop.place_id,
        ...ratings,
        timestamp: new Date().toISOString()
      });

      // Get existing shop data
      const shopDoc = await getDoc(shopRef);
      const shopData = shopDoc.exists() ? shopDoc.data() : {
        totalRatings: 0,
        averageRatings: {
          wifi: 0,
          power: 0,
          noise: 0,
          coffee: 0
        },
        name: selectedShop.name,
        address: selectedShop.vicinity,
        location: {
          lat: selectedShop.geometry.location.lat(),
          lng: selectedShop.geometry.location.lng()
        }
      };

      // Calculate new averages for each category
      const newTotal = shopData.totalRatings + 1;
      const newAverages = {};
      
      ['wifi', 'power', 'noise', 'coffee'].forEach(category => {
        newAverages[category] = (
          (shopData.averageRatings[category] * shopData.totalRatings) + ratings[category]
        ) / newTotal;
      });

      // Save updated shop data
      await setDoc(shopRef, {
        ...shopData,
        totalRatings: newTotal,
        averageRatings: newAverages,
        lastUpdated: new Date().toISOString()
      });

      console.log('Ratings saved successfully');
      setShowRatingForm(false);
    } catch (error) {
      console.error('Error saving ratings:', error);
    }
  }, [user, selectedShop]);

  // Add function to fetch ratings
  const fetchCofficeRatings = useCallback(async (placeId) => {
    try {
      const shopRef = doc(db, 'shops', placeId);
      const shopDoc = await getDoc(shopRef);
      
      if (shopDoc.exists()) {
        setCofficeRatings(shopDoc.data());
      } else {
        setCofficeRatings(null);
      }
    } catch (error) {
      console.error('Error fetching coffice ratings:', error);
      setCofficeRatings(null);
    }
  }, []);

  // Add effect to fetch ratings when shop is selected
  useEffect(() => {
    if (selectedShop) {
      fetchCofficeRatings(selectedShop.place_id);
    } else {
      setCofficeRatings(null);
    }
  }, [selectedShop, fetchCofficeRatings]);

  // Add function to fetch user's rating
  const fetchUserRating = useCallback(async (placeId, userId) => {
    if (!userId) return;
    
    try {
      const ratingRef = doc(db, 'ratings', `${placeId}_${userId}`);
      const ratingDoc = await getDoc(ratingRef);
      
      if (ratingDoc.exists()) {
        setUserRating(ratingDoc.data());
      } else {
        setUserRating(null);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
      setUserRating(null);
    }
  }, []);

  // Add effect to fetch user's rating when shop is selected
  useEffect(() => {
    if (selectedShop && user) {
      fetchUserRating(selectedShop.place_id, user.uid);
    } else {
      setUserRating(null);
    }
  }, [selectedShop, user, fetchUserRating]);

  // Add this return statement at the end of the Map component
  return (
    <div style={styles.container}>
      <Header user={user} onSignInClick={onSignInClick} />
      <div style={styles.mapContainer}>
        <SearchBar onLocationSelect={handleLocationSelect} />
        <div ref={mapRef} style={styles.map} />
      </div>
      
      {selectedShop && (
        <div style={styles.infoPanel}>
          <div style={styles.infoPanelHandle} />
          <button 
            style={styles.closeButton}
            onClick={() => {
              setSelectedShop(null);
              setShowRatingForm(false);
              setCofficeRatings(null);
              if (selectedMarker) {
                selectedMarker.setIcon(markerStyles.default);
                setSelectedMarker(null);
              }
            }}
          >
            ×
          </button>
          <h3 style={styles.title}>{selectedShop.name}</h3>
          <p style={styles.address}>{selectedShop.vicinity}</p>
          
          {/* Ratings Display */}
          <div style={styles.ratingsContainer}>
            {cofficeRatings && cofficeRatings.totalRatings > 0 ? (
              <div style={styles.ratingSection}>
                <h4 style={styles.ratingTitle}>Coffice Rating</h4>
                <div style={styles.cofficeRatings}>
                  <p style={styles.ratingItem}>
                    📶 WiFi: {cofficeRatings.averageRatings.wifi.toFixed(1)}
                  </p>
                  <p style={styles.ratingItem}>
                    🔌 Power: {cofficeRatings.averageRatings.power.toFixed(1)}
                  </p>
                  <p style={styles.ratingItem}>
                    🔊 Noise: {cofficeRatings.averageRatings.noise.toFixed(1)}
                  </p>
                  <p style={styles.ratingItem}>
                    ☕️ Coffee: {cofficeRatings.averageRatings.coffee.toFixed(1)}
                  </p>
                  <p style={styles.totalRatings}>
                    Based on {cofficeRatings.totalRatings} {cofficeRatings.totalRatings === 1 ? 'rating' : 'ratings'}
                  </p>
                  
                  {/* Comments Button */}
                  {cofficeRatings.totalRatings > 0 && (
                    <button
                      onClick={() => user ? setShowComments(!showComments) : onSignInClick()}
                      style={styles.commentsButton}
                    >
                      {user ? (showComments ? 'Hide Comments' : 'Show Comments') : 'Sign in to see comments'}
                    </button>
                  )}
                  
                  {/* Comments Section */}
                  {user && showComments && (
                    <div style={styles.commentsSection}>
                      {/* We'll need to fetch and display comments here */}
                      {/* This will be implemented in the next iteration */}
                    </div>
                  )}
                </div>
              </div>
            ) : selectedShop.rating ? (
              <div style={styles.ratingSection}>
                <h4 style={styles.ratingTitle}>Google Rating</h4>
                <p style={styles.rating}>
                  ⭐️ {selectedShop.rating.toFixed(1)} ({selectedShop.user_ratings_total})
                </p>
              </div>
            ) : null}
          </div>
          
          {/* Rate Button or Rating Form */}
          {!userRating && !showRatingForm && (
            <button
              onClick={() => user ? setShowRatingForm(true) : onSignInClick()}
              style={styles.rateButton}
            >
              {user ? 'Rate this Coffice' : 'Sign in to rate'}
            </button>
          )}
          
          {showRatingForm && (
            <RatingForm
              onSubmit={handleRating}
              onCancel={() => setShowRatingForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.background.main,
  },
  mapContainer: {
    position: 'absolute',
    top: '60px', // Height of header
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.background.main,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: '20px',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
    transform: 'translateY(0)',
    transition: 'transform 0.3s ease-in-out',
    maxHeight: '30vh',
    overflowY: 'auto',
    zIndex: 1000,
    '@media (min-width: 768px)': {
      left: '20px',
      right: 'auto',
      bottom: '20px',
      width: '300px',
      borderRadius: '12px',
      maxHeight: '400px',
    }
  },
  infoPanelHandle: {
    width: '40px',
    height: '4px',
    backgroundColor: '#E0E0E0',
    borderRadius: '2px',
    margin: '-10px auto 15px',
  },
  closeButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '30px',
    height: '30px',
    border: 'none',
    background: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    paddingRight: '30px',
  },
  address: {
    margin: '0 0 8px 0',
    color: '#666',
    fontSize: '14px',
  },
  rating: {
    margin: '0',
    fontSize: '14px',
    color: '#444',
  },
  authButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 1000,
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: colors.primary.dark,
    }
  },
  rateButton: {
    width: '100%',
    padding: '8px 16px',
    backgroundColor: colors.primary.main,
    color: colors.text.white,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '12px',
    fontSize: '14px',
    fontWeight: '500',
  },
  ratingsContainer: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  ratingSection: {
    padding: '8px',
    backgroundColor: colors.background.paper,
    borderRadius: '4px',
    border: `1px solid ${colors.border}`,
  },
  ratingTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.text.secondary,
  },
  cofficeRatings: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  ratingItem: {
    margin: 0,
    fontSize: '14px',
    color: colors.text.primary,
  },
  totalRatings: {
    margin: '8px 0 0 0',
    gridColumn: '1 / -1',
    fontSize: '12px',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  userRatingSection: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: colors.background.paper,
    borderRadius: '4px',
    border: `1px solid ${colors.border}`,
  },
  userComment: {
    gridColumn: '1 / -1',
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  ratingDate: {
    gridColumn: '1 / -1',
    margin: '8px 0 0 0',
    fontSize: '12px',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  commentsButton: {
    gridColumn: '1 / -1',
    padding: '8px',
    marginTop: '8px',
    backgroundColor: 'transparent',
    color: colors.text.secondary,
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: colors.background.main,
    }
  },
  commentsSection: {
    gridColumn: '1 / -1',
    marginTop: '12px',
    padding: '8px',
    backgroundColor: colors.background.main,
    borderRadius: '4px',
  }
};

export default Map; 