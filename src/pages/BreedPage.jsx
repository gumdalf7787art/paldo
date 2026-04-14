import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/Card';

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
      const region = searchParams.get('region');

      // 1. 유료 광고 데이터 가져오기
      let adQuery = supabase
        .from('advertisements')
        .select('*, dogs!inner(*)')
        .eq('status', 'active');
      
      if (breedName !== '전체') {
        adQuery = adQuery.eq('dogs.breed', breedName);
      }
      
      if (region && region !== '전국') {
        adQuery = adQuery.eq('dogs.region', region);
      }

      const { data: adData } = await adQuery.order('created_at', { foreignTable: 'dogs', ascending: false });

      const ads = (adData || []).map(ad => ({
        ...ad.dogs,
        isAd: true,
        image: ad.dogs.image_url,
        badgeText: 'AD'
      }));
      setAdDogs(ads.slice(0, 8));

      // 2. 일반 분양 리스트 가져오기
      let dogQuery = supabase
        .from('dogs')
        .select('*')
        .eq('status', 'available');

      if (breedName !== '전체') {
        dogQuery = dogQuery.eq('breed', breedName);
      }

      if (region && region !== '전국') {
        dogQuery = dogQuery.eq('region', region);
      }

      const { data: dogData } = await dogQuery.order('created_at', { ascending: false });

      if (dogData) {
        const adDogIds = new Set(ads.map(ad => ad.id));
        const sortedDogs = [...dogData].sort((a, b) => {
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
      
      setLoading(false);
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [breedName]);

  if (loading) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="breed-page" style={{ padding: '40px 0', minHeight: '80vh' }}>
      <div className="container">
        {/* 상단 타이틀 */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>
            {breedName} <span style={{ color: 'var(--primary)' }}>분양 리스트</span>
          </h1>
          <p style={{ color: '#666' }}>전국의 모든 {breedName} 아이들을 한눈에 확인하세요.</p>
        </div>

        {/* 1. 유료 광고 섹션 (4열 2줄) */}
        {adDogs.length > 0 && (
          <div style={{ marginBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>추천 {breedName}</h2>
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: '#fff3e0', color: '#e65100', borderRadius: '4px', fontWeight: 'bold' }}>AD</span>
            </div>
            <div className="responsive-grid-4">
              {adDogs.map(dog => (
                <Card key={dog.id} type="large" data={dog} badgeText="추천" />
              ))}
            </div>
          </div>
        )}

        {/* 2. 일반 분양 섹션 (6열) */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px' }}>실시간 분양 목록</h2>
          {regularDogs.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '16px' }}>
              <p style={{ color: '#999' }}>현재 등록된 {breedName} 분양 게시물이 없습니다.</p>
            </div>
          ) : (
            <div className="responsive-grid-2">
              {regularDogs.map(dog => (
                <Card key={dog.id} type="small" data={dog} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreedPage;
