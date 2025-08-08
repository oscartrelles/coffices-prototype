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
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import colors from '../../styles/colors';

const CofficeManagement = () => {
  const [coffices, setCoffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCoffice, setEditingCoffice] = useState(null);
  const [viewingCoffice, setViewingCoffice] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState(null);

  // Fetch all coffices from coffices collection
  const fetchCoffices = async () => {
    try {
      setLoading(true);
      const cofficesQuery = query(collection(db, 'coffices'), orderBy('lastUpdated', 'desc'));
      const cofficesSnapshot = await getDocs(cofficesQuery);
      const cofficesList = cofficesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCoffices(cofficesList);
    } catch (error) {
      console.error('Error fetching coffices:', error);
      setError('Failed to fetch coffices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoffices();
  }, []);

  const handleEditCoffice = (coffice) => {
    setEditingCoffice({ ...coffice });
  };

  const handleSaveCoffice = async () => {
    try {
      const cofficeRef = doc(db, 'coffices', editingCoffice.id);
      await updateDoc(cofficeRef, {
        name: editingCoffice.name,
        vicinity: editingCoffice.vicinity,
        lastUpdated: new Date().toISOString()
      });
      setEditingCoffice(null);
      fetchCoffices();
    } catch (error) {
      console.error('Error updating coffice:', error);
      setError('Failed to update coffice');
    }
  };

  const handleDeleteCoffice = async () => {
    try {
      await deleteDoc(doc(db, 'coffices', deleteConfirm.id));
      setDeleteConfirm(null);
      fetchCoffices();
    } catch (error) {
      console.error('Error deleting coffice:', error);
      setError('Failed to delete coffice');
    }
  };

  const getAverageRating = (ratings) => {
    if (!ratings || !ratings.wifi || !ratings.power || !ratings.coffee) return 'N/A';
    const avg = (ratings.wifi + ratings.power + ratings.coffee) / 3;
    return avg.toFixed(1);
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
        Coffice Management
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
              <TableCell>Coffice</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Ratings</TableCell>
              <TableCell>Total Reviews</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coffices.map((coffice) => (
              <TableRow key={coffice.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {coffice.mainImageUrl && (
                      <img 
                        src={coffice.mainImageUrl} 
                        alt={coffice.name}
                        style={{ width: 40, height: 30, borderRadius: 4, objectFit: 'cover' }}
                      />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {coffice.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{coffice.vicinity}</TableCell>
                <TableCell>
                  <Chip 
                    label={`${getAverageRating(coffice.averageRatings)}/5`}
                    color={getAverageRating(coffice.averageRatings) !== 'N/A' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={coffice.totalRatings || 0}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {coffice.lastUpdated ? new Date(coffice.lastUpdated).toLocaleDateString() : 'Unknown'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => setViewingCoffice(coffice)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditCoffice(coffice)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => setDeleteConfirm(coffice)}
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

      {/* Edit Coffice Dialog */}
      <Dialog open={!!editingCoffice} onClose={() => setEditingCoffice(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Coffice</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              value={editingCoffice?.name || ''}
              onChange={(e) => setEditingCoffice({ ...editingCoffice, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Location"
              value={editingCoffice?.vicinity || ''}
              onChange={(e) => setEditingCoffice({ ...editingCoffice, vicinity: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingCoffice(null)}>Cancel</Button>
          <Button onClick={handleSaveCoffice} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Coffice Dialog */}
      <Dialog open={!!viewingCoffice} onClose={() => setViewingCoffice(null)} maxWidth="md" fullWidth>
        <DialogTitle>Coffice Details</DialogTitle>
        <DialogContent>
          {viewingCoffice && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {viewingCoffice.mainImageUrl && (
                  <CardMedia
                    component="img"
                    image={viewingCoffice.mainImageUrl}
                    alt={viewingCoffice.name}
                    sx={{ width: 200, height: 150, borderRadius: 1, objectFit: 'cover' }}
                  />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{viewingCoffice.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {viewingCoffice.vicinity}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Average Rating</Typography>
                      <Chip 
                        label={`${getAverageRating(viewingCoffice.averageRatings)}/5`}
                        color="primary"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Total Reviews</Typography>
                      <Typography variant="body2">{viewingCoffice.totalRatings || 0}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              {viewingCoffice.averageRatings && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Detailed Ratings</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2">WiFi</Typography>
                      <Chip 
                        label={`${viewingCoffice.averageRatings.wifi?.toFixed(1) || 'N/A'}/5`}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">Power</Typography>
                      <Chip 
                        label={`${viewingCoffice.averageRatings.power?.toFixed(1) || 'N/A'}/5`}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">Coffee</Typography>
                      <Chip 
                        label={`${viewingCoffice.averageRatings.coffee?.toFixed(1) || 'N/A'}/5`}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2">Place ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {viewingCoffice.placeId}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2">Last Updated</Typography>
                <Typography variant="body2">
                  {viewingCoffice.lastUpdated ? new Date(viewingCoffice.lastUpdated).toLocaleString() : 'Unknown'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingCoffice(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteConfirm?.name}"? 
            This will remove all associated ratings and data. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteCoffice} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CofficeManagement;
