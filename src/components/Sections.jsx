import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import { api } from '../lib/api';

// 배열 요소를 무작위로 섞는 함수 (Fisher-Yates Shuffle)
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// 광고 데이터 및 부족한 슬롯 송기기 공통 로직 (api.js 기반)
const fetchAdsAndFill = async (_adType, limit, defaultBadge) => {
  try {
    // API를 통해 사용가능한 매물 로드
    const { data: allDogs } = await api.dogs.getList({ status: 'available', limit: 20 });
    const dogs = allDogs || [];

    // 관련 유형에 맞는 멌 매물 선별 (ad_type 필터 대신 주미로 선택)
    const selected = shuffleArray(dogs).slice(0, limit);

    return selected.map(dog => ({
      ...dog,
      id: dog.id,
      image: dog.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80',
      badgeText: defaultBadge,
      breed: dog.breed || '견종 미상',
      nickname: dog.nickname || '이름 없음',
      gender: dog.gender || '-',
      region: dog.region || '지역 미지정',
      age: dog.age || '나이 미상',
      price: dog.price,
      desc: dog.description || dog.desc || '팔도댓댓 추천 분양입니다.',
      date: new Date(dog.created_at).toLocaleDateString()
    }));
  } catch (err) {
    console.error('fetchAdsAndFill 실패:', err);
    return [];
  }
};

