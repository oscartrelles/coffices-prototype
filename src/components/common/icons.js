/**
 * Icon constants used throughout the application
 * Using emojis for now, but can be replaced with custom icons or icon components
 */

import WifiIcon from '@mui/icons-material/Wifi';
import PowerIcon from '@mui/icons-material/Power';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CoffeeIcon from '@mui/icons-material/Coffee';

// Rating category icons
export const RATING_ICONS = {
  power: PowerIcon,
  wifi: WifiIcon,
  noise: VolumeUpIcon,
  coffee: CoffeeIcon,
  total: '👥',
  google: '⭐',
  noRatings: '📝'
};

// Rating categories array for consistent ordering
export const RATING_CATEGORIES = ['power', 'wifi', 'noise', 'coffee'];

// Optional: Add icon descriptions for accessibility
export const ICON_DESCRIPTIONS = {
  power: 'Power outlets availability',
  wifi: 'WiFi quality',
  noise: 'Ambient noise level',
  coffee: 'Coffee quality',
  total: 'Total number of ratings',
  google: 'Google rating',
  noRatings: 'No ratings available'
};

// Optional: Add helper function to get icon with fallback
export const getIcon = (key, fallback = '❓') => RATING_ICONS[key] || fallback; 