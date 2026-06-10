import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const Card = ({ type, data, badgeText }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const checkLikeStatus = async () => {
      const { data: userData } = await api.auth.getUser();
      if (userData) {
        setUserId(userData.id);
        const { data: bookmarkData } = await api.bookmarks.check(data.id);
        if (bookmarkData?.bookmarked) setIsLiked(true);
      }
    };
    checkLikeStatus();
  }, [data.id]);

  const toggleLike = async (e) => {
    e.stopPropagation();
    if (!userId) {
      alert('관심아이 등록을 위해 먼저 로그인해 주세요!');
      navigate('/login');
      return;
    }

    // 낙관적 UI 업데이트
    setIsLiked(prev => !prev);
    const { error } = await api.bookmarks.toggle(data.id);
    if (error) {
      // 실패 시 롤백
      setIsLiked(prev => !prev);
      alert('관심 등록에 실패했습니다.');
    }
  };
  
  const getBadgeClass = () => {
    if (badgeText === '안심') return 'badge-safe';
    if (badgeText === '인기') return 'badge-popular';
    if (badgeText === '스페셜') return 'badge-special';
    if (badgeText === '추천') return 'badge-recommend';
    if (badgeText === '신규') return 'badge-new';
    return '';
  };

  // 가격 포맷팅 유틸리티
  const formattedPrice = (() => {
    let p = data.price;
    if (p === 0 || p === '0' || p === '무료분양' || p === '0만원') return '무료분양';
    if (typeof p === 'number') return `${p}만원`;
    if (typeof p === 'string' && !p.includes('만원') && p !== '무료분양') return `${p}만원`;
    return p;
  })();

  return (
    <div 
      onClick={() => navigate('/detail', { state: { dog: data } })}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        cursor: 'pointer',
        transition: 'var(--transition)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        justifyContent: 'flex-start'
      }} className="modern-card">
      
      {/* 1. 이미지 영역 (고정 비율 4:3) */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '75%', // 4:3 Aspect Ratio
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundImage: `url(${data.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'var(--transition)',
        flexShrink: 0
      }} className="card-image-container">
        
        {/* 뱃지 */}
        {badgeText && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
            <span className={`badge ${getBadgeClass()}`} style={{ fontSize: '0.7rem', padding: '3px 10px' }}>
              {badgeText}
            </span>
          </div>
        )}
      </div>

      {/* 2. 콘텐츠 영역 */}
      <div style={{ 
        padding: '0 8px 4px 8px', 
        display: 'flex', 
        flexDirection: 'column', 
        flexGrow: 1, 
        justifyContent: 'flex-start',
        gap: '4px',
        minWidth: 0
      }}>
        {/* 첫째줄: 품종(좌) / 지역(우) */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '0.8rem', 
          color: 'var(--muted-text)',
          fontWeight: '500',
          lineHeight: '1.2'
        }}>
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap', 
            maxWidth: '60%' 
          }}>{data.breed}</span>
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap', 
            maxWidth: '38%', 
            textAlign: 'right' 
          }}>{data.region}</span>
        </div>

        {/* 둘째줄: 이름(좌) / 관심등록(우) */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          lineHeight: '1.2'
        }}>
          <h3 style={{ 
            fontSize: '0.95rem', 
            fontWeight: '700', 
            color: 'var(--body-text)',
            margin: 0,
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            maxWidth: '60%'
          }}>
            {data.nickname}
          </h3>
          
          <button 
            onClick={toggleLike}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '0.75rem', 
              padding: '0', 
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: isLiked ? '#ff4757' : '#999',
              fontWeight: '600',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span>{isLiked ? '관심중' : '관심등록'}</span>
          </button>
        </div>

        {/* 셋째줄: 가격 및 판매처 */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2px',
          lineHeight: '1.2'
        }}>
          {/* 가격 */}
          <div style={{ 
            color: 'var(--primary)', 
            fontWeight: '800', 
            fontSize: '1.05rem', 
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '4px'
          }}>
            {(() => {
              const mainPrice = data.price;
              const origPrice = data.original_price;

              const formatP = (p) => {
                if (p === 0 || p === '0' || p === '무료분양' || p === '0만원') return '무료분양';
                if (typeof p === 'number') return `${p}만원`;
                if (typeof p === 'string' && !p.includes('만원') && p !== '무료분양') return `${p}만원`;
                return p;
              };

              const formattedMain = formatP(mainPrice);

              if (origPrice && mainPrice && origPrice > mainPrice && mainPrice !== 0 && mainPrice !== '무료분양') {
                const discountRate = Math.round(((origPrice - mainPrice) / origPrice) * 100);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '0.95rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '800' }}>{formattedMain}</span>
                    <span style={{ fontSize: '0.75rem', color: '#aaa', textDecoration: 'line-through', fontWeight: '500' }}>{formatP(origPrice)}</span>
                    <span style={{ fontSize: '0.75rem', color: '#FF4757', fontWeight: '700' }}>{discountRate}%</span>
                    {!!data.is_negotiable && <span style={{ fontSize: '0.6rem', color: '#7ed321', backgroundColor: '#f0f9eb', padding: '0px 4px', borderRadius: '3px' }}>협의</span>}
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{formattedMain}</span>
                  {!!data.is_negotiable && mainPrice !== 0 && mainPrice !== '무료분양' && (
                    <span style={{ fontSize: '0.6rem', color: '#7ed321', backgroundColor: '#f0f9eb', padding: '0px 4px', borderRadius: '3px' }}>협의</span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* 판매처 이름 */}
          <span style={{
            fontSize: '0.75rem',
            color: '#888',
            maxWidth: '45%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: '500'
          }}>
            {data.seller_business_name || data.seller_nickname || '개인분양'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Card;

