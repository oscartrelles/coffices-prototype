// Performance optimization utilities

// Debounce function for expensive operations
export const debounce = (func, wait) => {
  let timeout;
  const executedFunction = function(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  
  // Add cancel method for compatibility with lodash
  executedFunction.cancel = () => {
    clearTimeout(timeout);
  };
  
  return executedFunction;
};

// Throttle function for frequent events
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization helper for expensive calculations
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Performance measurement utility
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
};

// Async performance measurement
export const measureAsyncPerformance = async (name, fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = performance.memory;
    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100,
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100,
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100
    };
  }
  return null;
};

// Batch DOM updates for better performance
export const batchDOMUpdates = (updates) => {
  // Use requestAnimationFrame to batch DOM updates
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

// Optimize marker clustering for large datasets
export const optimizeMarkerClustering = (markers, maxZoom = 15) => {
  return markers.map(marker => ({
    ...marker,
    // Reduce marker complexity at higher zoom levels
    optimized: marker.zoom > maxZoom ? false : true
  }));
};

// Preload critical resources
export const preloadResource = (href, as = 'fetch') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// Prefetch non-critical resources
export const prefetchResource = (href) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};
