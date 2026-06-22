import React, { createContext, useContext, useState, useEffect } from 'react';

const MobileContext = createContext({ isMobile: false });

export const MobileProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobileWidth = window.innerWidth <= 768;
      const userAgentMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
      setIsMobile(mobileWidth || userAgentMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMobile = () => useContext(MobileContext);
