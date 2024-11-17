import { useEffect, useState } from 'react';
import Map from './Map';
import colors from '../styles/colors';

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-script';

const MapLoader = ({ user, onSignInClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // If Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps already loaded');
      setIsLoaded(true);
      return;
    }

    // Check for existing script
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) {
      console.log('Script already exists, waiting for load');
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    // Load Google Maps API
    console.log('Creating new script element');
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    
    script.onload = () => {
      console.log('Google Maps loaded successfully');
      setIsLoaded(true);
    };

    script.onerror = (error) => {
      console.error('Error loading Google Maps:', error);
    };

    document.head.appendChild(script);

    // No cleanup - we want to keep the script loaded
  }, []);

  console.log('MapLoader render - isLoaded:', isLoaded);

  if (!isLoaded) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading map...</div>
      </div>
    );
  }

  return <Map user={user} onSignInClick={onSignInClick} />;
};

const styles = {
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.main,
  },
  loadingText: {
    color: colors.primary.main,
    fontSize: '18px',
    fontWeight: '500',
  }
};

export default MapLoader; 