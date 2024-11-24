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
import WifiIcon from '@mui/icons-material/Wifi';
import PowerIcon from '@mui/icons-material/Power';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CoffeeIcon from '@mui/icons-material/Coffee';

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
      lat: typeof place.geometry.location.lat === 'function' 
        ? place.geometry.location.lat() 
        : place.geometry.location.lat,
      lng: typeof place.geometry.location.lng === 'function' 
        ? place.geometry.location.lng() 
        : place.geometry.location.lng
    };

    console.log('Calculating distance between:', {
      user: userLocation,
      place: placeLocation
    });

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
                <Tooltip title="WiFi" arrow>
                  <WifiIcon style={styles.categoryIcon} />
                </Tooltip>
                <span>{cofficeRatings.averageRatings.wifi?.toFixed(1)}</span>
              </div>
              <div style={styles.ratingCategory}>
                <Tooltip title="Power Outlets" arrow>
                  <PowerIcon style={styles.categoryIcon} />
                </Tooltip>
                <span>{cofficeRatings.averageRatings.power?.toFixed(1)}</span>
              </div>
              <div style={styles.ratingCategory}>
                <Tooltip title="Noise Level" arrow>
                  <VolumeUpIcon style={styles.categoryIcon} />
                </Tooltip>
                <span>{cofficeRatings.averageRatings.noise?.toFixed(1)}</span>
              </div>
              <div style={styles.ratingCategory}>
                <Tooltip title="Coffee Quality" arrow>
                  <CoffeeIcon style={styles.categoryIcon} />
                </Tooltip>
                <span>{cofficeRatings.averageRatings.coffee?.toFixed(1)}</span>
              </div>
              <span style={styles.ratingCount}>
                ({cofficeRatings.totalRatings} {cofficeRatings.totalRatings === 1 ? 'rating' : 'ratings'})
              </span>
            </>
          ) : (
            <>
              <StarIcon style={styles.starIcon} /><span>{place.rating ? `${place.rating.toFixed(1)} (${place.user_ratings_total})` : 'No rating'}</span>
            </>
          )}
        </div>

        <div style={styles.address}>
          <LocationOnIcon style={styles.locationIcon} />
          <span>{place.vicinity}</span>
          {distance && (
            <>
              <span style={styles.separator}>•</span>
              <DirectionsWalkIcon style={styles.walkIcon} />
              <span>{(distance / 1000).toFixed(1)} km</span>
            </>
          )}
        </div>
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
    borderTop: `1px solid ${colors.border}`,
    maxHeight: 'calc(100vh - 120px)',
    overflowY: 'auto',
    paddingBottom: 'calc(60px + env(safe-area-inset-bottom))',
    marginBottom: '0',
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
    marginTop: '2px',
    marginBottom: '8px',
  },
  separator: {
    margin: '0 4px',
    color: colors.text.disabled,
  },
  starIcon: {
    color: colors.text.secondary,
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
    marginTop: '8px',
    marginBottom: '8px',
    backgroundColor: colors.primary.main,
    color: colors.background.paper,
    '&:hover': {
      backgroundColor: colors.primary.dark,
    }
  },
  categoryIcon: {
    fontSize: '20px',
    color: colors.text.secondary,
  },
};

export default PlaceDetails; 