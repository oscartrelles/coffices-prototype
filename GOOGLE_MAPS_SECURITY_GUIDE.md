# Google Maps API Security Guide

## Overview
This guide addresses the Google Cloud security recommendation for your Maps Platform API Key and provides step-by-step instructions to secure your API usage.

## Current Situation
- **API Key ID**: 336fc8b4-c0e4-4eab-a699-f8772744c6f4
- **Project**: Find a Coffice (find-a-coffice-441008)
- **Issue**: API key lacks proper restrictions
- **APIs Used**: Maps JavaScript API, Places API, Places API (New)

## Immediate Actions Required

### 1. Add Website Restrictions

Go to [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials) and add these website restrictions to your API key:

**Production:**
- `https://findacoffice.com/*`

**Staging:**
- `https://find-a-coffice.web.app/*`

**Development:**
- `http://localhost:3000/*`
- `http://127.0.0.1:3000/*`

### 2. Add API Restrictions

Restrict your API key to only the APIs you're using:

- ✅ Maps JavaScript API
- ✅ Places API  
- ✅ Places API (New)

### 3. Optional: Split API Keys for Better Security

For enhanced security and cost control, consider creating separate API keys:

#### Key 1: Maps Display Key
- **Purpose**: Maps JavaScript API only
- **Restrictions**: Same website restrictions as above
- **Usage**: Map rendering, markers, basic map functionality

#### Key 2: Places Key  
- **Purpose**: Places API and Places API (New) only
- **Restrictions**: Same website restrictions as above
- **Usage**: Autocomplete, place details, nearby search

## Implementation Changes Made

### 1. Centralized API Key Management
Created `src/config/apiKeys.js` to centralize API key configuration:

```javascript
const getApiKeys = () => {
  const { mapsApiKey, placesApiKey } = getApiKeys();
  // Environment detection and validation
  return config;
};
```

### 2. Updated Components
- Updated `src/hooks/useGoogleMaps.js` to use centralized configuration
- Updated `src/App.js` to use centralized configuration
- Added environment detection for better debugging

### 3. Environment Variables
Ensure these environment variables are set:

```bash
# Required
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Optional (if splitting keys)
REACT_APP_GOOGLE_PLACES_API_KEY=your_places_api_key
```

## Security Best Practices

### 1. Never Expose API Keys in Client-Side Code
- ✅ Use environment variables (REACT_APP_*)
- ❌ Never hardcode API keys
- ❌ Never commit API keys to version control

### 2. Regular Monitoring
- Monitor API usage in Google Cloud Console
- Set up billing alerts
- Review API key restrictions monthly

### 3. Environment-Specific Keys
Consider using different API keys for:
- Development
- Staging  
- Production

## Cost Optimization

### 1. Implement Caching
- Cache place details to reduce API calls
- Use local storage for frequently accessed data
- Implement request debouncing for search

### 2. Monitor Usage
- Track API calls by feature
- Identify high-usage patterns
- Optimize expensive operations

## Troubleshooting

### Common Issues

1. **"RefererNotAllowedMapError"**
   - Check website restrictions in Google Cloud Console
   - Ensure exact domain match (including protocol)

2. **"ApiNotEnabledMapError"**
   - Enable required APIs in Google Cloud Console
   - Check API restrictions on your key

3. **"OverQuotaMapError"**
   - Monitor usage in Google Cloud Console
   - Implement caching and optimization
   - Consider upgrading quota limits

### Debug Mode
The new configuration includes environment logging:

```javascript
console.log('API Key Environment:', getApiKeys().environment);
console.log('Hostname:', getApiKeys().hostname);
```

## Next Steps

1. **Immediate**: Add website and API restrictions in Google Cloud Console
2. **Short-term**: Monitor API usage and implement caching
3. **Long-term**: Consider splitting API keys for better security

## Resources

- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
- [Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices) 