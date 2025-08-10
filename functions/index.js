const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Places API endpoint for nearby search
exports.nearbySearch = functions.https.onCall(async (data, context) => {
  try {
    const { location, radius = 1000, types = ['cafe'], keyword = 'cafe coffee shop wifi laptop' } = data;
    
    if (!location || !location.lat || !location.lng) {
      throw new functions.https.HttpsError('invalid-argument', 'Location is required');
    }

    // Build the Places API request URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: radius.toString(),
      types: types.join('|'),
      keyword: keyword,
      key: functions.config().google.server_api_key // Secure server-side API key
    });

    const url = `${baseUrl}?${params.toString()}`;
    
    console.log('Making Places API request:', url);
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK') {
      console.log(`Found ${response.data.results.length} places`);
      return {
        status: 'OK',
        results: response.data.results,
        nextPageToken: response.data.next_page_token
      };
    } else {
      console.error('Places API error:', response.data.status, response.data.error_message);
      throw new functions.https.HttpsError('internal', `Places API error: ${response.data.status}`);
    }
    
  } catch (error) {
    console.error('Error in nearbySearch function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Places API endpoint for place details
exports.getPlaceDetails = functions.https.onCall(async (data, context) => {
  try {
    const { placeId, fields = 'name,geometry,vicinity,formatted_address,place_id' } = data;
    
    if (!placeId) {
      throw new functions.https.HttpsError('invalid-argument', 'Place ID is required');
    }

    // Build the Places API request URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = new URLSearchParams({
      place_id: placeId,
      fields: fields,
      key: functions.config().google.server_api_key
    });

    const url = `${baseUrl}?${params.toString()}`;
    
    console.log('Making Place Details API request for:', placeId);
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK') {
      console.log('Place details retrieved successfully');
      return {
        status: 'OK',
        result: response.data.result
      };
    } else {
      console.error('Place Details API error:', response.data.status, response.data.error_message);
      throw new functions.https.HttpsError('internal', `Place Details API error: ${response.data.status}`);
    }
    
  } catch (error) {
    console.error('Error in getPlaceDetails function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Batch place details endpoint
exports.batchGetPlaceDetails = functions.https.onCall(async (data, context) => {
  try {
    const { placeIds, fields = 'name,geometry,vicinity,formatted_address,place_id' } = data;
    
    if (!placeIds || !Array.isArray(placeIds) || placeIds.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Place IDs array is required');
    }

    // Limit batch size to avoid API quotas
    const maxBatchSize = 5;
    const batchPlaceIds = placeIds.slice(0, maxBatchSize);
    
    console.log(`Processing batch of ${batchPlaceIds.length} place IDs`);

    // Make parallel requests for each place ID
    const promises = batchPlaceIds.map(async (placeId) => {
      try {
        const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
        const params = new URLSearchParams({
          place_id: placeId,
          fields: fields,
          key: functions.config().google.server_api_key
        });

        const url = `${baseUrl}?${params.toString()}`;
        const response = await axios.get(url);
        
        if (response.data.status === 'OK') {
          return {
            placeId: placeId,
            status: 'OK',
            result: response.data.result
          };
        } else {
          return {
            placeId: placeId,
            status: 'ERROR',
            error: response.data.status
          };
        }
      } catch (error) {
        return {
          placeId: placeId,
          status: 'ERROR',
          error: error.message
        };
      }
    });

    const results = await Promise.all(promises);
    
    console.log(`Batch processing completed. ${results.filter(r => r.status === 'OK').length} successful, ${results.filter(r => r.status === 'ERROR').length} failed`);
    
    return {
      status: 'OK',
      results: results
    };
    
  } catch (error) {
    console.error('Error in batchGetPlaceDetails function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 