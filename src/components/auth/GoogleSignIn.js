import { signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { useEffect } from 'react';

export const handleGoogleSignIn = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google:", error);
  }
};

// Add this useEffect in your App.js or main component
useEffect(() => {
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        // Handle successful sign-in
        console.log("Successfully signed in:", result.user);
      }
    })
    .catch((error) => {
      console.error("Error completing sign-in:", error);
    });
}, []);