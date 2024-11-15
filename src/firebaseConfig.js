import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Create a persistent provider instance
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign-in process...');
    
    // Only set the prompt parameter
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    console.log('Initiating redirect...');
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
};

export const checkAuthRedirect = async () => {
  try {
    console.log('Checking redirect result...');
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log('Redirect successful:', result.user.email);
    }
    return result;
  } catch (error) {
    console.error('Redirect check error:', error);
    throw error;
  }
};