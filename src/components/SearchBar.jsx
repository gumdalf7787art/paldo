import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BREEDS, REGIONS, GENDERS, PRICES } from '../utils/constants';

const SearchBar = () => {
  const navigate = useNavigate();
  const [selectedBreed, setSelectedBreed] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전국');

  const handleSearch = () => {
    const breed = selectedBreed || '전체';
    const regionParam = selectedRegion && selectedRegion !== '전국' ? `?region=${selectedRegion}` : '';
    navigate(`/breed/${breed}${regionParam}`);
  };

  return (
    <section className="fade-in" style={{ padding: '40px 0' }}>
      <div className="container">
        <div className="glass-card" style={{ 
          padding: '30px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          alignItems: 'end'
        }}>
          <div className="filter-item">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--muted-text)' }}>품종 선택</label>
            <select 
              style={selectStyle} 
              value={selectedBreed}
              onChange={(e) => setSelectedBreed(e.target.value)}
            >
              <option value="">전체 품종</option>
              {BREEDS.map(breed => <option key={breed} value={breed}>{breed}</option>)}
            </select>
          </div>

          <div className="filter-item">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--muted-text)' }}>분양지역 선택</label>
            <select 
              style={selectStyle}
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {REGIONS.map(region => <option key={region} value={region}>{region}</option>)}
            </select>
          </div>

          <div className="filter-item">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--muted-text)' }}>성별 선택</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {GENDERS.map(gender => (
                <button key={gender} style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: gender === '모두선택' ? 'var(--primary)' : 'var(--white)',
                  color: gender === '모두선택' ? 'var(--white)' : 'var(--muted-text)',
                  border: '1px solid #eee',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}>
                  {gender}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-item">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--muted-text)' }}>분양가격</label>
            <select style={selectStyle}>
              {PRICES.map(price => <option key={price} value={price}>{price}</option>)}
            </select>
          </div>

          <button 
            onClick={handleSearch}
            style={{
              gridColumn: 'span 1',
              backgroundColor: 'var(--primary)',
              color: 'var(--white)',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '1rem',
              boxShadow: '0 4px 15px rgba(38, 166, 154, 0.3)'
            }}
          >
            강아지 검색하기
          </button>
        </div>
      </div>
    </section>
  );
};

const selectStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #eee',
  backgroundColor: 'var(--white)',
  color: 'var(--body-text)',
  fontSize: '0.95rem',
  outline: 'none',
  appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23795548%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center'
};

export default SearchBar;
