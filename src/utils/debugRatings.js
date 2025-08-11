// Debug utility to inspect ratings data structure
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const debugRatings = async () => {
  try {
  
    
    const ratingsRef = collection(db, 'ratings');
    const querySnapshot = await getDocs(ratingsRef);
    
    console.log(`📊 Found ${querySnapshot.size} ratings`);
    
    if (querySnapshot.empty) {
      console.log('📭 No ratings found');
      return;
    }
    
    // Log first few ratings to see their structure
    console.log('📋 Sample ratings data:');
    querySnapshot.docs.slice(0, 3).forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n--- Rating ${index + 1} ---`);
      console.log('Document ID:', doc.id);
      console.log('All fields:', Object.keys(data));
      console.log('Full data:', JSON.stringify(data, null, 2));
    });
    
    // Check for location data
    let hasLocationData = 0;
    let missingLocationData = 0;
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.placeLat && data.placeLng) {
        hasLocationData++;
      } else {
        missingLocationData++;
      }
    });
    
    console.log(`\n📍 Location Data Summary:`);
    console.log(`  ✅ With location data: ${hasLocationData}`);
    console.log(`  ❌ Missing location data: ${missingLocationData}`);
    
  } catch (error) {
    console.error('❌ Error debugging ratings:', error);
  }
}; 