import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { isCrawler, getCrawlerType } from '../utils/crawlerDetection';

const SEO = ({ 
  title = 'Coffices - Find the Best Coffee Shops for Remote Work',
  description = 'Discover and rate the best coffee shops for remote work. Find great WiFi, power outlets, and coffee quality.',
  image = '/Coffices.PNG',
  url = '',
  type = 'website',
  place = null
}) => {
  // Force re-render when place data changes to ensure meta tags update
  useEffect(() => {
    if (place) {
      // Update document title immediately for better SEO
      document.title = title;
    }
  }, [place, title]);
  const fullUrl = url || window.location.href;
  
  // Handle image URL - ensure it's absolute
  let fullImageUrl;
  if (image.startsWith('http')) {
    fullImageUrl = image;
  } else if (image.startsWith('/')) {
    fullImageUrl = `${window.location.origin}${image}`;
  } else {
    fullImageUrl = `${window.location.origin}/${image}`;
  }

  const getStructuredData = () => {
    try {
      const baseData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Coffices",
        "description": "Find the best coffee shops for remote work",
        "url": window.location.origin,
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      };

      if (place) {
        return [
          baseData,
          generatePlaceStructuredData(place)
        ];
      }

      return [baseData];
    } catch (error) {
      console.error('Error generating structured data:', error);
      return [];
    }
  };

  const generatePlaceStructuredData = (place) => {
    try {
      const lat = typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : place.geometry?.location?.lat;
      const lng = typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : place.geometry?.location?.lng;
      
      return {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": place.name,
        "description": `Coffee shop for remote work: ${place.name}. Great WiFi, power outlets, and coffee quality for remote workers.`,
        "url": fullUrl,
        "image": place.mainImageUrl || fullImageUrl,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": place.formatted_address || place.vicinity || "",
          "addressLocality": place.vicinity || "",
          "addressCountry": "US"
        },
        "geo": lat && lng ? {
          "@type": "GeoCoordinates",
          "latitude": lat,
          "longitude": lng
        } : undefined,
        "telephone": place.formatted_phone_number || "",
        "openingHours": place.opening_hours?.weekday_text || [],
        "priceRange": place.price_level ? "1".repeat(place.price_level) : "",
        "aggregateRating": place.rating ? {
          "@type": "AggregateRating",
          "ratingValue": place.rating,
          "reviewCount": place.user_ratings_total || 0
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
    } catch (error) {
      console.error('Error generating place structured data:', error);
      return null;
    }
  };

  const structuredData = getStructuredData();
  const isCrawlerRequest = isCrawler();
  const crawlerType = getCrawlerType();

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Enhanced Open Graph / Facebook - especially for crawlers */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Coffices" />
      <meta property="og:locale" content="en_US" />
      
      {/* Enhanced place-specific Open Graph tags for crawlers */}
      {place && (
        <>
          <meta property="og:latitude" content={typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : place.geometry?.location?.lat} />
          <meta property="og:longitude" content={typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : place.geometry?.location?.lng} />
          <meta property="og:street-address" content={place.formatted_address || place.vicinity || ""} />
          <meta property="og:locality" content={place.vicinity || ""} />
          <meta property="og:region" content="US" />
          <meta property="og:country-name" content="United States" />
          
          {/* Additional Open Graph tags for better social media previews */}
          {isCrawlerRequest && (
            <>
              <meta property="og:price:amount" content="0" />
              <meta property="og:price:currency" content="USD" />
              <meta property="og:availability" content="in stock" />
              <meta property="og:category" content="Coffee Shop" />
              <meta property="og:brand" content="Coffices" />
            </>
          )}
        </>
      )}

      {/* Enhanced Twitter - especially for crawlers */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImageUrl} />
      <meta property="twitter:site" content="@coffices" />
      <meta property="twitter:creator" content="@coffices" />
      
      {/* Additional Twitter tags for better social media previews */}
      {isCrawlerRequest && place && (
        <>
          <meta property="twitter:label1" content="Location" />
          <meta property="twitter:data1" content={place.vicinity || place.formatted_address || ""} />
          <meta property="twitter:label2" content="Rating" />
          <meta property="twitter:data2" content={place.rating ? `${place.rating}/5` : "Not rated"} />
        </>
      )}

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Coffices" />
      <meta name="keywords" content="coffee shops, remote work, WiFi, power outlets, coffee quality, co-working, cafes" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Additional social media meta tags */}
      <meta name="theme-color" content="#4CAF50" />
      <meta name="msapplication-TileColor" content="#4CAF50" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Coffices" />

      {/* Enhanced Structured Data - especially for crawlers */}
      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
      
      {/* Additional structured data for crawlers */}
      {isCrawlerRequest && place && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": place.name,
            "description": `Remote work coffee shop: ${place.name}. Perfect for remote workers with great WiFi, power outlets, and coffee quality.`,
            "url": fullUrl,
            "image": place.mainImageUrl || fullImageUrl,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": place.formatted_address || place.vicinity || "",
              "addressLocality": place.vicinity || "",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : place.geometry?.location?.lat,
              "longitude": typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : place.geometry?.location?.lng
            },
            "telephone": place.formatted_phone_number || "",
            "openingHours": place.opening_hours?.weekday_text || [],
            "priceRange": place.price_level ? "1".repeat(place.price_level) : "",
            "aggregateRating": place.rating ? {
              "@type": "AggregateRating",
              "ratingValue": place.rating,
              "reviewCount": place.user_ratings_total || 0
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
            ],
            "servesCuisine": "Coffee",
            "hasMenu": false,
            "acceptsReservations": false,
            "wheelchairAccessible": true,
            "parkingAvailable": true
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
