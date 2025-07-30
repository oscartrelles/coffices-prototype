// Migration utility to populate coffices collection from existing ratings
// This script should be run once to migrate existing data to the new structure

import cofficesService from '../services/cofficesService';

export const migrateToCofficesCollection = async () => {
  try {
    console.log('🔄 Starting migration to coffices collection...');
    
    // Run the migration
    await cofficesService.migrateExistingRatings();
    
    console.log('✅ Migration completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Function to check migration status
export const checkMigrationStatus = async () => {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebaseConfig');
    
    // Check ratings collection
    const ratingsRef = collection(db, 'ratings');
    const ratingsSnapshot = await getDocs(ratingsRef);
    
    // Check coffices collection
    const cofficesRef = collection(db, 'coffices');
    const cofficesSnapshot = await getDocs(cofficesRef);
    
    console.log('📊 Migration Status:');
    console.log(`  Ratings collection: ${ratingsSnapshot.size} documents`);
    console.log(`  Coffices collection: ${cofficesSnapshot.size} documents`);
    
    return {
      ratingsCount: ratingsSnapshot.size,
      cofficesCount: cofficesSnapshot.size,
      isMigrated: cofficesSnapshot.size > 0
    };
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    throw error;
  }
}; 