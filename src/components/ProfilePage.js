import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Card, CardContent, Avatar, Divider, CardMedia, IconButton, Tooltip, TextField, TextareaAutosize, Grid, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageIcon from '@mui/icons-material/Language';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import colors from '../styles/colors';
import LoadingSpinner from './common/LoadingSpinner';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

function ProfilePage({ user, onSignInClick }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // If no userId provided, default to current user's profile
  const targetUserId = userId || user?.uid;
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [fileInputRef] = useState(React.createRef());
  const [favoriteCoffices, setFavoriteCoffices] = useState([]);
  const [favoriteCofficesLoading, setFavoriteCofficesLoading] = useState(false);
  const [ratedCofficesCount, setRatedCofficesCount] = useState(0);
  const [ratedCofficesLoading, setRatedCofficesLoading] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: '',
    tagline: '',
    bio: '',
    location: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      instagram: '',
      website: ''
    }
  });

  // Check if this is the current user's profile
  const isOwnProfile = !userId || userId === user?.uid;

  useEffect(() => {
    const loadProfile = async () => {
      if (!targetUserId) {
        setError('No user ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (isOwnProfile && user) {
          // Try to load profile from Firestore first
          const profileRef = doc(db, 'profiles', targetUserId);
          const profileDoc = await getDoc(profileRef);
          
          let userProfile;
          
          if (profileDoc.exists()) {
            // Profile exists in Firestore
            const firestoreData = profileDoc.data();
            userProfile = {
              displayName: firestoreData.displayName || user.displayName || '',
              email: user.email || '',
              photoURL: firestoreData.photoURL || user.photoURL || '',
              tagline: firestoreData.tagline || '',
              bio: firestoreData.bio || '',
              location: firestoreData.location || '',
              joinedDate: firestoreData.joinedDate || user.metadata?.creationTime || new Date().toISOString(),
              favoriteCoffices: firestoreData.favoriteCoffices || [],
              socialLinks: firestoreData.socialLinks || {
                twitter: '',
                linkedin: '',
                instagram: '',
                website: ''
              },
              userType: firestoreData.userType || 'regular',
              ratedCofficesCount: firestoreData.ratedCofficesCount || 0 // Load ratedCofficesCount
            };
          } else {
            // No profile in Firestore, create default from user data
            userProfile = {
              displayName: user.displayName || '',
              email: user.email || '',
              photoURL: user.photoURL || '',
              tagline: '',
              bio: '',
              location: '',
              joinedDate: user.metadata?.creationTime || new Date().toISOString(),
              favoriteCoffices: [],
              socialLinks: {
                twitter: '',
                linkedin: '',
                instagram: '',
                website: ''
              },
              userType: 'regular',
              ratedCofficesCount: 0 // Default ratedCofficesCount
            };
            
            // Double-check that the profile truly doesn't exist before creating it
            const doubleCheckDoc = await getDoc(profileRef);
            if (!doubleCheckDoc.exists()) {
              // Save the default profile to Firestore
              await setDoc(profileRef, userProfile);
            } else {
              // Profile was created by another process, load the existing one
              const existingData = doubleCheckDoc.data();
              userProfile = {
                displayName: existingData.displayName || '',
                email: existingData.email || '',
                photoURL: existingData.photoURL || '',
                tagline: existingData.tagline || '',
                bio: existingData.bio || '',
                location: existingData.location || '',
                joinedDate: existingData.joinedDate || user.metadata?.creationTime || new Date().toISOString(),
                favoriteCoffices: existingData.favoriteCoffices || [],
                socialLinks: {
                  twitter: existingData.socialLinks?.twitter || '',
                  linkedin: existingData.socialLinks?.linkedin || '',
                  instagram: existingData.socialLinks?.instagram || '',
                  website: existingData.socialLinks?.website || ''
                },
                userType: existingData.userType || 'regular',
                ratedCofficesCount: existingData.ratedCofficesCount || 0
              };
            }
          }
          
          setProfile(userProfile);
          setEditForm({
            displayName: userProfile.displayName,
            tagline: userProfile.tagline,
            bio: userProfile.bio,
            location: userProfile.location,
            socialLinks: userProfile.socialLinks
          });
        } else {
          setError('Profile not found');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [targetUserId, user, isOwnProfile]);

  const handleBackToMap = () => {
    navigate('/');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form to original values
      setEditForm({
        displayName: profile.displayName,
        tagline: profile.tagline,
        bio: profile.bio,
        location: profile.location
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!user) {
      setError('You must be logged in to save changes');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        displayName: editForm.displayName,
        tagline: editForm.tagline,
        bio: editForm.bio,
        location: editForm.location,
        socialLinks: editForm.socialLinks,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setProfile(prev => ({
        ...prev,
        displayName: editForm.displayName,
        tagline: editForm.tagline,
        bio: editForm.bio,
        location: editForm.location,
        socialLinks: editForm.socialLinks
      }));

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setEditForm({
      displayName: profile.displayName,
      tagline: profile.tagline,
      bio: profile.bio,
      location: profile.location
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!user) {
      setError('You must be logged in to upload a photo');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    setError(null);

    try {
      // Use a path that matches the existing Firebase Storage rules
      const fileName = `profile-pictures/${user.uid}/profile.jpg`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore profile
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        photoURL: downloadURL,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setProfile(prev => ({
        ...prev,
        photoURL: downloadURL
      }));

      console.log('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onSignInClick(); // Call the prop to trigger sign-in
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Fetch favorite coffices data
  const fetchFavoriteCoffices = async () => {
    if (!profile?.favoriteCoffices || profile.favoriteCoffices.length === 0) {
      setFavoriteCoffices([]);
      return;
    }

    setFavoriteCofficesLoading(true);
    try {
      const cofficesData = [];
      
      for (const placeId of profile.favoriteCoffices) {
        try {
          const service = new window.google.maps.places.PlacesService(document.createElement('div'));
          
          await new Promise((resolve, reject) => {
            service.getDetails({
              placeId: placeId,
              fields: ['name', 'formatted_address', 'vicinity', 'photos', 'rating']
            }, (placeDetails, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                cofficesData.push({
                  placeId,
                  name: placeDetails.name,
                  address: placeDetails.formatted_address || placeDetails.vicinity,
                  photo: placeDetails.photos?.[0],
                  rating: placeDetails.rating
                });
              }
              resolve();
            });
          });
        } catch (error) {
          console.error(`Error fetching place ${placeId}:`, error);
        }
      }
      
      setFavoriteCoffices(cofficesData);
    } catch (error) {
      console.error('Error fetching favorite coffices:', error);
    } finally {
      setFavoriteCofficesLoading(false);
    }
  };

  // Fetch favorite coffices when profile loads
  useEffect(() => {
    if (profile?.favoriteCoffices && window.google && window.google.maps) {
      fetchFavoriteCoffices();
    }
  }, [profile?.favoriteCoffices]);

  const getPhotoUrl = (photo) => {
    if (!photo) return '/logo512.png';
    return `${photo.getUrl({ maxWidth: 400, maxHeight: 300 })}`;
  };

  // Fetch user's rated coffices count
  const fetchRatedCofficesCount = async () => {
    if (!user?.uid) return;

    setRatedCofficesLoading(true);
    try {
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      // Count unique places rated by this user
      const uniquePlaces = new Set();
      querySnapshot.docs.forEach(doc => {
        const ratingData = doc.data();
        if (ratingData.placeId) {
          uniquePlaces.add(ratingData.placeId);
        }
      });
      
      const newCount = uniquePlaces.size;
      setRatedCofficesCount(newCount);
      
      // Store the count in the user profile for performance
      if (profile && newCount !== profile.ratedCofficesCount) {
        const profileRef = doc(db, 'profiles', user.uid);
        await updateDoc(profileRef, {
          ratedCofficesCount: newCount,
          updatedAt: new Date().toISOString()
        });
        
        // Update local profile state
        setProfile(prev => ({
          ...prev,
          ratedCofficesCount: newCount
        }));
      } else if (!profile) {
        // If profile doesn't exist yet, create it with the count
        const profileRef = doc(db, 'profiles', user.uid);
        
        // Double-check that the profile truly doesn't exist before creating it
        const doubleCheckDoc = await getDoc(profileRef);
        if (!doubleCheckDoc.exists()) {
          await setDoc(profileRef, {
            ratedCofficesCount: newCount,
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            tagline: '',
            bio: '',
            location: '',
            joinedDate: user.metadata?.creationTime || new Date().toISOString(),
            favoriteCoffices: [],
            socialLinks: {
              twitter: '',
              linkedin: '',
              instagram: '',
              website: ''
            },
            userType: 'regular',
            updatedAt: new Date().toISOString()
          });
        } else {
          // Profile exists, just update the count
          await updateDoc(profileRef, {
            ratedCofficesCount: newCount,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching rated coffices count:', error);
    } finally {
      setRatedCofficesLoading(false);
    }
  };

  // Fetch rated coffices count when user changes
  useEffect(() => {
    const loadRatedCofficesCount = async () => {
      if (!user?.uid) return;

      // First, try to use the stored count from profile
      if (profile?.ratedCofficesCount !== undefined) {
        setRatedCofficesCount(profile.ratedCofficesCount);
        return;
      }

      // If no stored count, fetch from ratings collection and store it
      await fetchRatedCofficesCount();
    };

    loadRatedCofficesCount();
  }, [user?.uid, profile?.ratedCofficesCount]);

  // Get achievement badge based on rated coffices count
  const getAchievementBadge = (count) => {
    if (count >= 100) return { label: 'Executive Espresso Cofficer', color: '#FFD700', icon: '🥇' };
    if (count >= 50) return { label: 'Global Grind Cofficer', color: '#C0C0C0', icon: '🌐' };
    if (count >= 20) return { label: 'Regional Remote Cofficer', color: '#CD7F32', icon: '🌍' };
    if (count >= 10) return { label: 'Senior Cofficer, Sips', color: '#4CAF50', icon: '🥤' };
    if (count >= 5) return { label: 'Associate Cofficer', color: '#2196F3', icon: ' 💻' };
    return { label: 'Junior Cofficer', color: '#9E9E9E', icon: '☕️' };
  };

  const achievement = getAchievementBadge(ratedCofficesCount);

  // Get next milestone
  const getNextMilestone = (count) => {
    if (count < 5) return 5;
    if (count < 10) return 10;
    if (count < 20) return 20;
    if (count < 50) return 50;
    if (count < 100) return 100;
    return null; // Max level reached
  };

  const nextMilestone = getNextMilestone(ratedCofficesCount);
  const progressToNext = nextMilestone ? (ratedCofficesCount / nextMilestone) * 100 : 100;

  // Social link validation and formatting
  const validateAndFormatSocialLink = (platform, value) => {
    if (!value || !value.trim()) return '';
    
    let formattedValue = value.trim();
    
    // Remove any existing protocol
    formattedValue = formattedValue.replace(/^https?:\/\//, '');
    
    switch (platform) {
      case 'twitter':
        // Remove @ symbol if present and extract handle from URL
        formattedValue = formattedValue.replace(/^@/, '');
        formattedValue = formattedValue.replace(/^twitter\.com\//, '');
        // Ensure it's a valid Twitter handle
        if (/^[a-zA-Z0-9_]{1,15}$/.test(formattedValue)) {
          return `https://twitter.com/${formattedValue}`;
        }
        break;
        
      case 'linkedin':
        // Handle different LinkedIn URL formats
        if (formattedValue.includes('linkedin.com/in/')) {
          const profileId = formattedValue.replace(/^linkedin\.com\/in\//, '');
          if (/^[a-zA-Z0-9-]+$/.test(profileId)) {
            return `https://linkedin.com/in/${profileId}`;
          }
        } else if (/^[a-zA-Z0-9-]+$/.test(formattedValue)) {
          return `https://linkedin.com/in/${formattedValue}`;
        }
        break;
        
      case 'instagram':
        // Remove @ symbol if present and extract handle from URL
        formattedValue = formattedValue.replace(/^@/, '');
        formattedValue = formattedValue.replace(/^instagram\.com\//, '');
        // Ensure it's a valid Instagram handle
        if (/^[a-zA-Z0-9._]+$/.test(formattedValue)) {
          return `https://instagram.com/${formattedValue}`;
        }
        break;
        
      case 'website':
        // Add protocol if missing
        if (!/^https?:\/\//.test(value)) {
          formattedValue = `https://${formattedValue}`;
        } else {
          formattedValue = value;
        }
        // Basic URL validation
        try {
          new URL(formattedValue);
          return formattedValue;
        } catch {
          return '';
        }
        break;
        
      default:
        return value;
    }
    
    return '';
  };

  const handleSocialLinkChange = (platform, value) => {
    const formattedValue = validateAndFormatSocialLink(platform, value);
    handleInputChange('socialLinks', { 
      ...(editForm.socialLinks || {}), 
      [platform]: formattedValue || value 
    });
  };

  const getSocialLinkError = (platform, value) => {
    if (!value || !value.trim()) return '';
    
    switch (platform) {
      case 'twitter':
        const twitterHandle = value.replace(/^https?:\/\/twitter\.com\//, '').replace(/^@/, '');
        if (!/^[a-zA-Z0-9_]{1,15}$/.test(twitterHandle)) {
          return 'Invalid Twitter handle (1-15 characters, letters, numbers, underscores only)';
        }
        break;
        
      case 'linkedin':
        const linkedinPath = value.replace(/^https?:\/\/linkedin\.com\/in\//, '');
        if (!/^[a-zA-Z0-9-]+$/.test(linkedinPath)) {
          return 'Invalid LinkedIn profile URL';
        }
        break;
        
      case 'instagram':
        const instagramHandle = value.replace(/^https?:\/\/instagram\.com\//, '').replace(/^@/, '');
        if (!/^[a-zA-Z0-9._]+$/.test(instagramHandle)) {
          return 'Invalid Instagram handle';
        }
        break;
        
      case 'website':
        try {
          new URL(value);
        } catch {
          return 'Invalid website URL';
        }
        break;
    }
    
    return '';
  };

  const getFormattedUrlPreview = (platform, value) => {
    if (!value || !value.trim()) return '';
    
    const formatted = validateAndFormatSocialLink(platform, value);
    if (formatted && formatted !== value) {
      return `Will be saved as: ${formatted}`;
    }
    return '';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box sx={{ height: '100vh', backgroundColor: colors.background.main, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            onClick={handleBackToMap}
            startIcon={<ArrowBackIcon />}
            sx={{ color: colors.text.secondary }}
          >
            Back to Map
          </Button>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" sx={{ color: colors.text.secondary }}>
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', backgroundColor: colors.background.main, display: 'flex', flexDirection: 'column' }}>
      {/* Profile Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: { xs: 0, sm: 4 } }}>
        <Card sx={{ width: '100%', maxWidth: 600, mx: 'auto', mb: 3, boxShadow: 3, borderRadius: 3, position: 'relative' }}>
          {/* Hero section with overlayed buttons */}
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="div"
              height="200"
              sx={{ 
                background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
                objectFit: 'cover', 
                borderTopLeftRadius: 12, 
                borderTopRightRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Avatar
                src={profile?.photoURL}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  fontSize: '3rem', 
                  border: '4px solid white'
                }}
              >
                {profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </CardMedia>
            
            {/* Photo upload overlay (only in edit mode) */}
            {isEditing && isOwnProfile && (
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 100,
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: '50%',
                cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
                opacity: isUploadingPhoto ? 0.7 : 0,
                transition: 'opacity 0.2s ease',
                zIndex: 4,
                '&:hover': {
                  opacity: isUploadingPhoto ? 0.7 : 0.8
                }
              }}
              onClick={isUploadingPhoto ? undefined : triggerFileInput}
            >
              {isUploadingPhoto ? (
                <LoadingSpinner size={24} />
              ) : (
                <PhotoCameraIcon sx={{ color: 'white', fontSize: '2rem' }} />
              )}
            </Box>
            )}
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
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
              {user && (
                <Tooltip title="Sign Out">
                  <IconButton onClick={handleSignOut} sx={{ background: 'rgba(255,255,255,0.85)' }}>
                    <LogoutIcon sx={{ color: colors.text.primary }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
          
          <CardContent sx={{ p: 3 }}>
            {/* Rated Coffices (replacing Profile Completion) */}
            {isOwnProfile && (
              <Box sx={{ mb: 3 }}>
                {ratedCofficesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <LoadingSpinner />
                  </Box>
                ) : (
                  <>
                    {/* Achievement Badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip
                        icon={<EmojiEventsIcon />}
                        label={achievement.label}
                        sx={{
                          backgroundColor: colors.primary.light,
                          color: colors.primary.dark,
                          fontWeight: 600,
                          borderRadius: 2,
                          fontSize: '0.9rem',
                          '& .MuiChip-icon': {
                            color: colors.primary.dark,
                            marginRight: 0.5
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ color: colors.text.secondary, ml: 1 }}>
                        {achievement.icon}
                      </Typography>
                    </Box>
                    
                    {/* Progress to Next Level */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ 
                        width: '100%', 
                        height: 8, 
                        backgroundColor: colors.background.main, 
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: `${Math.min(progressToNext, 100)}%`, 
                          height: '100%', 
                          backgroundColor: colors.primary.main,
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: colors.text.disabled }}>
                        {nextMilestone ? `${nextMilestone - ratedCofficesCount}/${nextMilestone} for next level` : 'Max level reached!'}
                      </Typography>
                    </Box>
                    
                    {/* Call to Action for New Users */}
                    {ratedCofficesCount === 0 && (
                      <Chip
                        label="Rate your first coffice!"
                        sx={{
                          backgroundColor: colors.background.paper,
                          color: colors.text.secondary,
                          border: `1px solid ${colors.border}`,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: colors.primary.light,
                            color: colors.primary.dark
                          }
                        }}
                        onClick={() => navigate('/')}
                      />
                    )}
                  </>
                )}
              </Box>
            )}

            {/* Profile Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {isEditing ? (
                <TextField
                  fullWidth
                  label="Display Name"
                  value={editForm.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  sx={{ mb: 2 }}
                  variant="outlined"
                />
              ) : (
                <Typography variant="h4" sx={{ color: colors.text.primary, fontWeight: 600, mb: 1 }}>
                  {profile?.displayName || 'Anonymous Cofficer'}
                </Typography>
              )}
              
              {isEditing ? (
                <TextField
                  fullWidth
                  label="Tagline"
                  value={editForm.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="A short description about yourself..."
                  sx={{ mb: 1 }}
                  variant="outlined"
                />
              ) : (
                profile?.tagline && (
                  <Typography variant="body1" sx={{ color: colors.text.secondary, mb: 1 }}>
                    {profile.tagline}
                  </Typography>
                )
              )}
              
              <Typography variant="caption" sx={{ color: colors.text.disabled }}>
                Joined {profile?.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'recently'}
              </Typography>
            </Box>

            {/* Email Section (Read-only in edit mode) */}
            {isEditing && profile?.email && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: colors.text.primary, mb: 1 }}>
                  Email
                </Typography>
                <TextField
                  fullWidth
                  label="Email"
                  value={profile.email}
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiInputBase-input.Mui-readOnly': {
                      backgroundColor: colors.background.main,
                      color: colors.text.disabled,
                    }
                  }}
                />
              </Box>
            )}

            {/* Photo Upload Section (only in edit mode) */}
            {isEditing && isOwnProfile && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: colors.text.primary, mb: 1 }}>
                  Profile Picture
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={triggerFileInput}
                  disabled={isUploadingPhoto}
                  sx={{ 
                    borderColor: colors.border, 
                    color: colors.text.secondary,
                    mb: 1
                  }}
                >
                  {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                </Button>
                <Typography variant="caption" sx={{ color: colors.text.disabled, display: 'block' }}>
                  Click to upload a new profile picture (max 5MB)
                </Typography>
              </Box>
            )}

            {/* Bio Section */}
            {(profile?.bio || isEditing) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: colors.text.primary, mb: 1 }}>
                  About
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Bio"
                    value={editForm.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    variant="outlined"
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    {profile.bio}
                  </Typography>
                )}
              </Box>
            )}

            {/* Location */}
            {(profile?.location || isEditing) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: colors.text.primary, mb: 1 }}>
                  Location
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    label="Location"
                    value={editForm.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Where are you based?"
                    variant="outlined"
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    {profile.location}
                  </Typography>
                )}
              </Box>
            )}

            {/* User Type (Admin Only) */}
            {profile?.userType && profile.userType !== 'regular' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: colors.text.primary, mb: 1 }}>
                  Role
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text.secondary, textTransform: 'capitalize' }}>
                  {profile.userType}
                </Typography>
              </Box>
            )}

            {/* Social Links */}
            {(profile?.socialLinks || isEditing) && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ color: colors.text.primary }}>
                    Social Links
                  </Typography>
                  {isEditing && (
                    <Tooltip title="Enter your social media handles or URLs. We'll automatically format them correctly.">
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon sx={{ fontSize: 16, color: colors.text.secondary }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {isEditing ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Twitter"
                      value={editForm.socialLinks?.twitter || ''}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      placeholder="username or @username"
                      variant="outlined"
                      error={!!getSocialLinkError('twitter', editForm.socialLinks?.twitter || '')}
                      helperText={
                        getSocialLinkError('twitter', editForm.socialLinks?.twitter || '') || 
                        getFormattedUrlPreview('twitter', editForm.socialLinks?.twitter || '') ||
                        "Enter your Twitter handle (e.g., 'john_doe' or '@john_doe')"
                      }
                      InputProps={{
                        startAdornment: <TwitterIcon sx={{ fontSize: 20, color: colors.text.secondary, mr: 1 }} />
                      }}
                    />
                    <TextField
                      fullWidth
                      label="LinkedIn"
                      value={editForm.socialLinks?.linkedin || ''}
                      onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                      placeholder="profile-id or full URL"
                      variant="outlined"
                      error={!!getSocialLinkError('linkedin', editForm.socialLinks?.linkedin || '')}
                      helperText={
                        getSocialLinkError('linkedin', editForm.socialLinks?.linkedin || '') || 
                        getFormattedUrlPreview('linkedin', editForm.socialLinks?.linkedin || '') ||
                        "Enter your LinkedIn profile ID (e.g., 'john-doe') or full URL"
                      }
                      InputProps={{
                        startAdornment: <LinkedInIcon sx={{ fontSize: 20, color: colors.text.secondary, mr: 1 }} />
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Instagram"
                      value={editForm.socialLinks?.instagram || ''}
                      onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                      placeholder="username or @username"
                      variant="outlined"
                      error={!!getSocialLinkError('instagram', editForm.socialLinks?.instagram || '')}
                      helperText={
                        getSocialLinkError('instagram', editForm.socialLinks?.instagram || '') || 
                        getFormattedUrlPreview('instagram', editForm.socialLinks?.instagram || '') ||
                        "Enter your Instagram handle (e.g., 'john_doe' or '@john_doe')"
                      }
                      InputProps={{
                        startAdornment: <InstagramIcon sx={{ fontSize: 20, color: colors.text.secondary, mr: 1 }} />
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Website"
                      value={editForm.socialLinks?.website || ''}
                      onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                      placeholder="yourwebsite.com or https://yourwebsite.com"
                      variant="outlined"
                      error={!!getSocialLinkError('website', editForm.socialLinks?.website || '')}
                      helperText={
                        getSocialLinkError('website', editForm.socialLinks?.website || '') || 
                        getFormattedUrlPreview('website', editForm.socialLinks?.website || '') ||
                        "Enter your website URL (we'll add https:// if needed)"
                      }
                      InputProps={{
                        startAdornment: <LanguageIcon sx={{ fontSize: 20, color: colors.text.secondary, mr: 1 }} />
                      }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {profile.socialLinks.twitter && (
                      <Tooltip title="Twitter">
                        <IconButton
                          href={profile.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: colors.primary.main,
                            '&:hover': {
                              color: colors.primary.dark,
                              backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          <TwitterIcon sx={{ fontSize: 24 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {profile.socialLinks.linkedin && (
                      <Tooltip title="LinkedIn">
                        <IconButton
                          href={profile.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: colors.primary.main,
                            '&:hover': {
                              color: colors.primary.dark,
                              backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          <LinkedInIcon sx={{ fontSize: 24 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {profile.socialLinks.instagram && (
                      <Tooltip title="Instagram">
                        <IconButton
                          href={profile.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: colors.primary.main,
                            '&:hover': {
                              color: colors.primary.dark,
                              backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          <InstagramIcon sx={{ fontSize: 24 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {profile.socialLinks.website && (
                      <Tooltip title="Website">
                        <IconButton
                          href={profile.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: colors.primary.main,
                            '&:hover': {
                              color: colors.primary.dark,
                              backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          <LanguageIcon sx={{ fontSize: 24 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {!profile.socialLinks.twitter && !profile.socialLinks.linkedin && !profile.socialLinks.instagram && !profile.socialLinks.website && (
                      <Typography variant="body2" sx={{ color: colors.text.disabled, fontStyle: 'italic' }}>
                        No social links added yet
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Recent Reviews */}
            {profile?.recentReviews && profile.recentReviews.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: colors.text.primary, mb: 1 }}>
                  Recent Reviews
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                  {profile.recentReviews.length} review{profile.recentReviews.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}

            {/* Favorite Coffices */}
            {profile?.favoriteCoffices && profile.favoriteCoffices.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FavoriteIcon sx={{ color: colors.primary.main, mr: 1 }} />
                  <Typography variant="h6" sx={{ color: colors.text.primary }}>
                    Favorite Coffices
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text.secondary, ml: 1 }}>
                    ({profile.favoriteCoffices.length})
                  </Typography>
                </Box>
                
                {favoriteCofficesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <LoadingSpinner />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {favoriteCoffices.map((coffice) => (
                      <Grid item xs={12} sm={6} key={coffice.placeId}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 4
                            }
                          }}
                          onClick={() => navigate(`/coffice/${coffice.placeId}`)}
                        >
                          <CardMedia
                            component="img"
                            height="120"
                            image={getPhotoUrl(coffice.photo)}
                            alt={coffice.name}
                            sx={{ objectFit: 'cover' }}
                            onError={e => { e.target.onerror = null; e.target.src = '/logo512.png'; }}
                          />
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: colors.text.primary, mb: 0.5, fontWeight: 500 }}>
                              {coffice.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOnIcon sx={{ fontSize: 16, color: colors.text.secondary }} />
                              <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                {coffice.address}
                              </Typography>
                            </Box>
                            {coffice.rating && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                  ⭐ {coffice.rating}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Empty state for favorite coffices */}
            {profile?.favoriteCoffices && profile.favoriteCoffices.length === 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FavoriteIcon sx={{ color: colors.text.disabled, mr: 1 }} />
                  <Typography variant="h6" sx={{ color: colors.text.primary }}>
                    Favorite Coffices
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: colors.text.disabled, fontStyle: 'italic' }}>
                  No favorite coffices yet. Visit some coffices and add them to your favorites!
                </Typography>
              </Box>
            )}

            {/* Edit Actions */}
            {isEditing && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
                {error && (
                  <Typography variant="body2" sx={{ color: 'error.main', textAlign: 'center' }}>
                    {error}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    onClick={handleSave}
                    variant="contained"
                    sx={{ backgroundColor: colors.primary.main, flex: 1 }}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outlined"
                    sx={{ borderColor: colors.border, color: colors.text.secondary, flex: 1 }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}

            {/* Edit Profile Button (when not editing) */}
            {isOwnProfile && !isEditing && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  onClick={handleEditToggle}
                  variant="outlined"
                  sx={{ 
                    borderColor: colors.border, 
                    color: colors.text.secondary,
                    '&:hover': {
                      borderColor: colors.primary.main,
                      color: colors.primary.main
                    }
                  }}
                >
                  Edit Profile
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default ProfilePage; 