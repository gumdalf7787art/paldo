import React from 'react';
import logoImg from '../assets/logo.png';

const Logo = () => {
  return (
    <div className="logo-container">
      <div className="logo-circle">
        <img 
          src={logoImg} 
          alt="Paldo Dang-Dang Maltese Logo" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)' }} 
        />
      </div>
      <h1 className="logo-text">
        팔도댕댕
      </h1>
    </div>
  );
};

export default Logo;
