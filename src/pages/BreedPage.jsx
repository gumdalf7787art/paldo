import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import Card from '../components/Card';
import SearchBar from '../components/SearchBar';
import { HeroCarousel, LoginWidget } from '../components/Sections';

const BreedPage = () => {
  const { breedName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [adDogs, setAdDogs] = useState([]);
  const [regularDogs, setRegularDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const searchParams = new URLSearchParams(location.search);
      const region = searchParams.get('region') || '';
      const gender = searchParams.get('gender') || '';
      const price = searchParams.get('price') || '';

      const queryParams = { status: 'available', breed: breedName };
      if (region) queryParams.region = region;
      // Note: Gender and price filtering might need to be supported in API or filtered on client side.
      // Currently API might not support gender/price, but we pass region.
      
      try {
        // 1. 유료 광고 데이터 가져오기 (REST API)
        const { data: adData } = await api.ads.getList({
          status: 'active',
          breed: breedName,
          region: region
        });

        const ads = (adData || []).map(ad => ({
          ...ad,
          isAd: true,
          image: ad.image_url,
          badgeText: 'AD'
        }));
        setAdDogs(ads.slice(0, 4)); // 상단 프리미엄은 최대 4개 (1줄)만 노출

        // 2. 일반 분양 리스트 가져오기 (REST API)
        const { data: dogData } = await api.dogs.getList(queryParams);

        if (dogData) {
          let filteredDogs = [...dogData];
          
          // 클라이언트 사이드 추가 필터링 (성별, 가격)
          if (gender && gender !== '모두선택') {
            filteredDogs = filteredDogs.filter(d => d.gender === gender);
          }
          if (price && price !== '전체') {
            // 간단한 텍스트 기반 필터링 (필요시 상세 로직 구현)
            if (price.includes('이하')) {
              const max = parseInt(price.replace(/[^0-9]/g, ''));
              filteredDogs = filteredDogs.filter(d => (d.price / 10000) <= max);
            } else if (price.includes('이상')) {
              const min = parseInt(price.replace(/[^0-9]/g, ''));
              filteredDogs = filteredDogs.filter(d => (d.price / 10000) >= min);
            } else if (price === '무료분양') {
              filteredDogs = filteredDogs.filter(d => d.price === 0);
            }
          }

          const adDogIds = new Set(ads.map(ad => ad.id));
          const sortedDogs = filteredDogs.sort((a, b) => {
            const aIsAd = adDogIds.has(a.id);
            const bIsAd = adDogIds.has(b.id);
            if (aIsAd && !bIsAd) return -1;
            if (!aIsAd && bIsAd) return 1;
            return 0;
          }).map(dog => ({
            ...dog,
            image: dog.image_url
          }));
          setRegularDogs(sortedDogs);
        }
      } catch (err) {
        console.error('Failed to fetch breed data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [breedName, location.search]);

  // 다른 인기 견종 목록
  const otherBreeds = ['말티즈', '푸들', '포메라니안', '비숑프리제', '시바견', '웰시코기', '골든리트리버', '말티푸'];

  return (
    <main className="container breed-page" style={{ padding: '0 20px', minHeight: '80vh' }}>
      
      {/* 1. 상단 타이틀 */}
      <div style={{ marginBottom: '20px', textAlign: 'center', marginTop: '20px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '6px' }}>
          {breedName} <span style={{ color: 'var(--primary)' }}>분양 리스트</span>
        </h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>모든 {breedName} 아이들을 한눈에 확인하세요.</p>
      </div>

      {/* 2. 메인 히어로 캐러셀 (추가됨) */}
      <div style={{ marginBottom: '40px' }}>
        <HeroCarousel breedName={breedName} />
      </div>

      {/* 3. 상단 프리미엄 하이라이트 (1줄) */}
      {!loading && adDogs.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>이달의 추천 {breedName}</h2>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: '#fff3e0', color: '#e65100', borderRadius: '4px', fontWeight: 'bold' }}>AD</span>
          </div>
          <div className="responsive-grid-4">
            {adDogs.map(dog => (
              <Card key={dog.id} type="large" data={dog} badgeText="추천" />
            ))}
          </div>
        </div>
      )}

      {/* 3. 상세 검색창 (품종 선택란 숨김) */}
      <div style={{ marginBottom: '30px' }}>
        <SearchBar hideBreed={true} defaultBreed={breedName} />
      </div>

      {/* 4. 2컬럼 레이아웃 (메인 리스트 / 우측 사이드바) */}
      <div className="main-portal-layout">
        
        {/* 좌측: 통합 그리드 리스트 */}
        <div className="portal-main-col">
          <section style={{ padding: '24px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>전체 {breedName} 분양 리스트</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>총 <b>{regularDogs.length}</b>건</span>
            </div>
            
            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#999' }}>데이터를 불러오는 중입니다...</div>
            ) : regularDogs.length === 0 ? (
              <div style={{ padding: '80px 0', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🐶</div>
                <p style={{ color: '#64748b', fontWeight: '600' }}>현재 조건에 맞는 {breedName} 분양 매물이 없습니다.</p>
              </div>
            ) : (
              <div className="adoption-grid">
                {regularDogs.map(dog => {
                  const isPremium = adDogs.some(ad => ad.id === dog.id);
                  return (
                    <Card 
                      key={dog.id} 
                      type="small" 
                      data={dog} 
                      badgeText={isPremium ? "추천" : undefined}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* 우측: 사이드바 */}
        <div className="portal-side-col">
          <LoginWidget />
          
          {/* 입양 안내 위젯 */}
          <div style={{
            backgroundColor: '#FFF8F6',
            border: '1px solid #FFECE5',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--shadow)',
            marginBottom: '10px'
          }}>
            <h4 style={{ color: '#E65100', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💡 안심 입양 가이드
            </h4>
            <ul style={{ fontSize: '0.8rem', color: '#6D4C41', display: 'flex', flexDirection: 'column', gap: '6px', padding: 0, listStyle: 'none' }}>
              <li>• 분양 시 반드시 <b>동물판매업 등록번호</b>를 확인하세요.</li>
              <li>• 직접 매장을 방문하여 아이의 건강 상태를 살피는 것이 좋습니다.</li>
              <li>• 계약서 작성 시 15일 이내 폐사/질병에 대한 보상 조건을 확인하세요.</li>
            </ul>
          </div>

          {/* 다른 인기 견종 둘러보기 위젯 */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: 'var(--shadow)',
            marginBottom: '10px'
          }}>
            <h4 style={{ color: '#1e293b', fontSize: '0.85rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              🐾 다른 인기 견종 둘러보기
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {otherBreeds.filter(b => b !== breedName).map(breed => (
                <div 
                  key={breed}
                  onClick={() => navigate(`/breed/${breed}`)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e2e8f0';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  {breed}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default BreedPage;
