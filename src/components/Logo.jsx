import React from 'react';
import logoImg from '../assets/logo.png';

const Logo = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ 
        width: '65px', 
        height: '65px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: '50%',
        backgroundColor: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <img 
          src={logoImg} 
          alt="Paldo Dang-Dang Maltese Logo" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)' }} 
        />
      </div>
      <h1 style={{ 
        fontSize: '2.2rem', 
        margin: 0, 
        color: '#4E342E', 
        letterSpacing: '-2px',
        fontWeight: '800',
        fontFamily: "'Outfit', sans-serif"
      }}>
        팔도댕댕
      </h1>
    </div>
  );
};

export default Logo;
