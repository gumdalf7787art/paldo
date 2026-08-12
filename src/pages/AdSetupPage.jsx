import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const AdSetupPage = () => {
  const { id: dogId } = useParams();
  const navigate = useNavigate();
  

  const [dog, setDog] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMainAds, setActiveMainAds] = useState(0); // 현재 활성 프리미엄 수
  const maxMainAds = 10; // 최대 슬롯 수

  // 폼 상태
  const [adType, setAdType] = useState('main'); // 기본 선택
  const [showCoupons, setShowCoupons] = useState(false);
  
  // 상태 제출
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adTypes = {
    main: [
      { id: 'main', label: '히어로 섹션', img: '/images/ad_hero.jpg' },
      { id: 'recommend', label: '추천 섹션', img: '/images/ad_recommend.jpg' },
      { id: 'popular', label: '인기 섹션', img: '/images/ad_popular.jpg' },
      { id: 'special', label: '스페셜 섹션', img: '/images/ad_special.jpg' }
    ],
    breed: [
      { id: 'breed_main', label: '히어로 섹션', img: '/images/ad_hero.jpg' },
      { id: 'breed_recommend', label: '추천 섹션', img: '/images/ad_recommend.jpg' },
      { id: 'breed_popular', label: '인기 섹션', img: '/images/ad_popular.jpg' },
      { id: 'breed_special', label: '스페셜 섹션', img: '/images/ad_special.jpg' }
    ]
  };

  const getAdInfo = (type) => {
    return [...adTypes.main, ...adTypes.breed].find(a => a.id === type);
  };

  useEffect(() => {
    fetchData();
  }, [dogId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: sessionData, error: sessionErr } = await api.auth.getSession();
    if (sessionErr || !sessionData?.session) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    const currentSession = sessionData.session;

    // 강아지 상세 정보 가져오기 (REST API)
    const { data: dogData } = await api.dogs.getDetail(dogId);
    
    if (dogData) {
      if (dogData.seller_id !== currentSession.user.id && currentSession.user.role !== 'admin') {
        alert('본인의 게시물만 서비스 설정이 가능합니다.');
        navigate('/mypage');
        return;
      }
      setDog(dogData);
    }

    // 본인 소유의 사용 가능한 쿠폰 가져오기 (REST API)
    const { data: couponData } = await api.auth.getMyCoupons();
    
    if (couponData) {
      setCoupons(couponData);
    }

    // 현재 진행 중인 메인광고 수 조회 (REST API)
    const { data: mainAdsCount } = await api.ads.getCount('main', 'active');
    setActiveMainAds(mainAdsCount || 0);

    setLoading(false);
  };

  const adTypeDisplay = {
    'main': '메인페이지 프리미엄 소개 서비스 (최상단 영역 노출)',
    'breed': '목록페이지 프리미엄 소개 서비스 (상단 영역 노출)',
    'section': '메인페이지 프리미엄 매장 소개 서비스 (추천 섹션 무작위 배치)'
  };

  const formatAdLabel = (label) => {
    if (label.startsWith('메인페이지')) {
      return <><span style={{ color: '#4A90E2' }}>메인페이지</span> {label.substring(5)}</>;
    } else if (label.startsWith('품종별페이지')) {
      return <><span style={{ color: '#7ED321' }}>품종별페이지</span> {label.substring(6)}</>;
    }
    return label;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const targetCoupons = coupons.filter(c => c.ad_type === adType || c.ad_type === 'all');
    if (targetCoupons.length === 0) {
      alert('선택하신 영역에 사용할 수 있는 쿠폰이 없습니다.');
      return;
    }

    if (adType === 'main' && activeMainAds >= maxMainAds) {
      alert('프리미엄 노출 잔여 슬롯이 없습니다. 다른 서비스 구역을 선택해주세요.');
      return;
    }

    const couponToUse = targetCoupons[0];

    setIsSubmitting(true);
    try {
      // REST API: 서비스 생성 및 쿠폰 소모 동시 처리
      const { data, error } = await api.ads.create({
        dog_id: parseInt(dogId),
        ad_type: adType,
        title: `${dog.nickname} 프리미엄 서비스 (${getAdInfo(adType)?.label})`,
        used_coupon_id: couponToUse.id
      });

      if (error) throw new Error(error);

      const endDate = data?.endDate ? new Date(data.endDate) : new Date();

      alert(`서비스 설정이 완료되었습니다!\n(${endDate.toLocaleDateString()} 까지)\n내 게시물에 프리미엄 혜택이 적용됩니다.`);
      navigate('/mypage');
      
    } catch (error) {
      console.error(error);
      alert('서비스 설정 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px 0' }}>데이터를 불러오는 중입니다...</div>;
  }

  if (!dog) {
    return <div style={{ textAlign: 'center', padding: '100px 0' }}>대상 게시물을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container" style={{ padding: '60px 0', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '20px', fontSize: '1rem' }}>
        ← 마이페이지로 돌아가기
      </button>

      <div className="glass-card" style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center' }}>광고 설정하기 📢</h1>
        
        <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '15px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '40px' }}>
          <img src={dog.image_url} alt={dog.nickname} style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }} />
          <div>
            <div style={{ color: '#888', fontSize: '0.85rem' }}>대상 게시물</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{dog.nickname} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666' }}>({dog.breed})</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
            
            {/* 왼쪽: 이미지 미리보기 */}
            <div style={{ flex: '1 1 300px', backgroundColor: '#f8fafc', borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', minHeight: '300px' }}>
              <div style={{ fontSize: '1rem', color: '#475569', fontWeight: 'bold', marginBottom: '15px' }}>선택된 영역 미리보기</div>
              {adType ? (
                <img src={getAdInfo(adType)?.img} alt="미리보기" style={{ width: '100%', borderRadius: '10px', boxShadow: 'var(--shadow)' }} />
              ) : (
                <div style={{ padding: '40px', color: '#94a3b8' }}>광고 영역을 선택해주세요.</div>
              )}
            </div>

            {/* 오른쪽: 라디오 옵션 */}
            <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <label style={labelStyle}>서비스 노출 영역 선택</label>
              
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#E65100' }}>[메인페이지]</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {adTypes.main.map((opt) => {
                  const availableCount = coupons.filter(c => c.ad_type === opt.id || c.ad_type === 'all').length;
                  const isMainFull = opt.id === 'main' && activeMainAds >= maxMainAds;
                  const isDisabled = availableCount === 0 || isMainFull;

                  return (
                    <label key={opt.id} style={{ 
                      ...radioBoxStyle, 
                      padding: '12px 15px',
                      borderColor: adType === opt.id ? 'var(--primary)' : '#eee', 
                      backgroundColor: adType === opt.id ? 'var(--primary-light)' : (isDisabled ? '#f8fafc' : 'white'),
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        value={opt.id} 
                        checked={adType === opt.id} 
                        onChange={() => !isDisabled && setAdType(opt.id)} 
                        disabled={isDisabled}
                        style={{ display: 'none' }} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ fontWeight: adType === opt.id ? '800' : '600', color: adType === opt.id ? 'var(--primary-dark)' : '#334155' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: availableCount > 0 ? 'var(--primary)' : '#94a3b8' }}>
                          보유 쿠폰: {availableCount}장
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#00796B', marginTop: '10px' }}>[견종별 페이지]</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {adTypes.breed.map((opt) => {
                  const availableCount = coupons.filter(c => c.ad_type === opt.id || c.ad_type === 'all').length;
                  const isDisabled = availableCount === 0;

                  return (
                    <label key={opt.id} style={{ 
                      ...radioBoxStyle,
                      padding: '12px 15px',
                      borderColor: adType === opt.id ? '#00796B' : '#eee', 
                      backgroundColor: adType === opt.id ? '#E0F2F1' : (isDisabled ? '#f8fafc' : 'white'),
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        value={opt.id} 
                        checked={adType === opt.id} 
                        onChange={() => !isDisabled && setAdType(opt.id)} 
                        disabled={isDisabled}
                        style={{ display: 'none' }} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ fontWeight: adType === opt.id ? '800' : '600', color: adType === opt.id ? '#004D40' : '#334155' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: availableCount > 0 ? '#00796B' : '#94a3b8' }}>
                          보유 쿠폰: {availableCount}장
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 결제 및 아이템 */}
          <div style={{ borderTop: '2px dashed #eee', paddingTop: '25px' }}>
            <div 
              onClick={() => setShowCoupons(!showCoupons)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '15px 20px', backgroundColor: '#fffbf0', borderRadius: '10px', border: '1px solid #ffeeba' }}
            >
              <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#b45309' }}>🎟️ 나의 보유 쿠폰 보기</span>
              <span style={{ fontWeight: 'bold', color: '#b45309' }}>{showCoupons ? '▲ 접기' : '▼ 펼치기'}</span>
            </div>
            
            {showCoupons && (
              <div style={{ marginTop: '10px', padding: '15px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', maxHeight: '280px', overflowY: 'auto' }}>
                {coupons.length === 0 ? (
                   <p style={{ color: '#64748b', textAlign: 'center', margin: '20px 0' }}>보유 중인 쿠폰이 없습니다.</p>
                ) : (
                   <div style={{ display: 'grid', gap: '8px' }}>
                     {Object.values(coupons.reduce((acc, curr) => {
                        const key = curr.name;
                        if (!acc[key]) acc[key] = { ...curr, count: 0 };
                        acc[key].count += 1;
                        return acc;
                      }, {})).map((c, idx) => (
                       <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                         <span style={{ fontWeight: 'bold', color: '#334155' }}>{c.name}</span>
                         <span style={{ color: 'var(--primary-dark)', fontWeight: '900', fontSize: '1.1rem' }}>{c.count}장</span>
                       </div>
                     ))}
                   </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>최종 결제 금액</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-dark)' }}>
              0 <span style={{ fontSize: '1rem', color: '#666' }}>원</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || coupons.filter(c => c.ad_type === adType || c.ad_type === 'all').length === 0}
            style={{ 
              width: '100%', padding: '20px', borderRadius: '15px', border: 'none', 
              backgroundColor: coupons.filter(c => c.ad_type === adType || c.ad_type === 'all').length === 0 ? '#ccc' : 'var(--primary)', 
              color: 'white', fontWeight: '900', fontSize: '1.1rem', cursor: coupons.filter(c => c.ad_type === adType || c.ad_type === 'all').length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '10px'
            }}
          >
            {isSubmitting ? '처리 중...' : '확인 및 서비스 적용하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '1rem', fontWeight: '800', color: '#333', marginBottom: '12px' };
const radioBoxStyle = { display: 'block', padding: '15px 20px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', transition: 'all 0.2s' };


export default AdSetupPage;
