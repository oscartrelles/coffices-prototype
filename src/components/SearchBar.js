import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import colors from '../styles/colors';

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
    
    // Style the autocomplete dropdown
    const pacContainer = document.querySelector('.pac-container');
    if (pacContainer) {
      pacContainer.style.border = `1px solid ${colors.border}`;
      pacContainer.style.borderRadius = '0 0 8px 8px';
      pacContainer.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      pacContainer.style.marginTop = '4px';
      pacContainer.style.backgroundColor = colors.background.paper;
    }

    const placeChangedListener = () => {
      const place = autocompleteInstance.getPlace();
      console.log('Place selected:', place);

      if (!place.geometry || !place.geometry.location) {
        console.error('No geometry found for place:', place);
        return;
      }

      // Update URL and map
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
      }
    };
  }, [navigate, onLocationSelect]);

  return (
    <div style={styles.container}>
      <div style={styles.searchContainer}>
        <input
          id="search-input"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for a city..."
          style={styles.input}
        />
        <div style={styles.searchIcon}>🔍</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '400px',
    zIndex: 1,
    padding: '0 16px',
  },
  searchContainer: {
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