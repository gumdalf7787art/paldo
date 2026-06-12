import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import { api } from '../lib/api';
import sidebarAd from '../assets/images/sidebar_ad.png';
import petInsuranceBanner from '../assets/images/pet_insurance_banner.png';
import petShopBanner from '../assets/images/pet_shop_banner.png';
import { calculateAge } from '../utils/age';

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
    const params = { status: 'available', limit: 20 };
    if (breedName) params.breed = breedName;
    const { data: allDogs } = await api.dogs.getList(params);
    const dogs = Array.isArray(allDogs) ? allDogs : [];

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
      age: calculateAge(dog.birthday, dog.age),
      price: dog.price,
      desc: dog.description || dog.desc || '다잇독 추천 분양입니다.',
      date: new Date(dog.created_at).toLocaleDateString()
    }));
  } catch (err) {
    console.error('fetchAdsAndFill 실패:', err);
    return [];
  }
};


const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

const HeroCarousel = ({ breedName }) => {
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
        {/* 상단 우측 AD 뱃지 (박스 전체가 광고임을 명시) */}
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          backgroundColor: 'transparent',
          color: '#cbd5e1',
          fontSize: '0.6rem',
          fontWeight: '500',
          padding: '2px 6px',
          borderBottomLeftRadius: '8px',
          zIndex: 15,
          borderLeft: '1px solid transparent',
          borderBottom: '1px solid transparent',
          letterSpacing: '0.5px'
        }}>
          AD
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

const SectionTitle = ({ title, sub, isAd }) => (
  <div className="section-title-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
      <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{title}</h2>
      <span style={{ fontSize: '0.85rem' }}>{sub}</span>
    </div>
    {isAd && (
      <span style={{ 
        fontSize: '0.65rem', 
        fontWeight: '500', 
        backgroundColor: 'transparent', 
        color: '#cbd5e1', 
        padding: '2px 6px', 
        borderRadius: '4px', 
        border: '1px solid transparent',
        letterSpacing: '0.5px',
        flexShrink: 0
      }}>
        AD
      </span>
    )}
  </div>
);


const AdSectionItem = ({ title, sub, dogs, badge, loading }) => {
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
  }, [currentIndex, pairs.length, isPaused, showSlider]);

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

const PetInsuranceBanner = () => {
  return (
    <div 
      style={{
        width: '100%',
        height: '140px',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '20px',
        border: '1px solid #cbd5e1',
        boxShadow: 'var(--shadow)',
        cursor: 'pointer',
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
      {/* 배경 이미지 */}
      <div 
        className="banner-bg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${petInsuranceBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 0.6s ease',
          zIndex: 1
        }}
      />
      {/* 어두운 그라데이션 오버레이 (텍스트 가독성 확보) */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0) 100%)',
          zIndex: 2
        }}
      />
      {/* 배너 텍스트 및 버튼 콘텐츠 */}
      <div 
        style={{
          position: 'relative',
          zIndex: 3,
          padding: '0 40px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '70%'
        }}
      >
        <span 
          style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            backgroundColor: '#ff4757',
            padding: '4px 10px',
            borderRadius: '20px',
            width: 'fit-content',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          마이펫 케어
        </span>
        <h2 
          style={{
            fontSize: '1.9rem',
            fontWeight: '900',
            margin: 0,
            lineHeight: '1.25',
            letterSpacing: '-1px',
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            wordBreak: 'keep-all'
          }}
        >
          우리 아이 건강을 지켜주는 평생 건강보험
        </h2>
      </div>
      
      {/* 오른쪽 끝 장식 버튼 */}
      <div 
        style={{
          position: 'absolute',
          right: '40px',
          zIndex: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#111',
          padding: '10px 20px',
          borderRadius: '30px',
          fontSize: '0.8rem',
          fontWeight: '800',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.3s ease'
        }}
      >
        <span>자세히 보기</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </div>
  );
};

