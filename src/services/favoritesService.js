import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import analyticsService from './analyticsService';

class FavoritesService {
  async checkFavoriteStatus(userId, placeId) {
    if (!userId || !placeId) return false;
    
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        const favoriteCoffices = profileData.favoriteCoffices || [];
        return favoriteCoffices.includes(placeId);
      }
      return false;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  async addToFavorites(userId, placeId, placeName) {
    if (!userId || !placeId) return false;
    
    try {
      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, {
        favoriteCoffices: arrayUnion(placeId)
      });
      
      analyticsService.trackFavoriteAdded(placeId, placeName);
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }

  async removeFromFavorites(userId, placeId, placeName) {
    if (!userId || !placeId) return false;
    
    try {
      const profileRef = doc(db, 'profiles', userId);
      await updateDoc(profileRef, {
        favoriteCoffices: arrayRemove(placeId)
      });
      
      analyticsService.trackFavoriteRemoved(placeId, placeName);
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }

  async toggleFavorite(userId, placeId, placeName, currentStatus) {
    if (currentStatus) {
      return await this.removeFromFavorites(userId, placeId, placeName);
    } else {
      return await this.addToFavorites(userId, placeId, placeName);
    }
  }

  async getFavorites(userId) {
    if (!userId) return [];
    
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        return profileData.favoriteCoffices || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }
}

const favoritesService = new FavoritesService();
export default favoritesService;
