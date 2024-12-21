import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box } from '@mui/material';
import PlaceDetails from './PlaceDetails';
import { doc, getDoc, query, setDoc, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import colors from '../styles/colors';
import { debounce } from 'lodash';
import { calculateDistance } from '../utils/distance';
import PropTypes from 'prop-types';
import { useGeolocation } from '../hooks/useGeolocation';

const DEFAULT_LOCATION = { lat: 36.7213028, lng: -4.4216366 }; // Málaga
const DEFAULT_ZOOM = 15;
const MIN_ZOOM = 14;
const MAX_ZOOM = 17;
const SEARCH_RADIUS = 1000; // meters

function Map({ user, onSignInClick, selectedLocation, onMapInstance, onUserLocation = () => {} }) {
  console.log('Map: Rendering with props:', { user, selectedLocation });

  // Near the top with other state declarations
  const [lastSearchLocation, setLastSearchLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationInitialized, setIsLocationInitialized] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Refs (keep these together)
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const clustererRef = useRef(null);
  const lastSearchLocationRef = useRef(null);
  const isProgrammaticMoveRef = useRef(false);
  const lastHandledLocationRef = useRef(null);

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
  // Detailed star path: M17.684,7.925l-5.131-0.67L10.329,2.57c-0.131-0.275-0.527-0.275-0.658,0L7.447,7.255l-5.131,0.67C2.014,7.964,1.892,8.333,2.113,8.54l3.76,3.568L4.924,17.21c-0.056,0.297,0.261,0.525,0.533,0.379L10,15.109l4.543,2.479c0.273,0.153,0.587-0.089,0.533-0.379l-0.949-5.103l3.76-3.568C18.108,8.333,17.986,7.964,17.684,7.925 M13.481,11.723c-0.089,0.083-0.129,0.205-0.105,0.324l0.848,4.547l-4.047-2.208c-0.055-0.03-0.116-0.045-0.176-0.045s-0.122,0.015-0.176,0.045l-4.047,2.208l0.847-4.547c0.023-0.119-0.016-0.241-0.105-0.324L3.162,8.54L7.74,7.941c0.124-0.016,0.229-0.093,0.282-0.203L10,3.568l1.978,4.17c0.053,0.11,0.158,0.187,0.282,0.203l4.578,0.598L13.481,11.723z

  // Define map styles
  const mapStyles = [
    {
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }]
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
      stylers: [{ color: "#c5e1f2" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }]
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#666666" }]
    },
    {
      featureType: "administrative",
      elementType: "labels.text.fill",
      stylers: [{ color: "#333333" }]
    }
  ];

  const [mapInstance, setMapInstance] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [coffeeShops, setCoffeeShops] = useState([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [cofficeRatings, setCofficeRatings] = useState(null);
  const [userRating, setUserRating] = useState(null);

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
    radius: getSearchRadius(),
   // type: ['cafe', 'restaurant', 'bar', 'bakery', 'food'],  // Cast a wider net for establishment types
    keyword: 'coffee cafe wifi laptop'  // Expanded workspace-related terms
    //rankBy: window.google.maps.places.RankBy.RATING,
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

  // Add ref to track last update
  const lastUpdateRef = useRef(null);

  // Update the updateMarkers function
  const updateMarkers = useCallback(async () => {
    if (!mapInstance || !coffeeShops.length) {
      console.log('Cannot create markers:', { hasMap: !!mapInstance, shopCount: coffeeShops.length });
      return;
    }

    // Check if we've already updated for these places
    const placesKey = coffeeShops.map(p => p.place_id).join(',');
    if (lastUpdateRef.current === placesKey) {
      console.log('⏭️ Skipping duplicate marker update');
      return;
    }
    
    console.log('🎯 Updating markers for', coffeeShops.length, 'places');
    lastUpdateRef.current = placesKey;
    
    // Clear old markers
    Object.values(markersRef.current).forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = {};
    
    // Create new markers
    for (const place of coffeeShops) {
      const marker = new window.google.maps.Marker({
        position: place.geometry.location,
        map: mapInstance,
        title: place.name,
        icon: markerStyles.default
      });

      marker.addListener('click', () => handleMarkerClick(marker, place));
      markersRef.current[place.place_id] = marker;
      
      // Check if this place has ratings
      const hasRatings = await checkPlaceRatings(place.place_id);
      if (hasRatings) {
        marker.setIcon(place.place_id === selectedShop?.place_id ? 
          markerStyles.ratedSelected : 
          markerStyles.rated
        );
        marker.hasRatings = true;
      }
    }

    console.log('✅ Created', Object.keys(markersRef.current).length, 'markers');
  }, [mapInstance, coffeeShops, selectedShop, markerStyles, handleMarkerClick, checkPlaceRatings]);

  // Update searchNearby to only use coffeeShops state
  const searchNearby = useCallback((location, isProgrammatic = false) => {
    if (!location || !mapInstance) {
      console.log('🚫 Cannot search:', { hasLocation: !!location, hasMap: !!mapInstance });
      return;
    }
    
    // Skip if this is the same location we just searched
    if (lastSearchLocationRef.current && 
        lastSearchLocationRef.current.lat === location.lat && 
        lastSearchLocationRef.current.lng === location.lng) {
      console.log('⏭️ Skipping duplicate search at same location');
      return;
    }
    
    console.log('🔍 searchNearby called with:', location, 'isProgrammatic:', isProgrammatic);
    
    // Update last search location before making the request
    lastSearchLocationRef.current = location;
    
    const request = getPlacesRequest(location);
    const service = new window.google.maps.places.PlacesService(mapInstance);

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        console.log('✅ Found nearby coffee shops:', results.length);
        setCoffeeShops(results);
        setLastSearchLocation(location);
      } else {
        console.log('❌ Places search failed:', status);
        setCoffeeShops([]);
      }
    });
  }, [mapInstance, getPlacesRequest]);

  // 1. First define getSearchRadius
  const getSearchRadius = useCallback(() => {
    if (!mapInstance) return SEARCH_RADIUS;

    // Get the bounds of the current viewport
    const bounds = mapInstance.getBounds();
    if (!bounds) return SEARCH_RADIUS;

    // Calculate the viewport width in meters
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const width = calculateDistance(
      { lat: ne.lat(), lng: sw.lng() },
      { lat: ne.lat(), lng: ne.lng() }
    );

    // Use half the viewport width as the search radius
    return width / 1.5;
  }, [mapInstance]);

  // 3. Then define centerMapOnLocation
  const centerMapOnLocation = useCallback((location) => {
    if (!mapInstance || !location) return;
    
    console.log('Centering map on location:', location);
    const newCenter = new window.google.maps.LatLng(location.lat, location.lng);
    
    // Set flag before programmatic move
    isProgrammaticMoveRef.current = true;
    mapInstance.panTo(newCenter);
    
    // Update current location state
    setCurrentLocation(location);
    
    // Trigger a new search at this location
    searchNearby(location);
  }, [mapInstance, searchNearby]);

  // Then define debouncedSearch
  const debouncedSearch = useCallback(
    debounce((location) => {
      console.log('Debounced search triggered at:', location);
      searchNearby(location);
    }, 1000),
    [searchNearby]
  );

  // Update effect to watch coffeeShops
  useEffect(() => {
    if (coffeeShops.length > 0) {
      console.log('🔄 Updating markers due to new places:', coffeeShops.length);
      updateMarkers();
    }
  }, [coffeeShops, updateMarkers]);

  // Then define handleMapIdle
  const handleMapIdle = useCallback(() => {
    if (!mapInstance) return;

    console.log('🌎 Map idle event fired:', {
      isProgrammaticMove: isProgrammaticMoveRef.current,
      isInitialLoad
    });

    if (isProgrammaticMoveRef.current) {
      console.log('⏭️ Skipping search - programmatic move');
      isProgrammaticMoveRef.current = false;
      return;
    }

    const center = mapInstance.getCenter();
    if (!center) return;

    const newLocation = {
      lat: center.lat(),
      lng: center.lng()
    };

    // If this is our first search or we've moved significantly, perform search
    if (!lastSearchLocation) {
      console.log('🔍 Initial search at:', newLocation);
      searchNearby(newLocation);
    } else {
      const distance = calculateDistance(lastSearchLocation, newLocation);
      const searchRadius = getSearchRadius();
      
      console.log('📏 Distance moved:', Math.round(distance), 'm, Search radius:', searchRadius, 'm');

      if (distance > searchRadius / 2) {
        console.log('🔄 Significant movement detected, triggering search');
        searchNearby(newLocation);
      } else {
        console.log('⏭️ Movement too small, skipping search');
      }
    }
  }, [mapInstance, isInitialLoad, lastSearchLocation, searchNearby, getSearchRadius]);

  // Then the map idle listener effect
  useEffect(() => {
    if (!mapInstance) return;

    console.log('Setting up map idle listener');
    const idleListener = mapInstance.addListener('idle', handleMapIdle);

    // Clean up function
    return () => {
      console.log('Cleaning up map idle listener');
      if (idleListener) {
        window.google.maps.event.removeListener(idleListener);
      }
      debouncedSearch.cancel();
    };
  }, [mapInstance, handleMapIdle, debouncedSearch]);

  // 3. Then declare handleLocationSelect
  const handleLocationSelect = useCallback((location, mapInstance) => {
    if (!location) return;
    
    console.log('Location selected:', location);
    
    // Only perform search if this is from a search action
    if (location.fromSearch) {
      const newCenter = new window.google.maps.LatLng(location.lat, location.lng);
      mapInstance?.panTo(newCenter);
      searchNearby(location);
    }
  }, [searchNearby]);

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

  // Update the initial map setup
  useEffect(() => {
    if (!mapRef.current || mapInstance) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: DEFAULT_LOCATION,
      zoom: DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
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
    if (onMapInstance) {
      console.log('Sharing map instance with parent');
      onMapInstance(map);
    }
  }, [onMapInstance]);

  // Update the selectedLocation effect
  useEffect(() => {
    if (!selectedLocation || !mapInstance) return;

    // Check if we've already handled this exact location
    if (lastHandledLocationRef.current?.lat === selectedLocation.lat && 
        lastHandledLocationRef.current?.lng === selectedLocation.lng) {
      console.log('📍 Skipping duplicate location change');
      return;
    }

    console.log('📍 Handling new location change:', selectedLocation);
    
    // Update last handled location
    lastHandledLocationRef.current = selectedLocation;
    
    // Set flag BEFORE the programmatic move
    isProgrammaticMoveRef.current = true;
    
    const newCenter = new window.google.maps.LatLng(
      selectedLocation.lat,
      selectedLocation.lng
    );
    
    mapInstance.panTo(newCenter);
    mapInstance.setZoom(DEFAULT_ZOOM);
    
    // Do a single search for the new location
    if (selectedLocation.fromSearch) {
      searchNearby({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      });
    }
  }, [selectedLocation, mapInstance, searchNearby]);

  // Add state for animation
  const [isClosing, setIsClosing] = useState(false);

  // Update handleClose
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setSelectedShop(null);
    }, 300);
  }, []);

  // Add this ref to track if we've done the initial search
  const initialSearchDoneRef = useRef(false);

  // Update the geolocation callback
  const { 
    currentLocation: geoLocation, 
    isInitialized 
  } = useGeolocation(
    useCallback((location) => {
      if (!mapInstance || !location || initialSearchDoneRef.current) return;

      console.log('📍 Handling geolocation update:', location);
      
      if (!isLocationInitialized && !selectedLocation) {
        console.log('📍 Initial center on user location:', location);
        isProgrammaticMoveRef.current = true;
        mapInstance.panTo(location);
        mapInstance.setZoom(DEFAULT_ZOOM);
        setIsLocationInitialized(true);
        
        // Perform initial search only once
        if (!initialSearchDoneRef.current) {
          console.log('🔍 Performing initial location search');
          initialSearchDoneRef.current = true;
          searchNearby(location, true);
        }
      }

      setCurrentLocation(location);
      if (onUserLocation) {
        onUserLocation(location);
      }
    }, [mapInstance, selectedLocation, onUserLocation, isLocationInitialized, searchNearby])
  );

  // Remove or update other effects that might trigger location initialization
  useEffect(() => {
    if (geoLocation) {
      console.log('📍 Updated user location:', geoLocation);
      setCurrentLocation(geoLocation);
    }
  }, [geoLocation]);

  // Add state for the ripple effect
  const [ripple, setRipple] = useState(null);

  // Update the effect to create/update the user location marker
  useEffect(() => {
    if (!mapInstance || !currentLocation) return;

    // Create the marker for the user's location
    const marker = new window.google.maps.Marker({
      position: currentLocation,
      map: mapInstance,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: colors.primary.main,
        fillOpacity: 1,
        scale: 6,
        strokeColor: colors.background.paper,
        strokeWeight: 2,
      },
      zIndex: 1000, // Ensure it's on top of other markers
    });

    // Set the ripple effect when the user's location is updated
    if (ripple) {
      ripple.setMap(null); // Remove the previous ripple
    }

    // Create a new ripple effect
    const rippleEffect = new window.google.maps.Circle({
      strokeColor: colors.primary.main,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: colors.primary.main,
      fillOpacity: 0.35,
      map: mapInstance,
      center: currentLocation,
      radius: 0, // Start with a radius of 0
    });

    // Animate the ripple effect continuously
    const animateRipple = () => {
      let radius = 0;
      const maxRadius = 50; // Maximum radius for the ripple
      const animationSpeed = 50; // Speed of the animation

      const expandRipple = () => {
        radius += 2; // Increase the radius
        rippleEffect.setRadius(radius);
        if (radius < maxRadius) {
          setTimeout(expandRipple, animationSpeed); // Continue expanding
        } else {
          // Reset the ripple effect
          radius = 0; // Reset radius
          rippleEffect.setRadius(radius);
          setTimeout(expandRipple, animationSpeed); // Restart the animation
        }
      };

      expandRipple(); // Start the ripple animation
    };

    animateRipple();
    setRipple(rippleEffect); // Store the ripple effect in state

    // Clean up function to remove the marker and ripple when the component unmounts
    return () => {
      marker.setMap(null);
      rippleEffect.setMap(null);
    };
  }, [mapInstance, currentLocation]);

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

      {(selectedShop || isClosing) && (
        <Box sx={{
          position: 'absolute',
          bottom: '48px',
          left: 0,
          right: 0,
          backgroundColor: colors.background.paper,
          padding: '0px',
          zIndex: 1000,
          maxHeight: 'calc(70vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          transform: (selectedShop && !isClosing) ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          // iOS specific adjustments
          '@supports (-webkit-touch-callout: none)': {
            bottom: 'calc(48px + env(safe-area-inset-bottom))',
            paddingBottom: 'env(safe-area-inset-bottom)',
            maxHeight: 'calc(70vh - 48px - env(safe-area-inset-bottom) + 34px)',
            marginBottom: '34px',
          },
          '@media (min-width: 768px)': {
            left: '20px',
            right: 'auto',
            bottom: '52px',
            width: '300px',
            borderRadius: '12px',
            maxHeight: '400px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transform: (selectedShop && !isClosing) ? 'translateY(0)' : 'translateY(20px)',
            opacity: (selectedShop && !isClosing) ? 1 : 0,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }
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
  // Deep compare the selectedLocation object
  const locationEqual = prevProps.selectedLocation?.lat === nextProps.selectedLocation?.lat &&
                       prevProps.selectedLocation?.lng === nextProps.selectedLocation?.lng;
                       
  return prevProps.user?.uid === nextProps.user?.uid &&
         prevProps.onSignInClick === nextProps.onSignInClick &&
         locationEqual;
}); 