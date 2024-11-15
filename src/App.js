import React from "react";
import Map from "./Map";
import { useEffect, useState } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useLoadScript } from '@react-google-maps/api';
import CircularProgress from "@mui/material/CircularProgress";

const libraries = ['places'];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser?.email ?? 'No user');
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded || loading) return <CircularProgress />;

  return (
    <div className="App">
      <Map user={user} />
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          background: 'white',
          padding: 10,
          border: '1px solid #ccc',
          zIndex: 1000
        }}>
          Auth Status: {user ? `Logged in (${user.email})` : 'Not logged in'}
        </div>
      )}
    </div>
  );
}

export default App;

