import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const AdStorePage = () => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [payMethod, setPayMethod] = useState('card'); // 'card' or 'vbank'
  const [senderName, setSenderName] = useState('');

  useEffect(() => {
    // 현재 사용자 정보 불러오기
    const loadUser = async () => {
      const { data } = await api.auth.getUser();
      if (data) {
        setCurrentUser(data);
      }
    };
    loadUser();

    // 포트원 SDK 초기화
    if (window.IMP) {
      const impCode = import.meta.env.VITE_PORTONE_IMP_CODE;
      window.IMP.init(impCode);
    }
  }, []);

  // 상품 정보
  const items = [
    {
      id: 1,
      name: '메인페이지 프리미엄 소개 서비스',
      price: 50000,
      description: '메인페이지 최상단 슬라이드 영역에 비즈니스 회원의 매장 및 콘텐츠가 우선 소개됩니다.',
      type: 'main',
      image: '/images/ads/ad_main.jpg'
    },
    {
      id: 2,
      name: '목록페이지 프리미엄 소개 서비스',
      price: 50000,
      description: '견종별 리스트 페이지 상단 영역에 비즈니스 회원의 콘텐츠가 우선 소개됩니다.',
      type: 'breed',
      image: '/images/ads/ad_breed.jpg'
    },
    {
      id: 3,
      name: '메인페이지 프리미엄 매장 소개 서비스',
      price: 30000,
      description: '메인페이지의 안심/인기/스페셜 추천 섹션 중 무작위 위치에 소개됩니다. (위치 공정성 보장)',
      type: 'section',
      image: '/images/ads/ad_safe.jpg'
    },
    {
      id: 6,
      name: '게시물 5개 추가 멤버십 이용권',
      price: 30000,
      description: '결제일로부터 30일 동안 게시물 등록 한도가 5개 증가합니다.',
      type: 'post_limit_5',
      image: '/images/ads/post_add_5.png'
    },
    {
      id: 7,
      name: '게시물 10개 추가 멤버십 이용권',
      price: 50000,
      description: '결제일로부터 30일 동안 게시물 등록 한도가 10개 증가합니다.',
      type: 'post_limit_10',
      image: '/images/ads/post_add_10.png'
    },
    {
      id: 8,
      name: '게시물 20개 추가 멤버십 이용권',
      price: 70000,
      description: '결제일로부터 30일 동안 게시물 등록 한도가 20개 증가합니다.',
      type: 'post_limit_20',
      image: '/images/ads/post_add_20.png'
    },
    {
      id: 9,
      name: '실결제 테스트용 이용권 (200원)',
      price: 200,
      description: '실제 토스페이 결제 연동 테스트를 위한 200원 결제 상품입니다.',
      type: 'test_100',
      image: '/images/ads/post_add_5.png'
    }
  ];

  const handlePurchaseClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const renderAdName = (name) => {
    if (name.includes('메인페이지')) {
      const suffix = name.replace('메인페이지', '').trim();
      return <><span style={{ color: '#4A90E2' }}>메인페이지</span> <span style={{ color: '#333' }}>{suffix}</span></>;
    } else if (name.includes('품종별페이지')) {
      const suffix = name.replace('품종별페이지', '').trim();
      return <><span style={{ color: '#7ED321' }}>품종별페이지</span> <span style={{ color: '#333' }}>{suffix}</span></>;
    }
    return <span style={{ color: '#333' }}>{name}</span>;
  };

  return (
    <div className="container fade-in" style={{ padding: '40px 20px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary-dark)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛒 다잇독 비즈니스 멤버십 스토어
          </h1>
          <p style={{ color: '#666', fontSize: '1.05rem', lineHeight: '1.6' }}>
            비즈니스 회원을 위한 다양한 맞춤형 프리미엄 멤버십 및 이용권을 만나보세요.<br/>
            결제하신 멤버십 이용권은 즉시 <b style={{color: 'var(--primary-dark)'}}>보유 이용권 현황</b>으로 지급됩니다.
          </p>
        </div>
        <button onClick={() => navigate('/mypage')} style={{ padding: '12px 24px', borderRadius: '12px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>← 마이페이지로 이동</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {items.map(item => (
          <div key={item.id} className="glass-card" style={{ padding: '15px 15px', border: '1px solid #eef2f7', borderRadius: '15px', display: 'flex', flexDirection: 'column', transition: 'all 0.3s', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}
               onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.08)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.04)'; }}>
            
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'inline-block', 
                padding: '2px 8px', 
                backgroundColor: item.type === 'test_100' ? '#ebfbee' : (item.type.startsWith('post_limit') ? '#e8f4fd' : '#fffbf0'), 
                color: item.type === 'test_100' ? '#2f3542' : (item.type.startsWith('post_limit') ? '#2980b9' : '#e6a800'), 
                borderRadius: '15px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold', 
                marginBottom: '8px', 
                border: `1px solid ${item.type === 'test_100' ? '#a4b0be' : (item.type.startsWith('post_limit') ? '#bde0fe' : '#ffeeba')}` 
              }}>
                {item.type === 'test_100' ? '🛠️ 테스트 결제용' : (item.type.startsWith('post_limit') ? '✨ 30일간 한도 확장' : '✨ 노출 보장 기간: 7일')}
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '6px', lineHeight: '1.4' }}>
                {renderAdName(item.name)}
              </h2>
              <p style={{ color: '#666', lineHeight: '1.4', fontSize: '0.85rem', minHeight: '30px', margin: 0 }}>
                {item.description}
              </p>
            </div>

            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px dashed #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                <span style={{ color: '#888', fontSize: '0.85rem', fontWeight: 'bold' }}>정상가</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary-dark)' }}>
                  {item.price.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#555' }}>원</span>
                </span>
              </div>
              <button 
                onClick={() => handlePurchaseClick(item)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '10px', 
                  backgroundColor: item.type === 'test_100' ? '#2f3542' : (item.type.startsWith('post_limit') ? '#3498db' : 'var(--primary)'), 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: '900', 
                  fontSize: '0.95rem', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  boxShadow: item.type === 'test_100' ? '0 4px 10px rgba(47, 53, 66, 0.3)' : (item.type.startsWith('post_limit') ? '0 4px 10px rgba(52, 152, 219, 0.3)' : '0 4px 10px rgba(255, 171, 0, 0.3)') 
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = item.type === 'test_100' ? '#57606f' : (item.type.startsWith('post_limit') ? '#2980b9' : 'var(--primary-dark)')}
                onMouseLeave={(e) => e.target.style.backgroundColor = item.type === 'test_100' ? '#2f3542' : (item.type.startsWith('post_limit') ? '#3498db' : 'var(--primary)')}
              >
                {item.type === 'test_100' ? '테스트 결제 진행' : (item.type.startsWith('post_limit') ? '멤버십 혜택 안내 및 결제' : '서비스 이용 안내 및 결제')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 이니시스 심사용 상품 상세페이지 필수 고지 사항 */}
      <div style={{
        maxWidth: '1100px',
        margin: '40px auto 0 auto',
        padding: '24px',
        backgroundColor: '#f8f9fa',
        borderRadius: '16px',
        border: '1px solid #eef2f7',
        fontSize: '0.9rem',
        color: '#4a5568',
        lineHeight: '1.7',
        boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
      }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#2d3748', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📢 서비스 제공 및 취소/환불 안내 (필수 고지)
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>서비스 제공기간 (배송 기간)</strong>: 본 서비스는 무형의 소프트웨어(SaaS) 솔루션으로, 결제 완료 즉시 멤버십 이용권이 계정에 지급되어 실시간으로 사용 가능합니다.</li>
          <li><strong>청약철회 및 취소/환불 규정</strong>: 
            <ul style={{ paddingLeft: '15px', marginTop: '4px', listStyleType: 'circle', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>결제 후 7일 이내에 구매한 비즈니스 멤버십 이용권을 전혀 사용하지 않은 경우 <strong>100% 전액 환불</strong>이 가능합니다.</li>
              <li>결제 후 7일이 경과했거나, 이용권을 이미 1회 이상 사용(서비스 적용 등)한 후 중도 해지를 요청하는 경우: <strong>결제 금액에서 '이용 기간에 해당하는 금액(일할 계산)'과 '해지 위약금(결제 금액의 10%)'을 공제한 잔여 금액을 환불</strong>해 드립니다.</li>
            </ul>
          </li>
          <li><strong>교환 및 반품 안내</strong>: 다잇독 비즈니스 멤버십 스토어 상품은 오프라인 실물 배송 상품이 아닌 무형의 온라인 솔루션이므로 실물 제품 교환 및 반품은 적용되지 않습니다.</li>
          <li>자세한 취소/환불 및 결제 조건은 하단 푸터의 <a href="/refund" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>[서비스 이용 및 환불 정책]</a> 페이지를 참고해 주시기 바랍니다.</li>
        </ul>
      </div>

      {/* 무통장 입금 안내 모달 */}
      {isModalOpen && selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>
          <div className="fade-in" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', display: 'flex', gap: '30px' }} onClick={e => e.stopPropagation()}>
            
            {/* 왼쪽: 아이템 미리보기 */}
            <div style={{ flex: 1, borderRight: '1px solid #eee', paddingRight: '20px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#333', marginBottom: '15px' }}>
                {selectedItem.type.startsWith('post_limit') ? '📦 비즈니스 멤버십 혜택 상세' : (selectedItem.type === 'test_100' ? '🛠️ 테스트 결제 상세' : '📺 프리미엄 서비스 노출 예시')}
              </h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>{selectedItem.description}</p>
              <div style={{ flex: 1, backgroundColor: '#f0f4f8', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '250px', border: '1px solid #eee', overflow: 'hidden' }}>
                <img src={selectedItem.image} alt={selectedItem.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                <div style={{ textAlign: 'center', color: '#64748b', display: 'none' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🖼️</span>
                  <span>이미지 준비중</span>
                </div>
              </div>
            </div>

            {/* 오른쪽: 결제 및 신청 안내 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary-dark)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  💳 결제 수단 선택
                </h3>
                <p style={{ color: '#666', lineHeight: '1.5', fontSize: '0.9rem', marginBottom: '20px' }}>
                  편리하고 안전한 결제 방식을 선택하여 서비스를 신청하세요.<br/>
                  가상계좌 입금의 경우, 입금이 완료되면 서비스 이용권이 즉시 지급됩니다.
                </p>

                {/* 결제 수단 선택 라디오/버튼 그룹 */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <button
                    onClick={() => setPayMethod('card')}
                    style={{
                      flex: 1,
                      padding: '12px 6px',
                      borderRadius: '10px',
                      border: payMethod === 'card' ? '2px solid var(--primary)' : '1px solid #ddd',
                      backgroundColor: payMethod === 'card' ? '#fffbf0' : '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      color: payMethod === 'card' ? 'var(--primary-dark)' : '#555',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      wordBreak: 'keep-all'
                    }}
                  >
                    💳 일반 신용카드
                  </button>
                  <button
                    onClick={() => setPayMethod('tosspay')}
                    style={{
                      flex: 1,
                      padding: '12px 6px',
                      borderRadius: '10px',
                      border: payMethod === 'tosspay' ? '2px solid var(--primary)' : '1px solid #ddd',
                      backgroundColor: payMethod === 'tosspay' ? '#e6f0fa' : '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      color: payMethod === 'tosspay' ? '#0064ff' : '#555',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      wordBreak: 'keep-all'
                    }}
                  >
                    🔵 토스 간편결제
                  </button>
                  <button
                    onClick={() => setPayMethod('vbank')}
                    style={{
                      flex: 1,
                      padding: '12px 6px',
                      borderRadius: '10px',
                      border: payMethod === 'vbank' ? '2px solid var(--primary)' : '1px solid #ddd',
                      backgroundColor: payMethod === 'vbank' ? '#fffbf0' : '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      color: payMethod === 'vbank' ? 'var(--primary-dark)' : '#555',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      wordBreak: 'keep-all'
                    }}
                  >
                    🏦 가상계좌
                  </button>
                </div>

                {payMethod === 'vbank' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>
                      입금자명 (실명) <span style={{ color: '#ff4757' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={currentUser?.business_name || currentUser?.nickname || '입금하시는 분 성함을 입력하세요'}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem' }}
                    />
                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '6px' }}>* 실제 입금하실 분의 실명을 정확히 입력해 주세요.</p>
                  </div>
                )}

                <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>구매 상품</span>
                    <strong style={{ color: '#333', fontSize: '0.9rem' }}>{selectedItem.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>결제 금액</span>
                    <strong style={{ color: '#ff4757', fontSize: '1.2rem' }}>{selectedItem.price.toLocaleString()}원</strong>
                  </div>
                  <div style={{ height: '1px', backgroundColor: '#ddd', margin: '15px 0' }}></div>
                  <div style={{ fontSize: '0.85rem', color: '#e67e22', lineHeight: '1.4' }}>
                    {payMethod === 'card' ? (
                      <span>* 하나카드, 비씨카드, 신한카드 등 모든 카드사 결제가 가능합니다.</span>
                    ) : (
                      <span>* 결제창에서 은행 선택 시 발급되는 계좌로 입금 기한 내 송금해 주세요.</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                >
                  닫기
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={async () => {
                    if (!currentUser) {
                      alert('로그인이 필요한 서비스입니다.');
                      navigate('/login');
                      return;
                    }

                    setIsSubmitting(true);

                    if (payMethod === 'vbank' && !senderName.trim()) {
                      alert('입금자명(실명)을 정확히 입력해 주세요.');
                      setIsSubmitting(false);
                      return;
                    }

                    // 1. 다잇독 백엔드에 임시 서비스 신청 생성
                    const { data: requestData, error: requestError } = await api.ads.requestAdPurchase({
                      ad_type: selectedItem.type,
                      title: selectedItem.name,
                      price: selectedItem.price,
                      duration: 7 // 기본 노출 기간 7일
                    });

                    if (requestError || !requestData || !requestData.adId) {
                      alert('서비스 신청 도중 오류가 발생했습니다: ' + (requestError || '알 수 없는 오류'));
                      setIsSubmitting(false);
                      return;
                    }

                    const adId = requestData.adId;
                    const merchantUid = `merchant_ad_${adId}_${Date.now()}`;

                    // 2. 포트원 결제창 호출
                    if (!window.IMP) {
                      alert('포트원 라이브러리가 로드되지 않았습니다.');
                      setIsSubmitting(false);
                      return;
                    }

                    const paymentData = {
                      channelKey: payMethod === 'tosspay' ? import.meta.env.VITE_PORTONE_CHANNEL_KEY_TOSS : import.meta.env.VITE_PORTONE_CHANNEL_KEY_GENERAL,
                      pay_method: payMethod,
                      merchant_uid: merchantUid,
                      name: selectedItem.name,
                      amount: selectedItem.price,
                      buyer_email: currentUser.email || '',
                      buyer_name: (payMethod === 'vbank' ? senderName.trim() : (currentUser.nickname || currentUser.email || '')),
                      buyer_tel: currentUser.phone || '',
                      m_redirect_url: window.location.origin + `/mypage?payment_done=true&tab=payments&amount=${selectedItem.price}&ad_id=${adId}&pay_method=${payMethod}`
                    };

                    window.IMP.request_pay(paymentData, async (rsp) => {
                      if (rsp.success) {
                        let resolvedPayMethod = rsp.pay_method;
                        const provider = rsp.pg_provider ? rsp.pg_provider.toLowerCase() : '';
                        const cardName = rsp.card_name ? rsp.card_name.toLowerCase() : '';
                        
                        if (provider.includes('kakaopay') || resolvedPayMethod === 'kakaopay' || cardName.includes('카카오') || cardName.includes('kakao')) {
                          resolvedPayMethod = 'kakaopay';
                        } else if (provider.includes('naverpay') || resolvedPayMethod === 'naverpay' || cardName.includes('네이버') || cardName.includes('naver') || resolvedPayMethod === 'point') {
                          resolvedPayMethod = 'naverpay';
                        } else if (provider.includes('tosspay') || resolvedPayMethod === 'tosspay' || cardName.includes('토스') || cardName.includes('toss')) {
                          resolvedPayMethod = 'tosspay';
                        } else if (provider.includes('payco') || resolvedPayMethod === 'payco' || cardName.includes('페이코')) {
                          resolvedPayMethod = 'payco';
                        }

                        // 3. 백엔드 결제 검증 호출
                        const { data: verifyData, error: verifyError } = await api.payment.verify(
                          rsp.imp_uid,
                          rsp.merchant_uid,
                          rsp.paid_amount || selectedItem.price,
                          adId,
                          resolvedPayMethod,
                          {
                            vbank_num: rsp.vbank_num,
                            vbank_name: rsp.vbank_name,
                            vbank_holder: rsp.vbank_holder,
                            vbank_date: rsp.vbank_date
                          }
                        );

                        setIsSubmitting(false);

                        if (verifyError) {
                          setIsModalOpen(false);
                          alert(`결제 실패: ${verifyError}`);
                          navigate('/mypage', { state: { paymentError: verifyError } });
                          return;
                        }

                        if (verifyData && verifyData.status === 'ready' && verifyData.vbank) {
                          const v = {
                            ...verifyData.vbank,
                            amount: selectedItem.price
                          };
                          setIsModalOpen(false);
                          alert(`가상계좌 발급 완료: [${v.vbank_name} ${v.vbank_num}]`);
                          navigate('/mypage', { state: { paymentReady: true, vbank: v, openTab: 'payments' } });
                        } else {
                          setIsModalOpen(false);
                          navigate('/mypage', { state: { paymentSuccess: true, openTab: 'payments' } });
                        }
                      } else {
                        setIsSubmitting(false);
                        setIsModalOpen(false);
                        alert(`결제 실패: ${rsp.error_msg}`);
                        navigate('/mypage', { state: { paymentError: rsp.error_msg } });
                      }
                    });
                  }}
                  style={{ flex: 2, padding: '14px', borderRadius: '12px', backgroundColor: isSubmitting ? '#ccc' : 'var(--primary)', color: 'white', border: 'none', fontWeight: '900', fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: isSubmitting ? 'none' : '0 4px 15px rgba(255, 171, 0, 0.3)' }}
                  onMouseEnter={(e) => { if(!isSubmitting) e.target.style.backgroundColor = 'var(--primary-dark)'; }}
                  onMouseLeave={(e) => { if(!isSubmitting) e.target.style.backgroundColor = 'var(--primary)'; }}
                >
                  {isSubmitting ? '결제 요청중...' : '결제하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdStorePage;