const PetShopBanner = () => {
  return (
    <div 
      style={{
        width: '100%',
        height: '140px',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '20px',
        border: '1px solid #cbd5e1',
        boxShadow: 'var(--shadow)',
        cursor: 'pointer',
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
      {/* 배경 이미지 */}
      <div 
        className="banner-bg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${petShopBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 0.6s ease',
          zIndex: 1
        }}
      />
      {/* 어두운 그라데이션 오버레이 (텍스트 가독성 확보) */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 65%, rgba(0,0,0,0) 100%)',
          zIndex: 2
        }}
      />
      {/* 배너 텍스트 및 버튼 콘텐츠 */}
      <div 
        style={{
          position: 'relative',
          zIndex: 3,
          padding: '0 40px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '70%'
        }}
      >
        <span 
          style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            backgroundColor: '#ffa502',
            padding: '4px 10px',
            borderRadius: '20px',
            width: 'fit-content',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          다잇독 펫숍 기획전
        </span>
        <h2 
          style={{
            fontSize: '1.9rem',
            fontWeight: '900',
            margin: 0,
            lineHeight: '1.25',
            letterSpacing: '-1px',
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            wordBreak: 'keep-all'
          }}
        >
          우리 아이 취향저격 명품 용품숍, 최대 50% 단독 특가!
        </h2>
      </div>
      
      {/* 오른쪽 끝 장식 버튼 */}
      <div 
        style={{
          position: 'absolute',
          right: '40px',
          zIndex: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#111',
          padding: '10px 20px',
          borderRadius: '30px',
          fontSize: '0.8rem',
          fontWeight: '800',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.3s ease'
        }}
      >
        <span>구경하기</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </div>
  );
};

const AdSections = () => {
  const [safeDogs, setSafeDogs] = useState([]);
  const [popularDogs, setPopularDogs] = useState([]);
  const [specialDogs, setSpecialDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllSections = async () => {
      try {
        const [safe, popular, special] = await Promise.all([
          Promise.race([fetchAdsAndFill('safe', 20, '안심'), timeoutPromise(2500)]),
          Promise.race([fetchAdsAndFill('popular', 20, '인기'), timeoutPromise(2500)]),
          Promise.race([fetchAdsAndFill('special', 20, '스페셜'), timeoutPromise(2500)])
        ]);

        setSafeDogs(safe || []);
        setPopularDogs(popular || []);
        setSpecialDogs(special || []);
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
      <AdSectionItem title="🛡️ 안심 분양 정보" sub="다잇독이 직접 검증한 깨끗한 안심 분양" dogs={safeDogs} badge="안심" loading={loading} />
      <PetInsuranceBanner />
      <AdSectionItem title="🔥 인기 분양 정보" sub="지금 많은 분들이 주목하고 있는 댕댕이" dogs={popularDogs} badge="인기" loading={loading} />
      <AdSectionItem title="✨ 스페셜 분양 정보" sub="선택받은 특별한 케어와 혜택의 분양" dogs={specialDogs} badge="스페셜" loading={loading} />
      <PetShopBanner />
    </>
  );
};

const AdoptionList = () => {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const { data } = await api.dogs.getList({ status: 'available', limit: 12 });
        if (Array.isArray(data)) setDogs(data);
        else setDogs([]);
      } catch (err) {
        setDogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDogs();
  }, []);

  return (
    <section style={{ padding: '24px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow)' }}>
      <SectionTitle title="전체 분양 리스트" sub="실시간 등록 정보" />
      <div className="adoption-grid">
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
  return (
    <div 
      className="naver-profile-widget" 
      style={{ 
        padding: '0', 
        overflow: 'hidden', 
        cursor: 'pointer',
        display: 'block',
        height: '240px',
        position: 'relative'
      }}
      onClick={() => window.open('https://github.com/gumdalf7787art/paldo', '_blank')}
    >
      <img 
        src={sidebarAd} 
        alt="광고 배너" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          display: 'block'
        }} 
      />
      <span style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        color: 'white',
        fontSize: '0.62rem',
        padding: '2px 6px',
        borderRadius: '4px',
        fontWeight: 'bold',
        letterSpacing: '0.5px'
      }}>
        AD
      </span>
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

export { HeroCarousel, AdSections, AdoptionList, LoginWidget, PersonalRecommendWidget };
