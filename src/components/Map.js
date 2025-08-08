import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import PlaceDetails from './PlaceDetails';
import { doc, getDoc, query, setDoc, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import colors from '../styles/colors';
import { debounce } from 'lodash';
import { calculateDistance } from '../utils/distance';
import PropTypes from 'prop-types';
import { useGeolocation } from '../hooks/useGeolocation';
import placesApiService from '../services/placesApiService';
import cofficesService from '../services/cofficesService';
import analyticsService from '../services/analyticsService';

const DEFAULT_LOCATION = { lat: 36.7213028, lng: -4.4216366 }; // Málaga
const DEFAULT_ZOOM = 15;
const MIN_ZOOM = 14;
const MAX_ZOOM = 17;
const SEARCH_RADIUS = 5000; // meters (5km) - increased to find more rated coffices

// Performance optimization: Memoize the Map component
function MapComponent({ user, onSignInClick, selectedLocation, onMapInstance, onUserLocation = () => {}, onClearSelectedLocation }) {


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

  // Performance optimization: Memoize marker styles to prevent recreation
  const markerStyles = useMemo(() => ({
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
  }), []);

  // Performance optimization: Memoize map styles
  const mapStyles = useMemo(() => [
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
      elementType: "geometry.stroke",
      stylers: [{ color: "#c9c9c9" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ visibility: "off" }]
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
  ], []);

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

  // Performance optimization: Memoize search configuration
  const getPlacesRequest = useMemo(() => (location) => ({
    location: location,
    radius: SEARCH_RADIUS, // Use fixed radius for initial search
    type: ['cafe', 'restaurant', 'bar', 'bakery', 'food'],  // Cast a wider net for establishment types
    keyword: 'cafe coffee shop wifi laptop'  // Expanded workspace-related terms
    //rankBy: window.google.maps.places.RankBy.RATING,
    // Note: Using both radius and rankBy together ensures we get more results
    // while still prioritizing highly-rated places within our search area
  }), []);

  // Performance optimization: Add request deduplication
  const pendingSearches = useRef(new Map());

  // Performance optimization: Add marker pooling
  const markerPool = useRef(new Map());

  // Performance optimization: Memoize marker creation function
  const createOrUpdateMarker = useCallback((place, isSelected) => {
    const existingMarker = markerPool.current.get(place.place_id);
    
    if (existingMarker) {
      // Update existing marker instead of creating new one
      const icon = place.hasRatings ? 
        (isSelected ? markerStyles.ratedSelected : markerStyles.rated) :
        (isSelected ? markerStyles.selected : markerStyles.default);
      
      existingMarker.setIcon(icon);
      existingMarker.setPosition(place.geometry.location);
      return existingMarker;
    }
    
    // Create new marker only if needed
    const newMarker = new window.google.maps.Marker({
      position: place.geometry.location,
      map: mapInstance,
      title: place.name,
      icon: place.hasRatings ? 
        (isSelected ? markerStyles.ratedSelected : markerStyles.rated) :
        (isSelected ? markerStyles.selected : markerStyles.default)
    });

    newMarker.addListener('click', () => handleMarkerClick(newMarker, place));
    markerPool.current.set(place.place_id, newMarker);
    return newMarker;
  }, [mapInstance, markerStyles]);

  // Performance optimization: Memoize marker click handler
  const handleMarkerClick = useCallback((marker, shop) => {
    // Track marker click for analytics
    analyticsService.trackMapMarkerClicked(
      shop.place_id,
      shop.name,
      shop.hasRatings || false,
      shop.isRatedCoffice || false,
      shop.types
    );
    analyticsService.trackJourneyStep('place_selected', {
      place_id: shop.place_id,
      place_name: shop.name,
      has_ratings: shop.hasRatings || false
    });

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



  // Add ref to track last update
  const lastUpdateRef = useRef(null);

  // Performance optimization: Optimize marker updates with pooling
  const updateMarkers = useCallback(async () => {
    if (!mapInstance || !coffeeShops.length) {
  
      return;
    }

    // Check if we've already updated for these places
    const placesKey = coffeeShops.map(p => p.place_id).join(',');
    if (lastUpdateRef.current === placesKey) {
  
      return;
    }
    

    lastUpdateRef.current = placesKey;
    
    // Performance optimization: Clear only unused markers
    const currentPlaceIds = new Set(coffeeShops.map(p => p.place_id));
    markerPool.current.forEach((marker, placeId) => {
      if (!currentPlaceIds.has(placeId)) {
        marker.setMap(null);
        markerPool.current.delete(placeId);
      }
    });
    
    // Clear old markers ref
    markersRef.current = {};
    
    // Batch check ratings for all places at once
    const placesToCheck = coffeeShops.filter(place => !place.hasRatings).map(place => place.place_id);
    let ratedPlaceIds = new Set();
    
    if (placesToCheck.length > 0) {
  
      const batchQuery = query(
        collection(db, 'ratings'), 
        where('placeId', 'in', placesToCheck)
      );
      const batchSnapshot = await getDocs(batchQuery);
      ratedPlaceIds = new Set(batchSnapshot.docs.map(doc => doc.data().placeId));
    }
    
    // Create or update markers using pooling
    for (const place of coffeeShops) {
      const isSelected = selectedShop?.place_id === place.place_id;
      const marker = createOrUpdateMarker(place, isSelected);
      markersRef.current[place.place_id] = marker;
      
      // Check if this place has ratings (from our database or batch check)
      const hasRatings = place.hasRatings || ratedPlaceIds.has(place.place_id);
      if (hasRatings) {
        marker.hasRatings = true;
        marker.setIcon(isSelected ? markerStyles.ratedSelected : markerStyles.rated);
      }
    }


  }, [mapInstance, coffeeShops, selectedShop, markerStyles, handleMarkerClick, createOrUpdateMarker]);

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

  // Function to fetch rated coffices from Firestore using the coffices collection
  const fetchRatedCoffices = useCallback(async (location, radius) => {
    try {
  
      
      // Use the coffices service to get nearby coffices
      const nearbyCoffices = await cofficesService.getCofficesNearby(location, radius);
      
      if (nearbyCoffices.length === 0) {

        return [];
      }
      
      // Convert to the format expected by the map component
      const ratedCoffices = nearbyCoffices.map(cofficeData => {
        
        
        return {
          place_id: cofficeData.placeId,
          name: cofficeData.name,
          vicinity: cofficeData.vicinity,
          geometry: {
            location: new window.google.maps.LatLng(
              cofficeData.geometry.location.lat,
              cofficeData.geometry.location.lng
            )
          },
          cofficeRatings: {
            averageRatings: cofficeData.averageRatings,
            totalRatings: cofficeData.totalRatings
          },
          hasRatings: true,
          isRatedCoffice: true,
          distance: cofficeData.distance
        };
      });
      
  
      return ratedCoffices;
      
    } catch (error) {
      console.error('Error fetching rated coffices:', error);
      return [];
    }
  }, []);

  // Update searchNearby to first fetch rated coffices, then supplement with Places API
  const searchNearby = useCallback(async (location, isProgrammatic = false) => {
    if (!location || !mapInstance) {
  
      return;
    }
    
    // Skip if this is the same location we just searched
    if (lastSearchLocationRef.current && 
        lastSearchLocationRef.current.lat === location.lat && 
        lastSearchLocationRef.current.lng === location.lng) {
  
      return;
    }
    

    
    // Update last search location before making the request
    lastSearchLocationRef.current = location;
    
    // Wait for map to be fully initialized with bounds
    if (!mapInstance.getBounds()) {
  
      // Wait a bit for the map to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const searchRadius = getSearchRadius();

    
    // First, fetch our rated coffices from Firestore

    const ratedCoffices = await fetchRatedCoffices(location, searchRadius);
    const ratedPlaceIds = new Set(ratedCoffices.map(place => place.place_id));
    
    // Show rated coffices immediately if we found any
    if (ratedCoffices.length > 0) {
  
      setCoffeeShops(ratedCoffices);
      setLastSearchLocation(location);
    }
    
    // Then fetch from Places API using Firebase Functions

    
    try {
      const newPlaces = await placesApiService.nearbySearch(
        location, 
        searchRadius, 
        ['cafe', 'restaurant', 'bar', 'bakery', 'food'],
        'cafe coffee shop wifi laptop'
      );
      
  
      
      // Filter out places that are already in our rated coffices
      const filteredNewPlaces = newPlaces.filter(place => !ratedPlaceIds.has(place.place_id));
  
      
      // Combine rated coffices (prioritized) with new places
      const allPlaces = [...ratedCoffices, ...filteredNewPlaces];
      
  
      setCoffeeShops(allPlaces);
      setLastSearchLocation(location);
      
    } catch (error) {
      console.error('❌ Error with Firebase Functions:', error);
      // Still show rated coffices even if Places API fails
  
      setCoffeeShops(ratedCoffices);
      setLastSearchLocation(location);
    }
  }, [mapInstance, getPlacesRequest, fetchRatedCoffices, getSearchRadius]);

  // 3. Then define centerMapOnLocation
  const centerMapOnLocation = useCallback((location) => {
    if (!mapInstance || !location) return;
    

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
  
      searchNearby(location);
    }, 1000),
    [searchNearby]
  );

  // Update effect to watch coffeeShops
  useEffect(() => {
    if (coffeeShops.length > 0) {
  
      updateMarkers();
    }
  }, [coffeeShops, updateMarkers]);

  // Then define handleMapIdle
  const handleMapIdle = useCallback(() => {
    if (!mapInstance) return;

    if (isProgrammaticMoveRef.current) {
      isProgrammaticMoveRef.current = false;
      return;
    }

    const center = mapInstance.getCenter();
    if (!center) return;

    const newLocation = {
      lat: center.lat(),
      lng: center.lng()
    };

    // Track map movement for analytics
    const bounds = mapInstance.getBounds();
    const zoomLevel = mapInstance.getZoom();
    if (bounds) {
      analyticsService.trackMapMoved({
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng()
      }, zoomLevel);
    }

    // If this is our first search or we've moved significantly, perform search
    if (!lastSearchLocation) {
      searchNearby(newLocation);
    } else {
      const distance = calculateDistance(lastSearchLocation, newLocation);
      const searchRadius = getSearchRadius();
      
      if (distance > searchRadius / 2) {
        searchNearby(newLocation);
      } else {
        // Map moved but not enough to trigger new search
      }
    }
  }, [mapInstance, isInitialLoad, lastSearchLocation, searchNearby, getSearchRadius]);

  // Then the map idle listener effect
  useEffect(() => {
    if (!mapInstance) return;


    const idleListener = mapInstance.addListener('idle', handleMapIdle);

    // Clean up function
    return () => {
  
      if (idleListener) {
        window.google.maps.event.removeListener(idleListener);
      }
      debouncedSearch.cancel();
    };
  }, [mapInstance, handleMapIdle, debouncedSearch]);

  // 3. Then declare handleLocationSelect
  const handleLocationSelect = useCallback((location, mapInstance) => {
    if (!location) return;
    

    
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


      setShowRatingForm(false);
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  }, [user, selectedShop]);

  // Update fetchCofficeRatings to work with ratings collection
  const fetchCofficeRatings = useCallback(async (placeId) => {
    try {

      const q = query(collection(db, 'ratings'), where('placeId', '==', placeId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const ratings = querySnapshot.docs.map(doc => doc.data());

        
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
  
      onMapInstance(map);
    }
  }, [onMapInstance]);

  // Update the selectedLocation effect
  useEffect(() => {
    if (!selectedLocation || !mapInstance) return;

    // Check if we've already handled this exact location
    if (lastHandledLocationRef.current?.lat === selectedLocation.lat && 
        lastHandledLocationRef.current?.lng === selectedLocation.lng) {
  
      return;
    }


    
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
    
    // If it's a venue from search, show the PlaceDetails
    if (selectedLocation.fromSearch && selectedLocation.isVenue && selectedLocation.placeData) {
  
      setSelectedShop(selectedLocation.placeData);
    }
    else
    {
      setSelectedShop(null); 
    }
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
      // Clear the selected location if it was from search
      if (selectedLocation?.fromSearch && onClearSelectedLocation) {
        onClearSelectedLocation();
      }
    }, 300);
  }, [selectedLocation, onClearSelectedLocation]);

  // Add this ref to track if we've done the initial search
  const initialSearchDoneRef = useRef(false);

  // Update the geolocation callback
  const { 
    currentLocation: geoLocation, 
    isInitialized 
  } = useGeolocation(
    useCallback((location) => {
      if (!mapInstance || !location || initialSearchDoneRef.current) return;

  
      
      if (!isLocationInitialized && !selectedLocation) {
    
        isProgrammaticMoveRef.current = true;
        mapInstance.panTo(location);
        mapInstance.setZoom(DEFAULT_ZOOM);
        setIsLocationInitialized(true);
        
        // Perform initial search only once
        if (!initialSearchDoneRef.current) {
      
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
  
      setCurrentLocation(geoLocation);
    }
  }, [geoLocation]);

  // Fallback: If no geolocation after 3 seconds, search at default location
  useEffect(() => {
    if (!mapInstance || initialSearchDoneRef.current) return;

    const fallbackTimer = setTimeout(async () => {
      if (!initialSearchDoneRef.current) {
    
        initialSearchDoneRef.current = true;
        
        // Test basic Places API call first
    
        
        try {
          const testResult = await placesApiService.nearbySearch(
            DEFAULT_LOCATION,
            1000,
            ['cafe'],
            'cafe'
          );
      
          searchNearby(DEFAULT_LOCATION, true);
        } catch (error) {
      
          // Still try the full search
          searchNearby(DEFAULT_LOCATION, true);
        }
      }
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [mapInstance, searchNearby]);

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
        fillColor: colors.status.info, // Use light sage
        fillOpacity: 1,
        scale: 6,
        strokeColor: colors.background.paper,
        strokeWeight: 2,
      },
      zIndex: 1, // Ensure it's under other markers
    });

    // Set the ripple effect when the user's location is updated
    if (ripple) {
      ripple.setMap(null); // Remove the previous ripple
    }

    // Create a new ripple effect
    const rippleEffect = new window.google.maps.Circle({
      strokeColor: colors.status.info, // Use light sage
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: colors.status.info, // Use light sage
      fillOpacity: 0.35,
      map: mapInstance,
      center: currentLocation,
      radius: 0, // Start with a radius of 0
      zIndex: 1, // Ensure it's under other markers
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
          overflow: 'visible',
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
            width: '600px',
            maxWidth: '600px',
            borderRadius: '12px',
            maxHeight: '600px',
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

// Add PropTypes
MapComponent.propTypes = {
  user: PropTypes.object,
  onSignInClick: PropTypes.func.isRequired,
  selectedLocation: PropTypes.object,
  onMapInstance: PropTypes.func.isRequired,
  onUserLocation: PropTypes.func,
  onClearSelectedLocation: PropTypes.func
};

// Export the memoized component
export default React.memo(MapComponent); 