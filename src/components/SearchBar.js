import { useState } from 'react';

import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import { components, icons } from '../styles';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import Box from '@mui/material/Box';

function SearchBar({ onLocationSelect, isMapLoaded, map, onLocationClick }) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // TODO: Consider moving to own file (for model)
  const getCoffice = async (placeId) => {
    console.log('****Getting Coffice for placeId:', placeId);
    const cofficesCollection = collection(db, 'coffices');
    const q = query(cofficesCollection, where('placeId', '==', placeId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      console.log('Coffice found:', docData);
      return docData;
    } else {
      console.log('No coffice found for placeId:', placeId);
      return null;
    }
  }

  const createCoffice = (place) => {    
    console.log('****Creating Coffice for place:', place);    
    console.log('Coffice id'+place.place_id +',name:'+ place.name );
    console.log('Coffice lat'+place.geometry.location.lat() +',long:'+ place.geometry.location.lng());

    const documentId = place.place_id; 
    const cofficeData = {
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),      
      createdAt: new Date().toISOString()
    }
    try {
      setDoc(doc(db, 'coffices', documentId), cofficeData);
    }
    catch (error) {
      console.error('**Error creating coffice:', error);
    }
  }

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

  const handleSuggestionClick = async (selectedSuggestion) => {
    const placesService = new window.google.maps.places.PlacesService(map);
    console.log('**Selected suggestion:', selectedSuggestion);

    // TODO:IM - compare the fields in selectedSuggestion with the fields in place below.

    const cofficeFromSelectedSuggestion = await getCoffice(selectedSuggestion.place_id);
    console.log('Coffice from selected suggestion:', cofficeFromSelectedSuggestion);
    // if already in the database we do not need to retrieve from API.
    if(cofficeFromSelectedSuggestion!=null)
    {
      console.log('Coffice already exists in database:', cofficeFromSelectedSuggestion);
      const location = {
        lat: cofficeFromSelectedSuggestion.lat,
        lng: cofficeFromSelectedSuggestion.lng,
        name: cofficeFromSelectedSuggestion.name,
        address: cofficeFromSelectedSuggestion.address,
        place_id: selectedSuggestion.place_id,
        fromSearch: true
      };
      onLocationSelect(location, map);
      setSearchValue(selectedSuggestion.structured_formatting.main_text);
      setSuggestions([]);
      return;
    }
    else
    {
      console.log('Coffice not found in database, retrieving from API...');
      
      placesService.getDetails(
        {
          placeId: selectedSuggestion.place_id,
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
            
            //coffice = getCoffice(place.place_id);
            createCoffice(place); // unsure if we're creating from place, location, or suggestion at this stage.
            
            onLocationSelect(location, map);
            setSearchValue(selectedSuggestion.structured_formatting.main_text);
            setSuggestions([]);
          }
        }
      ); //end getDetails call
    }
  };

  // Returns true if the user is an admin
  function isAdmin(user) {
    const adminEmails = ['info@oscartrelles.com', 'hello@ianmoss.com'];
    return user && adminEmails.includes(user.email);
  }

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