// Places API Service using Firebase Functions
// This service handles all Google Places API calls through our backend

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const functions = getFunctions();

// Connect to local emulator if in development
if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Initialize the Firebase Functions
const nearbySearchFunction = httpsCallable(functions, 'nearbySearch');
const getPlaceDetailsFunction = httpsCallable(functions, 'getPlaceDetails');
const batchGetPlaceDetailsFunction = httpsCallable(functions, 'batchGetPlaceDetails');

class PlacesApiService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  // Get nearby places using Firebase Functions
  async nearbySearch(location, radius = 1000, types = ['cafe'], keyword = 'cafe coffee shop wifi laptop') {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firebase Function call timed out after 10 seconds')), 10000);
      });
      
      const functionPromise = nearbySearchFunction({
        location,
        radius,
        types,
        keyword
      });
      
      const result = await Promise.race([functionPromise, timeoutPromise]);
      
      if (result.data.status === 'OK') {
        return result.data.results;
      } else {
        console.error('❌ Nearby search failed:', result.data.status);
        throw new Error(`Places API error: ${result.data.status}`);
      }
    } catch (error) {
      console.error('❌ Error in nearbySearch:', error);
      console.error('❌ Error details:', error.message, error.code, error.details);
      throw error;
    }
  }

  // Get place details using Firebase Functions
  async getPlaceDetails(placeId, fields = 'name,geometry,vicinity,formatted_address,place_id,photos') {
    try {
      // Check cache first
      const cacheKey = `details_${placeId}_${fields}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await getPlaceDetailsFunction({
        placeId,
        fields
      });
      
      if (result.data.status === 'OK') {
        // Cache the result
        this.setCache(cacheKey, result.data.result);
        return result.data.result;
      } else {
        console.error('❌ Place details failed:', result.data.status);
        throw new Error(`Place Details API error: ${result.data.status}`);
      }
    } catch (error) {
      console.error('❌ Error in getPlaceDetails:', error);
      throw error;
    }
  }

  // Batch get place details using Firebase Functions
  async batchGetPlaceDetails(placeIds, fields = 'name,geometry,vicinity,formatted_address,place_id,photos') {
    try {
      const result = await batchGetPlaceDetailsFunction({
        placeIds,
        fields
      });
      
      if (result.data.status === 'OK') {
        return result.data.results;
      } else {
        console.error('❌ Batch place details failed:', result.data.status);
        throw new Error(`Batch Place Details API error: ${result.data.status}`);
      }
    } catch (error) {
      console.error('❌ Error in batchGetPlaceDetails:', error);
      throw error;
    }
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    // eslint-disable-next-line no-unused-vars
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheTTL) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }
}

// Create and export a singleton instance
const placesApiService = new PlacesApiService();
export default placesApiService; 