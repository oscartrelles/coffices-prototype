# Coffices App Documentation

## Overview
Coffices is a web application that helps users find coffee shops suitable for working. It combines the words "Coffee" and "Office" to create a platform for digital nomads and remote workers to find their next workspace.

## Github repo
https://github.com/oscartrelles/coffices-prototype

## Design Philosophy
- **Mobile-First**: All components are designed for mobile devices first, then scaled up for larger screens
- **Responsive**: App adapts smoothly across all device sizes
- **Touch-Friendly**: Interactive elements are sized and spaced for touch input (min 44px touch targets)
- **Performance**: Optimized for mobile networks and devices

## Responsive Breakpoints

css
// Mobile first breakpoints
$breakpoints: (
'small': 320px, // Small phones
'medium': 375px, // Large phones
'tablet': 768px, // Tablets
'desktop': 1024px, // Desktop
'large': 1440px // Large screens
);


## UI Components Guidelines
1. **Search Bar**
   - Full width on mobile
   - Centered with max-width on larger screens
   - Touch-friendly input height (min 48px)
   - Clear visual feedback states

2. **Map Controls**
   - Positioned for easy thumb reach on mobile
   - Larger click targets for touch
   - Collapsible on small screens

3. **Info Windows**
   - Compact on mobile, expandable for more info
   - Bottom sheet pattern on small screens
   - Modal on larger screens

4. **Filters**
   - Slide-up panel on mobile
   - Sidebar on desktop
   - Touch-friendly toggles

## Testing Requirements
- Test on real mobile devices
- Test different screen orientations
- Test touch interactions
- Test on slow networks
- Test with different pixel densities

## Performance Targets
- First Contentful Paint: < 1.8s
- Time to Interactive: < 3.5s
- Speed Index: < 3.0s
- Mobile performance score: > 90

## Best Practices
- Use relative units (rem, vh, vw)
- Implement touch gestures where appropriate
- Test with different font sizes
- Ensure sufficient color contrast
- Maintain tap target spacing


## Core Features

### 1. Map Interface
- Interactive Google Maps integration
- Default center: user's location or, if unavailable, Málaga, Spain (36.7213028, -4.4216366)
- Default zoom level: 15
- Search radius: 1.5km
- Features:
  - Automatic geolocation detection
  - Custom URL routing (e.g., /s/barcelona)
  - Marker clustering for dense areas
  - Custom coffee shop markers with branded icons
  - Dynamic search on map movement

### 2. Search & Navigation
#### SearchBar Component
- Features:
  - Google Places Autocomplete integration
  - Current location button
  - URL updates with location name
  - Responsive design
  - Mobile-friendly interface

#### Search Functionality
- Autocomplete suggestions for:
  - Geographic locations
  - Establishments
- Fields retrieved:
  - Place name
  - Geometry (coordinates)
  - Formatted address
- URL Structure:
  - Search by location: /s/:locationName
  - Current location: /s/current-location

#### Location Button
- Uses browser's geolocation API
- Fallback to default location (Málaga)
- Updates URL accordingly
- Triggers new search in area

### 3. Place Details & Ratings

#### Rating Display Logic
- Community-rated shops:
  - Custom marker with Coffices branding
  - Display average ratings for:
    - WiFi quality
    - Power outlets
    - Noise level
    - Coffee quality
  - Show total number of community ratings
  - Option to add new rating

- Non-community-rated shops:
  - Standard marker
  - Display Google Places rating
  - Option to be first to rate

#### Marker System
- Community-rated marker:
  - Custom icon with Coffices branding
  - Color: #4285f4 (Coffices Blue)
  - Indicates verified workspace
- Standard marker:
  - Basic circular marker
  - Color: #DB4437 (Google Red)
  - Indicates potential workspace

### 4. User Features
- Authentication:
  - Email/Password login
  - Social logins: Google and Facebook
  - Registration: Name, Email, Password
- Ratings (authenticated users only):
  - Wifi quality (1-5)
  - Power outlets availability (1-5)
  - Noise level (1-5)
  - Coffee quality (1-5)
  - Written reviews

### 5. Technical Implementation
#### Map Component

javascript
// Core configuration
const DEFAULT_LOCATION = { lat: 36.7213028, lng: -4.4216366 };
const DEFAULT_ZOOM = 15;
const SEARCH_RADIUS = 1500;
// Marker styling
const markerIcon = {
path: google.maps.SymbolPath.CIRCLE,
fillColor: "#DB4437",
fillOpacity: 0.9,
scale: 8,
strokeColor: "white",
strokeWeight: 2
};


#### Best Practices
- Initialize Places service after map creation
- Use marker clustering for performance
- Implement debounced search
- Fetch place details on demand
- Clean up resources on unmount

#### Known Limitations
- Places API rate limits
- Clustering density adjustments
- Business status accuracy

## Technical Stack
- React
- Firebase (Authentication & Firestore)
- Google Maps & Places API
- Material-UI
- React Router

## URL Structure
- /: Homepage
- /s/:location: Search results
- /shop/:id: Coffee shop details
- /profile: User profile
- /favorites: Saved locations

## Rating Schema

json
{
"rating": {
"userId": "string",
"userName": "string",
"cofficeId": "string",
"timestamp": "timestamp",
"scores": {
"wifi": "number(1-5)",
"powerOutlets": "number(1-5)",
"noise": "number(1-5)",
"coffeeQuality": "number(1-5)"
},
"comment": "string"
}
}


## Future Features
- Filtering options
- Community features
- Mobile app version
- Offline support
- Multi-language support

## Project Structure

coffices-prototype/
├── public/ # Static files
└── src/ # Source files
├── components/ # Reusable components
│ ├── auth/ # Authentication components
│ ├── Map.js # Map component
│ ├── Modal.js # Modal component
│ └── SearchBar.js # Search bar component
├── pages/ # Page components
│ └── MapPage.js # Main map page
├── App.css # Global styles
├── App.js # Main app component
├── App.test.js # App tests
├── CoffeeShopProfile.js # Coffee shop details
├── FilterPanel.js # Search filters
├── firebaseConfig.js # Firebase configuration
├── index.css # Entry point styles
├── index.js # App entry point
├── Map.js # Map logic
├── RatingForm.js # Rating submission form
├── reportWebVitals.js # Performance reporting
├── SearchBar.js # Search functionality
├── setupTests.js # Test configuration
└── styles.css # Additional styles
├── .env # Environment variables
├── .firebaserc # Firebase configuration
├── .gitignore # Git ignore rules
├── DOCUMENTATION.md # Project documentation
├── firebase.json # Firebase settings
├── package-lock.json # Dependency lock file
├── package.json # Project dependencies
└── README.md # Project overview


### Key Components

1. **Map Components**
   - `Map.js`: Core map functionality
   - `MapPage.js`: Page wrapper for map
   - `SearchBar.js`: Location search

2. **User Interface**
   - `Modal.js`: Reusable modal component
   - `FilterPanel.js`: Search refinement
   - `CoffeeShopProfile.js`: Venue details

3. **Authentication**
   - `auth/`: Authentication components
   - `firebaseConfig.js`: Firebase setup

4. **Styling**
   - `App.css`: Global styles
   - `index.css`: Entry styles
   - `styles.css`: Component styles

5. **Configuration**
   - `.env`: Environment variables
   - `firebase.json`: Firebase settings
   - `package.json`: Dependencies
