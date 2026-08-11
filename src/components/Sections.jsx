import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '../context/MobileContext';
import Card from './Card';
import { api } from '../lib/api';
import { calculateAge } from '../utils/age';

const DynamicBanner = ({ banners, height = '140px' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners]);

  if (!banners || banners.length === 0) {
    // 이미지가 없을 경우 숨김처리
    return null; 
  }

  const currentBanner = banners[currentIndex];
  const bgImage = currentBanner.image_url;

  return (
    <div 
      onClick={() => {
        if (currentBanner.link_url) {
          window.open(currentBanner.link_url, '_blank');
        }
      }}
      style={{
        width: '100%',
        height,
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '20px',
        border: '1px solid #cbd5e1',
        boxShadow: 'var(--shadow)',
        cursor: currentBanner.link_url ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
        const bg = e.currentTarget.querySelector('.banner-bg');
        if (bg) bg.style.transform = 'scale(1.03)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
        const bg = e.currentTarget.querySelector('.banner-bg');
        if (bg) bg.style.transform = 'scale(1)';
      }}
    >
      <div 
        className="banner-bg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 0.6s ease',
          zIndex: 1
        }}
      />
      {banners.length > 1 && (
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 3, display: 'flex', gap: '5px' }}>
          {banners.map((_, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i === currentIndex ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  );
};

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
const fetchAdsAndFill = async (_adType, limit, defaultBadge, breedName) => {
  try {
    // API를 통해 사용가능한 매물 로드
    const params = { status: 'available', limit: 100 };
    if (breedName) params.breed = breedName;
    const { data: allDogs } = await api.dogs.getList(params);
    const dogs = Array.isArray(allDogs) ? allDogs : [];

    // 관련 유형에 맞는 멌 매물 선별 (현재는 유기견 리스트를 섞어서 사용)
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
      age: calculateAge(dog.birthday, dog.age),
      price: dog.price,
      desc: dog.description || dog.desc || '팔도댕댕 추천 분양입니다.',
      date: new Date(dog.created_at).toLocaleDateString()
    }));
  } catch (err) {
    console.error('fetchAdsAndFill 실패:', err);
    return [];
  }
};


const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

