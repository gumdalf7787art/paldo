import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BREEDS, REGIONS, GENDERS, PRICES } from '../utils/constants';

const SearchBar = () => {
  const navigate = useNavigate();
  const [selectedBreed, setSelectedBreed] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전국');
  const [selectedGender, setSelectedGender] = useState('모두선택');
  const [selectedPrice, setSelectedPrice] = useState('전체');

  const handleSearch = () => {
    const breed = selectedBreed || '전체';
    const regionParam = selectedRegion && selectedRegion !== '전국' ? `?region=${selectedRegion}` : '';
    navigate(`/breed/${breed}${regionParam}`);
  };

  const popularBreedsList = [
    { name: '말티즈', icon: '🐶' },
    { name: '포메라니안', icon: '🐩' },
    { name: '토이푸들', icon: '🐕' },
    { name: '비숑프리제', icon: '🐾' },
    { name: '푸들', icon: '🐕‍🦺' },
    { name: '시바견', icon: '🦊' },
    { name: '프랜치불독', icon: '🐷' },
    { name: '웰쉬코기', icon: '🍞' },
    { name: '리트리버', icon: '🐕' },
    { name: '보더콜리', icon: '🦓' }
  ];

  return (
    <section className="fade-in search-bar-section" style={{ padding: '10px 0 5px 0' }}>
      <div className="glass-card search-bar-container" style={{ 
        padding: '16px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.02)'
      }}>
        {/* 상단 검색 필터 영역 */}
        <div style={{
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'flex-end',
          width: '100%'
        }}>
          {/* 1. 품종 선택 */}
          <div className="filter-item" style={{ flex: '1.2 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginLeft: '2px' }}>품종</label>
            <select 
              style={selectStyle} 
              value={selectedBreed}
              onChange={(e) => setSelectedBreed(e.target.value)}
            >
              <option value="">전체 품종</option>
              {BREEDS.map(breed => <option key={breed} value={breed}>{breed}</option>)}
            </select>
          </div>

          {/* 2. 분양지역 선택 */}
          <div className="filter-item" style={{ flex: '1 1 110px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginLeft: '2px' }}>지역</label>
            <select 
              style={selectStyle}
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {REGIONS.map(region => <option key={region} value={region}>{region}</option>)}
            </select>
          </div>

          {/* 3. 성별 선택 */}
          <div className="filter-item" style={{ flex: '0.9 1 100px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginLeft: '2px' }}>성별</label>
            <select 
              style={selectStyle}
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              {GENDERS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
            </select>
          </div>

          {/* 4. 분양가격 */}
          <div className="filter-item" style={{ flex: '1.1 1 120px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginLeft: '2px' }}>분양가격</label>
            <select 
              style={selectStyle}
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
            >
              {PRICES.map(price => <option key={price} value={price}>{price}</option>)}
            </select>
          </div>

          {/* 5. 검색하기 버튼 */}
          <button 
            onClick={handleSearch}
            style={{
              flexShrink: 0,
              backgroundColor: 'var(--primary)',
              color: 'var(--white)',
              padding: '0 24px',
              height: '34px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.85rem',
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

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid #cbd5e1', width: '100%' }} />

        {/* 하단 인기 견종 칩 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          {/* 인기견종 레이블 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap',
            fontSize: '0.78rem',
            fontWeight: '800',
            color: '#475569',
            backgroundColor: '#f1f5f9',
            padding: '3px 8px',
            borderRadius: '6px',
            flexShrink: 0
          }}>
            🔥 인기견종
          </div>

          {/* 칩 목록 */}
          <div className="breed-chips-container" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '6px', 
            overflowX: 'auto', 
            padding: '4px 0', 
            margin: 0,
            border: 'none',
            flexGrow: 1,
            scrollbarWidth: 'none'
          }}>
            {popularBreedsList.map((breed, i) => (
              <div 
                key={i} 
                className="breed-chip"
                onClick={() => navigate(`/breed/${breed.name}`)}
                style={{
                  padding: '3px 0',
                  flex: '1',
                  minWidth: '70px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  gap: '4px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  height: '26px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>{breed.icon}</span>
                <span>{breed.name}</span>
              </div>
            ))}

            {/* 전체보기 칩 추가 */}
            <div 
              className="breed-chip"
              onClick={() => navigate('/breed/전체')}
              style={{
                padding: '3px 0',
                flex: '1',
                minWidth: '70px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                gap: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: 'var(--primary)',
                fontWeight: '700',
                height: '26px',
                boxSizing: 'border-box',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '0.8rem' }}>👀</span>
              <span>전체보기</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const selectStyle = {
  width: '100%',
  padding: '6px 20px 6px 8px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  backgroundColor: 'var(--white)',
  color: 'var(--body-text)',
  fontSize: '0.82rem',
  outline: 'none',
  appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  height: '34px',
  boxSizing: 'border-box'
};

export default SearchBar;
