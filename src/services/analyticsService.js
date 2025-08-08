import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebaseConfig';

class AnalyticsService {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
  }

  logEvent(eventName, parameters = {}) {
    if (!this.isEnabled) {
      return;
    }

    try {
      logEvent(analytics, eventName, {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        ...parameters
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  // App lifecycle events
  trackAppLoaded() {
    this.logEvent('app_loaded');
  }

  trackPageView(pageName, parameters = {}) {
    this.logEvent('page_view', {
      page_name: pageName,
      ...parameters
    });
  }

  // Search and discovery events
  trackSearchInitiated(query, source) {
    this.logEvent('search_initiated', {
      search_query: query,
      search_source: source
    });
  }

  trackSearchSuggestionClicked(suggestion, position) {
    this.logEvent('search_suggestion_clicked', {
      suggestion: suggestion,
      position: position
    });
  }

  trackCurrentLocationUsed() {
    this.logEvent('current_location_used');
  }

  // Map interaction events
  trackMapMarkerClicked(placeId, placeName, hasRatings, isRatedCoffice, placeTypes) {
    this.logEvent('map_marker_clicked', {
      place_id: placeId,
      place_name: placeName,
      has_ratings: hasRatings,
      is_rated_coffice: isRatedCoffice,
      place_types: placeTypes
    });
  }

  trackMapMoved(bounds, zoomLevel) {
    this.logEvent('map_moved', {
      bounds: bounds,
      zoom_level: zoomLevel
    });
  }

  // Rating events
  trackRatingFormStarted(placeId, placeName) {
    this.logEvent('rating_form_started', {
      place_id: placeId,
      place_name: placeName
    });
  }

  trackRatingSubmitted(placeId, placeName, isNewRating, ratingValues) {
    this.logEvent('rating_submitted', {
      place_id: placeId,
      place_name: placeName,
      is_new_rating: isNewRating,
      rating_values: ratingValues
    });
  }

  trackFirstRatingSubmitted(placeId, placeName) {
    this.logEvent('first_rating_submitted', {
      place_id: placeId,
      place_name: placeName
    });
  }

  trackRatingSubmissionError(placeId, error) {
    this.logEvent('rating_submission_error', {
      place_id: placeId,
      error: error
    });
  }

  // Place details events
  trackPlaceDetailsViewed(placeId, placeName, hasRatings) {
    this.logEvent('place_details_viewed', {
      place_id: placeId,
      place_name: placeName,
      has_ratings: hasRatings
    });
  }

  trackPlaceDetailsClosed(placeId) {
    this.logEvent('place_details_closed', {
      place_id: placeId
    });
  }

  trackRateButtonClicked(placeId, placeName) {
    this.logEvent('rate_button_clicked', {
      place_id: placeId,
      place_name: placeName
    });
  }

  // Favorite events
  trackFavoriteAdded(placeId, placeName) {
    this.logEvent('favorite_added', {
      place_id: placeId,
      place_name: placeName
    });
  }

  trackFavoriteRemoved(placeId, placeName) {
    this.logEvent('favorite_removed', {
      place_id: placeId,
      place_name: placeName
    });
  }

  trackFavoritesViewed() {
    this.logEvent('favorites_viewed');
  }

  // Sharing events
  trackShareInitiated(placeId, placeName) {
    this.logEvent('share_initiated', {
      place_id: placeId,
      place_name: placeName
    });
  }

  trackShareMethodSelected(placeId, method) {
    this.logEvent('share_method_selected', {
      place_id: placeId,
      share_method: method
    });
  }

  trackShareCompleted(placeId, method) {
    this.logEvent('share_completed', {
      place_id: placeId,
      share_method: method
    });
  }

  // Authentication events
  trackSignInInitiated(method) {
    this.logEvent('sign_in_initiated', {
      sign_in_method: method
    });
  }

  trackSignInCompleted(method) {
    this.logEvent('sign_in_completed', {
      sign_in_method: method
    });
  }

  trackSignOut() {
    this.logEvent('sign_out');
  }

  // Error tracking
  trackError(errorType, errorMessage, context = {}) {
    this.logEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      ...context
    });
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