const HeroCarousel = ({ breedName }) => {
  const { isMobile } = useMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ads, setAds] = useState([]);
  const [isTransitionActive, setIsTransitionActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    const loadHeroAds = async () => {
      try {
        const data = await fetchAdsAndFill('main', 10, '추천', breedName);
        if (data && data.length > 0) {
          setAds(data);
        } else {
          setAds([]);
        }
      } catch (err) {
        console.error('Failed to load main ads:', err);
        setAds([]);
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
    if (isMobile) return; // 모바일에서는 자동 롤링 정지
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
  }, [currentIndex, ads.length, isPaused, isMobile]);

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

  if (isMobile) {
    return (
      <section style={{ padding: '0px 0 5px 0', position: 'relative' }}>
        <div 
          style={{ 
            overflowX: 'auto', 
            display: 'flex',
            gap: '10px',
            padding: '4px 10px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none'
          }}
          className="mobile-scroll-container"
        >
          {ads.map((dog, i) => (
            <div 
              key={`hero-slide-mobile-${dog.id}-${i}`}
              style={{
                flex: '0 0 calc(45% - 8px)',
                scrollSnapAlign: 'start'
              }}
            >
              <Card 
                badgeText={dog.badgeText || '추천'} 
                data={{
                  ...dog,
                  image: dog.image || dog.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop',
                  breed: dog.breed || '견종 미상',
                  nickname: dog.nickname || '이름 없음',
                  gender: dog.gender || '-',
                  region: dog.region || '지역 미지정',
                  age: calculateAge(dog.birthday, dog.age),
                  price: dog.price
                }}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const extendedAds = [...ads, ...ads.slice(0, 5)];

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{ padding: '8px 0 5px 0', position: 'relative' }}
    >
      <div 
        style={{ 
          overflow: 'hidden', 
          borderRadius: '16px',
          border: '1px solid #cbd5e1',
          padding: '16px',
          backgroundColor: 'white',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative'
        }}
      >
        {/* 상단 우측 PREMIUM 뱃지 */}
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          backgroundColor: '#f8fafc',
          color: '#94a3b8',
          fontSize: '0.6rem',
          fontWeight: '500',
          padding: '2px 6px',
          borderBottomLeftRadius: '8px',
          zIndex: 15,
          borderLeft: '1px solid #f1f5f9',
          borderBottom: '1px solid #f1f5f9',
          letterSpacing: '0.5px'
        }}>
          PREMIUM
        </div>
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
                height: '210px', /* Reduced from 250px */
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
                  age: calculateAge(dog.birthday, dog.age),
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

export const SectionTitle = ({ title, sub, isAd }) => {
  const { isMobile } = useMobile();
  return (
    <div className="section-title-wrap" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-end', 
      marginBottom: isMobile ? '0px' : '15px' 
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: isMobile ? '1.15rem' : '1.4rem', margin: 0 }}>{title}</h2>
        <span style={{ fontSize: '0.85rem' }}>{sub}</span>
      </div>
      {!isMobile && isAd && (
        <span style={{ 
          fontSize: '0.65rem', 
          fontWeight: '500', 
          backgroundColor: '#f8fafc', 
          color: '#94a3b8', 
          padding: '2px 6px', 
          borderRadius: '4px', 
          border: '1px solid #f1f5f9',
          letterSpacing: '0.5px',
          flexShrink: 0
        }}>
          PREMIUM
        </span>
      )}
    </div>
  );
};


const AdSectionItem = ({ title, sub, dogs, badge, loading }) => {
  const { isMobile } = useMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitionActive, setIsTransitionActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // 홀수 개수일 경우 빈 칸이 생기지 않도록 첫 번째 강아지를 복제해서 맨 뒤에 추가해 짝수로 만듭니다.
  const adjustedDogs = [...dogs];
  if (adjustedDogs.length > 0 && adjustedDogs.length % 2 !== 0) {
    adjustedDogs.push(adjustedDogs[0]);
  }

  // 2개씩 짝지어서 1개의 열(Column) 구성
  const pairs = [];
  for (let i = 0; i < adjustedDogs.length; i += 2) {
    pairs.push(adjustedDogs.slice(i, i + 2));
  }

  const showSlider = adjustedDogs.length > 8;

  // 자동 롤링 타이머
  useEffect(() => {
    if (isMobile) return; // 모바일에서는 자동 롤링 비활성화
    if (!showSlider || isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(() => {
      setIsTransitionActive(true);
      setCurrentIndex((prev) => {
        if (prev === pairs.length) {
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
    }, 4000); // 4초마다 자동으로 다음으로 이동

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, pairs.length, isPaused, showSlider, isMobile]);

  const handlePrev = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    if (currentIndex === 0) {
      setIsTransitionActive(false);
      setCurrentIndex(pairs.length);
      setTimeout(() => {
        setIsTransitionActive(true);
        setCurrentIndex(pairs.length - 1);
      }, 30);
    } else {
      setIsTransitionActive(true);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setIsTransitionActive(true);
    setCurrentIndex((prev) => {
      if (prev === pairs.length) {
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

  // extendedPairs 구성 (뒤에 처음 4개 pair 복제)
  const extendedPairs = showSlider ? [...pairs, ...pairs.slice(0, 4)] : pairs;

  if (isMobile) {
    const isSafeAd = title.includes("안심");
    return (
      <section style={{ 
        padding: isSafeAd ? '0px 10px 10px 10px' : '10px 10px 10px 10px', 
        backgroundColor: 'transparent', 
        borderRadius: 0, 
        border: 'none', 
        boxShadow: 'none',
        marginBottom: '10px',
        position: 'relative'
      }}>
        <SectionTitle title={title} sub={sub} isAd={!isSafeAd} />
        
        {loading && dogs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px 0', color: '#888' }}>
            매물을 불러오는 중입니다...
          </p>
        ) : dogs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px 0', color: '#888' }}>
            등록된 분양 매물이 없습니다.
          </p>
        ) : (
          <div 
            style={{ 
              overflowX: 'auto', 
              display: 'flex',
              gap: '10px',
              padding: '4px 10px',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
            className="mobile-scroll-container"
          >
            {dogs.map((dog, i) => (
              <div 
                key={`mobile-ad-${badge}-${dog.id}-${i}`} 
                style={{ 
                  flex: '0 0 calc(45% - 8px)',
                  scrollSnapAlign: 'start'
                }}
              >
                <Card 
                  badgeText={dog.badgeText || badge} 
                  data={dog} 
                />
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section style={{ 
      padding: '20px 20px 10px 20px', 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      border: '1px solid #cbd5e1', 
      boxShadow: 'var(--shadow)',
      marginBottom: '10px',
      position: 'relative'
    }}>
      <SectionTitle title={title} sub={sub} isAd={true} />
      
      {loading && dogs.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '20px 0', color: '#888' }}>
          매물을 불러오는 중입니다...
        </p>
      ) : dogs.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '20px 0', color: '#888' }}>
          등록된 분양 매물이 없습니다.
        </p>
      ) : showSlider ? (
        /* 슬라이드 뷰 (8개 초과 시 가로 1열씩 무한 슬라이드) */
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {/* 좌측 버튼 */}
          <button 
            onClick={handlePrev}
            className="ad-carousel-btn left"
            aria-label="이전 슬라이드"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          
          {/* 우측 버튼 */}
          <button 
            onClick={handleNext}
            className="ad-carousel-btn right"
            aria-label="다음 슬라이드"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>

          <div 
            style={{
              display: 'flex',
              gap: '12px',
              transition: isTransitionActive ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
              transform: `translateX(calc(-${currentIndex} * (25% + 3px)))`
            }}
          >
            {extendedPairs.map((pair, idx) => (
              <div 
                key={`pair-${idx}`}
                style={{
                  flex: '0 0 calc(25% - 9px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {pair.map((dog, i) => (
                  <div key={`${badge}-${dog.id}-${i}`} style={{ height: '195px' }}>
                    <Card 
                      type="middle" 
                      badgeText={dog.badgeText || badge} 
                      data={dog} 
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 일반 그리드 뷰 (4개 이하 1줄, 5~8개 2줄) */
        <div 
          className="responsive-grid-2" 
          style={{ 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '12px' 
          }}
        >
          {adjustedDogs.map((dog, i) => (
            <Card 
              key={`${badge}-${dog.id}-${i}`} 
              type="middle" 
              badgeText={dog.badgeText || badge} 
              data={dog} 
            />
          ))}
        </div>
      )}
    </section>
  );
};


const AdSections = () => {
  const [safeDogs, setSafeDogs] = useState([]);
  const [popularDogs, setPopularDogs] = useState([]);
  const [specialDogs, setSpecialDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemBanners, setSystemBanners] = useState({});

  useEffect(() => {
    const loadAllSections = async () => {
      try {
        // 섹션 통합 광고(section) 데이터 풀을 한 번에 24개 가져옵니다.
        const [allSectionAds, bannerDataResponse] = await Promise.all([
          Promise.race([
            fetchAdsAndFill('section', 24, '추천'), 
            timeoutPromise(2500)
          ]),
          api.banners.getList()
        ]);

        const ads = allSectionAds || [];
        if (bannerDataResponse.data) {
          setSystemBanners(bannerDataResponse.data);
        }
        
        // 가져온 전체 광고를 3등분하여 안심, 인기, 스페셜 구역에 무작위 배치합니다.
        // 현재 fetchAdsAndFill 내부에서 shuffleArray가 동작하므로 이미 섞여 있습니다.
        setSafeDogs(ads.slice(0, 8).map(d => ({...d, badgeText: '추천'})));
        setPopularDogs(ads.slice(8, 16).map(d => ({...d, badgeText: '인기'})));
        setSpecialDogs(ads.slice(16, 24).map(d => ({...d, badgeText: '스페셜'})));
      } catch (err) {
        console.error('Failed to load sections:', err);
        setSafeDogs([]);
        setPopularDogs([]);
        setSpecialDogs([]);
      } finally {
        setLoading(false);
      }
    };
    loadAllSections();
  }, []);

  return (
    <>
      <AdSectionItem title="🛡️ 추천 파트너 정보" sub="팔도댕댕 추천 회원 매장이 등록한 신뢰할 수 있는 정보" dogs={safeDogs} badge="추천" loading={loading} />
      
      <DynamicBanner 
        banners={systemBanners.main_bottom_a} 
        slotName="main_bottom_a" 
      />

      <AdSectionItem title="🔥 인기 파트너 매물" sub="지금 많은 반려인들이 주목하고 있는 우수 케어 매물" dogs={popularDogs} badge="인기" loading={loading} />
      
      <DynamicBanner 
        banners={systemBanners.main_bottom_b} 
        slotName="main_bottom_b" 
      />

      <AdSectionItem title="✨ 스페셜 파트너 매물" sub="특별한 혜택과 맞춤 케어가 보증된 스페셜 매물" dogs={specialDogs} badge="스페셜" loading={loading} />
    </>
  );
};

const AdoptionList = () => {
  const { isMobile } = useMobile();
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const { data } = await api.dogs.getList({ status: 'available', limit: 12 });
        if (Array.isArray(data)) setDogs(data);
        else setDogs([]);
      } catch (error) {
        console.error(error);
        setDogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDogs();
  }, []);

  return (
    <section style={
      isMobile ? {
        padding: '15px 10px 10px 10px',
        backgroundColor: 'transparent',
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none'
      } : {
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        boxShadow: 'var(--shadow)'
      }
    }>
      <SectionTitle title="전체 등록 매물 정보" sub="실시간 업데이트 매장 정보" />
      <div 
        className={isMobile ? "" : "adoption-grid"}
        style={
          isMobile ? {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          } : undefined
        }
      >
        {loading ? (
           <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#666' }}>리스트를 불러오는 중입니다...</p>
        ) : dogs.length === 0 ? (
           <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#666' }}>아직 등록된 매장 매물 정보가 없습니다.</p>
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
                age: calculateAge(dog.birthday, dog.age),
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



const LoginWidget = () => {
  const [banners, setBanners] = useState({});

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await api.banners.getList();
      if (data) {
        setBanners(data);
      }
    };
    fetchBanners();
  }, []);

  return (
    <div style={{ marginBottom: '10px' }}>
      <DynamicBanner 
        banners={banners.main_sidebar} 
        slotName="main_sidebar" 
        height="240px" 
      />
    </div>
  );
};


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
        const available = Array.isArray(allDogs) ? allDogs : [];

        if (available.length >= 3) {
          const shuffled = [...available].sort(() => 0.5 - Math.random());
          setRecommendedDogs(shuffled.slice(0, 3));
        } else {
          setRecommendedDogs([]);
        }
      } catch (err) {
        console.error('Failed to load recommendation:', err);
        setRecommendedDogs([]);
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
            onClick={() => navigate('/detail', { state: { dog } })}
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
                width: '42px', /* Reduced from 50px */
                height: '42px', /* Reduced from 50px */
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
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  padding: '14px',
  boxShadow: 'var(--shadow)',
  marginBottom: '10px'
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

export { HeroCarousel, AdSections, AdoptionList, LoginWidget, PersonalRecommendWidget, DynamicBanner };
