import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import colors from '../styles/colors';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { Paper, InputBase, IconButton } from '@mui/material';

function SearchBar({ onLocationSelect, isMapLoaded, map }) {
  const [searchInput, setSearchInput] = useState('');
  const autocompleteRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMapLoaded) {
      console.log('Waiting for map to load...');
      return;
    }

    console.log('Map is loaded, initializing autocomplete');
    const input = document.getElementById('search-input');
    if (!input) {
      console.error('Search input not found');
      return;
    }

    const autocompleteInstance = new window.google.maps.places.Autocomplete(input, {
      types: ['(cities)'],
      fields: ['name', 'geometry', 'formatted_address']
    });
    autocompleteRef.current = autocompleteInstance;

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();
      if (place.geometry) {
        onLocationSelect(place);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isMapLoaded, onLocationSelect]);

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          onLocationSelect(userLocation, map);
          
          if (map) {
            map.panTo(userLocation);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <div style={styles.container}>
      <Paper component="form" sx={styles.searchBar} elevation={3}>
        <InputBase
          id="search-input"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for a city..."
          style={styles.input}
        />
        <IconButton
          onClick={handleLocationClick}
          sx={styles.locateButton}
        >
          <MyLocationIcon />
        </IconButton>
      </Paper>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'absolute',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '600px',
    p: '2px 4px',
    backgroundColor: colors.background.paper,
    zIndex: 999,
    border: `1px solid ${colors.border}`,
    '&:hover': {
      border: `1px solid ${colors.primary.main}`,
    },
  },
  searchBar: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '12px 40px 12px 16px', // Added right padding for search icon
    fontSize: '16px',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    backgroundColor: colors.background.paper,
    color: colors.text.primary,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    outline: 'none',
    transition: 'all 0.2s ease',
    ':focus': {
      borderColor: colors.primary.main,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    '::placeholder': {
      color: colors.text.secondary,
    }
  },
  searchIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
    color: colors.text.secondary,
    pointerEvents: 'none',
  },
  locateButton: {
    position: 'absolute',
    right: '-48px', // Position it to the right of the search bar
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: colors.background.paper,
    color: colors.primary.main,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      backgroundColor: colors.background.overlay,
    }
  }
};

// Add global styles for Google Places Autocomplete dropdown
const styleTag = document.createElement('style');
styleTag.textContent = `
  .pac-container {
    border: 1px solid ${colors.border} !important;
    border-radius: 0 0 8px 8px !important;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
    margin-top: 4px !important;
    background-color: ${colors.background.paper} !important;
    font-family: inherit !important;
  }
  
  .pac-item {
    padding: 8px 16px !important;
    cursor: pointer !important;
    font-size: 14px !important;
    color: ${colors.text.primary} !important;
    border-top: 1px solid ${colors.border} !important;
  }
  
  .pac-item:first-child {
    border-top: none !important;
  }
  
  .pac-item:hover {
    background-color: ${colors.background.main} !important;
  }
  
  .pac-item-query {
    font-size: 14px !important;
    color: ${colors.text.primary} !important;
  }
  
  .pac-matched {
    color: ${colors.primary.main} !important;
    font-weight: 600 !important;
  }
  
  .pac-icon {
    display: none !important;
  }
`;
document.head.appendChild(styleTag);

export default SearchBar; 