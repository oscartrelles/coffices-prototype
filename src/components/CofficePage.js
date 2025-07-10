import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Tooltip, Card, CardContent, CardMedia, Divider, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import WifiIcon from '@mui/icons-material/Wifi';
import PowerIcon from '@mui/icons-material/Power';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CoffeeIcon from '@mui/icons-material/Coffee';
import VerifiedIcon from '@mui/icons-material/Verified';
import colors from '../styles/colors';
import LoadingSpinner from './common/LoadingSpinner';
import useGoogleMaps from '../hooks/useGoogleMaps';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const FALLBACK_IMAGE = '/logo512.png';

function CofficePage({ user, onSignInClick }) {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState(null);
  const [cofficeRatings, setCofficeRatings] = useState(null);
  const [cofficeReviews, setCofficeReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { loaded: mapsLoaded, error: mapsError } = useGoogleMaps();
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    if (!mapsLoaded) return;
    if (mapsError) {
      setError('Google Maps failed to load');
      setIsLoading(false);
      return;
    }
    const fetchCofficeData = async () => {
      if (!placeId) {
        setError('No place ID provided');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const ratingsRef = collection(db, 'ratings');
        const q = query(ratingsRef, where('placeId', '==', placeId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const service = new window.google.maps.places.PlacesService(document.createElement('div'));
          service.getDetails({
            placeId: placeId,
            fields: ['geometry', 'name', 'formatted_address', 'vicinity', 'place_id', 'types', 'rating', 'user_ratings_total', 'photos']
          }, (placeDetails, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
              fetchCofficeRatingsAndReviews(placeId);
              setPlace({
                ...placeDetails,
                vicinity: placeDetails.vicinity || placeDetails.formatted_address
              });
            } else {
              setError('Place not found');
            }
            setIsLoading(false);
          });
        } else {
          setError('Coffice not found in our database');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching coffice data:', error);
        setError('Failed to load coffice data');
        setIsLoading(false);
      }
    };
    fetchCofficeData();
  }, [placeId, mapsLoaded, mapsError]);

  const fetchCofficeRatingsAndReviews = async (placeId) => {
    try {
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('placeId', '==', placeId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const ratings = querySnapshot.docs.map(doc => doc.data());
        setCofficeReviews(ratings);
        const totals = {
          wifi: { sum: 0, count: 0 },
          power: { sum: 0, count: 0 },
          noise: { sum: 0, count: 0 },
          coffee: { sum: 0, count: 0 }
        };
        ratings.forEach(rating => {
          ['wifi', 'power', 'noise', 'coffee'].forEach(key => {
            if (typeof rating[key] === 'number') {
              totals[key].sum += rating[key];
              totals[key].count++;
            }
          });
        });
        const averageRatings = {};
        Object.keys(totals).forEach(key => {
          averageRatings[key] = totals[key].count > 0 ? 
            totals[key].sum / totals[key].count : 0;
        });
        setCofficeRatings({
          averageRatings,
          totalRatings: ratings.length
        });
      } else {
        setCofficeReviews([]);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setCofficeReviews([]);
    }
  };

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (typeof photo.getUrl === 'function') {
      return photo.getUrl({ maxWidth: 800 });
    }
    return null;
  };

  const handleBackToMap = () => {
    navigate('/');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/coffice/${placeId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: place?.name || 'Check out this coffice!',
          text: `Check out ${place?.name} on Coffices!`,
          url: url
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg('Link copied to clipboard!');
        setTimeout(() => setShareMsg(''), 2000);
      }
    } catch (error) {
      setShareMsg('Failed to share');
      setTimeout(() => setShareMsg(''), 2000);
    }
  };

  if (!mapsLoaded && !mapsError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.background.main }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.background.main }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.background.main, padding: 2 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={handleBackToMap} sx={{ mt: 2 }}>
          Back to Map
        </Button>
      </Box>
    );
  }

  // Venue info card
  return (
    <Box sx={{ height: '100vh', backgroundColor: colors.background.main, display: 'block', overflowY: 'auto', py: 4 }}>
      <Card sx={{ width: '100%', maxWidth: 600, mb: 4, boxShadow: 3, borderRadius: 3, mx: 'auto', position: 'relative' }}>
        {/* Hero image with overlayed buttons */}
        <Box sx={{ position: 'relative' }}>
          {place?.photos && place.photos.length > 0 ? (
            <CardMedia
              component="img"
              height="260"
              image={getPhotoUrl(place.photos[0])}
              alt={place.name}
              sx={{ objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
              onError={e => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
            />
          ) : (
            <CardMedia
              component="img"
              height="260"
              image={FALLBACK_IMAGE}
              alt="No photo available"
              sx={{ objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
            />
          )}
          {/* Overlayed buttons */}
          <Box sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            zIndex: 2
          }}>
            <Tooltip title="Back to map">
              <IconButton onClick={handleBackToMap} sx={{ background: 'rgba(255,255,255,0.85)', mr: 1 }}>
                <ArrowBackIcon sx={{ color: colors.text.primary }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share this coffice">
              <IconButton onClick={handleShare} sx={{ background: 'rgba(255,255,255,0.85)' }}>
                <ShareIcon sx={{ color: colors.text.primary }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h5" sx={{ color: colors.text.primary, fontWeight: 600 }}>
              {place?.name}
            </Typography>
            {cofficeRatings && (
              <Tooltip title="Verified Coffice" arrow>
                <VerifiedIcon sx={{ color: colors.primary.main, fontSize: '1.2rem' }} />
              </Tooltip>
            )}
          </Box>
          <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2 }}>
            {place?.vicinity}
          </Typography>
          {cofficeRatings && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="WiFi" arrow><WifiIcon sx={{ color: colors.text.secondary }} /></Tooltip>
                <span>{cofficeRatings.averageRatings.wifi?.toFixed(1)}</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Power Outlets" arrow><PowerIcon sx={{ color: colors.text.secondary }} /></Tooltip>
                <span>{cofficeRatings.averageRatings.power?.toFixed(1)}</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Noise Level" arrow><VolumeUpIcon sx={{ color: colors.text.secondary }} /></Tooltip>
                <span>{cofficeRatings.averageRatings.noise?.toFixed(1)}</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Coffee Quality" arrow><CoffeeIcon sx={{ color: colors.text.secondary }} /></Tooltip>
                <span>{cofficeRatings.averageRatings.coffee?.toFixed(1)}</span>
              </Box>
              <Typography variant="caption" sx={{ color: colors.text.disabled, ml: 2 }}>
                ({cofficeRatings.totalRatings} {cofficeRatings.totalRatings === 1 ? 'rating' : 'ratings'})
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      {shareMsg && (
        <Box sx={{ mt: 1, mb: -2, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="caption" sx={{ color: colors.primary.main }}>{shareMsg}</Typography>
        </Box>
      )}
      {/* Reviews Section (only for logged in users) */}
      {user && (
        <Card sx={{ width: '100%', maxWidth: 600, boxShadow: 2, borderRadius: 3, mb: 4, mx: 'auto' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Reviews</Typography>
            {cofficeReviews.length === 0 && (
              <Typography variant="body2" sx={{ color: colors.text.disabled }}>
                No reviews yet.
              </Typography>
            )}
            {cofficeReviews.map((review, idx) => (
              <React.Fragment key={idx}>
                <Box sx={{ p: 2, background: colors.background.paper }}>
                  <Typography variant="subtitle2" sx={{ color: colors.text.secondary, mb: 1 }}>
                    {review.displayName ? review.displayName : 'Anonymous'}
                    {review.timestamp && (
                      <span style={{ marginLeft: 8, fontSize: '0.9em', color: colors.text.disabled }}>
                        {new Date(review.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="WiFi" arrow><WifiIcon sx={{ color: colors.text.secondary, fontSize: 20 }} /></Tooltip>
                      <span>{review.wifi ?? '-'}</span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Power Outlets" arrow><PowerIcon sx={{ color: colors.text.secondary, fontSize: 20 }} /></Tooltip>
                      <span>{review.power ?? '-'}</span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Noise Level" arrow><VolumeUpIcon sx={{ color: colors.text.secondary, fontSize: 20 }} /></Tooltip>
                      <span>{review.noise ?? '-'}</span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Coffee Quality" arrow><CoffeeIcon sx={{ color: colors.text.secondary, fontSize: 20 }} /></Tooltip>
                      <span>{review.coffee ?? '-'}</span>
                    </Box>
                  </Box>
                  {review.comment && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {review.comment}
                    </Typography>
                  )}
                </Box>
                {idx < cofficeReviews.length - 1 && <Divider sx={{ my: 2 }} />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      )}
      {/* Add some bottom padding for scrollability */}
      <Box sx={{ height: 32 }} />
    </Box>
  );
}

export default CofficePage; 