const defaultHeroAds = [
  { id: 'mock-1', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80', badgeText: '추천', breed: '골든 리트리버', nickname: '인절미', gender: '남아', region: '서울 강남구', age: '2개월', price: 35 },
  { id: 'mock-2', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80', badgeText: '인기', breed: '포메라니안', nickname: '구름이', gender: '여아', region: '경기 수원시', age: '3개월', price: 45 },
  { id: 'mock-3', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80', badgeText: '스페셜', breed: '프렌치 불독', nickname: '초코', gender: '남아', region: '인천 연수구', age: '2.5개월', price: 60 },
  { id: 'mock-4', image: 'https://images.unsplash.com/photo-1537151608828-ea2b117b62e4?auto=format&fit=crop&q=80', badgeText: '추천', breed: '말티즈', nickname: '밀크', gender: '여아', region: '서울 송파구', age: '2개월', price: 30 },
  { id: 'mock-5', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80', badgeText: '신규', breed: '비숑 프리제', nickname: '눈송이', gender: '여아', region: '부산 해운대', age: '3개월', price: 50 },
  { id: 'mock-6', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80', badgeText: '인기', breed: '시바 이누', nickname: '보리', gender: '남아', region: '대구 수성구', age: '2.5개월', price: 55 },
  { id: 'mock-7', image: 'https://images.unsplash.com/photo-1537151608828-ea2b117b62e4?auto=format&fit=crop&q=80', badgeText: '추천', breed: '웰시 코기', nickname: '감자', gender: '남아', region: '대전 서구', age: '2개월', price: 40 },
  { id: 'mock-8', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80', badgeText: '스페셜', breed: '토이 푸들', nickname: '쿠키', gender: '여아', region: '광주 북구', age: '3개월', price: 35 },
  { id: 'mock-9', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80', badgeText: '신규', breed: '사모예드', nickname: '두부', gender: '남아', region: '울산 남구', age: '2개월', price: 75 },
  { id: 'mock-10', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80', badgeText: '추천', breed: '골든두들', nickname: '라떼', gender: '여아', region: '세종시', age: '3개월', price: 65 }
];

const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ads, setAds] = useState([]);
  const [isTransitionActive, setIsTransitionActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    const loadHeroAds = async () => {
      try {
        const data = await Promise.race([
          fetchAdsAndFill('main', 10, '추천'),
          timeoutPromise(2500)
        ]);
        if (data && data.length > 0) {
          setAds(data);
        } else {
          setAds(defaultHeroAds);
        }
      } catch (err) {
        console.error('Failed to load main ads, using fallback:', err);
        setAds(defaultHeroAds);
      }
    };
    loadHeroAds();
  }, []);

  const timerRef = useRef(null);

  // isPaused 디버그 로그용 이펙트
  useEffect(() => {
    console.log(`[Carousel] isPaused changed to: ${isPaused}, currentIndex: ${currentIndex}`);
  }, [isPaused, currentIndex]);

  // 자동 롤링 타이머 (isPaused 또는 currentIndex 변경 시 갱신하여 수동클릭과 꼬임 방지)
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (ads.length === 0 || isPaused) return;

    timerRef.current = setTimeout(() => {
      setIsTransitionActive(true);
      setCurrentIndex((prev) => {
        if (prev === ads.length) {
          setIsTransitionActive(false);
          setCurrentIndex(0);
          setTimeout(() => {
            setIsTransitionActive(true);
            setCurrentIndex(1);
          }, 30);
          return 0;
        }
        return prev + 1;
      });
    }, 3500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, ads.length, isPaused]);

  const handlePrev = () => {
    if (ads.length === 0) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (currentIndex === 0) {
      setIsTransitionActive(false);
      setCurrentIndex(ads.length);
      setTimeout(() => {
        setIsTransitionActive(true);
        setCurrentIndex(ads.length - 1);
      }, 30);
    } else {
      setIsTransitionActive(true);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (ads.length === 0) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsTransitionActive(true);
    setCurrentIndex((prev) => {
      if (prev === ads.length) {
        setIsTransitionActive(false);
        setCurrentIndex(0);
        setTimeout(() => {
          setIsTransitionActive(true);
          setCurrentIndex(1);
        }, 30);
        return 0;
      }
      return prev + 1;
    });
  };

  if (ads.length === 0) return null;

  const extendedAds = [...ads, ...ads.slice(0, 5)];

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{ padding: '15px 0 10px 0', position: 'relative' }}
    >
      <div 
        style={{ 
          overflow: 'hidden', 
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '16px',
          backgroundColor: '#f8fafc',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative'
        }}
      >
        {/* 좌측 화살표 버튼 */}
        <button 
          onClick={handlePrev}
          aria-label="이전 배너 보기"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s ease',
            color: '#475569'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            e.currentTarget.style.color = '#10b981';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>

        {/* 우측 화살표 버튼 */}
        <button 
          onClick={handleNext}
          aria-label="다음 배너 보기"
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s ease',
            color: '#475569'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            e.currentTarget.style.color = '#10b981';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <div 
          style={{
            display: 'flex',
            gap: '10px',
            transition: isTransitionActive ? 'transform 0.5s ease' : 'none',
            transform: `translateX(calc(-${currentIndex} * (20% + 2px)))`
          }}
        >
          {extendedAds.map((dog, i) => (
            <div 
              key={`hero-slide-${dog.id}-${i}`}
              style={{
                flex: '0 0 calc(20% - 8px)',
                height: '250px',
                backgroundColor: 'white',
                borderRadius: '12px',
                transition: 'transform 0.2s ease',
                display: 'flex'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Card 
                type="small" 
                badgeText={dog.badgeText || '추천'} 
                data={{
                  ...dog,
                  image: dog.image || dog.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop',
                  breed: dog.breed || '견종 미상',
                  nickname: dog.nickname || '이름 없음',
                  gender: dog.gender || '-',
                  region: dog.region || '지역 미지정',
                  age: dog.age || '나이 미상',
                  price: dog.price
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SectionTitle = ({ title, sub }) => (
  <div className="section-title-wrap" style={{ marginBottom: '15px' }}>
    <h2 style={{ fontSize: '1.4rem' }}>{title}</h2>
    <span style={{ fontSize: '0.85rem' }}>{sub}</span>
  </div>
);

const defaultSafeDogs = [
  { id: 'safe-1', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80', breed: '골든 리트리버', nickname: '인절미', gender: '남아', region: '서울', age: '2개월', price: 350000 },
  { id: 'safe-2', image: 'https://images.unsplash.com/photo-1537151608828-ea2b117b62e4?auto=format&fit=crop&q=80', breed: '웰시 코기', nickname: '빵둥이', gender: '여아', region: '부산', age: '2개월', price: 400000 },
  { id: 'safe-3', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80', breed: '비숑 프리제', nickname: '솜이', gender: '여아', region: '대구', age: '3개월', price: 500000 },
  { id: 'safe-4', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80', breed: '말티즈', nickname: '두부', gender: '남아', region: '광주', age: '2.5개월', price: 300000 }
];

const defaultPopularDogs = [
  { id: 'pop-1', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80', breed: '포메라니안', nickname: '구름이', gender: '여아', region: '경기', age: '3개월', price: 450000 },
  { id: 'pop-2', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80', breed: '토이 푸들', nickname: '초코', gender: '남아', region: '서울', age: '2개월', price: 280000 },
  { id: 'pop-3', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80', breed: '시바 이누', nickname: '단풍이', gender: '남아', region: '인천', age: '2.5개월', price: 600000 },
  { id: 'pop-4', image: 'https://images.unsplash.com/photo-1537151608828-ea2b117b62e4?auto=format&fit=crop&q=80', breed: '시츄', nickname: '사랑이', gender: '여아', region: '대전', age: '3개월', price: 250000 }
];

const defaultSpecialDogs = [
  { id: 'spec-1', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80', breed: '프렌치 불독', nickname: '까망이', gender: '남아', region: '인천', age: '2.5개월', price: 600000 },
  { id: 'spec-2', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80', breed: '사모예드', nickname: '설탕이', gender: '여아', region: '강원', age: '3개월', price: 800000 },
  { id: 'spec-3', image: 'https://images.unsplash.com/photo-1537151608828-ea2b117b62e4?auto=format&fit=crop&q=80', breed: '그레이하운드', nickname: '스피디', gender: '남아', region: '경기', age: '3.5개월', price: 700000 },
  { id: 'spec-4', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80', breed: '웰시 코기', nickname: '둥이', gender: '남아', region: '울산', age: '2개월', price: 420000 }
];

const AdSections = () => {
  const [safeDogs, setSafeDogs] = useState([]);
  const [popularDogs, setPopularDogs] = useState([]);
  const [specialDogs, setSpecialDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllSections = async () => {
      try {
        const [safe, popular, special] = await Promise.all([
          Promise.race([fetchAdsAndFill('safe', 4, '안심'), timeoutPromise(2500)]),
          Promise.race([fetchAdsAndFill('popular', 4, '인기'), timeoutPromise(2500)]),
          Promise.race([fetchAdsAndFill('special', 4, '스페셜'), timeoutPromise(2500)])
        ]);

        setSafeDogs(safe && safe.length > 0 ? safe.slice(0, 4) : defaultSafeDogs);
        setPopularDogs(popular && popular.length > 0 ? popular.slice(0, 4) : defaultPopularDogs);
        setSpecialDogs(special && special.length > 0 ? special.slice(0, 4) : defaultSpecialDogs);
      } catch (err) {
        console.error('Failed to load sections, using fallback:', err);
        setSafeDogs(defaultSafeDogs);
        setPopularDogs(defaultPopularDogs);
        setSpecialDogs(defaultSpecialDogs);
      } finally {
        setLoading(false);
      }
    };
    loadAllSections();
  }, []);

  const renderSection = (title, sub, dogs, badge) => (
    <section style={{ 
      padding: '24px', 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      border: '1px solid #e2e8f0', 
      boxShadow: 'var(--shadow)',
      marginBottom: '20px'
    }}>
      <SectionTitle title={title} sub={sub} />
      <div className="responsive-grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
        {loading && dogs.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px 0', color: '#888' }}>
            매물을 불러오는 중입니다...
          </p>
        ) : dogs.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px 0', color: '#888' }}>
            등록된 분양 매물이 없습니다.
          </p>
        ) : (
          dogs.map((dog, i) => (
            <Card 
              key={`${badge}-${dog.id}-${i}`} 
              type="middle" 
              badgeText={dog.badgeText || badge} 
              data={dog} 
            />
          ))
        )}
      </div>
    </section>
  );

  return (
    <>
      {renderSection("🛡️ 안심 분양 정보", "팔도댕댕이 직접 검증한 깨끗한 안심 분양", safeDogs, "안심")}
      {renderSection("🔥 인기 분양 정보", "지금 많은 분들이 주목하고 있는 댕댕이", popularDogs, "인기")}
      {renderSection("✨ 스페셜 분양 정보", "선택받은 특별한 케어와 혜택의 분양", specialDogs, "스페셜")}
    </>
  );
};

const AdoptionList = () => {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDogs = async () => {
      const { data } = await api.dogs.getList({ status: 'available', limit: 12 });
      if (data) setDogs(data);
      setLoading(false);
    };
    fetchDogs();
  }, []);

  return (
    <section style={{ padding: '24px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>
      <SectionTitle title="전체 분양 리스트" sub="실시간 등록 정보" />
      <div className="responsive-grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
    { name: '리트리버', icon: '🐕' },
    { name: '보더콜리', icon: '🦓' }
  ];

  return (
    <section style={{ padding: '0 0 10px 0', backgroundColor: 'transparent' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* 칩 목록 - PC 화면에서 좌우 꽉 차게 맞추기 위해 flex: 1 적용 및 균등 배분 */}
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
          {breeds.map((breed, i) => (
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
                border: '1px solid #e2e8f0',
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
              border: '1px solid #e2e8f0',
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
    </section>
  );
};

const LoginWidget = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initWidget = async () => {
      const { data: sessionData } = await api.auth.getSession();
      const session = sessionData?.session;
      setSession(session);
      if (session?.user) {
        const { data: profileData } = await api.auth.getUser();
        if (profileData) setProfile(profileData);
      } else {
        setProfile(null);
      }
    };
    initWidget();

    window.addEventListener('auth-change', initWidget);
    return () => window.removeEventListener('auth-change', initWidget);
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    setSession(null);
    setProfile(null);
    window.dispatchEvent(new Event('auth-change'));
    alert('로그아웃되었습니다.');
    navigate('/');
  };

  if (!session) {
    return (
      <div className="naver-login-widget">
        <p className="naver-login-widget-text">🐾 팔도댕댕을 로그인하고 더 안전하고 편리하게 분양을 이용해보세요.</p>
        <button onClick={() => navigate('/login')} className="naver-login-btn">팔도댕댕 로그인</button>
        <div className="naver-login-links">
          <a href="/signup">회원가입</a>
          <span>|</span>
          <a href="/reset-password">비밀번호 찾기</a>
        </div>
      </div>
    );
  }

  const userNickname = profile?.nickname || session.user.email?.split('@')[0] || '사용자';

  return (
    <div className="naver-profile-widget">
      <div className="profile-widget-header">
        <div className="profile-widget-avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            userNickname.charAt(0).toUpperCase()
          )}
        </div>
        <div className="profile-widget-info">
          <h4>{userNickname} 님</h4>
          <span style={{ color: 'var(--primary-dark)', fontWeight: 'bold' }}>
            {profile?.role === 'admin' ? '👑 관리자' : profile?.role === 'seller' ? '🏢 안심 분양 파트너' : '👤 일반 회원'}
          </span>
        </div>
      </div>
      <div className="profile-widget-menu">
        <button onClick={() => navigate('/mypage')} className="profile-widget-menu-btn">마이페이지</button>
        <button onClick={() => navigate('/mypage')} className="profile-widget-menu-btn">팔톡 메시지</button>
        <button onClick={handleLogout} className="profile-widget-menu-btn profile-widget-logout-btn">로그아웃</button>
      </div>
    </div>
  );
};

const DUMMY_RECOMMENDS = [
  {
    id: 'dummy-rec-1',
    breed: '말티즈',
    nickname: '두부',
    region: '서울 강남구',
    price: 350000,
    image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'dummy-rec-2',
    breed: '포메라니안',
    nickname: '망고',
    region: '경기 성남시',
    price: 500000,
    image_url: 'https://images.unsplash.com/photo-1537151608828-ea2b117b62e4?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'dummy-rec-3',
    breed: '토이푸들',
    nickname: '보리',
    region: '인천 남동구',
    price: 0,
    image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=200'
  }
];

const PersonalRecommendWidget = () => {
  const navigate = useNavigate();
  const [recommendedDogs, setRecommendedDogs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const { data: sessionData } = await api.auth.getSession();
        const user = sessionData?.session?.user || null;
        setCurrentUser(user);

        // 비로그인 또는 로그인 모두 api.dogs.getList로 쳐리
        const { data: allDogs } = await api.dogs.getList({ status: 'available', limit: 20 });
        const available = allDogs || [];

        if (available.length >= 3) {
          const shuffled = [...available].sort(() => 0.5 - Math.random());
          setRecommendedDogs(shuffled.slice(0, 3));
        } else {
          setRecommendedDogs(DUMMY_RECOMMENDS);
        }
      } catch (err) {
        console.error('Failed to load recommendation:', err);
        setRecommendedDogs(DUMMY_RECOMMENDS);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  if (loading) {
    return (
      <div style={widgetContainerStyle}>
        <h4 style={widgetTitleStyle}>🎯 맞춤 개별 추천</h4>
        <div style={{ textAlign: 'center', padding: '15px 0', fontSize: '0.78rem', color: '#888' }}>
          매물을 분석 중입니다...
        </div>
      </div>
    );
  }

  if (recommendedDogs.length === 0) return null;

  return (
    <div style={widgetContainerStyle}>
      <h4 style={widgetTitleStyle}>
        🎯 {currentUser ? `${currentUser.user_metadata?.name || '회원'}님 맞춤 추천` : '오늘의 개별 추천'}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {recommendedDogs.map((dog) => (
          <div 
            key={dog.id} 
            onClick={() => {
              if (dog.id.toString().startsWith('dummy-rec')) {
                // 더미 예시 칩 클릭 시 경고 안내창
                alert('해당 강아지는 비로그인 또는 DB 매물 부족 시 노출되는 추천 예시입니다. 더 많은 강아지들을 상세 조회하시면 회원님의 취향을 정밀 추적해 맞춤형으로 추천해 드립니다!');
              } else {
                navigate('/detail', { state: { dog } });
              }
            }}
            style={itemCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <img 
              src={dog.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200'} 
              alt={dog.nickname} 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                objectFit: 'cover',
                flexShrink: 0
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {dog.breed}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{dog.region}</span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#1e293b', marginTop: '1px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {dog.nickname}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f59e0b', marginTop: '1px' }}>
                {dog.price === 0 || !dog.price ? '무료분양' : `${(dog.price / 10000).toLocaleString()}만원`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const widgetContainerStyle = {
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '14px',
  boxShadow: 'var(--shadow)',
  marginBottom: '20px'
};

const widgetTitleStyle = {
  color: '#1e293b', 
  fontSize: '0.85rem', 
  fontWeight: '800',
  marginBottom: '10px', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '5px'
};

const itemCardStyle = {
  display: 'flex',
  gap: '10px',
  padding: '4px',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  alignItems: 'center',
  border: '1px solid transparent'
};

export { HeroCarousel, AdSections, AdoptionList, PopularBreeds, LoginWidget, PersonalRecommendWidget };
