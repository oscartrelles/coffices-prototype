import { useState } from 'react';
import { components, icons } from '../styles';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import Box from '@mui/material/Box';

function SearchBar({ onLocationSelect, isMapLoaded, map, onLocationClick }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    if (!value.trim() || !isMapLoaded) {
      setSuggestions([]);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: value,
        componentRestrictions: { country: 'ES' },
        types: ['establishment', 'geocode']
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  const handleSuggestionClick = async (suggestion) => {
    const service = new window.google.maps.places.PlacesService(map);
    
    service.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ['geometry', 'name', 'formatted_address', 'place_id']
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.name,
            address: place.formatted_address,
            place_id: place.place_id,
            fromSearch: true
          };
          onLocationSelect(location, map);
          setSearchValue(suggestion.structured_formatting.main_text);
          setSuggestions([]);
        }
      }
    );
  };

  return (
    <div style={components.searchBar.container}>
      <div style={components.searchBar.inputWrapper}>
        <SearchIcon sx={icons.search} />
        <input
          type="text"
          placeholder="Search for a location..."
          value={searchValue}
          onChange={handleInputChange}
          style={components.searchBar.input}
        />
        <button
          onClick={onLocationClick}
          style={components.searchBar.locationButton}
          title="Use my location"
        >
          <MyLocationIcon sx={icons.location} />
        </button>
      </div>

      {suggestions.length > 0 && (
        <div style={components.searchBar.suggestions}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              style={components.searchBar.suggestion}
            >
              <div style={components.searchBar.suggestionText}>
                {suggestion.structured_formatting.main_text}
              </div>
              <div style={components.searchBar.suggestionSecondary}>
                {suggestion.structured_formatting.secondary_text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar; 