import React, { useState, useRef, useEffect } from 'react';
import { Box, Skeleton } from '../common/MUIComponents';

const LazyImage = ({ 
  src, 
  alt, 
  width = '100%', 
  height = 'auto', 
  placeholder = null,
  fallback = null,
  onLoad = () => {},
  onError = () => {},
  sx = {},
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Create intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Once in view, we can stop observing
          observerRef.current?.unobserve(entry.target);
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleImageError = () => {
    setHasError(true);
    onError();
  };

  // Show placeholder while not in view
  if (!isInView) {
    return (
      <Box
        ref={imgRef}
        sx={{
          width,
          height,
          backgroundColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx
        }}
        {...props}
      >
        {placeholder || <Skeleton variant="rectangular" width="100%" height="100%" />}
      </Box>
    );
  }

  // Show fallback on error
  if (hasError && fallback) {
    return (
      <Box
        component="img"
        src={fallback}
        alt={alt}
        sx={{
          width,
          height,
          objectFit: 'cover',
          ...sx
        }}
        {...props}
      />
    );
  }

  return (
    <Box
      ref={imgRef}
      sx={{
        position: 'relative',
        width,
        height,
        ...sx
      }}
      {...props}
    >
      {/* Show skeleton while loading */}
      {!isLoaded && (
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height="100%" 
          sx={{ position: 'absolute', top: 0, left: 0 }}
        />
      )}
      
      {/* Actual image */}
      <Box
        component="img"
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        onError={handleImageError}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          display: isLoaded ? 'block' : 'none'
        }}
      />
    </Box>
  );
};

export default LazyImage;
