import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { components } from '../styles';
import colors from '../styles/colors';

function Header({ user, onSignInClick, setUser }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) {
        setProfileData(null);
        return;
      }

      setLoading(true);
      try {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          setProfileData(profileDoc.data());
        } else {
          setProfileData(null);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.uid]);

  const displayName = useMemo(() => {
    // Priority: Firestore profile data > Firebase Auth displayName > email > Guest
    if (profileData?.displayName) return profileData.displayName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Guest';
  }, [profileData?.displayName, user?.displayName, user?.email]);

  return (
    <header style={components.header.container}>
      <div style={components.header.leftSection}>
        <h1 style={components.header.title}>Find a Coffice!</h1>
      </div>
      
      <div style={components.header.rightSection}>
        {user && (
          <div style={components.header.userInfo}>
            <span style={components.header.statusDot} />
            <span style={components.header.userName}>
              <Link 
                to="/profile" 
                style={{ 
                  ...components.header.userNameLink,
                  color: colors.primary.main,
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Hi, {displayName}!
              </Link>
            </span>
          </div>
        )}
        {!user && (
          <button
            onClick={onSignInClick}
            style={components.header.authButton}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

export default Header; 