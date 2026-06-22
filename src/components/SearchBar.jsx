import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BREEDS, REGIONS, GENDERS, PRICES } from '../utils/constants';
import { useMobile } from '../context/MobileContext';

const SearchBar = ({ hideBreed, defaultBreed }) => {
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  const [selectedBreed, setSelectedBreed] = useState(defaultBreed || '');
  const [selectedRegion, setSelectedRegion] = useState('전국');
  const [selectedGender, setSelectedGender] = useState('모두선택');
  const [selectedPrice, setSelectedPrice] = useState('전체');

  const handleSearch = () => {
    const breed = hideBreed ? defaultBreed : (selectedBreed || '전체');
    const params = new URLSearchParams();
    if (selectedRegion && selectedRegion !== '전국') params.append('region', selectedRegion);
    if (selectedGender && selectedGender !== '모두선택') params.append('gender', selectedGender);
    if (selectedPrice && selectedPrice !== '전체') params.append('price', selectedPrice);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    navigate(`/breed/${breed}${queryString}`);
  };

  const row1 = [
    { name: '말티즈', icon: '🐶' },
    { name: '푸들', icon: '🐩' },
    { name: '포메라니안', icon: '🐕' },
    { name: '비숑프리제', icon: '🐾' },
    { name: '시바견', icon: '🦊' },
    { name: '프렌치불독', icon: '🐷' },
    { name: '웰시코기', icon: '🍞' },
    { name: '골든리트리버', icon: '🐕' },
    { name: '보더콜리', icon: '🦓' }
  ];

  const row2 = [
    { name: '말티푸', icon: '🐶' },
    { name: '푸숑', icon: '🐩' },
    { name: '말숑', icon: '🐾' },
    { name: '포메푸', icon: '🐕' },
    { name: '폼피츠', icon: '🦊' },
    { name: '코카푸', icon: '🍞' },
    { name: '골든두들', icon: '🐕' },
    { name: '래브라도두들', icon: '🐩' },
    { name: '치푸', icon: '🐾' }
  ];

  const chipStyle = {
    padding: '2px 0',
    flex: '1',
    minWidth: '75px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    gap: '4px',
    border: '1px solid #cbd5e1',
    backgroundColor: 'white',
    height: '24px',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer'
  };

  return (
    <section className="fade-in search-bar-section" style={{ padding: '5px 0' }}>
      <div className="glass-card search-bar-container" style={{ 
        padding: isMobile ? '12px 14px' : (hideBreed ? '16px 24px' : '10px 16px'), 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px',
        backgroundColor: 'rgba(241, 245, 249, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.02)'
      }}>
        {/* 상단 인기 견종 칩 영역 (hideBreed가 아닐 때만 노출) */}
        {!hideBreed && (
          <>
            {isMobile ? (
              /* 📱 모바일 인기견종 스크롤 칩 태그 */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🔥 인기견종 바로가기</span>
                </div>
                <div 
                  className="mobile-scroll-container" 
                  style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    padding: '2px 0 6px 0',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {[...row1, ...row2].map((breed, i) => (
                    <div 
                      key={i} 
                      className="breed-chip"
                      onClick={() => navigate(`/breed/${breed.name}`)}
                      style={{
                        ...chipStyle,
                        flex: '0 0 auto',
                        minWidth: '85px',
                        height: '28px',
                        borderRadius: '20px',
                        border: '1px solid #cbd5e1',
                        padding: '0 10px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', marginRight: '3px' }}>{breed.icon}</span>
                      <span>{breed.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* 💻 PC 인기견종 바둑판 칩 */
              <div style={{ display: 'flex', alignItems: 'stretch', gap: '10px', width: '100%' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  whiteSpace: 'nowrap',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  color: '#475569',
                  backgroundColor: '#e2e8f0',
                  padding: '0 10px',
                  borderRadius: '6px',
                  flexShrink: 0
                }}>
                  <span>🔥 인기견종</span>
                  <span>바로가기</span>
                </div>

                <div className="breed-chips-rows-container" style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '6px', 
                  flexGrow: 1,
                  minWidth: 0
                }}>
                  <div className="breed-chips-row" style={{
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none'
                  }}>
                    {row1.map((breed, i) => (
                      <div 
                        key={i} 
                        className="breed-chip"
                        onClick={() => navigate(`/breed/${breed.name}`)}
                        style={chipStyle}
                      >
                        <span style={{ fontSize: '0.85rem' }}>{breed.icon}</span>
                        <span>{breed.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="breed-chips-row" style={{
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none'
                  }}>
                    {row2.map((breed, i) => (
                      <div 
                        key={i} 
                        className="breed-chip"
                        onClick={() => navigate(`/breed/${breed.name}`)}
                        style={chipStyle}
                      >
                        <span style={{ fontSize: '0.85rem' }}>{breed.icon}</span>
                        <span>{breed.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 구분선 */}
            <div style={{ borderTop: '1px solid #cbd5e1', width: '100%', margin: '2px 0' }} />
          </>
        )}

        {/* 하단 검색 필터 영역 */}
        {isMobile ? (
          /* 📱 모바일 상세검색 (좌측 2x2 필터 그리드 + 우측 세로형 검색 버튼) */
          <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'stretch' }}>
            {/* 좌측 2x2 필터 그리드 */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px 8px'
            }}>
              {/* 1. 품종선택 (hideBreed가 아닐 때만) */}
              {!hideBreed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>품종</label>
                  <select 
                    style={{ ...selectStyle, height: '30px', fontSize: '0.75rem' }} 
                    value={selectedBreed}
                    onChange={(e) => setSelectedBreed(e.target.value)}
                  >
                    <option value="">전체 품종</option>
                    {BREEDS.map(breed => <option key={breed} value={breed}>{breed}</option>)}
                  </select>
                </div>
              )}

              {/* 2. 분양지역 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>지역</label>
                <select 
                  style={{ ...selectStyle, height: '30px', fontSize: '0.75rem' }}
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  {REGIONS.map(region => <option key={region} value={region}>{region}</option>)}
                </select>
              </div>

              {/* 3. 성별 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>성별</label>
                <select 
                  style={{ ...selectStyle, height: '30px', fontSize: '0.75rem' }}
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                >
                  {GENDERS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
                </select>
              </div>

              {/* 4. 가격 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>가격</label>
                <select 
                  style={{ ...selectStyle, height: '30px', fontSize: '0.75rem' }}
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                >
                  {PRICES.map(price => <option key={price} value={price}>{price}</option>)}
                </select>
              </div>
            </div>

            {/* 우측 통합 검색 버튼 (2줄 높이) */}
            <button 
              onClick={handleSearch}
              style={{
                width: '65px',
                flexShrink: 0,
                backgroundColor: 'var(--primary)',
                color: 'var(--white)',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.8rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(38, 166, 154, 0.15)',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '0 4px',
                alignSelf: 'stretch'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark, #00796b)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              <span style={{ fontSize: '1.1rem' }}>🔍</span>
              <span style={{ fontSize: '0.75rem' }}>검색</span>
            </button>
          </div>
        ) : (
          /* 💻 PC버전 상세검색 (기존의 1줄 가로형 레이아웃) */
          <div style={{
            display: 'flex', 
            flexDirection: 'row', 
            flexWrap: 'nowrap',
            gap: '8px',
            alignItems: 'center',
            width: '100%'
          }}>
            {!hideBreed && (
              <div className="filter-item" style={{ flex: '1.2 1 130px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                <label style={{ whiteSpace: 'nowrap', fontSize: hideBreed ? '0.85rem' : '0.72rem', fontWeight: '700', color: '#64748b' }}>품종</label>
                <select 
                  style={{ ...selectStyle, height: hideBreed ? '31px' : '27px', fontSize: hideBreed ? '0.85rem' : '0.72rem' }} 
                  value={selectedBreed}
                  onChange={(e) => setSelectedBreed(e.target.value)}
                >
                  <option value="">전체 품종</option>
                  {BREEDS.map(breed => <option key={breed} value={breed}>{breed}</option>)}
                </select>
              </div>
            )}

            <div className="filter-item" style={{ flex: '1 1 105px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <label style={{ whiteSpace: 'nowrap', fontSize: hideBreed ? '0.85rem' : '0.72rem', fontWeight: '700', color: '#64748b' }}>지역</label>
              <select 
                style={{ ...selectStyle, height: hideBreed ? '31px' : '27px', fontSize: hideBreed ? '0.85rem' : '0.72rem' }}
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                {REGIONS.map(region => <option key={region} value={region}>{region}</option>)}
              </select>
            </div>

            <div className="filter-item" style={{ flex: '0.9 1 95px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <label style={{ whiteSpace: 'nowrap', fontSize: hideBreed ? '0.85rem' : '0.72rem', fontWeight: '700', color: '#64748b' }}>성별</label>
              <select 
                style={{ ...selectStyle, height: hideBreed ? '31px' : '27px', fontSize: hideBreed ? '0.85rem' : '0.72rem' }}
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
              >
                {GENDERS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
              </select>
            </div>

            <div className="filter-item" style={{ flex: '1.1 1 120px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <label style={{ whiteSpace: 'nowrap', fontSize: hideBreed ? '0.85rem' : '0.72rem', fontWeight: '700', color: '#64748b' }}>가격</label>
              <select 
                style={{ ...selectStyle, height: hideBreed ? '31px' : '27px', fontSize: hideBreed ? '0.85rem' : '0.72rem' }}
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
              >
                {PRICES.map(price => <option key={price} value={price}>{price}</option>)}
              </select>
            </div>

            <button 
              onClick={handleSearch}
              style={{
                flexShrink: 0,
                backgroundColor: 'var(--primary)',
                color: 'var(--white)',
                padding: hideBreed ? '0 24px' : '0 16px',
                height: hideBreed ? '31px' : '27px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: hideBreed ? '0.85rem' : '0.72rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(38, 166, 154, 0.15)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark, #00796b)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              검색하기
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

const selectStyle = {
  width: '100%',
  padding: '4px 16px 4px 6px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: 'var(--white)',
  color: 'var(--body-text)',
  fontSize: '0.72rem',
  outline: 'none',
  appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 6px center',
  height: '27px',
  boxSizing: 'border-box'
};

export default SearchBar;
