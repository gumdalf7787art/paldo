import React from 'react';
import logoImg from '../assets/daitdog-logo.png';

const Logo = () => {
  return (
    <div className="logo-container">
      <img 
        src={logoImg} 
        alt="Daitdog Logo" 
        className="logo-image"
      />
    </div>
  );
};

export default Logo;
