import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useMobile } from '../context/MobileContext';

const BottomNavigation = () => {
  const { isMobile } = useMobile();
  const location = useLocation();

  if (!isMobile) return null;

  // 특정 페이지(예: 로그인, 글쓰기 등 자판이 심하게 차지하거나 화면을 가득 채워야 하는 곳)에서는 하단 탭바를 숨기는 옵션 처리 가능
  const hiddenRoutes = ['/login', '/signup', '/community/write', '/reset-password'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  const navItems = [
    { label: '홈', path: '/', icon: '🏠' },
    { label: '안심분양', path: '/breed/all', icon: '🐶' },
    { label: '커뮤니티', path: '/community', icon: '🐾' },
    { label: '마이페이지', path: '/mypage', icon: '👤' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 999,
      paddingBottom: 'safe-area-inset-bottom' // 최신 iOS 노치 대응
    }}>
      {navItems.map((item) => {
        const isActive = item.path === '/' 
          ? location.pathname === '/' 
          : location.pathname.startsWith(item.path.split('/')[1]); // 서브 라우트 포함 활성화 판단

        return (
          <NavLink
            key={item.label}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              width: '25%',
              height: '100%',
              gap: '4px',
              transition: 'all 0.2s ease-in-out',
              color: isActive ? 'var(--primary)' : '#94a3b8'
            }}
          >
            <span style={{ 
              fontSize: '1.4rem', 
              transform: isActive ? 'scale(1.15)' : 'scale(1)', 
              transition: 'transform 0.15s ease' 
            }}>
              {item.icon}
            </span>
            <span style={{ 
              fontSize: '0.72rem', 
              fontWeight: isActive ? '700' : '500',
              color: isActive ? 'var(--primary)' : '#64748b'
            }}>
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default BottomNavigation;
