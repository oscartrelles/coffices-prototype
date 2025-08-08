import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper, 
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import UserManagement from './UserManagement';
import CofficeManagement from './CofficeManagement';
import RatingsManagement from './RatingsManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import colors from '../../styles/colors';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [user, loading, error] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Check if user has admin or moderator privileges
  const hasAdminAccess = userRole === 'admin' || userRole === 'moderator';
  const hasFullAdminAccess = userRole === 'admin';

  if (loading || isLoadingRole) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
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
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          You must be logged in to access the admin interface.
        </Alert>
      </Container>
    );
  }

  if (!hasAdminAccess) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          You don't have permission to access the admin interface. Required role: admin or moderator
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: colors.background.paper }}>
          <Typography variant="h4" sx={{ p: 3, pb: 1, color: colors.text.primary }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" sx={{ px: 3, pb: 2, color: colors.text.secondary }}>
            Welcome, {user.displayName || user.email} ({userRole})
          </Typography>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="admin tabs"
            sx={{ px: 3 }}
          >
            <Tab label="Analytics" />
            <Tab label="User Management" disabled={!hasFullAdminAccess} />
            <Tab label="Coffice Management" disabled={!hasFullAdminAccess} />
            <Tab label="Ratings Management" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AnalyticsDashboard userRole={userRole} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {hasFullAdminAccess ? (
            <UserManagement />
          ) : (
            <Alert severity="info">
              Only administrators can access user management.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {hasFullAdminAccess ? (
            <CofficeManagement />
          ) : (
            <Alert severity="info">
              Only administrators can access coffice management.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <RatingsManagement userRole={userRole} />
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default AdminDashboard;
