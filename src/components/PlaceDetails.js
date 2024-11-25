import React, { useState, useEffect } from 'react';
import { Typography, Button, Box, IconButton, Tooltip, Skeleton } from '@mui/material';
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
import { keyframes } from '@mui/system';

// Define the blur animation
const fadeInFromBlur = keyframes`
  from {
    opacity: 0;
    filter: blur(8px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
`;

function PlaceDetails({ place, userLocation, user, onSignInRequired, cofficeRatings, onClose, isLoading }) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [userHasRated, setUserHasRated] = useState(false);
  const contentKey = place?.place_id || 'empty';

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
    console.log('getDistance called with:', {
      userLocation,
      placeGeometry: place.geometry,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    });

    if (!userLocation) {
      console.log('No user location available');
      return null;
    }

    if (!place.geometry?.location) {
      console.log('No place geometry available');
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

    console.log('Location data:', {
      userLocation,
      placeLocation
    });

    const calculatedDistance = calculateDistance(userLocation, placeLocation);
    console.log('Calculated distance:', calculatedDistance);
    return calculatedDistance;
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
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: colors.text.secondary,
          zIndex: 1
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box
        key={place?.place_id}
        sx={{
          animation: `${fadeInFromBlur} 0.3s ease-out`,
          willChange: 'filter',
          position: 'relative',
          '& > *': {
            position: 'relative',
            zIndex: 0
          }
        }}
      >
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
          <Box sx={{
            ...styles.rating,
            transition: 'opacity 0.3s ease-out',
          }}>
            {cofficeRatings?.averageRatings ? (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                transition: 'opacity 0.3s ease-out',
              }}>
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
              </Box>
            ) : (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'opacity 0.3s ease-out',
              }}>
                <StarIcon style={styles.starIcon} />
                <span>{place.rating ? `${place.rating.toFixed(1)} (${place.user_ratings_total})` : 'No rating'}</span>
              </Box>
            )}
          </Box>

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
      </Box>

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

      {isLoading ? (
        <Skeleton 
          variant="rectangular" 
          height={200} 
          sx={{ 
            borderRadius: 2,
            backgroundColor: colors.background.lighter 
          }} 
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
    overflow: 'hidden',
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
  card: {
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    }
  },
  '@keyframes slideIn': {
    '0%': {
      opacity: 0,
      transform: 'translateY(10px)'
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)'
    }
  },
};

export default PlaceDetails; 