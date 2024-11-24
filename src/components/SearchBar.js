import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import colors from '../styles/colors';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { Box, Paper, InputBase, IconButton } from '@mui/material';

function SearchBar({ onLocationSelect, isMapLoaded, map, onLocationClick = () => {} }) {
  const [searchInput, setSearchInput] = useState('');
  const autocompleteRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMapLoaded) {
      console.log('SearchBar: Waiting for maps to load');
      return;
    }

    console.log('SearchBar: Initializing autocomplete');
    const input = document.getElementById('search-input');
    if (!input) {
      console.error('SearchBar: Search input not found');
      return;
    }

    try {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(input, {
        fields: ['name', 'geometry', 'formatted_address'],
        types: ['establishment', 'geocode']
      });

      autocompleteRef.current = autocompleteInstance;

      const placeChangedListener = autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        console.log('SearchBar: Place selected:', place);

        if (place.geometry) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.name,
            formatted_address: place.formatted_address,
            fromSearch: true
          };
          
          console.log('SearchBar: Calling onLocationSelect with:', location);
          onLocationSelect(location, map);
          setSearchInput(place.name);
        }
      });

      return () => {
        if (placeChangedListener) {
          placeChangedListener.remove();
        }
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          autocompleteRef.current = null;
        }
      };
    } catch (error) {
      console.error('SearchBar: Error initializing autocomplete:', error);
    }
  }, [isMapLoaded, onLocationSelect, map]);

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <Box sx={styles.searchContainer}>
    <Paper
      component="form"
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        boxShadow: 3
      }}
    >
      <IconButton 
        sx={{ p: '10px' }} 
        aria-label="locate me"
        onClick={onLocationClick}
      >
        <MyLocationIcon />
      </IconButton>
      
      <InputBase
        id="search-input"
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search for a location..."
        style={styles.input}
        autoComplete="off"
      />
    </Paper>
    </Box>
  );
}

const styles = {
  searchContainer: {
    position: 'absolute',
    top: '65px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '600px',
    zIndex: 1000,
    backgroundColor: 'transparent',
    padding: '0 16px',
    boxSizing: 'border-box',
  },
  searchInput: {
    width: '100%',
    height: '44px',
    padding: '0 16px',
    borderRadius: '22px',
    border: 'none',
    backgroundColor: colors.background.paper,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontSize: '16px',
    outline: 'none',
    '&:focus': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
  },
  searchResults: {
    position: 'absolute',
    top: '52px',
    left: '16px',
    right: '16px',
    backgroundColor: colors.background.paper,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 1001,
  },
  resultItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: colors.background.main,
    },
    '&:first-child': {
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
    },
    '&:last-child': {
      borderBottomLeftRadius: '12px',
      borderBottomRightRadius: '12px',
    },
  },
  resultText: {
    margin: 0,
    fontSize: '14px',
    color: colors.text.primary,
  },
  resultAddress: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: colors.text.secondary,
  },
  '@media (max-width: 600px)': {
    searchContainer: {
      top: '72px',
      padding: '0 12px',
    },
    searchInput: {
      height: '40px',
      fontSize: '14px',
    },
  },
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