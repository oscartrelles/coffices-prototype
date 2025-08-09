const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Places API endpoint for nearby search
exports.nearbySearch = functions.https.onCall(async (data, context) => {
  try {
    const { location, radius = 1000, types = ['cafe'], keyword = 'cafe coffee shop wifi laptop' } = data;
    
    if (!location || !location.lat || !location.lng) {
      throw new functions.https.HttpsError('invalid-argument', 'Location is required');
    }

    // Build the Places API request URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: radius.toString(),
      types: types.join('|'),
      keyword: keyword,
      key: functions.config().google.server_api_key // Secure server-side API key
    });

    const url = `${baseUrl}?${params.toString()}`;
    
    console.log('Making Places API request:', url);
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK') {
      console.log(`Found ${response.data.results.length} places`);
      return {
        status: 'OK',
        results: response.data.results,
        nextPageToken: response.data.next_page_token
      };
    } else {
      console.error('Places API error:', response.data.status, response.data.error_message);
      throw new functions.https.HttpsError('internal', `Places API error: ${response.data.status}`);
    }
    
  } catch (error) {
    console.error('Error in nearbySearch function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Places API endpoint for place details
exports.getPlaceDetails = functions.https.onCall(async (data, context) => {
  try {
    const { placeId, fields = 'name,geometry,vicinity,formatted_address,place_id' } = data;
    
    if (!placeId) {
      throw new functions.https.HttpsError('invalid-argument', 'Place ID is required');
    }

    // Build the Places API request URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = new URLSearchParams({
      place_id: placeId,
      fields: fields,
      key: functions.config().google.server_api_key
    });

    const url = `${baseUrl}?${params.toString()}`;
    
    console.log('Making Place Details API request for:', placeId);
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK') {
      console.log('Place details retrieved successfully');
      return {
        status: 'OK',
        result: response.data.result
      };
    } else {
      console.error('Place Details API error:', response.data.status, response.data.error_message);
      throw new functions.https.HttpsError('internal', `Place Details API error: ${response.data.status}`);
    }
    
  } catch (error) {
    console.error('Error in getPlaceDetails function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Batch place details endpoint
exports.batchGetPlaceDetails = functions.https.onCall(async (data, context) => {
  try {
    const { placeIds, fields = 'name,geometry,vicinity,formatted_address,place_id' } = data;
    
    if (!placeIds || !Array.isArray(placeIds) || placeIds.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Place IDs array is required');
    }

    console.log(`Batch processing ${placeIds.length} place IDs`);
    
    // Process place IDs in batches of 5 to avoid rate limiting
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < placeIds.length; i += batchSize) {
      const batch = placeIds.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (placeId) => {
        try {
          const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
          const params = new URLSearchParams({
            place_id: placeId,
            fields: fields,
            key: functions.config().google.server_api_key
          });

          const url = `${baseUrl}?${params.toString()}`;
          const response = await axios.get(url);
          
          if (response.data.status === 'OK') {
            return response.data.result;
          } else {
            console.error(`Error getting details for ${placeId}:`, response.data.status);
            return null;
          }
        } catch (error) {
          console.error(`Error processing place ${placeId}:`, error.message);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < placeIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`Successfully retrieved ${results.length} place details`);
    return {
      status: 'OK',
      results: results
    };
    
  } catch (error) {
    console.error('Error in batchGetPlaceDetails function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Social Media Crawler Detection and Meta Tag Generation
exports.socialPreview = functions.https.onRequest(async (req, res) => {
  try {
    const userAgent = req.get('User-Agent') || '';
    const isCrawler = detectSocialCrawler(userAgent);
    
    console.log('Social Preview Request:', {
      path: req.path,
      userAgent: userAgent,
      isCrawler: isCrawler
    });

    // Track analytics for social sharing requests
    const analyticsData = {
      event: 'social_crawler_request',
      timestamp: new Date().toISOString(),
      path: req.path,
      userAgent: userAgent,
      isCrawler: isCrawler,
      crawlerType: detectCrawlerType(userAgent)
    };

    // If not a crawler, serve the standard React app HTML
    if (!isCrawler) {
      try {
        // Serve the built React app's index.html with correct script references
        const reactAppHTML = getBuiltReactAppHTML();
        res.set('Content-Type', 'text/html');
        return res.send(reactAppHTML);
      } catch (error) {
        console.error('Error serving React app HTML:', error);
        // Fallback to basic redirect
        return res.redirect(301, `https://find-a-coffice.web.app`);
      }
    }

    // Extract place ID from URL
    const pathParts = req.path.split('/');
    const cofficeIndex = pathParts.indexOf('coffice');
    
    if (cofficeIndex === -1 || cofficeIndex === pathParts.length - 1) {
      // Not a coffice URL, serve default meta tags
      return serveDefaultHTML(res);
    }

    const placeId = pathParts[cofficeIndex + 1];
    console.log('Extracted place ID:', placeId);

    // Fetch coffice data from Firestore
    const cofficeData = await getCofficeData(placeId);
    
    if (!cofficeData) {
      console.log('No coffice data found for:', placeId);
      return serveDefaultHTML(res);
    }

    // Generate and serve HTML with dynamic meta tags
    const html = generateCofficeHTML(cofficeData, req);
    res.set('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Error in socialPreview function:', error);
    return serveDefaultHTML(res);
  }
});

// Helper function to detect social media crawlers
function detectSocialCrawler(userAgent) {
  const crawlers = [
    'facebookexternalhit',
    'Facebookbot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'SkypeUriPreview',
    'SlackBot',
    'TelegramBot',
    'applebot',
    'discordbot',
    'bitlybot'
  ];
  
  return crawlers.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

// Helper function to detect specific crawler type for analytics
function detectCrawlerType(userAgent) {
  const ua = userAgent.toLowerCase();
  if (ua.includes('facebookexternalhit') || ua.includes('facebookbot')) return 'facebook';
  if (ua.includes('twitterbot')) return 'twitter';
  if (ua.includes('linkedinbot')) return 'linkedin';
  if (ua.includes('whatsapp')) return 'whatsapp';
  if (ua.includes('slackbot')) return 'slack';
  if (ua.includes('discordbot')) return 'discord';
  if (ua.includes('telegrambot')) return 'telegram';
  if (ua.includes('applebot')) return 'apple';
  if (ua.includes('skypeuripreview')) return 'skype';
  if (ua.includes('bitlybot')) return 'bitly';
  return 'unknown';
}

// Helper function to get coffice data from Firestore
async function getCofficeData(placeId) {
  try {
    const db = admin.firestore();
    const cofficeDoc = await db.collection('coffices').doc(placeId).get();
    
    if (!cofficeDoc.exists) {
      console.log('Coffice document not found:', placeId);
      return null;
    }
    
    const data = cofficeDoc.data();
    console.log('Retrieved coffice data:', {
      name: data.name,
      hasRatings: !!data.averageRatings,
      location: data.location
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching coffice data:', error);
    return null;
  }
}

// Helper function to generate dynamic HTML with meta tags
function generateCofficeHTML(cofficeData, req) {
  const baseUrl = `https://${req.get('host')}`;
  const cofficeUrl = `${baseUrl}/coffice/${cofficeData.placeId}`;
  
  // Generate description based on ratings
  const description = generateDescription(cofficeData);
  
  // Generate title
  const title = `${cofficeData.name} - Remote Work Coffee Shop | Coffices`;
  
  // Get image URL (use venue photo or default)
  const imageUrl = cofficeData.mainImageUrl || `${baseUrl}/Coffices.PNG`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <link rel="icon" href="${baseUrl}/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#4CAF50" />
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="${title}">
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="place">
    <meta property="og:url" content="${cofficeUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Coffices">
    <meta property="og:locale" content="en_US">
    
    <!-- Location-specific Open Graph -->
    ${cofficeData.location ? `
    <meta property="og:latitude" content="${cofficeData.location.lat}">
    <meta property="og:longitude" content="${cofficeData.location.lng}">
    ` : ''}
    ${cofficeData.vicinity ? `
    <meta property="og:street-address" content="${cofficeData.vicinity}">
    <meta property="og:locality" content="${cofficeData.vicinity}">
    ` : ''}
    <meta property="og:region" content="US">
    <meta property="og:country-name" content="United States">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${cofficeUrl}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${imageUrl}">
    <meta property="twitter:site" content="@coffices">
    
    <!-- Additional Meta Tags -->
    <meta name="robots" content="index, follow">
    <meta name="author" content="Coffices">
    <meta name="keywords" content="coffee shop, remote work, ${cofficeData.name}, WiFi, power outlets, ${cofficeData.vicinity || 'coffee'}">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(generateStructuredData(cofficeData, cofficeUrl, imageUrl))}
    </script>
    
    <!-- Redirect to app for real users -->
    <script>
    setTimeout(function() {
        window.location.href = '${cofficeUrl}';
    }, 1000);
    </script>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
        <h1>${cofficeData.name}</h1>
        <p>${description}</p>
        <p>📍 ${cofficeData.vicinity || 'Coffee Shop'}</p>
        ${cofficeData.averageRatings ? generateRatingsDisplay(cofficeData.averageRatings) : ''}
        <p><a href="${cofficeUrl}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View on Coffices →</a></p>
    </div>
</body>
</html>`;
}

// Helper function to generate description based on ratings
function generateDescription(cofficeData) {
  if (!cofficeData.averageRatings) {
    return `${cofficeData.name} - A great coffee shop for remote work. Find WiFi quality, power outlets, noise levels, and coffee ratings on Coffices.`;
  }
  
  const ratings = cofficeData.averageRatings;
  const features = [];
  
  if (ratings.wifi >= 4) features.push('excellent WiFi');
  if (ratings.power >= 4) features.push('plenty of power outlets');
  if (ratings.noise <= 2) features.push('quiet atmosphere');
  if (ratings.coffee >= 4) features.push('great coffee');
  
  const featuresText = features.length > 0 ? ` Known for ${features.join(', ')}.` : '';
  const ratingText = ` Average rating: ${((ratings.wifi + ratings.power + ratings.coffee) / 3).toFixed(1)}/5 stars.`;
  
  return `${cofficeData.name} - Perfect coffee shop for remote work.${featuresText}${ratingText} ${cofficeData.vicinity || ''}`;
}

// Helper function to generate structured data
function generateStructuredData(cofficeData, url, imageUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "name": cofficeData.name,
    "description": `Coffee shop for remote work: ${cofficeData.name}. Great WiFi, power outlets, and workspace for digital nomads.`,
    "url": url,
    "image": imageUrl,
    "address": cofficeData.vicinity ? {
      "@type": "PostalAddress",
      "streetAddress": cofficeData.vicinity,
      "addressLocality": cofficeData.vicinity,
      "addressCountry": "US"
    } : undefined,
    "geo": cofficeData.location ? {
      "@type": "GeoCoordinates",
      "latitude": cofficeData.location.lat,
      "longitude": cofficeData.location.lng
    } : undefined,
    "aggregateRating": cofficeData.averageRatings ? {
      "@type": "AggregateRating",
      "ratingValue": ((cofficeData.averageRatings.wifi + cofficeData.averageRatings.power + cofficeData.averageRatings.coffee) / 3).toFixed(1),
      "bestRating": 5,
      "worstRating": 1,
      "reviewCount": cofficeData.ratingsCount || 1
    } : undefined,
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "WiFi",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Power Outlets",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Coffee",
        "value": true
      }
    ]
  };
}

// Helper function to generate ratings display
function generateRatingsDisplay(ratings) {
  return `
    <div style="margin: 20px 0;">
        <div>📶 WiFi: ${'★'.repeat(Math.round(ratings.wifi))}${'☆'.repeat(5-Math.round(ratings.wifi))} (${ratings.wifi.toFixed(1)})</div>
        <div>🔌 Power: ${'★'.repeat(Math.round(ratings.power))}${'☆'.repeat(5-Math.round(ratings.power))} (${ratings.power.toFixed(1)})</div>
        <div>🔊 Noise: ${'★'.repeat(5-Math.round(ratings.noise))}${'☆'.repeat(Math.round(ratings.noise))} (${(5-ratings.noise).toFixed(1)})</div>
        <div>☕ Coffee: ${'★'.repeat(Math.round(ratings.coffee))}${'☆'.repeat(5-Math.round(ratings.coffee))} (${ratings.coffee.toFixed(1)})</div>
    </div>
  `;
}

// Helper function to get the actual built React app HTML
function getBuiltReactAppHTML() {
  // This is the exact HTML from the built React app (build/index.html)
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><link rel="icon" href="/favicon.ico"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#000000"/><meta name="description" content="Discover and rate the best coffee shops for remote work. Find coffices with great WiFi, power outlets, and coffee quality."/><meta name="keywords" content="coffice, coffee shop, remote work, wifi, power outlets, coffee quality"/><meta name="author" content="Coffices"/><meta property="og:type" content="website"/><meta property="og:url" content=""/><meta property="og:title" content="Coffices - Find Your Perfect Remote Work Coffee Shop"/><meta property="og:description" content="Discover and rate the best coffee shops for remote work. Find coffices with great WiFi, power outlets, and coffee quality."/><meta property="og:image" content="/Coffices.PNG"/><meta property="twitter:card" content="summary_large_image"/><meta property="twitter:url" content=""/><meta property="twitter:title" content="Coffices - Find Your Perfect Remote Work Coffee Shop"/><meta property="twitter:description" content="Discover and rate the best coffee shops for remote work. Find coffices with great WiFi, power outlets, and coffee quality."/><meta property="twitter:image" content="/Coffices.PNG"/><link rel="apple-touch-icon" href="/Coffices.PNG"/><link rel="manifest" href="/manifest.json"/><title>Coffices - Find Your Perfect Remote Work Coffee Shop</title><script defer="defer" src="/static/js/main.3bbbf10b.js"></script><link href="/static/css/main.7ff33ee3.css" rel="stylesheet"></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>`;
}

// Helper function to serve default HTML for non-coffice URLs
function serveDefaultHTML(res) {
  const defaultHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Coffices - Find the Best Coffee Shops for Remote Work</title>
    <meta name="description" content="Discover and rate the best coffee shops for remote work. Find great WiFi, power outlets, and coffee quality.">
    
    <!-- Open Graph -->
    <meta property="og:title" content="Coffices - Find the Best Coffee Shops for Remote Work">
    <meta property="og:description" content="Discover and rate the best coffee shops for remote work. Find great WiFi, power outlets, and coffee quality.">
    <meta property="og:image" content="https://findacoffice.com/Coffices.PNG">
    <meta property="og:type" content="website">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="Coffices - Find the Best Coffee Shops for Remote Work">
    <meta property="twitter:description" content="Discover and rate the best coffee shops for remote work. Find great WiFi, power outlets, and coffee quality.">
    <meta property="twitter:image" content="https://findacoffice.com/Coffices.PNG">
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
        <h1>Coffices</h1>
        <p>Find the Best Coffee Shops for Remote Work</p>
        <p><a href="https://findacoffice.com" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Visit Coffices →</a></p>
    </div>
</body>
</html>`;
  
  res.set('Content-Type', 'text/html');
  res.send(defaultHTML);
} 