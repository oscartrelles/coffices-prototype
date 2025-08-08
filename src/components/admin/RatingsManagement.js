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
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import colors from '../../styles/colors';

const RatingsManagement = ({ userType }) => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRating, setEditingRating] = useState(null);
  const [viewingRating, setViewingRating] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Fetch all ratings from ratings collection
  const fetchRatings = async () => {
    try {
      setLoading(true);
      const ratingsQuery = query(collection(db, 'ratings'), orderBy('timestamp', 'desc'));
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratingsList = ratingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRatings(ratingsList);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setError('Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const handleEditRating = (rating) => {
    setEditingRating({ ...rating });
  };

  const handleSaveRating = async () => {
    try {
      const ratingRef = doc(db, 'ratings', editingRating.id);
      await updateDoc(ratingRef, {
        wifi: editingRating.wifi,
        power: editingRating.power,
        noise: editingRating.noise,
        coffee: editingRating.coffee,
        comment: editingRating.comment,
        updatedAt: new Date().toISOString(),
        updatedBy: userType
      });
      setEditingRating(null);
      fetchRatings();
    } catch (error) {
      console.error('Error updating rating:', error);
      setError('Failed to update rating');
    }
  };

  const handleDeleteRating = async () => {
    try {
      await deleteDoc(doc(db, 'ratings', deleteConfirm.id));
      setDeleteConfirm(null);
      fetchRatings();
    } catch (error) {
      console.error('Error deleting rating:', error);
      setError('Failed to delete rating');
    }
  };

  const getAverageRating = (rating) => {
    if (!rating.wifi || !rating.power || !rating.coffee) return 'N/A';
    const avg = (rating.wifi + rating.power + rating.coffee) / 3;
    return avg.toFixed(1);
  };

  const filteredRatings = ratings.filter(rating => {
    if (filter === 'all') return true;
    if (filter === 'recent') {
      const ratingDate = new Date(rating.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return ratingDate > weekAgo;
    }
    if (filter === 'high') {
      const avg = getAverageRating(rating);
      return avg !== 'N/A' && parseFloat(avg) >= 4;
    }
    if (filter === 'low') {
      const avg = getAverageRating(rating);
      return avg !== 'N/A' && parseFloat(avg) <= 2;
    }
    return true;
  });

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
        Ratings Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="Filter"
            size="small"
          >
            <MenuItem value="all">All Ratings</MenuItem>
            <MenuItem value="recent">Recent (7 days)</MenuItem>
            <MenuItem value="high">High Ratings (4+ stars)</MenuItem>
            <MenuItem value="low">Low Ratings (2- stars)</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredRatings.length} of {ratings.length} ratings
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: colors.background.paper }}>
              <TableCell>User</TableCell>
              <TableCell>Coffice</TableCell>
              <TableCell>Ratings</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRatings.map((rating) => (
              <TableRow key={rating.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {rating.userId || 'Unknown'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {rating.placeName || 'Unknown'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption">WiFi:</Typography>
                      <Rating value={rating.wifi || 0} size="small" readOnly />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption">Power:</Typography>
                      <Rating value={rating.power || 0} size="small" readOnly />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption">Coffee:</Typography>
                      <Rating value={rating.coffee || 0} size="small" readOnly />
                    </Box>
                    <Chip 
                      label={`${getAverageRating(rating)}/5 avg`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ 
                    maxWidth: 200, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {rating.comment || 'No comment'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {rating.timestamp ? new Date(rating.timestamp).toLocaleDateString() : 'Unknown'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => setViewingRating(rating)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditRating(rating)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => setDeleteConfirm(rating)}
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

      {/* Edit Rating Dialog */}
      <Dialog open={!!editingRating} onClose={() => setEditingRating(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Rating</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Coffice</Typography>
              <Typography variant="body2">{editingRating?.placeName}</Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>WiFi Rating</Typography>
              <Rating
                value={editingRating?.wifi || 0}
                onChange={(event, newValue) => {
                  setEditingRating({ ...editingRating, wifi: newValue });
                }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Power Rating</Typography>
              <Rating
                value={editingRating?.power || 0}
                onChange={(event, newValue) => {
                  setEditingRating({ ...editingRating, power: newValue });
                }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Noise Rating</Typography>
              <Rating
                value={editingRating?.noise || 0}
                onChange={(event, newValue) => {
                  setEditingRating({ ...editingRating, noise: newValue });
                }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Coffee Rating</Typography>
              <Rating
                value={editingRating?.coffee || 0}
                onChange={(event, newValue) => {
                  setEditingRating({ ...editingRating, coffee: newValue });
                }}
              />
            </Box>

            <TextField
              label="Comment"
              value={editingRating?.comment || ''}
              onChange={(e) => setEditingRating({ ...editingRating, comment: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingRating(null)}>Cancel</Button>
          <Button onClick={handleSaveRating} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Rating Dialog */}
      <Dialog open={!!viewingRating} onClose={() => setViewingRating(null)} maxWidth="md" fullWidth>
        <DialogTitle>Rating Details</DialogTitle>
        <DialogContent>
          {viewingRating && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">User ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {viewingRating.userId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Place ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {viewingRating.placeId}
                  </Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2">Coffice</Typography>
                <Typography variant="h6">{viewingRating.placeName}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Ratings</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">WiFi</Typography>
                    <Rating value={viewingRating.wifi || 0} readOnly />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Power</Typography>
                    <Rating value={viewingRating.power || 0} readOnly />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Noise</Typography>
                    <Rating value={viewingRating.noise || 0} readOnly />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Coffee</Typography>
                    <Rating value={viewingRating.coffee || 0} readOnly />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={`${getAverageRating(viewingRating)}/5 average`}
                    color="primary"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2">Comment</Typography>
                <Typography variant="body2">
                  {viewingRating.comment || 'No comment provided'}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Created</Typography>
                  <Typography variant="body2">
                    {viewingRating.timestamp ? new Date(viewingRating.timestamp).toLocaleString() : 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Last Updated</Typography>
                  <Typography variant="body2">
                    {viewingRating.updatedAt ? new Date(viewingRating.updatedAt).toLocaleString() : 'Never'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingRating(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this rating for "{deleteConfirm?.placeName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteRating} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RatingsManagement;
