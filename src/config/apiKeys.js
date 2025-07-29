// API Keys Configuration
// This file centralizes API key management for better security

const getApiKeys = () => {
  const environment = process.env.NODE_ENV;
  const hostname = window.location.hostname;
  
  // Determine environment
  const isProduction = hostname === 'findacoffice.com';
  const isStaging = hostname === 'find-a-coffice.web.app';
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';

  // Base configuration
  const config = {
    // Primary Maps API key (for Maps JavaScript API)
    mapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    
    // Optional: Separate Places API key (if you want to split them)
    placesApiKey: process.env.REACT_APP_GOOGLE_PLACES_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    
    // Environment info for debugging
    environment: isProduction ? 'production' : isStaging ? 'staging' : 'development',
    hostname: hostname
  };

  // Validate required keys
  if (!config.mapsApiKey) {
    console.error('Google Maps API key is missing!');
  }

  return config;
};

export default getApiKeys; 