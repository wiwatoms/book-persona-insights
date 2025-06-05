
import { useState, useEffect } from 'react';

// Simple hook to detect if the viewport is mobile-sized
export const isMobile = (): boolean => {
  const [mobile, setMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return mobile;
};

// Hook for components that need to track mobile state and respond to changes
export const useMobile = () => {
  const [mobile, setMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setMobile(window.innerWidth < 768);
    };

    // Set up the event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return mobile;
};

export default useMobile;
