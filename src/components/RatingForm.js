import React, { useState, useEffect } from 'react';
import { Box, Typography, Rating, Stack, Button, TextField } from '@mui/material';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import colors from '../styles/colors';
import cofficesService from '../services/cofficesService';
import analyticsService from '../services/analyticsService';

function RatingForm({ placeId, place, user, onSubmit, onCancel }) {
  const [ratings, setRatings] = useState({
    wifi: 0,
    power: 0,
    noise: 0,
    coffee: 0
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStartTime] = useState(Date.now());

  // Track form start
  useEffect(() => {
    analyticsService.trackRatingFormStarted(placeId, place?.name);
    analyticsService.trackJourneyStep('rating_form_opened', {
      place_id: placeId,
      place_name: place?.name
    });
  }, [placeId, place?.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ratings
    if (!ratings.wifi || !ratings.power || !ratings.noise || !ratings.coffee) {
      alert('Please provide all ratings');
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log('📝 Starting rating submission for placeId:', placeId);
      console.log('📍 Place data:', {
        name: place?.name,
        placeId: place?.place_id,
        hasPhotos: !!place?.photos,
        photoCount: place?.photos?.length || 0
      });
      console.log('⭐ Rating data:', ratings);
      
      const docId = `${user.uid}_${placeId}`;
      const ratingData = {
        userId: user.uid,
        placeId: placeId,
        placeName: place?.name || '',
        wifi: ratings.wifi,
        power: ratings.power,
        noise: ratings.noise,
        coffee: ratings.coffee,
        comment: comment.trim(),
        timestamp: new Date().toISOString()
      };

      // Check if this is a new rating (not updating existing)
      const existingRatingRef = doc(db, 'ratings', docId);
      const existingRatingDoc = await getDoc(existingRatingRef);
      const isNewRating = !existingRatingDoc.exists();
      
      console.log('🆕 Is this a new rating?', isNewRating);

      // Step 1: Create/update coffice document with location data and aggregated ratings
      if (place) {
        console.log('🏢 Creating/updating coffice document...');
        await cofficesService.createOrUpdateCoffice(place, ratingData);
        console.log('✅ Coffice document created/updated successfully');
      } else {
        console.log('⚠️ No place data available for coffice creation');
      }

      // Step 2: Save the individual rating
      console.log('💾 Saving individual rating...');
      await setDoc(doc(db, 'ratings', docId), ratingData);
      console.log('✅ Individual rating saved successfully');

      // If this is a new rating, increment the user's rated coffices count
      if (isNewRating) {
        console.log('👤 Updating user profile with new rating count...');
        const profileRef = doc(db, 'profiles', user.uid);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          const currentCount = profileDoc.data().ratedCofficesCount || 0;
          await updateDoc(profileRef, {
            ratedCofficesCount: currentCount + 1,
            updatedAt: new Date().toISOString()
          });
          console.log('✅ User profile updated');
        }
      }
      
      console.log('🎉 Rating submission completed successfully!');
      
      // Track successful submission
      analyticsService.trackRatingSubmitted(placeId, place?.name, isNewRating, ratings);
      if (isNewRating) {
        analyticsService.trackFirstRatingSubmitted(placeId, place?.name);
      }
      analyticsService.trackJourneyStep('rating_submitted', {
        place_id: placeId,
        place_name: place?.name,
        is_new_rating: isNewRating,
        rating_values: ratings
      });
      
      // Call the onSubmit callback
      onSubmit();
    } catch (error) {
      console.error('❌ Error saving rating:', error);
      analyticsService.trackRatingSubmissionError(placeId, error.message);
      analyticsService.trackError('rating_submission_error', error.message, {
        place_id: placeId,
        place_name: place?.name
      });
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
            onClick={() => {
              const timeSpent = Date.now() - formStartTime;
              analyticsService.trackDropoff('rating_form_abandoned', {
                place_id: placeId,
                place_name: place?.name,
                time_spent: timeSpent,
                form_progress: Object.values(ratings).filter(r => r > 0).length
              });
              onCancel();
            }}
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
    backgroundColor: colors.background.overlay,
    padding: 2,
    borderRadius: 2,
    width: '100%',
    mx: 'auto',
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
    },
    '& .MuiRating-iconFilled': {
      color: colors.primary.main,
    },
    '& .MuiRating-iconHover': {
      color: colors.primary.light,
    }
  },
};

export default RatingForm; 