import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { getAnalytics, logEvent } from 'firebase/analytics';

// Environment detection
const isProduction = window.location.hostname === 'findacoffice.com';
const isStaging = window.location.hostname === 'find-a-coffice.web.app';

console.log('Environment detected:', {
  hostname: window.location.hostname,
  isProduction,
  isStaging
});

// Dynamic auth domain based on environment
const getAuthDomain = () => {
  if (isProduction) {
    return 'findacoffice.com';
  } else if (isStaging) {
    return 'find-a-coffice.web.app';
  } else {
    // Development - use the env variable
    return process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;
  }
};

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: getAuthDomain(),
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

console.log("About to initialize Firebase with config:", {
  authDomain: firebaseConfig.authDomain,
  environment: isProduction ? 'PRODUCTION' : isStaging ? 'STAGING' : 'DEVELOPMENT'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure auth settings based on environment
if (isProduction) {
  // Production settings
  auth.settings.appVerificationDisabledForTesting = false;
  console.log('Firebase Auth configured for PRODUCTION');
} else if (isStaging) {
  // Staging settings
  auth.settings.appVerificationDisabledForTesting = false;
  console.log('Firebase Auth configured for STAGING');
} else {
  // Development settings
  console.log('Firebase Auth configured for DEVELOPMENT');
}

export const db = getFirestore(app);
const analytics = getAnalytics(app);

// Create a persistent provider instance
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign-in process...', {
      environment: isProduction ? 'PRODUCTION' : isStaging ? 'STAGING' : 'DEVELOPMENT',
      hostname: window.location.hostname
    });
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Sign-in error:', error.message);
    throw error;
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('Sign-in successful:', result.user.email);
      return result;
    }
  } catch (error) {
    console.error('Redirect error:', error.message);
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Email sign-in successful:', result.user.email);
    return result;
  } catch (error) {
    console.error('Sign-in error:', error.message);
    throw error;
  }
};

export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Email sign-up successful:', result.user.email);
    return result;
  } catch (error) {
    console.error('Sign-up error:', error.message);
    throw error;
  }
};

export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  if (process.env.REACT_APP_FIREBASE_MEASUREMENT_ID) {
    logEvent(analytics, eventName, eventParams);
  }
};

export { analytics };