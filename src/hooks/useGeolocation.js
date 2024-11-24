import { useState, useEffect, useCallback } from 'react';

export const useGeolocation = (onLocationChange) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const handlePositionUpdate = useCallback((position) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    setCurrentLocation(newLocation);
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  }, [onLocationChange]);

  useEffect(() => {
    if (!navigator.geolocation || isInitialized) return;

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePositionUpdate(position);
        setIsInitialized(true);
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        setError(error);
        setIsInitialized(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    // Watch for updates
    const watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      (error) => {
        console.error('Geolocation watch error:', error.message);
        setError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [handlePositionUpdate, isInitialized]);

  return { currentLocation, error, isInitialized };
}; 