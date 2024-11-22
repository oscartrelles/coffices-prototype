import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box } from '@mui/material';
import PlaceDetails from './PlaceDetails';
import { doc, getDoc, query, setDoc, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import colors from '../styles/colors';
import { debounce } from 'lodash';
import { calculateDistance } from '../utils/distance';
import PropTypes from 'prop-types';

const DEFAULT_LOCATION = { lat: 36.7213028, lng: -4.4216366 }; // Málaga
const DEFAULT_ZOOM = 15;
const SEARCH_RADIUS = 1500; // meters

function Map({ user, onSignInClick, selectedLocation }) {
  console.log('Map component rendering');

  // Add isInitialLoad state at the top with other state declarations
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [locationReady, setLocationReady] = useState(false);

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
    },
    rated: {
      path: 'M 10,1.2 12.5,6.9 18,7.3 14,11.2 15,16.2 10,13.9 5,16.2 6,11.2 2,7.3 7.5,6.9 z',
      fillColor: colors.primary.main,
      fillOpacity: 0.9,
      scale: 1.5,
      strokeColor: colors.background.paper,
      strokeWeight: 1,
      anchor: new window.google.maps.Point(10, 10)
    },
    ratedSelected: {
      path: 'M 10,1.2 12.5,6.9 18,7.3 14,11.2 15,16.2 10,13.9 5,16.2 6,11.2 2,7.3 7.5,6.9 z',
      fillColor: colors.primary.dark,
      fillOpacity: 1,
      scale: 2,
      strokeColor: colors.background.paper,
      strokeWeight: 1.5,
      anchor: new window.google.maps.Point(10, 10)
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
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
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

  // Add zoom state
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);

  // Add these state declarations with your other existing state
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);  // Default zoom level

  // Define a unified search configuration
  const getPlacesRequest = (location) => ({
    location: location,
    radius: SEARCH_RADIUS,
    type: ['cafe', 'restaurant', 'bar', 'bakery', 'food'],  // Cast a wider net for establishment types
    keyword: 'coffee cafe wifi laptop',  // Expanded workspace-related terms
    rankBy: window.google.maps.places.RankBy.RATING,
    // Note: Using both radius and rankBy together ensures we get more results
    // while still prioritizing highly-rated places within our search area
  });

  // Add a function to handle marker selection
  const handleMarkerClick = useCallback((marker, shop) => {
    console.log('Marker clicked:', shop.name);
    
    // Reset all markers to their default style
    Object.values(markersRef.current).forEach(m => {
      if (m !== marker) {
        m.setIcon(m.hasRatings ? markerStyles.rated : markerStyles.default);
      }
    });

    // Update new selected marker
    marker.setIcon(marker.hasRatings ? markerStyles.ratedSelected : markerStyles.selected);
    setSelectedShop(shop);
  }, [markerStyles]);

  // Add function to check if place has ratings
  const checkPlaceRatings = useCallback(async (placeId) => {
    const q = query(collection(db, 'ratings'), where('placeId', '==', placeId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }, []);

  // Update updateMarkers to handle rated places
  const updateMarkers = useCallback(async () => {
    if (!mapInstance || !coffeeShops.length) {
      console.log('Cannot create markers:', { hasMap: !!mapInstance, shopCount: coffeeShops.length });
      return;
    }

    console.log('Updating markers for', coffeeShops.length, 'shops');
    
    // Clear old markers
    Object.entries(markersRef.current).forEach(([placeId, marker]) => {
      if (!coffeeShops.find(shop => shop.place_id === placeId)) {
        marker.setMap(null);
        delete markersRef.current[placeId];
      }
    });
    
    // Create or update markers
    for (const shop of coffeeShops) {
      const existingMarker = markersRef.current[shop.place_id];
      if (!existingMarker) {
        // Check if place has ratings
        const hasRatings = await checkPlaceRatings(shop.place_id);
        
        const marker = new window.google.maps.Marker({
          position: shop.geometry.location,
          map: mapInstance,
          title: shop.name,
          animation: window.google.maps.Animation.DROP,
          icon: hasRatings ? 
            (shop.place_id === selectedShop?.place_id ? markerStyles.ratedSelected : markerStyles.rated) :
            (shop.place_id === selectedShop?.place_id ? markerStyles.selected : markerStyles.default),
          placeData: shop,
          hasRatings: hasRatings
        });

        marker.addListener('click', () => handleMarkerClick(marker, shop));
        markersRef.current[shop.place_id] = marker;
      }
    }
  }, [mapInstance, coffeeShops, selectedShop, handleMarkerClick, markerStyles, checkPlaceRatings]);

  // Then define searchNearby
  const [lastSearchLocation, setLastSearchLocation] = useState(null);

  const searchNearby = useCallback(async (location) => {
    if (!mapInstance) return;

    console.log('Starting nearby search at:', location);
    setLastSearchLocation(location);

    const currentZoom = mapInstance.getZoom();
    const radius = getSearchRadius(currentZoom);

    try {
      const service = new window.google.maps.places.PlacesService(mapInstance);
      
      const request = getPlacesRequest(location);

      console.log('Search request:', request);

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          console.log('Found nearby coffee shops:', results.length);
          setCoffeeShops(results);
        } else {
          console.error('Places search failed:', status);
        }
      });
    } catch (error) {
      console.error('Error in searchNearby:', error);
    }
  }, [mapInstance, setLastSearchLocation]);

  // Then define debouncedSearch
  const debouncedSearch = useCallback(
    debounce((location) => {
      console.log('Debounced search triggered at:', location);
      searchNearby(location);
    }, 1000),
    [searchNearby]
  );

  // Add effect to update markers when coffee shops change
  useEffect(() => {
    if (coffeeShops.length > 0) {
      updateMarkers();
    }
  }, [coffeeShops, updateMarkers]);

  // First define getSearchRadius
  const getSearchRadius = useCallback((zoom) => {
    // Adjust radius based on zoom level
    // At zoom level 13, radius is 2000m
    // Each zoom level doubles/halves the radius
    const baseRadius = 2000;
    const baseZoom = 13;
    const zoomDiff = zoom - baseZoom;
    return baseRadius * Math.pow(0.5, zoomDiff);
  }, []);

  // Then define handleMapIdle
  const handleMapIdle = useCallback(() => {
    if (isInitialLoad) {
      console.log('Skipping initial idle event');
      setIsInitialLoad(false);
      return;
    }

    const center = mapInstance?.getCenter();
    if (!center) return;

    const newLocation = {
      lat: center.lat(),
      lng: center.lng()
    };

    // Skip if this is our first search
    if (!lastSearchLocation) {
      setLastSearchLocation(newLocation);
      return;
    }

    // Calculate distance from last search
    const distance = calculateDistance(lastSearchLocation, newLocation);
    const searchRadius = getSearchRadius(mapInstance.getZoom());
    
    console.log('Distance moved:', Math.round(distance), 'm, Search radius:', searchRadius, 'm');

    // Only search if we've moved more than half the search radius
    if (distance > searchRadius / 2) {
      console.log('Moved significant distance, searching new area');
      debouncedSearch(newLocation);
    } else {
      console.log('Movement too small, skipping search');
    }
  }, [mapInstance, isInitialLoad, lastSearchLocation, debouncedSearch, getSearchRadius, setLastSearchLocation]);

  // Then the map idle listener effect
  useEffect(() => {
    if (!mapInstance) return;

    console.log('Setting up map idle listener');
    const idleListener = mapInstance.addListener('idle', handleMapIdle);

    return () => {
      if (idleListener) {
        window.google.maps.event.removeListener(idleListener);
      }
      debouncedSearch.cancel();
    };
  }, [mapInstance, handleMapIdle, debouncedSearch]);

  // 3. Then declare handleLocationSelect
  const handleLocationSelect = (location) => {
    console.log('Received new location:', location);
    
    if (mapInstance && location.lat && location.lng) {
      const newCenter = new window.google.maps.LatLng(location.lat, location.lng);
      console.log('Setting new map center:', newCenter.toString());
      mapInstance.setCenter(newCenter);
      mapInstance.setZoom(13);
    }
  };

  // Update rating handling for multiple categories
  const handleRating = useCallback(async (ratings) => {
    if (!user || !selectedShop) return;

    try {
      const ratingRef = doc(db, 'ratings', `${selectedShop.place_id}_${user.uid}`);

      // Save rating with all categories
      await setDoc(ratingRef, {
        userId: user.uid,
        placeId: selectedShop.place_id,
        ...ratings,
        timestamp: new Date().toISOString()
      });

      console.log('Rating saved successfully');
      setShowRatingForm(false);
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  }, [user, selectedShop]);

  // Update fetchCofficeRatings to work with ratings collection
  const fetchCofficeRatings = useCallback(async (placeId) => {
    try {
      console.log('Fetching ratings for place:', placeId);
      const q = query(collection(db, 'ratings'), where('placeId', '==', placeId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const ratings = querySnapshot.docs.map(doc => doc.data());
        console.log('Raw ratings from DB:', ratings);
        
        // Initialize counters for each category
        const totals = {
          wifi: { sum: 0, count: 0 },
          power: { sum: 0, count: 0 },
          noise: { sum: 0, count: 0 },
          coffee: { sum: 0, count: 0 }
        };
        
        // Sum up ratings for each category
        ratings.forEach(rating => {
          ['wifi', 'power', 'noise', 'coffee'].forEach(key => {
            if (typeof rating[key] === 'number') {
              totals[key].sum += rating[key];
              totals[key].count++;
            }
          });
        });
        
        // Calculate averages
        const finalAverages = {};
        Object.keys(totals).forEach(key => {
          finalAverages[key] = totals[key].count > 0 ? 
            totals[key].sum / totals[key].count : 0;
        });

        console.log('Final calculated averages:', finalAverages);
        
        setCofficeRatings({
          averageRatings: finalAverages,
          totalRatings: ratings.length
        });
      } else {
        setCofficeRatings(null);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
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

  // Update the initial map setup effect
  useEffect(() => {
    if (!mapRef.current) return;

    console.log('Map initialization starting');

    // Get user location first, then initialize map
    if (navigator.geolocation) {
      console.log('Requesting user location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Got user location:', userLocation);
          setCurrentLocation(userLocation);
          
          // Initialize map with user location
          const map = new window.google.maps.Map(mapRef.current, {
            center: userLocation,  // Use user location as center
            zoom: 15,
            minZoom: 11,
            maxZoom: 17,
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
          searchNearby(userLocation);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fall back to default location only if geolocation fails
          const map = new window.google.maps.Map(mapRef.current, {
            center: DEFAULT_LOCATION,
            zoom: 15,
            // ... other map options ...
          });

          setMapInstance(map);
          searchNearby(DEFAULT_LOCATION);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // Browser doesn't support geolocation, use default location
      console.log('Geolocation not supported, using default location');
      const map = new window.google.maps.Map(mapRef.current, {
        center: DEFAULT_LOCATION,
        zoom: 15,
        // ... other map options ...
      });

      setMapInstance(map);
      searchNearby(DEFAULT_LOCATION);
    }
  }, []); // Empty dependency array since this should only run once


  // Update handleClose function
  const handleClose = useCallback(() => {
    console.log('Closing details pane');
    setSelectedShop(null);  // This should hide the bottom pane
    
    // Reset all markers to their default style
    Object.values(markersRef.current).forEach(marker => {
      marker.setIcon(marker.hasRatings ? markerStyles.rated : markerStyles.default);
    });
  }, [markerStyles]);

  // Update the selectedLocation effect
  useEffect(() => {
    if (selectedLocation && mapInstance) {
      console.log('Setting new location from props:', selectedLocation);
      const newCenter = new window.google.maps.LatLng(
        selectedLocation.lat,
        selectedLocation.lng
      );
      
      // Update map center and zoom
      mapInstance.setCenter(newCenter);
      mapInstance.setZoom(15);
      
      // Update current location state
      setCurrentLocation({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      });
      
      // Trigger a new search at this location
      searchNearby({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      });
    }
  }, [selectedLocation, mapInstance]);

  // Add this return statement at the end of the Map component
  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Box 
        ref={mapRef} 
        sx={{ 
          height: '100%',
          width: '100%'
        }} 
      />

      {selectedShop && (
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background.paper,
          padding: '0px',
          zIndex: 1000
        }}>
          <PlaceDetails 
            place={selectedShop} 
            userLocation={currentLocation}
            user={user}
            onSignInRequired={onSignInClick}
            cofficeRatings={cofficeRatings}
            onClose={handleClose}
          />
        </Box>
      )}
    </Box>
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

// Wrap Map with React.memo and a custom comparison function
export default React.memo(Map, (prevProps, nextProps) => {
  // Only re-render if user auth state changes
  return prevProps.user?.uid === nextProps.user?.uid &&
         prevProps.onSignInClick === nextProps.onSignInClick;
}); 