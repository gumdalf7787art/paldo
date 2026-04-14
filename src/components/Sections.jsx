import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import { supabase } from '../lib/supabaseClient';

// 배열 요소를 무작위로 섞는 함수 (Fisher-Yates Shuffle)
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// 광고 데이터 및 부족한 슬롯 채우기 공통 로직
const fetchAdsAndFill = async (adType, limit, defaultBadge) => {
  // 1. 활성 광고 데이터 가져오기
  const { data: adData } = await supabase
    .from('advertisements')
    .select('*, dog:dogs(*)')
    .eq('ad_type', adType)
    .eq('status', 'active');
    
  let items = (adData || []).filter(ad => ad.dog).map(ad => ({ ...ad.dog, isAd: true }));

  // 2. 남은 슬롯 개수만큼 일반 강아지 추가 (최신순)
  if (items.length < limit) {
    const excludeIds = items.map(d => d.id);
    const { data: recentDogs } = await supabase
      .from('dogs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20); // 여유있게 가져오기
      
    const fillItems = (recentDogs || [])
      .filter(d => !excludeIds.includes(d.id) && d.status === 'available')
      .slice(0, limit - items.length)
      .map(d => ({ ...d, isAd: false }));
      
    items = [...items, ...fillItems];
  }

  // 3. 순서 랜덤으로 섞기
  items = shuffleArray(items);

  // 4. Card 컴포넌트 형식에 맞도록 데이터 보존하며 변환
  return items.map(dog => ({
    ...dog, // 상세 페이지에서 필요한 모든 필드(seller_id, additional_images, video_url 등) 보존
    id: dog.id,
    image: dog.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80',
    badgeText: defaultBadge,
    breed: dog.breed || '견종 미상',
    nickname: dog.nickname || '이름 없음',
    gender: dog.gender || '-',
    region: dog.region || '지역 미지정',
    age: dog.age || '나이 미상',
    price: dog.price, // Card.jsx의 formattedPrice에서 처리함
    desc: dog.description || dog.desc || '팔도댕댕 추천 분양입니다.',
    date: new Date(dog.created_at).toLocaleDateString()
  }));
};

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [ads, setAds] = useState([]);
  
  useEffect(() => {
    const loadHeroAds = async () => {
      // 메인 배너 최대 12개 (4의 배수)
      const data = await fetchAdsAndFill('main', 12, '추천');
      setAds(data);
    };
    loadHeroAds();
  }, []);

  React.useEffect(() => {
    if (ads.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (ads.length === 0) return null;

  // Get 4 items starting from currentIndex, with wrapping
  const visibleAds = [
    ads[currentIndex % ads.length],
    ads[(currentIndex + 1) % ads.length],
    ads[(currentIndex + 2) % ads.length],
    ads[(currentIndex + 3) % ads.length]
  ];

  return (
    <section style={{ padding: '20px 0', position: 'relative' }}>
      <div className="container">
        <div className="responsive-grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {visibleAds.map((ad, i) => (
            <Card key={`${currentIndex}-${i}`} type="large" data={ad} />
          ))}
        </div>
        <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {ads.map((_, i) => (
            <div key={i} style={{
              width: i === currentIndex ? '24px' : '8px', 
              height: '8px', 
              borderRadius: '4px',
              backgroundColor: i === currentIndex ? 'var(--primary)' : '#ddd',
              transition: 'var(--transition)'
            }} />
          ))}
        </div>
      </div>
    </section>
  );
};

const SectionTitle = ({ title, sub }) => (
  <div className="section-title-wrap">
    <h2>{title}</h2>
    <span>{sub}</span>
  </div>
);

