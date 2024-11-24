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
          p: '2px 12px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          boxShadow: 3,
          borderRadius: '22px',
          '& .MuiInputBase-input': {
            width: '100%',
            overflow: 'visible',
            textOverflow: 'ellipsis',
          }
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
          sx={{
            ml: 1,
            flex: 1,
            width: '100%',
            '& input': {
              width: '100%',
              overflow: 'visible',
              textOverflow: 'ellipsis',
            }
          }}
          inputProps={{ 'aria-label': 'search coffee shops' }}
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
    boxSizing: 'border-box',
  },
  '@media (max-width: 600px)': {
    searchContainer: {
      top: '72px',
      width: '95%',
    }
  }
};

// Update the global styles for the Places Autocomplete dropdown
const styleTag = document.createElement('style');
styleTag.textContent = `
  .pac-container {
    margin-top: 8px !important;
    border-radius: 12px !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
    background-color: ${colors.background.paper} !important;
    font-family: inherit !important;
    
    /* Match the search container width exactly */
    width: 90% !important;
    max-width: 600px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
  }

  @media (max-width: 600px) {
    .pac-container {
      width: 95% !important;
    }
  }
  
  .pac-item {
    padding: 12px 16px !important;
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