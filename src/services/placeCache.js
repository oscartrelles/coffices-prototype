// Place Cache Service for Google Maps API optimization
// This service reduces API calls by caching place details and implementing smart caching strategies

class PlaceCacheService {
  constructor() {
    this.localCache = new Map();
    this.sessionCache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
    this.sessionTTL = 60 * 60 * 1000; // 1 hour
    this.requestQueue = new Map(); // Prevent duplicate requests
  }

  // Get place details with caching
  async getPlaceDetails(placeId, fields = null) {
    // Check if request is already in progress
    if (this.requestQueue.has(placeId)) {
      return this.requestQueue.get(placeId);
    }

    // Check session cache first (fastest)
    const sessionCached = this.getFromSessionCache(placeId);
    if (sessionCached) {
      console.log('📦 Place details found in session cache:', placeId);
      return sessionCached;
    }

    // Check local storage cache
    const localCached = this.getFromLocalCache(placeId);
    if (localCached) {
      console.log('💾 Place details found in local cache:', placeId);
      // Move to session cache for faster access
      this.setSessionCache(placeId, localCached);
      return localCached;
    }

    // Create promise for this request
    const requestPromise = this.fetchFromAPI(placeId, fields);
    this.requestQueue.set(placeId, requestPromise);

    try {
      const details = await requestPromise;
      
      // Store in both caches
      this.setLocalCache(placeId, details);
      this.setSessionCache(placeId, details);
      
      console.log('🌐 Place details fetched from API:', placeId);
      return details;
    } finally {
      // Clean up request queue
      this.requestQueue.delete(placeId);
    }
  }

  // Batch get place details with rate limiting
  async batchGetPlaceDetails(placeIds, fields = null) {
    const results = [];
    const chunks = this.chunk(placeIds, 10); // Google's recommended batch size

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(placeId => 
        this.getPlaceDetails(placeId, fields)
      );
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      
      // Rate limiting: wait 100ms between chunks
      if (chunks.length > 1) {
        await this.delay(100);
      }
    }

    return results;
  }

  // Fetch from Google Places API
  async fetchFromAPI(placeId, fields = null) {
    return new Promise((resolve, reject) => {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      const request = {
        placeId: placeId,
        fields: fields || [
          'geometry', 'name', 'formatted_address', 'vicinity', 
          'place_id', 'types', 'rating', 'user_ratings_total', 'photos'
        ]
      };

      service.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          // Track API usage
          this.trackAPICall('Places', 'getDetails', 0.017);
          resolve(place);
        } else {
          console.error('Failed to fetch place details:', placeId, status);
          reject(new Error(`API call failed: ${status}`));
        }
      });
    });
  }

  // Session cache methods (in-memory, fastest)
  getFromSessionCache(placeId) {
    const cached = this.sessionCache.get(placeId);
    if (cached && Date.now() - cached.timestamp < this.sessionTTL) {
      return cached.data;
    }
    this.sessionCache.delete(placeId);
    return null;
  }

  setSessionCache(placeId, data) {
    this.sessionCache.set(placeId, {
      data,
      timestamp: Date.now()
    });
  }

  // Local storage cache methods (persistent)
  getFromLocalCache(placeId) {
    try {
      const cacheKey = `place_${placeId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < this.cacheTTL) {
          return parsed.data;
        } else {
          // Expired, remove from storage
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error reading from local cache:', error);
    }
    return null;
  }

  setLocalCache(placeId, data) {
    try {
      const cacheKey = `place_${placeId}`;
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to local cache:', error);
      // If localStorage is full, clear old entries
      this.cleanupLocalCache();
    }
  }

  // Clean up expired cache entries
  cleanupLocalCache() {
    try {
      const keys = Object.keys(localStorage);
      const placeKeys = keys.filter(key => key.startsWith('place_'));
      
      placeKeys.forEach(key => {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (Date.now() - cached.timestamp > this.cacheTTL) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Invalid JSON, remove the key
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error cleaning up local cache:', error);
    }
  }

  // Search cache for autocomplete results
  getSearchCache(query) {
    try {
      const cacheKey = `search_${query.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) { // 5 minutes
          return parsed.data;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error reading search cache:', error);
    }
    return null;
  }

  setSearchCache(query, data) {
    try {
      const cacheKey = `search_${query.toLowerCase()}`;
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing search cache:', error);
    }
  }

  // Track API usage for cost monitoring
  trackAPICall(api, operation, cost) {
    try {
      const usage = JSON.parse(localStorage.getItem('api_usage') || '{}');
      const key = `${api}_${operation}`;
      usage[key] = (usage[key] || 0) + 1;
      localStorage.setItem('api_usage', JSON.stringify(usage));
    } catch (error) {
      console.error('Error tracking API usage:', error);
    }
  }

  // Get API usage statistics
  getAPIUsage() {
    try {
      return JSON.parse(localStorage.getItem('api_usage') || '{}');
    } catch (error) {
      console.error('Error reading API usage:', error);
      return {};
    }
  }

  // Estimate costs based on usage
  estimateCosts() {
    const usage = this.getAPIUsage();
    const costs = {
      'Places_getDetails': (usage['Places_getDetails'] || 0) * 0.017,
      'Places_nearbySearch': (usage['Places_nearbySearch'] || 0) * 0.032,
      'Places_getPlacePredictions': (usage['Places_getPlacePredictions'] || 0) * 0.00283
    };
    
    const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    
    return {
      breakdown: costs,
      total: total,
      usage: usage
    };
  }

  // Utility methods
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear all caches
  clearAllCaches() {
    this.sessionCache.clear();
    this.requestQueue.clear();
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('place_') || key.startsWith('search_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing local cache:', error);
    }
  }
}

// Create singleton instance
const placeCacheService = new PlaceCacheService();

export default placeCacheService; 