const AdSections = () => {
  const [safeDogs, setSafeDogs] = useState([]);
  const [popularDogs, setPopularDogs] = useState([]);
  const [specialDogs, setSpecialDogs] = useState([]);
  
  const [safeIdx, setSafeIdx] = useState(0);
  const [popularIdx, setPopularIdx] = useState(0);
  const [specialIdx, setSpecialIdx] = useState(0);

  useEffect(() => {
    const loadAdSections = async () => {
      // 로테이션을 위해 넉넉히 12개씩 로드 (4의 배수)
      const safe = await fetchAdsAndFill('safe', 12, '안심');
      const popular = await fetchAdsAndFill('popular', 12, '인기');
      const special = await fetchAdsAndFill('special', 12, '스페셜');
      
      setSafeDogs(safe);
      setPopularDogs(popular);
      setSpecialDogs(special);
    };
    loadAdSections();
  }, []);

  // 자동 로테이션 타이머 (5초마다 4개씩 이동)
  useEffect(() => {
    if (safeDogs.length === 0) return;
    const timer = setInterval(() => {
      setSafeIdx(prev => (prev + 4) % safeDogs.length);
      setPopularIdx(prev => (prev + 4) % popularDogs.length);
      setSpecialIdx(prev => (prev + 4) % specialDogs.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [safeDogs.length, popularDogs.length, specialDogs.length]);

  const getVisibleItems = (items, idx) => {
    if (items.length === 0) return [];
    return [
      items[idx % items.length],
      items[(idx + 1) % items.length],
      items[(idx + 2) % items.length],
      items[(idx + 3) % items.length]
    ].filter(Boolean);
  };

  return (
    <section style={{ padding: '60px 0' }}>
      <div className="container">
        <div style={{ marginBottom: '60px' }}>
          <SectionTitle title="안심 분양" sub="검증된 매장의 강아지들" />
          <div className="responsive-grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {getVisibleItems(safeDogs, safeIdx).map((dog, i) => (
              <Card key={`safe-${safeIdx}-${i}`} type="middle" badgeText="안심" data={dog} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '60px' }}>
          <SectionTitle title="인기 분양" sub="지금 가장 사랑받고 있어요" />
          <div className="responsive-grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {getVisibleItems(popularDogs, popularIdx).map((dog, i) => (
              <Card key={`pop-${popularIdx}-${i}`} type="middle" badgeText="인기" data={dog} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '60px' }}>
          <SectionTitle title="스페셜 분양" sub="팔도댕댕이 추천하는 특별한 아이들" />
          <div className="responsive-grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {getVisibleItems(specialDogs, specialIdx).map((dog, i) => (
              <Card key={`spec-${specialIdx}-${i}`} type="middle" badgeText="스페셜" data={dog} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const AdoptionList = () => {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDogs = async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(18); // 6의 배수
        
      if (data) setDogs(data);
      setLoading(false);
    };
    fetchDogs();
  }, []);

  return (
    <section style={{ padding: '60px 0', backgroundColor: '#f9f9f9' }}>
      <div className="container">
        <SectionTitle title="분양 리스트" sub="전국의 모든 분양 정보를 확인하세요" />
        <div className="responsive-grid-2">
          {loading ? (
             <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#666' }}>리스트를 불러오는 중입니다...</p>
          ) : dogs.length === 0 ? (
             <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#666' }}>아직 등록된 분양 게시물이 없습니다.</p>
          ) : (
            dogs.map((dog) => (
              <Card 
                key={dog.id} 
                type="small" 
                data={{
                  ...dog,
                  image: dog.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop',
                  breed: dog.breed || '견종 미상',
                  nickname: dog.nickname || '이름 없음',
                  gender: dog.gender || '-',
                  region: dog.region || '지역 미지정',
                  age: dog.age || '나이 미상',
                  price: dog.price,
                  date: new Date(dog.created_at).toLocaleDateString()
                }} 
              />
            ))
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <button style={{
            padding: '15px 40px',
            borderRadius: '30px',
            backgroundColor: 'var(--white)',
            border: '1px solid var(--primary)',
            color: 'var(--primary-dark)',
            fontWeight: '700',
            fontSize: '1rem'
          }}>
            분양 정보 더보기 +
          </button>
        </div>
      </div>
    </section>
  );
};

const PopularBreeds = () => {
  const navigate = useNavigate();
  const breeds = [
    { name: '말티즈', icon: '🐶' },
    { name: '포메라니안', icon: '🐩' },
    { name: '토이푸들', icon: '🐕' },
    { name: '비숑프리제', icon: '🐾' },
    { name: '푸들', icon: '🐕‍🦺' },
    { name: '시바견', icon: '🦊' },
    { name: '프랜치불독', icon: '🐷' },
    { name: '웰쉬코기', icon: '🍞' },
    { name: '라브라도리트리버', icon: '🐕' },
    { name: '골든리트리버', icon: '🦮' },
    { name: '알래스카 말라뮤트', icon: '🐺' },
    { name: '보더콜리', icon: '🦓' }
  ];

  return (
    <section style={{ padding: '40px 0', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="container">
        <SectionTitle title="인기 견종 바로가기" sub="가장 많이 찾는 인기 아이들이에요" />
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(6, 1fr)', 
          gap: '20px',
          marginTop: '30px'
        }} className="breed-grid">
          {breeds.map((breed, i) => (
            <div 
              key={i} 
              className="breed-item"
              onClick={() => navigate(`/breed/${breed.name}`)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '2rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                border: '1px solid #f0f0f0'
              }} className="breed-icon-circle">
                {breed.icon}
              </div>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--body-text)' }}>{breed.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { HeroCarousel, AdSections, AdoptionList, PopularBreeds };
