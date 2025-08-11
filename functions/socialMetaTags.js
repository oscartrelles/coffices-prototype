const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// List of social media crawler user agents
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Twitterbot',
  'WhatsApp',
  'LinkedInBot',
  'SkypeUriPreview',
  'SlackBot',
  'DiscordBot',
  'TelegramBot',
  'redditbot',
  'Pinterest',
  'GoogleBot',
  'facebookcatalog',
  'Facebot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'Slackbot',
  'Discordbot',
  'SkypeUriPreview',
  'redditbot',
  'Pinterest',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'Slackbot',
  'Discordbot',
  'SkypeUriPreview',
  'redditbot',
  'Pinterest',
  'Twitterbot'
];

// Check if the request is from a social media crawler
function isCrawler(userAgent) {
  if (!userAgent) return false;
  const lowerUserAgent = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(crawler => 
    lowerUserAgent.includes(crawler.toLowerCase())
  );
}

// Generate rich HTML with meta tags for social media
function generateMetaHTML(config) {
  const {
    title,
    description,
    url,
    image,
    type = 'website',
    publishedTime,
    author = 'Coffices',
    placeName,
    averageRatings,
    totalRatings,
    vicinity
  } = config;

  // Generate rating summary
  let ratingSummary = '';
  if (averageRatings && totalRatings > 0) {
    const ratings = [];
    if (averageRatings.wifi) ratings.push(`WiFi: ${averageRatings.wifi.toFixed(1)}/5`);
    if (averageRatings.power) ratings.push(`Power: ${averageRatings.power.toFixed(1)}/5`);
    if (averageRatings.coffee) ratings.push(`Coffee: ${averageRatings.coffee.toFixed(1)}/5`);
    if (averageRatings.noise) ratings.push(`Noise: ${averageRatings.noise.toFixed(1)}/5`);
    
    if (ratings.length > 0) {
      ratingSummary = `Rated by ${totalRatings} cofficers: ${ratings.join(', ')}`;
    }
  }

  // Enhanced description with ratings
  const enhancedDescription = ratingSummary ? 
    `${description} ${ratingSummary}` : 
    description;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${enhancedDescription}">
  <meta property="og:image" content="${image}">
  <meta property="og:site_name" content="Coffices">
  <meta property="og:locale" content="en_US">
  ${publishedTime ? `<meta property="og:updated_time" content="${publishedTime}">` : ''}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${enhancedDescription}">
  <meta property="twitter:image" content="${image}">
  <meta property="twitter:site" content="@coffices">
  <meta property="twitter:creator" content="@coffices">
  
  <!-- LinkedIn -->
  <meta property="linkedin:owner" content="coffices">
  <meta property="linkedin:title" content="${title}">
  <meta property="linkedin:description" content="${enhancedDescription}">
  <meta property="linkedin:image" content="${image}">
  
  <!-- Additional Meta Tags -->
  <meta name="description" content="${enhancedDescription}">
  <meta name="author" content="${author}">
  <meta name="robots" content="index, follow">
  
  <!-- Structured Data for Rich Snippets -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "${placeName || 'Coffee Shop'}",
    "description": "${enhancedDescription}",
    "url": "${url}",
    "image": "${image}",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "${vicinity || ''}"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "${averageRatings?.wifi ? averageRatings.wifi.toFixed(1) : '0'}",
      "reviewCount": "${totalRatings || 0}"
    },
    "servesCuisine": "Coffee",
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "WiFi",
        "value": "${averageRatings?.wifi ? averageRatings.wifi.toFixed(1) : '0'}/5"
      },
      {
        "@type": "LocationFeatureSpecification", 
        "name": "Power Outlets",
        "value": "${averageRatings?.power ? averageRatings.power.toFixed(1) : '0'}/5"
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Coffee Quality", 
        "value": "${averageRatings?.coffee ? averageRatings.coffee.toFixed(1) : '0'}/5"
      }
    ]
  }
  </script>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 600px;
      text-align: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 40px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    .title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    .description {
      font-size: 1.2rem;
      line-height: 1.6;
      margin-bottom: 30px;
      opacity: 0.9;
    }
    .ratings {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .rating-item {
      background: rgba(255, 255, 255, 0.2);
      padding: 15px 20px;
      border-radius: 15px;
      min-width: 100px;
    }
    .rating-value {
      font-size: 1.5rem;
      font-weight: 700;
      display: block;
    }
    .rating-label {
      font-size: 0.9rem;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .location {
      font-size: 1.1rem;
      opacity: 0.8;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 1rem;
      opacity: 0.7;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: 20px;
    }
    .redirect-note {
      background: rgba(255, 255, 255, 0.2);
      padding: 15px;
      border-radius: 10px;
      margin-top: 20px;
      font-size: 0.9rem;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">${placeName || 'Coffee Shop'}</h1>
    
    <p class="description">${enhancedDescription}</p>
    
    ${vicinity ? `<p class="location">📍 ${vicinity}</p>` : ''}
    
    ${averageRatings && totalRatings > 0 ? `
      <div class="ratings">
        ${averageRatings.wifi ? `
          <div class="rating-item">
            <span class="rating-value">${averageRatings.wifi.toFixed(1)}</span>
            <span class="rating-label">WiFi</span>
          </div>
        ` : ''}
        ${averageRatings.power ? `
          <div class="rating-item">
            <span class="rating-value">${averageRatings.power.toFixed(1)}</span>
            <span class="rating-label">Power</span>
          </div>
        ` : ''}
        ${averageRatings.coffee ? `
          <div class="rating-item">
            <span class="rating-value">${averageRatings.coffee.toFixed(1)}</span>
            <span class="rating-label">Coffee</span>
          </div>
        ` : ''}
        ${averageRatings.noise ? `
          <div class="rating-item">
            <span class="rating-value">${averageRatings.noise.toFixed(1)}</span>
            <span class="rating-label">Noise</span>
          </div>
        ` : ''}
      </div>
      <p style="font-size: 0.9rem; opacity: 0.8;">Rated by ${totalRatings} cofficers</p>
    ` : ''}
    
    <div class="brand">
      <strong>Coffices</strong> - Find the best coffee shops for remote work
    </div>
    
    <div class="redirect-note">
      Redirecting to the full Coffices app...
    </div>
  </div>
  
  <script>
    // Redirect to the main app after a short delay
    setTimeout(() => {
      window.location.href = '${url}';
    }, 2000);
  </script>
</body>
</html>`;
}

// Generate redirect HTML for non-crawler requests
function generateRedirectHTML(url) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to Coffices...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Redirecting to Coffices...</h2>
    <p>If you're not redirected automatically, <a href="${url}">click here</a>.</p>
  </div>
  
  <script>
    // Smart redirect that preserves the deeplink
    // Add a small delay to ensure proper redirect
    setTimeout(() => {
      // Redirect to the same URL but through the main app
      // This preserves the deeplink while ensuring the React app handles it
      window.location.href = '${url}';
    }, 100);
  </script>
</body>
</html>`;
}

// Main function to handle dynamic meta tags
exports.dynamicMetaTags = functions.https.onRequest(async (req, res) => {
  try {
    const userAgent = req.get('User-Agent') || '';
    const url = req.url;
    
    console.log('Dynamic meta tags function called for URL:', url);
    console.log('User Agent:', userAgent);
    
    // Only handle specific routes: /coffice/** and /profile/**
    if (!url.startsWith('/coffice/') && !url.startsWith('/profile/')) {
      console.log('URL not supported by this function, returning 404');
      res.status(404).send('Not Found');
      return;
    }
    
    // Check if this is a social media crawler
    if (!isCrawler(userAgent)) {
      console.log('Non-crawler request detected - serving React app HTML');
      
      // For non-crawler requests, serve the React app HTML directly
      // This allows deeplinks to work properly without infinite loops
      const reactAppHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Discover and rate the best coffee shops for remote work. Find coffices with great WiFi, power outlets, and coffee quality." />
    <meta name="keywords" content="coffice, coffee shop, remote work, wifi, power outlets, coffee quality" />
    <meta name="author" content="Coffices" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="" />
    <meta property="og:title" content="Coffices - Find Your Perfect Remote Work Coffee Shop" />
    <meta property="og:description" content="Discover and rate the best coffee shops for remote work. Find coffices with great WiFi, power outlets, and coffee quality." />
    <meta property="og:image" content="/Coffices.PNG" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="" />
    <meta property="twitter:title" content="Coffices - Find Your Perfect Remote Work Coffee Shop" />
    <meta property="twitter:description" content="Discover and rate the best coffee shops for remote work. Find coffices with great WiFi, power outlets, and coffee quality." />
    <meta property="twitter:image" content="/Coffices.PNG" />
    <link rel="apple-touch-icon" href="/Coffices.PNG" />
    <link rel="manifest" href="/manifest.json" />
    <title>Coffices - Find Your Perfect Remote Work Coffee Shop</title>
    <script defer="defer" src="/static/js/main.7654533a.js"></script>
    <link href="/static/css/main.7ff33ee3.css" rel="stylesheet">
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;
      
      res.set('Content-Type', 'text/html');
      res.send(reactAppHtml);
      return;
    }
    
    console.log('Crawler detected, generating rich meta tags');
    
    // Parse the URL to extract place ID
    let placeId = null;
    
    // Handle different URL patterns
    if (url === '/' || url === '') {
      // Handle root path - main app
      console.log('Root path detected, serving main app meta tags');
      const mainAppHtml = generateMetaHTML({
        title: 'Coffices - Find the Best Coffee Shops for Remote Work',
        description: 'Discover and rate the best coffee shops for remote work. Find great WiFi, power outlets, and coffee quality. Perfect for remote workers, freelancers, and digital nomads.',
        url: `https://${req.get('host')}${url}`,
        image: `https://${req.get('host')}/Coffices.PNG`,
        type: 'website',
        placeName: 'Coffices',
        vicinity: 'Remote Work Coffee Shops',
        publishedTime: new Date().toISOString()
      });
      
      res.set('Content-Type', 'text/html');
      res.send(mainAppHtml);
      return;
    } else if (url.startsWith('/coffice/')) {
      placeId = url.split('/coffice/')[1]?.split('?')[0]?.split('#')[0];
    } else if (url.startsWith('/profile/')) {
      // Handle profile pages
      const profileId = url.split('/profile/')[1]?.split('?')[0]?.split('#')[0];
      
      if (profileId && profileId !== '') {
        console.log('Fetching profile data for user ID:', profileId);
        
        try {
          // Fetch profile data from Firestore
          const profileRef = db.collection('profiles').doc(profileId);
          const profileDoc = await profileRef.get();
          
          if (profileDoc.exists) {
            const profileData = profileDoc.data();
            console.log('Profile data retrieved:', {
              displayName: profileData.displayName,
              email: profileData.email
            });
            
            // Generate profile meta tags HTML
            const profileHtml = generateMetaHTML({
              title: `${profileData.displayName || 'Cofficer'} - Coffices Profile`,
              description: `${profileData.displayName || 'Cofficer'} is a cofficer on Coffices. ${profileData.favoriteCoffices?.length > 0 ? 
                `Has ${profileData.favoriteCoffices.length} favorite coffee shops for remote work. ` : 
                'Discovering great coffee shops for remote work. '
              }Join the community of remote workers finding the best coffee shops!`,
              url: `https://${req.get('host')}${url}`,
              image: profileData.photoURL || `https://${req.get('host')}/Coffices.PNG`,
              type: 'profile',
              placeName: profileData.displayName || 'Cofficer',
              vicinity: 'Coffices Community',
              publishedTime: profileData.createdAt || new Date().toISOString()
            });
            
            res.set('Content-Type', 'text/html');
            res.send(profileHtml);
            return;
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      }
    }
    
    if (!placeId) {
      console.log('No place ID found in URL, serving default meta tags');
      const defaultHtml = generateMetaHTML({
        title: 'Coffices - Find the Best Coffee Shops for Remote Work',
        description: 'Discover and rate the best coffee shops for remote work. Find great WiFi, power outlets, and coffee quality.',
        url: `https://${req.get('host')}${url}`,
        image: `https://${req.get('host')}/Coffices.PNG`,
        type: 'website',
        placeName: 'Coffices',
        vicinity: 'Remote Work Coffee Shops'
      });
      res.set('Content-Type', 'text/html');
      res.send(defaultHtml);
      return;
    }
    
    console.log('Fetching coffice data for place ID:', placeId);
    
    // Fetch coffice data from Firestore
    const cofficeRef = db.collection('coffices').doc(placeId);
    const cofficeDoc = await cofficeRef.get();
    
    if (!cofficeDoc.exists) {
      console.log('Coffice not found, serving default meta tags');
      const defaultHtml = generateMetaHTML({
        title: 'Coffice Not Found - Coffices',
        description: 'This coffice could not be found. Discover other great coffee shops for remote work on Coffices.',
        url: `https://${req.get('host')}${url}`,
        image: `https://${req.get('host')}/Coffices.PNG`,
        type: 'website',
        placeName: 'Coffice Not Found',
        vicinity: 'Remote Work Coffee Shops'
      });
      res.set('Content-Type', 'text/html');
      res.send(defaultHtml);
      return;
    }
    
    const cofficeData = cofficeDoc.data();
    console.log('Coffice data retrieved:', {
      name: cofficeData.name,
      vicinity: cofficeData.vicinity,
      totalRatings: cofficeData.totalRatings
    });
    
    // Generate meta tags HTML
    const metaHtml = generateMetaHTML({
      title: `${cofficeData.name} - Remote Work Coffee Shop | Coffices`,
      description: `${cofficeData.name} - Perfect coffee shop for remote work! ${cofficeData.totalRatings > 0 ? 
        `Rated by ${cofficeData.totalRatings} cofficers with great WiFi, power outlets, and quality coffee. ` : 
        'Be the first to rate this coffice! '
      }Located in ${cofficeData.vicinity}. Great for remote work with WiFi, power outlets, and quality coffee.`,
      url: `https://${req.get('host')}${url}`,
      image: cofficeData.mainImageUrl || `https://${req.get('host')}/Coffices.PNG`,
      type: 'restaurant',
      placeName: cofficeData.name,
      vicinity: cofficeData.vicinity,
      averageRatings: cofficeData.averageRatings || {},
      totalRatings: cofficeData.totalRatings || 0,
      publishedTime: cofficeData.lastUpdated || new Date().toISOString()
    });
    
    console.log('Serving rich meta tags HTML for crawler');
    res.set('Content-Type', 'text/html');
    res.send(metaHtml);
    
  } catch (error) {
    console.error('Error in dynamicMetaTags function:', error);
    
    // Fallback to default meta tags on error
    const fallbackHtml = generateMetaHTML({
      title: 'Coffices - Find the Best Coffee Shops for Remote Work',
      description: 'Discover and rate the best coffee shops for remote work. Find great WiFi, power outlets, and coffee quality.',
      url: `https://${req.get('host')}${url}`,
      image: `https://${req.get('host')}/Coffices.PNG`,
      type: 'website',
      placeName: 'Coffices',
      vicinity: 'Remote Work Coffee Shops'
    });
    
    res.set('Content-Type', 'text/html');
    res.status(500).send(fallbackHtml);
  }
});
