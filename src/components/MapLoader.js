import { useEffect, useState } from 'react';
import Map from './Map';
import colors from '../styles/colors';

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-script';

const MapLoader = ({ children, onMapLoaded }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.google) {
      console.log('Google Maps already loaded');
      setIsLoaded(true);
      onMapLoaded?.(true);
      return;
    }

    console.log('Creating new script element');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      console.log('Google Maps loaded successfully');
      setIsLoaded(true);
      onMapLoaded?.(true);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [onMapLoaded]);

  console.log('MapLoader render - isLoaded:', isLoaded);
  return isLoaded ? children : null;
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