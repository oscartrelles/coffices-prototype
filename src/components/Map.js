import React, { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar from './SearchBar';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import colors from '../styles/colors';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import Header from './Header';

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

  const mapRef = useRef(null);
  const markersRef = useRef({});
  const clustererRef = useRef(null);

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
          {selectedShop.rating && (
            <p style={styles.rating}>
              Rating: {selectedShop.rating} ({selectedShop.user_ratings_total} reviews)
            </p>
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
  }
};

export default Map; 