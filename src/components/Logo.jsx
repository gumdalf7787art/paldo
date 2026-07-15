import React from 'react';
import logoImg from '../assets/paldodog-logo.png';

const Logo = ({ style }) => {
  return (
    <div className="logo-container" style={style}>
      <img 
        src={logoImg} 
        alt="PaldoDog Logo" 
        className="logo-image"
      />
    </div>
  );
};

export default Logo;
