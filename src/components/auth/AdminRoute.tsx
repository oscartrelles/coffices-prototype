import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { Box, CircularProgress, Alert, Container } from '@mui/material';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'moderator';
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, requiredRole = 'admin' }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
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
    const checkUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'profiles', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || 'user');
          } else {
            setUserRole('user');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          setUserRole('user');
        }
      }
      setIsLoadingRole(false);
    };

    checkUserRole();
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
    ? userRole === 'admin' 
    : userRole === 'admin' || userRole === 'moderator';

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
