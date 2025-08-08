import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Tooltip, Card, CardContent, CardMedia, Divider, IconButton, Modal } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import WifiIcon from '@mui/icons-material/Wifi';
import PowerIcon from '@mui/icons-material/Power';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CoffeeIcon from '@mui/icons-material/Coffee';
import VerifiedIcon from '@mui/icons-material/Verified';
import colors from '../styles/colors';
import LoadingSpinner from './common/LoadingSpinner';

import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import analyticsService from '../services/analyticsService';

import EmailSignIn from './auth/EmailSignIn';
import GoogleSignIn from './auth/GoogleSignIn';
import SEO from './SEO';
import RatingForm from './RatingForm';

const FALLBACK_IMAGE = '/logo512.png';

// Helper function to get display name for reviews
const getReviewDisplayName = (review, currentUser, currentUserProfile, userProfiles) => {
  // If this review belongs to the current user, use the same logic as Header
  if (review.userId === currentUser?.uid)  return 'You';
  
  // For other users, use the fetched profile display name
  if (userProfiles[review.userId]) {
    return userProfiles[review.userId].displayName;
  }
  
  // Fallback to review's displayName or 'Cofficer'
  return review.displayName || 'Cofficer';
};

function CofficePage({ user, onSignInClick }) {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState(null);
  const [cofficeRatings, setCofficeRatings] = useState(null);
  const [cofficeReviews, setCofficeReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [shareMsg, setShareMsg] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  // Check if this place is in user's favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user?.uid || !placeId) return;
      
      try {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          const favoriteCoffices = profileData.favoriteCoffices || [];
          setIsFavorite(favoriteCoffices.includes(placeId));
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [user?.uid, placeId]);

  // Fetch current user's profile for display name
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          setCurrentUserProfile(profileDoc.data());
        }
      } catch (error) {
        console.error('Error fetching current user profile:', error);
      }
    };

    fetchCurrentUserProfile();
  }, [user?.uid]);

  // Fetch user profiles for display names
  const fetchUserProfiles = async (reviews) => {
    if (!reviews || reviews.length === 0) return;
    
    try {
      const userIds = [...new Set(reviews.map(review => review.userId).filter(Boolean))];
      const profiles = {};
      
      for (const userId of userIds) {
        if (!userProfiles[userId]) { // Only fetch if not already cached
          const profileRef = doc(db, 'profiles', userId);
          const profileDoc = await getDoc(profileRef);
          
          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            profiles[userId] = {
              displayName: profileData.displayName || profileData.email?.split('@')[0] || 'Cofficer',
              photoURL: profileData.photoURL
            };
          } else {
            profiles[userId] = {
              displayName: 'Cofficer',
              photoURL: null
            };
          }
        }
      }
      
      setUserProfiles(prev => ({ ...prev, ...profiles }));
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  };

  // Fetch user profiles when reviews change
  useEffect(() => {
    if (cofficeReviews && cofficeReviews.length > 0) {
      fetchUserProfiles(cofficeReviews);
    }
  }, [cofficeReviews]);

  const handleToggleFavorite = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setFavoriteLoading(true);
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      
      if (isFavorite) {
        // Remove from favorites
        await updateDoc(profileRef, {
          favoriteCoffices: arrayRemove(placeId)
        });
        setIsFavorite(false);
        analyticsService.trackFavoriteRemoved(placeId, place?.name);
      } else {
        // Add to favorites
        await updateDoc(profileRef, {
          favoriteCoffices: arrayUnion(placeId)
        });
        setIsFavorite(true);
        analyticsService.trackFavoriteAdded(placeId, place?.name);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Track place details viewed when place data changes
  useEffect(() => {
    if (place) {
      analyticsService.trackPlaceDetailsViewed(
        placeId, 
        place.name, 
        cofficeRatings ? true : false
      );
    }
  }, [place, placeId, cofficeRatings]);

  useEffect(() => {
    const fetchCofficeData = async () => {
      if (!placeId) {
        setError('No place ID provided');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        
        // First, try to get data from coffices collection
        const cofficeRef = doc(db, 'coffices', placeId);
        const cofficeDoc = await getDoc(cofficeRef);
        
        if (cofficeDoc.exists()) {
          const cofficeData = cofficeDoc.data();
          
          // Set place data from coffices collection
          setPlace({
            place_id: cofficeData.placeId,
            name: cofficeData.name,
            vicinity: cofficeData.vicinity,
            geometry: cofficeData.geometry,
            // Include main image URL
            mainImageUrl: cofficeData.mainImageUrl || null,
            // Add other fields that might be needed
            types: ['cafe'],
            rating: 0, // We'll calculate this from our ratings
            user_ratings_total: cofficeData.totalRatings
          });
          
          // Set ratings data from coffices collection
          setCofficeRatings({
            averageRatings: cofficeData.averageRatings,
            totalRatings: cofficeData.totalRatings
          });
          
          // Fetch individual reviews for display
          fetchCofficeRatingsAndReviews(placeId);
        } else {
          // Fallback: check if place exists in ratings (for backward compatibility)
          const ratingsRef = collection(db, 'ratings');
          const q = query(ratingsRef, where('placeId', '==', placeId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Place exists in ratings but not in coffices - this shouldn't happen after migration
            setError('Coffice data incomplete - please contact support');
          } else {
            setError('Coffice not found in our database');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching coffice data:', error);
        setError('Failed to load coffice data');
        setIsLoading(false);
      }
    };
    fetchCofficeData();
  }, [placeId]);

  const fetchCofficeRatingsAndReviews = async (placeId) => {
    try {
      // Only fetch individual reviews for display - averages are already in coffices collection
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('placeId', '==', placeId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const ratings = querySnapshot.docs.map(doc => doc.data());
        // Sort by timestamp (newest first)
        ratings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setCofficeReviews(ratings);
        
        // Fetch user profiles for display names
        await fetchUserProfiles(ratings);
      } else {
        setCofficeReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setCofficeReviews([]);
    }
  };

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    
    // Handle cached photo data from database
    if (photo.url) {
      return photo.url;
    }
    
    // Handle Google Maps photo objects
    if (typeof photo.getUrl === 'function') {
      return photo.getUrl({ maxWidth: 800 });
    }
    
    return null;
  };

  const handleBackToMap = () => {
    navigate('/');
  };

  const handleShare = async () => {
    analyticsService.trackShareInitiated(placeId, place?.name);
    
    const url = `${window.location.origin}/coffice/${placeId}`;
    const shareTitle = place ? `${place.name} - Remote Work Coffee Shop` : 'Check out this coffice!';
    const shareText = place ? 
      `${place.name} - Perfect coffee shop for remote work! ${cofficeRatings ? 
        `Rated ${cofficeRatings.averageRatings?.wifi?.toFixed(1) || '0'}/5 WiFi, ${cofficeRatings.averageRatings?.power?.toFixed(1) || '0'}/5 power outlets, ${cofficeRatings.averageRatings?.coffee?.toFixed(1) || '0'}/5 coffee by ${cofficeRatings.totalRatings} cofficers. ` : 
        'Be the first to rate this coffice! '
      }Located in ${place.vicinity}.` :
      'Check out this coffice on Coffices!';
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url
        });
        analyticsService.trackShareCompleted(placeId, 'native');
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg('Link copied to clipboard!');
        setTimeout(() => setShareMsg(''), 2000);
        analyticsService.trackShareCompleted(placeId, 'clipboard');
      }
    } catch (error) {
      setShareMsg('Failed to share');
      setTimeout(() => setShareMsg(''), 2000);
    }
  };

  const handleRatingSubmit = () => {
    setShowRatingForm(false);
    // Refresh the reviews to show the new rating
    fetchCofficeRatingsAndReviews(placeId);
  };



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
    <>
      {/* SEO component - always render to ensure meta tags are available */}
      <SEO 
        title={place ? `${place.name} - Remote Work Coffee Shop | Coffices` : 'Coffice - Coffices'}
        description={place ? 
          `${place.name} - Perfect coffee shop for remote work! ${cofficeRatings ? 
            `Rated ${cofficeRatings.averageRatings?.wifi?.toFixed(1) || '0'}/5 WiFi, ${cofficeRatings.averageRatings?.power?.toFixed(1) || '0'}/5 power outlets, ${cofficeRatings.averageRatings?.coffee?.toFixed(1) || '0'}/5 coffee by ${cofficeRatings.totalRatings} cofficers. ` : 
            'Be the first to rate this coffice! '
          }Located in ${place.vicinity}. Great for remote work with WiFi, power outlets, and quality coffee.` :
          'Discover and rate the best coffee shops for remote work.'
        }
        image={place?.mainImageUrl || `${window.location.origin}/Coffices.PNG`}
        url={`${window.location.origin}/coffice/${placeId}`}
        type={place ? "restaurant" : "website"}
        place={place}
      />
      <Box sx={{ height: '100vh', backgroundColor: colors.background.main, display: 'block', overflowY: 'auto', py: { xs: 0, sm: 4 } }}>
      <Card sx={{ width: '100%', maxWidth: 600, mb: 4, boxShadow: 3, borderRadius: 3, mx: 'auto', position: 'relative' }}>
        {/* Hero image with overlayed buttons */}
        <Box sx={{ position: 'relative' }}>
          {place?.mainImageUrl ? (
            <CardMedia
              component="img"
              height="260"
              image={place.mainImageUrl}
              alt={place.name}
              sx={{ objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
              onError={e => { 
                e.target.onerror = null; 
                e.target.src = FALLBACK_IMAGE; 
              }}
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <IconButton 
                  onClick={handleToggleFavorite} 
                  disabled={favoriteLoading}
                  sx={{ 
                    background: 'rgba(255,255,255,0.85)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.95)'
                    }
                  }}
                >
                  {isFavorite ? (
                    <FavoriteIcon sx={{ color: colors.primary.main }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ color: colors.text.primary }} />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Share this coffice">
                <IconButton onClick={handleShare} sx={{ background: 'rgba(255,255,255,0.85)' }}>
                  <ShareIcon sx={{ color: colors.text.primary }} />
                </IconButton>
              </Tooltip>
            </Box>
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
              {/* Rate this Coffice Button */}
              {user && !cofficeReviews.some(review => review.userId === user.uid) && (
                <Button
                  variant="contained"
                  onClick={() => {
                    analyticsService.trackRateButtonClicked(placeId, place?.name);
                    setShowRatingForm(true);
                  }}
                  sx={{ 
                    backgroundColor: colors.primary.main,
                    color: colors.background.paper,
                    ml: 2,
                    '&:hover': {
                      backgroundColor: colors.primary.dark
                    }
                  }}
                >
                  Rate this Coffice
                </Button>
              )}
              {!user && (
                <Button
                  variant="contained"
                  onClick={() => {
                    analyticsService.trackRateButtonClicked(placeId, place?.name);
                    analyticsService.trackDropoff('authentication_required', {
                      action_attempted: 'rate_coffice',
                      place_id: placeId,
                      place_name: place?.name
                    });
                    setShowAuthModal(true);
                  }}
                  sx={{ 
                    backgroundColor: colors.primary.main,
                    color: colors.background.paper,
                    ml: 2,
                    '&:hover': {
                      backgroundColor: colors.primary.dark
                    }
                  }}
                >
                  Rate this Coffice
                </Button>
              )}
            </Box>
          )}

          {/* Rating Form */}
          {showRatingForm && (
            <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${colors.border}` }}>
              <RatingForm 
                placeId={placeId}
                place={place}
                user={user}
                onSubmit={handleRatingSubmit}
                onCancel={() => setShowRatingForm(false)}
              />
            </Box>
          )}
        </CardContent>
      </Card>
      {shareMsg && (
        <Box sx={{ mt: 1, mb: -2, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="caption" sx={{ color: colors.primary.main }}>{shareMsg}</Typography>
        </Box>
      )}
      {/* Reviews Section */}
      {cofficeReviews && (
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
                    {review.userId ? (
                      <span
                        onClick={() => navigate(`/profile/${review.userId}`)}
                        style={{
                          cursor: 'pointer',
                          color: colors.primary.main,
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {getReviewDisplayName(review, user, currentUserProfile, userProfiles)}
                      </span>
                    ) : (
                      getReviewDisplayName(review, user, currentUserProfile, userProfiles)
                    )}
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
      
      {/* Auth Modal */}
      <Modal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="auth-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            Sign in to continue
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <EmailSignIn 
              onSuccess={() => setShowAuthModal(false)} 
              setUser={() => {}} // This will be handled by the auth state listener
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>or</Typography>
              <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
            </Box>
            <GoogleSignIn 
              onSuccess={() => setShowAuthModal(false)}
              setUser={() => {}} // This will be handled by the auth state listener
            />
          </Box>
        </Box>
      </Modal>
    </Box>
    </>
  );
}

export default CofficePage; 