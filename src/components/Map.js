import { useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce';

function Map({ user, ...props }) {
  // ... existing state ...
  
  useEffect(() => {
    // Add this effect to watch for user changes
    if (!user) {
      setSelectedShop(null);  // Reset selected shop
      setInfoWindowOpen(false);  // Close info window
    }
  }, [user]);

  const fetchShopsInView = useCallback(
    debounce(async (bounds) => {
      // Only fetch if we've moved significantly from last fetch
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      try {
        // Your existing fetch logic here
        const shops = await fetchShopsInBounds(ne, sw);
        setShops(shops);
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    }, 1000),  // Wait 1 second after last pan before fetching
    []
  );

  const handleMapIdle = () => {
    if (map) {
      const bounds = map.getBounds();
      fetchShopsInView(bounds);
    }
  };

  // Use in map options
  const mapOptions = {
    // ... other options ...
    onIdle: handleMapIdle,
  };

  // ... rest of the component
} 