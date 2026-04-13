import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Card = ({ type, data, badgeText }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const checkLikeStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: bookmark } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .eq('dog_id', data.id)
          .single();
        
        if (bookmark) setIsLiked(true);
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

    if (isLiked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('dog_id', data.id);
      if (!error) setIsLiked(false);
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert([{ user_id: userId, dog_id: data.id }]);
      if (!error) setIsLiked(true);
    }
  };
  
  const getBadgeClass = () => {
    if (badgeText === '안심') return 'badge-safe';
    if (badgeText === '인기') return 'badge-popular';
    if (badgeText === '스페셜') return 'badge-special';
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
        cursor: 'pointer',
        transition: 'var(--transition)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
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
        transition: 'var(--transition)'
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
      <div style={{ padding: '0 4px' }}>
        {/* 상단 메타 정보 + 찜 버튼 (이름 위) */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '0.85rem', 
            color: 'var(--muted-text)',
            fontWeight: '500'
          }}>
            <span>{data.breed}</span>
            <span style={{ width: '1px', height: '10px', backgroundColor: '#eee' }}></span>
            <span>{data.region}</span>
          </div>
          
          <button 
            onClick={toggleLike}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '0.8rem', 
              padding: '0', 
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: isLiked ? '#ff4757' : '#999',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span>{isLiked ? '관심중' : '관심등록'}</span>
          </button>
        </div>

        {/* 별명 (제목) */}
        <h3 style={{ 
          fontSize: '1.05rem', 
          fontWeight: '700', 
          lineHeight: '1.4',
          marginBottom: '6px',
          color: 'var(--body-text)',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxDirection: 'vertical',
          overflow: 'hidden'
        }}>
          {data.nickname}
        </h3>

        {/* 가격 (하단 강조) */}
        <div style={{ 
          color: 'var(--primary)', 
          fontWeight: '800', 
          fontSize: '1.15rem', 
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
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
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#aaa', textDecoration: 'line-through', fontWeight: '500' }}>{formatP(origPrice)}</span>
                    <span style={{ fontSize: '0.8rem', color: '#FF4757', fontWeight: '700' }}>{discountRate}% 할인</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {formattedMain}
                    {data.is_negotiable && <span style={{ fontSize: '0.65rem', color: '#7ed321', backgroundColor: '#f0f9eb', padding: '1px 5px', borderRadius: '4px' }}>협의</span>}
                  </div>
                </>
              );
            }

            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {formattedMain}
                {data.is_negotiable && mainPrice !== 0 && mainPrice !== '무료분양' && (
                  <span style={{ fontSize: '0.65rem', color: '#7ed321', backgroundColor: '#f0f9eb', padding: '1px 5px', borderRadius: '4px' }}>협의</span>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Card;

