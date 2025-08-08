import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = 'Coffices - Find the Best Coffee Shops for Remote Work',
  description = 'Discover and rate the best coffee shops for remote work. Find great WiFi, power outlets, and coffee quality.',
  image = '/Coffices.PNG',
  url = '',
  type = 'website',
  place = null
}) => {
  const fullUrl = url || window.location.href;
  const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

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
      return {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": place.name,
        "description": `Coffee shop for remote work: ${place.name}`,
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
        } : undefined
      };
    } catch (error) {
      console.error('Error generating place structured data:', error);
      return null;
    }
  };

  const structuredData = getStructuredData();

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Coffices" />
      
      {/* Place-specific Open Graph tags */}
      {place && (
        <>
          <meta property="og:latitude" content={typeof place.geometry?.location?.lat === 'function' ? place.geometry.location.lat() : place.geometry?.location?.lat} />
          <meta property="og:longitude" content={typeof place.geometry?.location?.lng === 'function' ? place.geometry.location.lng() : place.geometry?.location?.lng} />
          <meta property="og:street-address" content={place.formatted_address || place.vicinity || ""} />
          <meta property="og:locality" content={place.vicinity || ""} />
          <meta property="og:region" content="US" />
          <meta property="og:country-name" content="United States" />
        </>
      )}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImageUrl} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Coffices" />
      <meta name="keywords" content="coffee shops, remote work, WiFi, power outlets, coffee quality, co-working, cafes" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Structured Data */}
      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
