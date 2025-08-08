import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import colors from '../../styles/colors';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState(null);

  // Fetch all users from profiles collection
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'profiles'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
  };

  const handleSaveUser = async () => {
    try {
      const userRef = doc(db, 'profiles', editingUser.id);
      await updateDoc(userRef, {
        displayName: editingUser.displayName,
        userType: editingUser.userType,
        isDisabled: editingUser.isDisabled,
        updatedAt: new Date().toISOString()
      });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteDoc(doc(db, 'profiles', deleteConfirm.id));
      setDeleteConfirm(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  const getRoleColor = (userType) => {
    switch (userType) {
      case 'admin': return 'error';
      case 'moderator': return 'warning';
      case 'regular': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (isDisabled) => {
    return isDisabled ? 'error' : 'success';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: colors.background.paper }}>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {user.photoURL && (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        style={{ width: 32, height: 32, borderRadius: '50%' }}
                      />
                    )}
                    <Typography variant="body2">
                      {user.displayName || 'No name'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email || 'No email'}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.userType || 'regular'} 
                    color={getRoleColor(user.userType)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.isDisabled ? 'Disabled' : 'Active'} 
                    color={getStatusColor(user.isDisabled)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => setViewingUser(user)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditUser(user)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => setDeleteConfirm(user)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onClose={() => setEditingUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Display Name"
              value={editingUser?.displayName || ''}
              onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editingUser?.userType || 'regular'}
                onChange={(e) => setEditingUser({ ...editingUser, userType: e.target.value })}
                label="User Type"
              >
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={editingUser?.isDisabled || false}
                  onChange={(e) => setEditingUser({ ...editingUser, isDisabled: e.target.checked })}
                />
              }
              label="Disable Account"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingUser(null)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onClose={() => setViewingUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {viewingUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {viewingUser.photoURL && (
                  <img 
                    src={viewingUser.photoURL} 
                    alt="Profile" 
                    style={{ width: 64, height: 64, borderRadius: '50%' }}
                  />
                )}
                <Box>
                  <Typography variant="h6">{viewingUser.displayName || 'No name'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {viewingUser.email || 'No email'}
                  </Typography>
                </Box>
              </Box>
                              <Box>
                  <Typography variant="subtitle2">User Type</Typography>
                  <Chip label={viewingUser.userType || 'regular'} color={getRoleColor(viewingUser.userType)} />
                </Box>
              <Box>
                <Typography variant="subtitle2">Status</Typography>
                <Chip 
                  label={viewingUser.isDisabled ? 'Disabled' : 'Active'} 
                  color={getStatusColor(viewingUser.isDisabled)}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2">Joined</Typography>
                <Typography variant="body2">
                  {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString() : 'Unknown'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Last Updated</Typography>
                <Typography variant="body2">
                  {viewingUser.updatedAt ? new Date(viewingUser.updatedAt).toLocaleString() : 'Never'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Rated Coffices</Typography>
                <Typography variant="body2">
                  {viewingUser.ratedCofficesCount || 0} coffices rated
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{deleteConfirm?.displayName || deleteConfirm?.email}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
