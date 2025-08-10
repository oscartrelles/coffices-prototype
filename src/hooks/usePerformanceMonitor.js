import { useEffect, useRef } from 'react';

const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current} - Time since last render: ${timeSinceLastRender.toFixed(2)}ms`);
    }
    
    lastRenderTime.current = currentTime;
  });

  // Track component mount/unmount
  useEffect(() => {
    const mountTime = performance.now();
    const mountTimeRef = useRef(mountTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Mounted in ${mountTime.toFixed(2)}ms`);
    }

    return () => {
      const unmountTime = performance.now();
      const totalLifetime = unmountTime - mountTimeRef.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${componentName}] Unmounted after ${totalLifetime.toFixed(2)}ms - Total renders: ${renderCount.current}`);
      }
    };
  }, [componentName]);

  // Return performance data for external monitoring
  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    getRenderStats: () => ({
      renderCount: renderCount.current,
      lastRenderTime: lastRenderTime.current,
      averageRenderTime: renderCount.current > 1 ? 
        (performance.now() - mountTime.current) / renderCount.current : 0
    })
  };
};

export default usePerformanceMonitor;
