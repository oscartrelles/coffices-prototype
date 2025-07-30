// Coffices Service - Manages the coffices collection
// This service handles creating and updating coffice documents with location data and aggregated ratings

import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebaseConfig';

class CofficesService {
  // Create or update a coffice document with location data
  async createOrUpdateCoffice(placeData, ratingData = null) {
    try {
      const placeId = placeData.place_id;
      console.log('🔄 Starting createOrUpdateCoffice for placeId:', placeId);
      console.log('📊 Place data received:', {
        name: placeData.name,
        hasPhotos: !!placeData.photos,
        photoCount: placeData.photos?.length || 0,
        hasPhotoReference: !!(placeData.photos && placeData.photos[0]?.photo_reference)
      });
      
      // If we don't have photos but this is a new coffice, try to fetch fresh data with photos
      let enhancedPlaceData = placeData;
      console.log('🔍 Checking if fresh fetch is needed...');
      console.log('🔍 placeData.photos:', placeData.photos);
      console.log('🔍 placeData.photos?.length:', placeData.photos?.length);
      console.log('🔍 Condition check:', !placeData.photos || placeData.photos.length === 0);
      
      if (!placeData.photos || placeData.photos.length === 0) {
        console.log('🔄 No photos in place data, attempting fresh fetch with photos...');
        try {
          // Import here to avoid circular dependency
          const placeCacheModule = await import('./placeCache.js');
          const placeCacheService = placeCacheModule.default;
          console.log('📦 PlaceCacheService imported successfully');
          
          placeCacheService.clearPlaceCache(placeId);
          console.log('🧹 Cache cleared for placeId:', placeId);
          
          const freshPlaceData = await placeCacheService.getPlaceDetails(placeId, [
            'geometry', 'name', 'formatted_address', 'vicinity', 
            'place_id', 'types', 'rating', 'user_ratings_total', 'photos'
          ]);
          
          console.log('📥 Fresh place data received:', {
            name: freshPlaceData.name,
            hasPhotos: !!freshPlaceData.photos,
            photoCount: freshPlaceData.photos?.length || 0
          });
          
          if (freshPlaceData.photos && freshPlaceData.photos.length > 0) {
            console.log('✅ Fresh fetch successful, found photos:', freshPlaceData.photos.length);
            enhancedPlaceData = freshPlaceData;
          } else {
            console.log('📭 Fresh fetch completed but still no photos available');
          }
        } catch (error) {
          console.error('❌ Error fetching fresh place data:', error);
          console.error('❌ Error details:', error.message);
          // Continue with original data
        }
      } else {
        console.log('✅ Place data already has photos, no fresh fetch needed');
      }
      
      const cofficeRef = doc(db, 'coffices', placeId);
      
      // Check if coffice already exists
      const existingDoc = await getDoc(cofficeRef);
      
      if (existingDoc.exists()) {
        console.log('📝 Updating existing coffice:', placeId);
        // Update existing coffice
        const updateData = {
          lastUpdated: new Date().toISOString()
        };
        
        // If we have new rating data, update the averages
        if (ratingData) {
          const currentData = existingDoc.data();
          const currentRatings = currentData.totalRatings || 0;
          const currentAverages = currentData.averageRatings || {};
          
          // Calculate new averages
          const newAverages = this.calculateNewAverages(
            currentAverages, 
            currentRatings, 
            ratingData
          );
          
          updateData.totalRatings = currentRatings + 1;
          updateData.averageRatings = newAverages;
        }
        
        await updateDoc(cofficeRef, updateData);
        console.log('✅ Updated existing coffice:', placeId);
        
      } else {
        console.log('🆕 Creating new coffice:', placeId);
        // Create new coffice document
        
        // Check if we have photos to download
        let mainImageUrl = null;
        if (enhancedPlaceData.photos && enhancedPlaceData.photos.length > 0) {
          console.log('🖼️ Found photos, attempting to download image...');
          console.log('📸 Photo object structure:', enhancedPlaceData.photos[0]);
          console.log('📸 Photo properties:', Object.keys(enhancedPlaceData.photos[0]));
          
          const photo = enhancedPlaceData.photos[0];
          
          // Check if photo has getUrl method (new format) or photo_reference (old format)
          if (photo.getUrl && typeof photo.getUrl === 'function') {
            console.log('📸 Using getUrl() method for photo URL');
            try {
              // Get the photo URL directly using getUrl()
              const photoUrl = photo.getUrl({ maxWidth: 400, maxHeight: 300 });
              console.log('📸 Photo URL from getUrl():', photoUrl);
              
              // Download and store the image using the URL
              mainImageUrl = await this.downloadAndStoreImageFromUrl(photoUrl, placeId);
              console.log('✅ Image download result:', mainImageUrl);
            } catch (error) {
              console.error('❌ Image download failed:', error);
              mainImageUrl = null;
            }
          } else if (photo.photo_reference) {
            console.log('📸 Using photo_reference for photo download');
            try {
              mainImageUrl = await this.downloadAndStoreImage(photo.photo_reference, placeId, 400, 300);
              console.log('✅ Image download result:', mainImageUrl);
            } catch (error) {
              console.error('❌ Image download failed:', error);
              mainImageUrl = null;
            }
          } else {
            console.log('⚠️ Photo object has neither getUrl() method nor photo_reference');
            mainImageUrl = null;
          }
        } else {
          console.log('📭 No photos available for this place');
        }
        
        const cofficeData = {
          placeId: placeId,
          name: enhancedPlaceData.name || null,
          vicinity: enhancedPlaceData.vicinity || null,
          geometry: {
            location: {
              lat: enhancedPlaceData.geometry?.location?.lat ? 
                (typeof enhancedPlaceData.geometry.location.lat === 'function' ? 
                  enhancedPlaceData.geometry.location.lat() : 
                  enhancedPlaceData.geometry.location.lat) : null,
              lng: enhancedPlaceData.geometry?.location?.lng ? 
                (typeof enhancedPlaceData.geometry.location.lng === 'function' ? 
                  enhancedPlaceData.geometry.location.lng() : 
                  enhancedPlaceData.geometry.location.lng) : null
            }
          },
          // Store main image in Firebase Storage if available
          mainImageUrl: mainImageUrl,
          totalRatings: ratingData ? 1 : 0,
          averageRatings: ratingData ? {
            wifi: ratingData.wifi,
            power: ratingData.power,
            noise: ratingData.noise,
            coffee: ratingData.coffee
          } : {},
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        console.log('💾 Saving coffice data to Firestore:', {
          placeId: cofficeData.placeId,
          name: cofficeData.name,
          hasImage: !!cofficeData.mainImageUrl,
          imageUrl: cofficeData.mainImageUrl
        });
        
        await setDoc(cofficeRef, cofficeData);
        console.log('✅ Created new coffice:', placeId);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error creating/updating coffice:', error);
      throw error;
    }
  }
  
  // Calculate new averages when adding a rating
  calculateNewAverages(currentAverages, currentCount, newRating) {
    const categories = ['wifi', 'power', 'noise', 'coffee'];
    const newAverages = {};
    
    categories.forEach(category => {
      const currentAvg = currentAverages[category] || 0;
      const newValue = newRating[category];
      
      if (newValue) {
        newAverages[category] = (currentAvg * currentCount + newValue) / (currentCount + 1);
      } else {
        newAverages[category] = currentAvg;
      }
    });
    
    return newAverages;
  }
  
  // Get coffices within a radius of a location
  async getCofficesNearby(location, radius) {
    try {
      console.log('🔍 Fetching coffices from database for location:', location, 'radius:', radius);
      
      // Get all coffices from the collection
      const cofficesRef = collection(db, 'coffices');
      const querySnapshot = await getDocs(cofficesRef);
      
      if (querySnapshot.empty) {
        console.log('📭 No coffices found in database');
        return [];
      }
      
      console.log('📊 Found', querySnapshot.size, 'coffices in database');
      
      // Filter by distance
      const nearbyCoffices = [];
      
      querySnapshot.docs.forEach(doc => {
        const cofficeData = doc.data();
        
        if (cofficeData.geometry?.location?.lat && cofficeData.geometry?.location?.lng) {
          const cofficeLocation = {
            lat: cofficeData.geometry.location.lat,
            lng: cofficeData.geometry.location.lng
          };
          
          // Calculate distance
          const distance = this.calculateDistance(location, cofficeLocation);
          
          if (distance <= radius) {
            nearbyCoffices.push({
              ...cofficeData,
              distance: distance,
              id: doc.id
            });
          }
        }
      });
      
      // Sort by distance
      nearbyCoffices.sort((a, b) => a.distance - b.distance);
      
      console.log('✅ Found', nearbyCoffices.length, 'coffices within', radius, 'meters');
      return nearbyCoffices;
      
    } catch (error) {
      console.error('❌ Error fetching nearby coffices:', error);
      return [];
    }
  }
  
  // Calculate distance between two points (Haversine formula)
  calculateDistance(point1, point2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  // Migrate existing ratings to create coffices collection
  async migrateExistingRatings() {
    try {
      console.log('🔄 Starting migration of existing ratings to coffices collection...');
      
      const ratingsRef = collection(db, 'ratings');
      const querySnapshot = await getDocs(ratingsRef);
      
      if (querySnapshot.empty) {
        console.log('📭 No ratings to migrate');
        return;
      }
      
      console.log('📊 Found', querySnapshot.size, 'ratings to process');
      
      // Group ratings by placeId
      const placeGroups = {};
      
      querySnapshot.docs.forEach(doc => {
        const rating = doc.data();
        const placeId = rating.placeId;
        
        if (!placeGroups[placeId]) {
          placeGroups[placeId] = {
            ratings: [],
            placeId: placeId
          };
        }
        
        placeGroups[placeId].ratings.push(rating);
      });
      
      console.log('📋 Grouped into', Object.keys(placeGroups).length, 'unique places');
      
      // Get unique placeIds to fetch location data
      const uniquePlaceIds = Object.keys(placeGroups);
      console.log('🔍 Fetching location data for', uniquePlaceIds.length, 'places from Google Places API...');
      
      // Fetch place details for all unique places
      const placeDetails = await this.fetchPlaceDetailsForMigration(uniquePlaceIds);
      console.log('✅ Fetched details for', placeDetails.length, 'places');
      
      // Create coffice documents for each place
      const batch = writeBatch(db);
      let createdCount = 0;
      
      for (const [placeId, group] of Object.entries(placeGroups)) {
        const placeDetail = placeDetails.find(p => p.place_id === placeId);
        
        if (placeDetail && placeDetail.geometry?.location) {
          // Calculate averages from all ratings
          const averages = this.calculateAveragesFromRatings(group.ratings);
          
          const cofficeData = {
            placeId: placeId,
            name: placeDetail.name,
            vicinity: placeDetail.vicinity,
            geometry: {
              location: {
                lat: placeDetail.geometry.location.lat,
                lng: placeDetail.geometry.location.lng
              }
            },
            // Store main image in Firebase Storage if available
            mainImageUrl: placeDetail.photos && placeDetail.photos.length > 0 ? 
              await this.downloadAndStoreImage(placeDetail.photos[0].photo_reference, placeId, 400, 300) : null,
            totalRatings: group.ratings.length,
            averageRatings: averages,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          const cofficeRef = doc(db, 'coffices', placeId);
          batch.set(cofficeRef, cofficeData);
          createdCount++;
          console.log('✅ Created coffice for:', placeDetail.name);
        } else {
          console.log('⚠️ Skipping place without location data:', placeId);
        }
      }
      
      await batch.commit();
      console.log('✅ Successfully migrated', createdCount, 'coffices');
      
    } catch (error) {
      console.error('❌ Error migrating ratings:', error);
      throw error;
    }
  }
  
  // Fetch place details for migration using Google Places API
  async fetchPlaceDetailsForMigration(placeIds) {
    try {
      console.log('🔍 Fetching place details for migration...');
      
      // Import placesApiService properly
      const placesApiService = (await import('./placesApiService')).default;
      
      // Fetch details in batches to avoid rate limits
      const batchSize = 5;
      const allPlaceDetails = [];
      
      for (let i = 0; i < placeIds.length; i += batchSize) {
        const batch = placeIds.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(placeIds.length/batchSize)}`);
        
        try {
          const batchDetails = await placesApiService.batchGetPlaceDetails(
            batch, 
            'name,geometry,vicinity,formatted_address,place_id,photos'
          );
          allPlaceDetails.push(...batchDetails);
          
          // Add delay between batches to respect rate limits
          if (i + batchSize < placeIds.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          console.error('❌ Error fetching batch:', error);
        }
      }
      
      return allPlaceDetails;
      
    } catch (error) {
      console.error('❌ Error fetching place details:', error);
      throw error;
    }
  }
  
  // Update existing coffices with photos
  async updateCofficesWithPhotos() {
    try {
      console.log('🖼️ Starting photo update for existing coffices...');
      
      // Get all coffices from the collection
      const cofficesRef = collection(db, 'coffices');
      const querySnapshot = await getDocs(cofficesRef);
      
      if (querySnapshot.empty) {
        console.log('📭 No coffices found to update');
        return { updated: 0, total: 0 };
      }
      
      console.log('📊 Found', querySnapshot.size, 'coffices to check for photos');
      
      const cofficesToUpdate = [];
      querySnapshot.docs.forEach(doc => {
        const cofficeData = doc.data();
        // Check if coffice doesn't have photos, has empty photos array, or photos without URLs
        const hasValidPhotos = cofficeData.photos && 
          cofficeData.photos.length > 0 && 
          cofficeData.photos.some(photo => photo.url);
        
        if (!hasValidPhotos) {
          cofficesToUpdate.push({
            id: doc.id,
            placeId: cofficeData.placeId
          });
        }
      });
      
      if (cofficesToUpdate.length === 0) {
        console.log('✅ All coffices already have photos');
        return { updated: 0, total: querySnapshot.size };
      }
      
      console.log('🖼️ Found', cofficesToUpdate.length, 'coffices that need photos');
      
      // Fetch place details with photos
      const placeIds = cofficesToUpdate.map(coffice => coffice.placeId);
      const placeDetails = await this.fetchPlaceDetailsForMigration(placeIds);
      
      // Update coffices with photos
      const batch = writeBatch(db);
      let updatedCount = 0;
      
      for (const coffice of cofficesToUpdate) {
        const placeDetail = placeDetails.find(p => p.place_id === coffice.placeId);
        
        if (placeDetail && placeDetail.photos && placeDetail.photos.length > 0) {
          // Download and store the main image
          const mainImageUrl = await this.downloadAndStoreImage(
            placeDetail.photos[0].photo_reference, 
            coffice.placeId, 
            400, 
            300
          );
          
          const cofficeRef = doc(db, 'coffices', coffice.id);
          batch.update(cofficeRef, {
            mainImageUrl: mainImageUrl,
            lastUpdated: new Date().toISOString()
          });
          
          updatedCount++;
          console.log('✅ Updated photos for:', placeDetail.name);
        }
      }
      
      await batch.commit();
      console.log('✅ Successfully updated', updatedCount, 'coffices with photos');
      
      return { updated: updatedCount, total: querySnapshot.size };
      
    } catch (error) {
      console.error('❌ Error updating coffices with photos:', error);
      throw error;
    }
  }

  // Clean up old photo references from coffices collection
  async cleanupPhotoReferences() {
    try {
      console.log('🧹 Starting cleanup of old photo references...');
      
      const cofficesRef = collection(db, 'coffices');
      const querySnapshot = await getDocs(cofficesRef);
      
      if (querySnapshot.empty) {
        console.log('📭 No coffices found to clean up');
        return { cleaned: 0, total: 0 };
      }
      
      console.log('📊 Found', querySnapshot.size, 'coffices to check for cleanup');
      
      const cofficesToClean = [];
      querySnapshot.docs.forEach(doc => {
        const cofficeData = doc.data();
        // Check if coffice has old photos array that needs to be removed
        if (cofficeData.photos && Array.isArray(cofficeData.photos)) {
          cofficesToClean.push({
            id: doc.id,
            name: cofficeData.name || 'Unknown'
          });
        }
      });
      
      if (cofficesToClean.length === 0) {
        console.log('✅ No old photo references found to clean up');
        return { cleaned: 0, total: querySnapshot.size };
      }
      
      console.log('🧹 Found', cofficesToClean.length, 'coffices with old photo references to clean');
      
      // Clean up in batches
      const batch = writeBatch(db);
      let cleanedCount = 0;
      
      for (const coffice of cofficesToClean) {
        const cofficeRef = doc(db, 'coffices', coffice.id);
        batch.update(cofficeRef, {
          photos: deleteField(),
          lastUpdated: new Date().toISOString()
        });
        
        cleanedCount++;
        console.log('🧹 Cleaned up photos for:', coffice.name);
      }
      
      await batch.commit();
      console.log('✅ Successfully cleaned up', cleanedCount, 'coffices');
      
      return { cleaned: cleanedCount, total: querySnapshot.size };
      
    } catch (error) {
      console.error('❌ Error cleaning up photo references:', error);
      throw error;
    }
  }

  // Download and store image in Firebase Storage via Firebase Function
  async downloadAndStoreImage(photoReference, placeId, maxWidth = 400, maxHeight = 300) {
    try {
      if (!photoReference) {
        console.log('⚠️ No photo reference provided');
        return null;
      }
      
      console.log('🖼️ Starting downloadAndStoreImage for placeId:', placeId);
      console.log('📸 Parameters:', { photoReference, placeId, maxWidth, maxHeight });
      
      const functions = getFunctions();
      const downloadAndStoreImage = httpsCallable(functions, 'downloadAndStoreImage');
      
      console.log('📞 Calling Firebase Function downloadAndStoreImage...');
      
      const result = await downloadAndStoreImage({
        photoReference,
        placeId,
        maxWidth,
        maxHeight
      });
      
      console.log('📥 Firebase Function response received:', result);
      console.log('📊 Response data:', result.data);
      
      const { imageUrl } = result.data;
      console.log('✅ Image stored in Firebase Storage:', imageUrl);
      
      return imageUrl;
      
    } catch (error) {
      console.error('❌ Error in downloadAndStoreImage:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return null;
    }
  }

  // Download and store image from a direct URL in Firebase Storage
  async downloadAndStoreImageFromUrl(imageUrl, placeId) {
    try {
      if (!imageUrl) {
        console.log('⚠️ No image URL provided for direct download');
        return null;
      }

      console.log('🖼️ Starting downloadAndStoreImageFromUrl for placeId:', placeId);
      console.log('📸 Image URL:', imageUrl);

      const functions = getFunctions();
      const downloadAndStoreImage = httpsCallable(functions, 'downloadAndStoreImageFromUrl');

      console.log('📞 Calling Firebase Function downloadAndStoreImageFromUrl...');

      const result = await downloadAndStoreImage({
        imageUrl,
        placeId
      });

      console.log('📥 Firebase Function response received:', result);
      console.log('📊 Response data:', result.data);

      const { imageUrl: storedImageUrl } = result.data;
      console.log('✅ Image stored in Firebase Storage from URL:', storedImageUrl);

      return storedImageUrl;

    } catch (error) {
      console.error('❌ Error in downloadAndStoreImageFromUrl:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return null;
    }
  }

  // Generate photo URL from photo reference (legacy method)
  generatePhotoUrl(photoReference, maxWidth = 400, maxHeight = 300) {
    if (!photoReference) return null;
    
    // Google Places Photo API URL format
    const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ No Google Places API key found for photo URLs');
      return null;
    }
    
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&maxheight=${maxHeight}&photo_reference=${photoReference}&key=${apiKey}`;
  }

  // Calculate averages from an array of ratings
  calculateAveragesFromRatings(ratings) {
    const categories = ['wifi', 'power', 'noise', 'coffee'];
    const totals = {};
    const counts = {};
    
    // Initialize
    categories.forEach(category => {
      totals[category] = 0;
      counts[category] = 0;
    });
    
    // Sum up all ratings
    ratings.forEach(rating => {
      categories.forEach(category => {
        if (typeof rating[category] === 'number') {
          totals[category] += rating[category];
          counts[category]++;
        }
      });
    });
    
    // Calculate averages
    const averages = {};
    categories.forEach(category => {
      averages[category] = counts[category] > 0 ? totals[category] / counts[category] : 0;
    });
    
    return averages;
  }
}

// Create and export a singleton instance
const cofficesService = new CofficesService();
export default cofficesService; 