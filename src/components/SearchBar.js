import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchBar({ onLocationSelect }) {
  const [searchInput, setSearchInput] = useState('');
  const autocompleteRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.google) return;

    const input = document.getElementById('search-input');
    if (!input) return;

    console.log('Initializing autocomplete');

    const options = {
      types: ['(cities)'],
      fields: ['name', 'geometry', 'formatted_address']
    };

    const autocompleteInstance = new window.google.maps.places.Autocomplete(input, options);
    
    const placeChangedListener = () => {
      const place = autocompleteInstance.getPlace();
      console.log('Place selected:', place);

      if (!place.geometry || !place.geometry.location) {
        console.error('No geometry found for place:', place);
        return;
      }

      const placeName = place.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      navigate(`/s/${placeName}`);
      onLocationSelect(place);
      
      // Clear input
      setSearchInput('');
    };

    autocompleteInstance.addListener('place_changed', placeChangedListener);
    autocompleteRef.current = autocompleteInstance;

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [navigate, onLocationSelect]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Current location:', location);
          onLocationSelect(location);
          navigate('/s/current-location');
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <div className="search-bar-container" style={styles.container}>
      <input
        id="search-input"
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search for a city..."
        style={styles.input}
        autoComplete="off"
      />
      <button 
        onClick={handleCurrentLocation}
        style={styles.locationButton}
        title="Use my current location"
        aria-label="Use my current location"
      >
        📍
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '92%',
    maxWidth: '600px',
    padding: '0 8px',
  },
  input: {
    flex: 1,
    padding: '14px 16px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    outline: 'none',
    WebkitAppearance: 'none',
    height: '48px',
    maxHeight: '48px',
  },
  locationButton: {
    width: '48px',
    height: '48px',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  }
};

export default SearchBar; 