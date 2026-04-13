import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AdSetupPage = () => {
  const { id: dogId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [dog, setDog] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMainAds, setActiveMainAds] = useState(0); // 현재 활성 메인광고 수
  const maxMainAds = 10; // 메인광고 최대 슬롯 수

  // 폼 상태
  const [adType, setAdType] = useState('main'); // main, safe, popular, special
  const [duration, setDuration] = useState('7'); // 7, 14, 30
  const [selectedCoupon, setSelectedCoupon] = useState('');
  
  // 상태 제출
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dogId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    setSession(session);

    // 강아지 상세 정보 가져오기
    const { data: dogData } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', dogId)
      .single();
    
    if (dogData) {
      if (dogData.seller_id !== session.user.id && session.user.user_metadata?.role !== 'admin') {
        alert('본인의 게시물만 광고 설정이 가능합니다.');
        navigate('/mypage');
        return;
      }
      setDog(dogData);
    }

    // 본인 소유의 사용 가능한 쿠폰 가져오기 (쿠폰 정보 조인)
    const { data: couponData } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupons:coupon_id(display_name, benefit_type)
      `)
      .eq('user_id', session.user.id)
      .eq('is_used', false);
    
    if (couponData) {
      // 광고 관련 쿠폰(ad_로 시작하는 타입)만 필터링하되, 
      // Join 실패로 정보를 알 수 없는 경우(null)에도 일단 사용자에게 노출하도록 허용 (안전장치)
      const adCoupons = couponData.filter(c => {
        const type = c.coupons?.benefit_type;
        return !type || type.startsWith('ad_');
      });
      setCoupons(adCoupons);
    }

    // 현재 진행 중인 메인광고 수 조회
    const { count: mainAdsCount } = await supabase
      .from('advertisements')
      .select('*', { count: 'exact', head: true })
      .eq('ad_type', 'main')
      .eq('status', 'active');
      
    setActiveMainAds(mainAdsCount || 0);

    setLoading(false);
  };

  const adTypeDisplay = {
    'main': '메인배너 (웹사이트 최상단 노출)',
    'safe': '안심분양 (인증 마크와 함께 강조)',
    'popular': '인기분양 (우선 목록 노출)',
    'special': '스페셜분양 (하이라이트 효과 적용)'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoupon) {
      alert('광고를 진행하시려면 사용하실 쿠폰을 먼저 선택해 주세요.');
      return;
    }
    if (adType === 'main' && activeMainAds >= maxMainAds) {
      alert('메인배너 잔여 슬롯이 없습니다. 다른 광고 구역을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 광고 내역 저장
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(duration));

      const { error: adError } = await supabase.from('advertisements').insert([{
        dog_id: dogId,
        seller_id: session.user.id,
        ad_type: adType,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        used_coupon_id: selectedCoupon
      }]);

      if (adError) throw adError;

      // 2. 쿠폰 사용 처리
      const { error: couponUpdateError } = await supabase
        .from('user_coupons')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', selectedCoupon);

      if (couponUpdateError) throw couponUpdateError;

      alert(`광고 설정이 완료되었습니다!\n진행 기간: ${duration}일 (${endDate.toLocaleDateString()} 까지)\n내 게시물이 즉시 홍보됩니다.`);
      navigate('/mypage');
      
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
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '20px', fontSize: '1rem' }}>
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
                          {label}
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

          {/* 광고 기간 */}
          <div>
            <label style={labelStyle}>진행 기간</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['7', '14', '30'].map(days => (
                <button 
                  key={days} type="button" 
                  onClick={() => setDuration(days)}
                  style={{ ...durationBtnStyle, borderColor: duration === days ? 'var(--primary)' : '#eee', backgroundColor: duration === days ? 'var(--primary)' : 'white', color: duration === days ? 'white' : '#666' }}
                >
                  {days}일
                </button>
              ))}
            </div>
          </div>

          {/* 결제 및 쿠폰 */}
          <div style={{ borderTop: '2px dashed #eee', paddingTop: '25px' }}>
            <label style={labelStyle}>결제 방법 (현재 쿠폰으로만 운영됩니다)</label>
            <div style={{ backgroundColor: '#fffbf0', padding: '20px', borderRadius: '15px', border: '1px solid #ffeeba' }}>
              <select 
                value={selectedCoupon} 
                onChange={(e) => setSelectedCoupon(e.target.value)}
                style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #ffd700', outline: 'none', backgroundColor: 'white', color: '#333', fontSize: '0.95rem', fontWeight: 'bold' }}
              >
                <option value="">🎁 사용할 쿠폰을 선택해 주세요</option>
                {coupons.map(c => (
                  <option key={c.id} value={c.id}>{c.coupons?.display_name || '무명 쿠폰'}</option>
                ))}
              </select>
              {coupons.length === 0 && (
                <p style={{ color: '#ff4757', fontSize: '0.85rem', marginTop: '10px', fontWeight: 'bold' }}>사용 가능한 쿠폰이 없습니다. 플랫폼 관리자 문의를 통해 쿠폰을 획득해주세요.</p>
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
const durationBtnStyle = { flex: 1, padding: '15px', borderRadius: '12px', border: '2px solid', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' };

export default AdSetupPage;
