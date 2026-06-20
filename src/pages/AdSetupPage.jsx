import React, { useState, useEffect } from 'react';

import { useRouter, useParams } from 'next/navigation';
import { api } from '../lib/api';

const AdSetupPage = () => {
  const { id: dogId  } = useParams() || {};
  const router = useRouter();
  

  const [dog, setDog] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMainAds, setActiveMainAds] = useState(0); // 현재 활성 메인광고 수
  const maxMainAds = 10; // 메인광고 최대 슬롯 수

  // 폼 상태
  const [adType, setAdType] = useState('main'); // main, breed, safe, popular, special
  const [selectedCoupon, setSelectedCoupon] = useState('');
  
  // 상태 제출
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dogId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: sessionData, error: sessionErr } = await api.auth.getSession();
    if (sessionErr || !sessionData?.session) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    const currentSession = sessionData.session;

    // 강아지 상세 정보 가져오기 (REST API)
    const { data: dogData } = await api.dogs.getDetail(dogId);
    
    if (dogData) {
      if (dogData.seller_id !== currentSession.user.id && currentSession.user.role !== 'admin') {
        alert('본인의 게시물만 광고 설정이 가능합니다.');
        router.push('/mypage');
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
    'main': '메인페이지 메인배너 (메인페이지 최상단 노출)',
    'breed': '품종별페이지 메인배너 (품종별페이지 메인배너 및 상위노출)',
    'section': '메인페이지 안심/인기/스페셜 광고 (안심/인기/스페셜 랜덤 배치)'
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
    if (!selectedCoupon) {
      alert('광고를 진행하시려면 사용할 광고 아이템을 먼저 선택해 주세요.');
      return;
    }
    if (adType === 'main' && activeMainAds >= maxMainAds) {
      alert('메인배너 잔여 슬롯이 없습니다. 다른 광고 구역을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // REST API: 광고 생성 및 쿠폰 소모 동시 처리
      const { data, error } = await api.ads.create({
        dog_id: parseInt(dogId),
        ad_type: adType,
        title: `${dog.nickname} 분양 광고 (${adTypeDisplay[adType]})`,
        used_coupon_id: parseInt(selectedCoupon)
      });

      if (error) throw new Error(error);

      const endDate = data?.endDate ? new Date(data.endDate) : new Date();

      alert(`광고 설정이 완료되었습니다!\n(${endDate.toLocaleDateString()} 까지)\n내 게시물이 즉시 홍보됩니다.`);
      router.push('/mypage');
      
    } catch (error) {
      console.error(error);
      alert('광고 설정 중 오류가 발생했습니다: ' + error.message);
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
    <div className="container" style={{ padding: '60px 0', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => router.push(-1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '20px', fontSize: '1rem' }}>
        ← 마이페이지로 돌아가기
      </button>

      <div className="glass-card" style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center' }}>광고 설정하기 📢</h1>
        
        <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '15px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '40px' }}>
          <img src={dog.image_url} alt={dog.nickname} style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }} />
          <div>
            <div style={{ color: '#888', fontSize: '0.85rem' }}>광고 대상 강아지</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{dog.nickname} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666' }}>({dog.breed})</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '25px' }}>
          
          {/* 광고 종류 */}
          <div>
            <label style={labelStyle}>광고 구역 선택</label>
            <div style={{ display: 'grid', gap: '10px' }}>
              {Object.entries(adTypeDisplay).map(([val, label]) => {
                const isMainFull = val === 'main' && activeMainAds >= maxMainAds;
                
                return (
                  <label key={val} style={{ 
                    ...radioBoxStyle, 
                    borderColor: adType === val ? 'var(--primary)' : '#eee', 
                    backgroundColor: adType === val ? 'var(--primary-light)' : (isMainFull ? '#f5f5f5' : 'white'),
                    opacity: isMainFull ? 0.6 : 1,
                    cursor: isMainFull ? 'not-allowed' : 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      value={val} 
                      checked={adType === val} 
                      onChange={() => !isMainFull && setAdType(val)} 
                      disabled={isMainFull}
                      style={{ display: 'none' }} 
                    />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: adType === val ? 'var(--primary)' : '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {adType === val && <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--primary)', borderRadius: '50%' }}></div>}
                        </div>
                        <span style={{ fontWeight: adType === val ? '800' : '500', color: adType === val ? 'var(--primary-dark)' : '#333' }}>
                          {formatAdLabel(label)}
                        </span>
                      </div>
                      {val === 'main' && (
                         <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isMainFull ? '#ff4757' : 'var(--primary)' }}>
                           {isMainFull ? '(마감)' : `(${activeMainAds}/${maxMainAds} 사용중)`}
                         </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 결제 및 아이템 */}
          <div style={{ borderTop: '2px dashed #eee', paddingTop: '25px' }}>
            <label style={labelStyle}>사용할 광고 아이템 선택</label>
            <div style={{ backgroundColor: '#fffbf0', padding: '20px', borderRadius: '15px', border: '1px solid #ffeeba' }}>
              <select 
                value={selectedCoupon} 
                onChange={(e) => setSelectedCoupon(e.target.value)}
                style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #ffd700', outline: 'none', backgroundColor: 'white', color: '#333', fontSize: '0.95rem', fontWeight: 'bold' }}
              >
                <option value="">🎁 사용할 광고 아이템을 선택해 주세요</option>
                {coupons
                  .filter(c => c.ad_type === 'all' || c.ad_type === adType)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || '무명 아이템'} (기한: {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '무제한'})
                    </option>
                ))}
              </select>
              {coupons.filter(c => c.ad_type === 'all' || c.ad_type === adType).length === 0 && (
                <div style={{ marginTop: '15px', backgroundColor: '#fff', padding: '15px', borderRadius: '10px', border: '1px dashed #ff4757', textAlign: 'center' }}>
                  <p style={{ color: '#ff4757', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 'bold' }}>
                    현재 선택한 구역에 사용 가능한 광고 아이템이 없습니다.
                  </p>
                  <button 
                    type="button"
                    onClick={() => router.push('/ad-store')}
                    style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--primary-dark)', border: '2px solid var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--primary)'; e.target.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = '#fff'; e.target.style.color = 'var(--primary-dark)'; }}
                  >
                    💳 광고 아이템 구매하러 가기
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>최종 결제 금액</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-dark)' }}>
              0 <span style={{ fontSize: '1rem', color: '#666' }}>원</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || coupons.length === 0}
            style={{ 
              width: '100%', padding: '20px', borderRadius: '15px', border: 'none', 
              backgroundColor: coupons.length === 0 ? '#ccc' : 'var(--primary)', 
              color: 'white', fontWeight: '900', fontSize: '1.1rem', cursor: coupons.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '10px'
            }}
          >
            {isSubmitting ? '처리 중...' : '확인 및 광고 시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '1rem', fontWeight: '800', color: '#333', marginBottom: '12px' };
const radioBoxStyle = { display: 'block', padding: '15px 20px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', transition: 'all 0.2s' };


export default AdSetupPage;
