import React from 'react';
import logoImg from '../assets/daitdog-logo.png';

const Logo = ({ style }) => {
  return (
    <div className="logo-container" style={style}>
      <img 
        src={logoImg} 
        alt="Daitdog Logo" 
        className="logo-image"
      />
    </div>
  );
};

export default Logo;
