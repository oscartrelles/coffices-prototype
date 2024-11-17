import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import SearchBar from './components/SearchBar';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

function Map({ user, initialLocation }) {
  // Constants - as per DOCUMENTATION.md
  const DEFAULT_LOCATION = {
    lat: 36.7213028,   // Málaga, Spain coordinates
    lng: -4.4216366
  };
  const DEFAULT_ZOOM = 15;      // "Default zoom level is 15"
  const SEARCH_RADIUS = 1500;   // "Search radius is 1.5km"

  // States
  const [selectedShop, setSelectedShop] = useState(null);
  const [coffeeShops, setCoffeeShops] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const [userLocation, setUserLocation] = useState(initialLocation || DEFAULT_LOCATION);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [communityRatings, setCommunityRatings] = useState({});
  const [queuedLocation, setQueuedLocation] = useState(null);

  // Refs
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const clustererRef = useRef(null);
  const idleListenerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const infoWindowRef = useRef(null);
  const initialSearchDoneRef = useRef(false);

  // Debug logging
  useEffect(() => {
    console.log('Map container ref:', mapRef.current);
    console.log('Google Maps loaded:', !!window.google);
    console.log('Current location:', userLocation);
  }, [userLocation]);

  // Handle initial location changes
  useEffect(() => {
    if (initialLocation && mapInstance) {
      console.log('Setting initial location:', initialLocation);
      handleLocationSelect(initialLocation);
    }
  }, [initialLocation, mapInstance, handleLocationSelect]);

  // Validate location object
  const validateLocation = useCallback((loc) => {
    if (!loc) return DEFAULT_LOCATION;
    
    // If it's a string, return default
    if (typeof loc === 'string') {
      console.log('String location provided, using default');
      return DEFAULT_LOCATION;
    }
    
    // Check for valid coordinates
    const lat = typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat);
    const lng = typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng);
    
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      console.log('Invalid coordinates, using default:', { lat, lng });
      return DEFAULT_LOCATION;
    }
    
    return { lat, lng };
  }, []);

  // Search nearby places
  const searchNearby = useCallback((center) => {
    if (!placesService) {
      console.log('Places service not ready');
      return;
    }
    
    const validCenter = validateLocation(center);
    console.log('Searching nearby with coordinates:', validCenter);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      try {
        const request = {
          location: new window.google.maps.LatLng(validCenter.lat, validCenter.lng),
          radius: SEARCH_RADIUS,
          type: ['cafe'],
          keyword: 'coffee'
        };

        placesService.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            console.log('Found coffee shops:', results.length);
            setCoffeeShops(results);
          } else {
            console.error('Search failed:', status, 'at location:', validCenter);
            setCoffeeShops([]);
          }
        });
      } catch (error) {
        console.error('Error during search:', error);
        setCoffeeShops([]);
      }
    }, 500);
  }, [placesService, validateLocation]);

  // Handle location selection
  const handleLocationSelect = useCallback((location) => {
    console.log('Location selection handler called with:', location);
    
    if (!mapInstance) {
      console.log('Map not ready, queuing location:', location);
      setQueuedLocation(location);
      return;
    }
    
    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
      const newLocation = {
        lat: location.lat,
        lng: location.lng
      };

      console.log('Setting map center to:', newLocation);
      
      setUserLocation(newLocation);
      mapInstance.setCenter(newLocation);
      mapInstance.setZoom(DEFAULT_ZOOM);
      searchNearby(newLocation);
    } else {
      console.error('Invalid location format:', location);
    }
  }, [mapInstance, searchNearby]);

  // Process queued location when map is ready
  useEffect(() => {
    if (mapInstance && queuedLocation) {
      console.log('Processing queued location:', queuedLocation);
      handleLocationSelect(queuedLocation);
      setQueuedLocation(null);
    }
  }, [mapInstance, queuedLocation, handleLocationSelect]);

  // Initialize map
  useEffect(() => {
    if (!window.google || !mapRef.current || isMapInitialized) return;

    console.log('Initializing map...');

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: validateLocation(userLocation),
        zoom: DEFAULT_ZOOM,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });

      const places = new window.google.maps.places.PlacesService(map);
      const infoWindow = new window.google.maps.InfoWindow();

      setMapInstance(map);
      setPlacesService(places);
      infoWindowRef.current = infoWindow;
      setIsMapInitialized(true);

      console.log('Map initialization complete');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [userLocation, isMapInitialized]);

  // Debug container size
  useEffect(() => {
    if (mapRef.current) {
      const container = mapRef.current;
      console.log('Container dimensions:', {
        offsetHeight: container.offsetHeight,
        offsetWidth: container.offsetWidth,
        clientHeight: container.clientHeight,
        clientWidth: container.clientWidth
      });
    }
  }, []);

  // Perform initial search
  useEffect(() => {
    if (!placesService || !userLocation || initialSearchDoneRef.current) {
      console.log('Skipping initial search:', {
        hasPlacesService: !!placesService,
        hasLocation: !!userLocation,
        alreadySearched: initialSearchDoneRef.current
      });
      return;
    }

    console.log('Performing initial search at:', userLocation);
    
    const request = {
      location: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
      radius: SEARCH_RADIUS,
      type: ['cafe'],
      keyword: 'coffee'
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        console.log('Initial search found:', results.length, 'coffee shops');
        setCoffeeShops(results);
        initialSearchDoneRef.current = true;
      } else {
        console.error('Initial search failed:', status);
      }
    });
  }, [placesService, userLocation]);

  // Get detailed place information
  const getPlaceDetails = useCallback((placeId) => {
    if (!placesService) return null;

    return new Promise((resolve) => {
      placesService.getDetails(
        {
          placeId: placeId,
          fields: ['name', 'formatted_address', 'rating', 'user_ratings_total', 'business_status']
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(place);
          } else {
            console.error('Error fetching place details:', status);
            resolve(null);
          }
        }
      );
    });
  }, [placesService]);

  // Create info window content
  const createInfoWindowContent = useCallback((shop) => {
    return `
      <div style="padding: 12px; max-width: 300px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">${shop.name}</h3>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
          ${shop.vicinity || shop.formatted_address}
        </p>
        ${shop.rating ? `
          <div style="margin-top: 8px;">
            <span style="color: #FFD700;">★</span> 
            <strong>${shop.rating}</strong> 
            ${shop.user_ratings_total ? `(${shop.user_ratings_total} reviews)` : ''}
          </div>
        ` : ''}
        ${shop.business_status ? `
          <div style="margin-top: 8px; color: ${
            shop.business_status === 'OPERATIONAL' ? '#4CAF50' : '#F44336'
          };">
            ${shop.business_status === 'OPERATIONAL' ? 'Open' : 'Closed'}
          </div>
        ` : ''}
      </div>
    `;
  }, []);

  // Handle marker click with details fetch
  const handleMarkerClick = useCallback(async (shop, marker) => {
    if (infoWindowRef.current) {
      // Show initial info while loading details
      infoWindowRef.current.setContent(createInfoWindowContent(shop));
      infoWindowRef.current.open(mapInstance, marker);

      // Get and show detailed information
      const details = await getPlaceDetails(shop.place_id);
      if (details) {
        infoWindowRef.current.setContent(createInfoWindowContent({
          ...shop,
          ...details
        }));
      }
    }
    setSelectedShop(shop);
  }, [mapInstance, createInfoWindowContent, getPlaceDetails]);

  // Update marker creation
  useEffect(() => {
    if (!mapInstance || !coffeeShops.length) {
      console.log('Cannot create markers:', {
        hasMap: !!mapInstance,
        shopCount: coffeeShops.length
      });
      return;
    }

    console.log('Creating markers for', coffeeShops.length, 'shops');

    // Clear existing markers
    if (markersRef.current) {
      Object.values(markersRef.current).forEach(marker => marker.setMap(null));
      markersRef.current = {};
    }

    // Create new markers
    const newMarkers = coffeeShops.reduce((acc, shop) => {
      const position = shop.geometry.location;
      const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
      const lng = typeof position.lng === 'function' ? position.lng() : position.lng;

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: shop.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#DB4437',
          fillOpacity: 0.9,
          scale: 8,
          strokeColor: 'white',
          strokeWeight: 2,
        }
      });

      marker.addListener('click', () => handleMarkerClick(shop, marker));

      acc[shop.place_id] = marker;
      return acc;
    }, {});

    markersRef.current = newMarkers;

    // Update clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(Object.values(newMarkers));
    }

    return () => {
      Object.values(newMarkers).forEach(marker => marker.setMap(null));
    };
  }, [mapInstance, coffeeShops, handleMarkerClick]);

  // Add idle listener for continuous search
  useEffect(() => {
    if (!mapInstance || !placesService || idleListenerRef.current) return;

    console.log('Setting up idle listener');
    
    idleListenerRef.current = mapInstance.addListener('idle', () => {
      const center = mapInstance.getCenter();
      if (center) {
        const newCenter = {
          lat: center.lat(),
          lng: center.lng()
        };
        console.log('Map idle at:', newCenter);
        searchNearby(newCenter);
      }
    });

    return () => {
      if (idleListenerRef.current) {
        window.google.maps.event.removeListener(idleListenerRef.current);
        idleListenerRef.current = null;
      }
    };
  }, [mapInstance, placesService, searchNearby]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <SearchBar onLocationSelect={handleLocationSelect} />
      <div 
        ref={mapRef} 
        style={{ 
          height: '100%', 
          width: '100%',
          backgroundColor: '#f0f0f0'
        }} 
      />
      
      {/* Debug overlay */}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        background: 'white', 
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}>
        <div>Map Initialized: {isMapInitialized ? 'Yes' : 'No'}</div>
        <div>Has Places Service: {!!placesService ? 'Yes' : 'No'}</div>
        <div>Coffee Shops: {coffeeShops.length}</div>
        <div>Container Height: {mapRef.current?.offsetHeight || 0}px</div>
        <div>Container Width: {mapRef.current?.offsetWidth || 0}px</div>
      </div>
    </div>
  );
}

// Optional: Define map styles
const mapStyles = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  }
];

export default Map;