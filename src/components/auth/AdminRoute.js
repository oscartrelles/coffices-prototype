import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { Box, CircularProgress, Alert, Container } from '@mui/material';

const AdminRoute = ({ children, requiredRole = 'admin' }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    }, (error) => {
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkUserType = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'profiles', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserType(userData.userType || 'regular');
          } else {
            setUserType('regular');
          }
        } catch (error) {
          console.error('Error checking user type:', error);
          setUserType('regular');
        }
      }
      setIsLoadingRole(false);
    };

    checkUserType();
  }, [user]);

  if (loading || isLoadingRole) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading admin interface: {error.message}
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user has required role
  const hasRequiredRole = requiredRole === 'admin' 
    ? userType === 'admin' 
    : userType === 'admin' || userType === 'moderator';

  if (!hasRequiredRole) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          You don't have permission to access this page. Required role: {requiredRole}
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
