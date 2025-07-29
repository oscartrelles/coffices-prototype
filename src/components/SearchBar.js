import { useState, useCallback } from 'react';
import { components, icons } from '../styles';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { debounce } from 'lodash';
import placeCacheService from '../services/placeCache';

function SearchBar({ onLocationSelect, isMapLoaded, map, onLocationClick, userLocation, mapCenter }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Debounced search function with caching
  const debouncedSearch = useCallback(
    debounce(async (value) => {
      if (!value.trim() || !isMapLoaded) {
        setSuggestions([]);
        return;
      }

      // Check cache first
      const cached = placeCacheService.getSearchCache(value);
      if (cached) {
        console.log('📦 Using cached search results for:', value);
        setSuggestions(cached);
        return;
      }

      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: value,
          // Bias search to user's current location if available
          location: userLocation ? new window.google.maps.LatLng(userLocation.lat, userLocation.lng) : undefined,
          radius: userLocation ? 50000 : undefined, // 50km radius if location is available
          types: ['establishment', 'geocode']
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Cache the results
            placeCacheService.setSearchCache(value, predictions);
            // Track API usage
            placeCacheService.trackAPICall('Places', 'getPlacePredictions', 0.00283);
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 300), // 300ms debounce
    [isMapLoaded, userLocation]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleSuggestionClick = async (suggestion) => {
    try {
      // Use cached place details if available
      const place = await placeCacheService.getPlaceDetails(suggestion.place_id);
      
      const isVenue = place.types && place.types.includes('establishment');
      
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        name: place.name,
        address: place.formatted_address,
        place_id: place.place_id,
        fromSearch: true,
        isVenue: isVenue,
        // Include full place data if it's a venue for the PlaceDetails component
        ...(isVenue && { 
          placeData: {
            ...place,
            // Ensure we have the fields that PlaceDetails expects
            vicinity: place.vicinity || place.formatted_address,
            geometry: place.geometry
          }
        })
      };
      onLocationSelect(location, map);
      setSearchValue(suggestion.structured_formatting.main_text);
      setSuggestions([]);
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Fallback to original method if cache fails
      const service = new window.google.maps.places.PlacesService(map);
      service.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ['geometry', 'name', 'formatted_address', 'vicinity', 'place_id', 'types', 'rating', 'user_ratings_total']
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const isVenue = place.types && place.types.includes('establishment');
            
            const location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              name: place.name,
              address: place.formatted_address,
              place_id: place.place_id,
              fromSearch: true,
              isVenue: isVenue,
              ...(isVenue && { 
                placeData: {
                  ...place,
                  vicinity: place.vicinity || place.formatted_address,
                  geometry: place.geometry
                }
              })
            };
            onLocationSelect(location, map);
            setSearchValue(suggestion.structured_formatting.main_text);
            setSuggestions([]);
          }
        }
      );
    }
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