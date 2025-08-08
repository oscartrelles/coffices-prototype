import { useState } from 'react';
import { components, icons } from '../styles';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import analyticsService from '../services/analyticsService';

function SearchBar({ onLocationSelect, isMapLoaded, map, onLocationClick, userLocation, mapCenter }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    const previousValue = searchValue;
    setSearchValue(value);

    // Track search initiation when user starts typing
    if (!previousValue.trim() && value.trim() && isMapLoaded) {
      analyticsService.trackSearchInitiated(value, 'search_bar');
      analyticsService.trackJourneyStep('search_initiated', { query: value });
      analyticsService.trackFunnelStep('main_user_journey', 'search_initiated', 2, 6, { query: value });
    }

    // Track search abandonment if user clears the search
    if (previousValue.trim() && !value.trim()) {
      analyticsService.trackDropoff('search_abandoned', { 
        search_query: previousValue 
      });
    }

    if (!value.trim() || !isMapLoaded) {
      setSuggestions([]);
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
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  const handleSuggestionClick = async (suggestion) => {
    // Track search suggestion click
    analyticsService.trackSearchSuggestionClicked(suggestion.description, suggestion.index);
    analyticsService.trackJourneyStep('search_suggestion_selected', { 
      suggestion: suggestion.description,
      position: suggestion.index 
    });
    
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
          onClick={() => {
            analyticsService.trackCurrentLocationUsed();
            analyticsService.trackJourneyStep('current_location_used');
            onLocationClick();
          }}
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