import { useEffect, useState } from 'react';

const GOOGLE_MAPS_SRC = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;

export default function useGoogleMaps() {
  const [loaded, setLoaded] = useState(!!window.google?.maps);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setLoaded(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setLoaded(true));
      existingScript.addEventListener('error', () => setError('Failed to load Google Maps'));
      return;
    }

    // Create script
    const script = document.createElement('script');
    script.src = GOOGLE_MAPS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  return { loaded, error };
} 