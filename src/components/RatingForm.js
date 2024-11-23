import React, { useState } from 'react';
import { 
  Box, 
  Rating, 
  Button, 
  Stack,
  Typography,
  TextField 
} from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import colors from '../styles/colors';

function RatingForm({ placeId, userId, onSubmit, onCancel }) {
  const [ratings, setRatings] = useState({
    wifi: 0,
    power: 0,
    noise: 0,
    coffee: 0
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ratings
    if (!ratings.wifi || !ratings.power || !ratings.noise || !ratings.coffee) {
      alert('Please provide all ratings');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create document ID by combining placeId and userId
      const docId = `${placeId}_${userId}`;
      
      // Prepare rating data
      const ratingData = {
        placeId,
        userId,
        wifi: ratings.wifi,
        power: ratings.power,
        noise: ratings.noise,
        coffee: ratings.coffee,
        comment: comment.trim(),
        timestamp: new Date().toISOString()
      };

      // Save to Firestore
      await setDoc(doc(db, 'ratings', docId), ratingData);
      
      // Call the onSubmit callback
      onSubmit();
    } catch (error) {
      console.error('Error saving rating:', error);
      alert('Failed to save rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={0.5} sx={styles.ratingsContainer}>
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="body2" sx={styles.label}>WiFi</Typography>
            <Rating
              name="wifi"
              value={ratings.wifi}
              onChange={(e, value) => setRatings(prev => ({ ...prev, wifi: value }))}
              size="small"
              sx={styles.rating}
            />
          </Stack>

          <Stack spacing={0.5} alignItems="center">
            <Typography variant="body2" sx={styles.label}>Power</Typography>
            <Rating
              name="power"
              value={ratings.power}
              onChange={(e, value) => setRatings(prev => ({ ...prev, power: value }))}
              size="small"
              sx={styles.rating}
            />
          </Stack>

          <Stack spacing={0.5} alignItems="center">
            <Typography variant="body2" sx={styles.label}>Noise</Typography>
            <Rating
              name="noise"
              value={ratings.noise}
              onChange={(e, value) => setRatings(prev => ({ ...prev, noise: value }))}
              size="small"
              sx={styles.rating}
            />
          </Stack>

          <Stack spacing={0.5} alignItems="center">
            <Typography variant="body2" sx={styles.label}>Coffee</Typography>
            <Rating
              name="coffee"
              value={ratings.coffee}
              onChange={(e, value) => setRatings(prev => ({ ...prev, coffee: value }))}
              size="small"
              sx={styles.rating}
            />
          </Stack>
        </Stack>

        <TextField
          multiline
          rows={2}
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          size="small"
          sx={styles.comment}
        />

        <Stack direction="row" spacing={1} sx={styles.buttons}>
          <Button 
            type="button" 
            onClick={onCancel}
            variant="outlined"
            size="small"
            sx={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            size="small"
            sx={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

const styles = {
  form: {
    mt: 2,
    p: 2,
    backgroundColor: colors.background.overlay,
    borderRadius: 1,
  },
  ratingsContainer: {
    justifyContent: 'space-between',
    px: 0.5,
    width: '100%',
  },
  label: {
    color: colors.text.secondary,
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
  },
  comment: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: colors.background.paper,
      fontSize: '0.875rem',
      '& fieldset': {
        borderColor: colors.border,
      },
      '&:hover fieldset': {
        borderColor: colors.primary.light,
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.primary.main,
      },
    },
  },
  buttons: {
    justifyContent: 'flex-end',
  },
  cancelButton: {
    color: colors.text.secondary,
    borderColor: colors.text.secondary,
    '&:hover': {
      borderColor: colors.text.primary,
      backgroundColor: 'transparent',
    },
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    color: colors.background.paper,
    '&:hover': {
      backgroundColor: colors.primary.dark,
    },
  },
  rating: {
    '& .MuiRating-icon': {
      marginRight: '-2px',
    }
  },
};

export default RatingForm; 