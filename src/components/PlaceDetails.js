import React, { useState, useEffect } from 'react';
import { Typography, Button, Box, IconButton, Tooltip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import { calculateDistance } from '../utils/distance';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import colors from '../styles/colors';
import RatingForm from './RatingForm';

function PlaceDetails({ place, userLocation, user, onSignInRequired, cofficeRatings, onClose }) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [userHasRated, setUserHasRated] = useState(false);

  // Check if user has already rated
  useEffect(() => {
    const checkUserRating = async () => {
      if (!user || !place.place_id) return;

      try {
        const ratingsRef = collection(db, 'ratings');
        const q = query(
          ratingsRef, 
          where('placeId', '==', place.place_id),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        setUserHasRated(!querySnapshot.empty);
      } catch (error) {
        console.error('Error checking user rating:', error);
      }
    };

    checkUserRating();
  }, [user, place.place_id]);

  const getDistance = () => {
    if (!userLocation || !place.geometry?.location) {
      return null;
    }

    const placeLocation = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    };

    return calculateDistance(userLocation, placeLocation);
  };

  const distance = getDistance();

  const handleRateClick = () => {
    if (!user) {
      onSignInRequired();
    } else {
      setShowRatingForm(true);
    }
  };

  const handleRatingSubmit = () => {
    setShowRatingForm(false);
    setUserHasRated(true);
  };

  return (
    <div style={styles.container}>
      <IconButton 
        onClick={() => {
          console.log('Close button clicked');
          onClose();
        }}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: colors.text.secondary
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="h6" sx={{ color: colors.text.primary }}>
          {place.name}
        </Typography>
        {cofficeRatings && (
          <Tooltip title="Verified Coffice" arrow>
            <VerifiedIcon 
              sx={{ 
                color: colors.primary.main,
                fontSize: '1.2rem'
              }} 
            />
          </Tooltip>
        )}
      </Box>

      <div style={styles.details}>
        <div style={styles.rating}>
          {cofficeRatings?.averageRatings ? (
            <>
              <div style={styles.ratingCategory}>
                <span>WiFi</span>
                <StarIcon style={styles.starIcon} />
                <span>{cofficeRatings.averageRatings.wifi?.toFixed(1)}</span>
              </div>
              <div style={styles.ratingCategory}>
                <span>Outlets</span>
                <StarIcon style={styles.starIcon} />
                <span>{cofficeRatings.averageRatings.power?.toFixed(1)}</span>
              </div>
              <div style={styles.ratingCategory}>
                <span>Noise</span>
                <StarIcon style={styles.starIcon} />
                <span>{cofficeRatings.averageRatings.noise?.toFixed(1)}</span>
              </div>
              <div style={styles.ratingCategory}>
                <span>Coffee</span>
                <StarIcon style={styles.starIcon} />
                <span>{cofficeRatings.averageRatings.coffee?.toFixed(1)}</span>
              </div>
              <span style={styles.ratingCount}>
                ({cofficeRatings.totalRatings} {cofficeRatings.totalRatings === 1 ? 'rating' : 'ratings'})
              </span>
            </>
          ) : (
            <>
              <StarIcon style={styles.starIcon} />
              <span>
                {place.rating ? `${place.rating.toFixed(1)} (${place.user_ratings_total})` : 'No rating'}
              </span>
            </>
          )}
        </div>

        <div style={styles.address}>
          <LocationOnIcon style={styles.locationIcon} />
          <span>{place.vicinity}</span>
        </div>

        {distance && (
          <div style={styles.distance}>
            <DirectionsWalkIcon style={styles.walkIcon} />
            <span>{(distance / 1000).toFixed(1)} km</span>
          </div>
        )}
      </div>

      {!user ? (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onSignInRequired}
          style={styles.rateButton}
        >
          Rate Coffice
        </Button>
      ) : !userHasRated && !showRatingForm ? (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleRateClick}
          style={styles.rateButton}
        >
          Rate Coffice
        </Button>
      ) : showRatingForm ? (
        <RatingForm 
          placeId={place.place_id}
          userId={user.uid}
          onSubmit={handleRatingSubmit}
          onCancel={() => setShowRatingForm(false)}
        />
      ) : null}
    </div>
  );
}

const styles = {
  container: {
    padding: '12px',
    backgroundColor: colors.background.paper,
    borderRadius: '4px',
    border: `1px solid ${colors.border}`,
    maxHeight: 'calc(80vh - 40px)',
    overflowY: 'auto',
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    color: colors.text.primary,
  },
  ratingCategory: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: colors.text.primary,
  },
  address: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: colors.text.secondary,
    fontSize: '0.9rem',
    marginBottom: '8px',
  },
  distance: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: colors.text.secondary,
  },
  starIcon: {
    color: colors.status.warning,
    fontSize: '20px',
  },
  locationIcon: {
    color: colors.text.secondary,
    fontSize: '20px',
  },
  walkIcon: {
    color: colors.text.secondary,
    fontSize: '20px',
  },
  ratingCount: {
    color: colors.text.disabled,
  },
  rateButton: {
    marginTop: '16px',
    backgroundColor: colors.primary.main,
    color: colors.background.paper,
    '&:hover': {
      backgroundColor: colors.primary.dark,
    }
  },
};

export default PlaceDetails; 