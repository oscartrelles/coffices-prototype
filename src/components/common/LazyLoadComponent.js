import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Box, Skeleton, CircularProgress } from '../common/MUIComponents';

const LazyLoadComponent = ({ 
  children, 
  placeholder = null,
  fallback = null,
  threshold = 0.1,
  rootMargin = '50px',
  height = 'auto',
  width = '100%',
  sx = {},
  ...props 
}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

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
        rootMargin,
        threshold
      }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [rootMargin, threshold]);

  // Show placeholder while not in view
  if (!isInView) {
    return (
      <Box
        ref={containerRef}
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.50',
          borderRadius: 1,
          ...sx
        }}
        {...props}
      >
        {placeholder || (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={24} />
            <Box sx={{ mt: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
              Loading...
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  // Show fallback on error
  if (hasError && fallback) {
    return fallback;
  }

  // Render the actual component wrapped in Suspense
  return (
    <Box
      ref={containerRef}
      sx={{
        width,
        height,
        ...sx
      }}
      {...props}
    >
      <Suspense fallback={
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          minHeight: '200px'
        }}>
          <CircularProgress size={24} />
        </Box>
      }>
        {children}
      </Suspense>
    </Box>
  );
};

export default LazyLoadComponent;
