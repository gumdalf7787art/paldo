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
      const impCode = 'imp14397622'; // 테스트 결제창 작동을 보장하기 위해 데모 계정 코드로 강제 하드코딩
      window.IMP.init(impCode);
    }
  }, []);

  // 상품 정보
  const items = [
    {
      id: 9,
      name: '[테스트] 100원 결제 테스트 상품',
      price: 100,
      description: 'PG사 결제 연동 테스트를 위한 임시 100원 결제용 상품입니다.',
      type: 'test_100',
      image: '/images/ads/ad_test.png'
    },
    {
      id: 1,
      name: '메인페이지 메인배너',
      price: 50000,
      description: '메인페이지 최상단 슬라이드 배너에 노출됩니다.',
      type: 'main',
      image: '/images/ads/ad_main.jpg'
    },
    {
      id: 2,
      name: '품종별페이지 메인배너',
      price: 50000,
      description: '견종별 리스트 페이지 상단 1순위로 노출됩니다.',
      type: 'breed',
      image: '/images/ads/ad_breed.jpg'
    },
    {
      id: 3,
      name: '메인페이지 안심/인기/스페셜 광고',
      price: 30000,
      description: '메인페이지의 안심/인기/스페셜 3개 섹션 중 무작위 위치에 섞여서 번갈아 노출됩니다. (위치 공정성 보장)',
      type: 'section',
      image: '/images/ads/ad_safe.jpg'
    },
    {
      id: 6,
      name: '게시물 5개 추가 아이템',
      price: 30000,
      description: '결제일로부터 30일 동안 게시물 등록 한도가 5개 증가합니다.',
      type: 'post_limit_5',
      image: '/images/ads/post_add_5.png'
    },
    {
      id: 7,
      name: '게시물 10개 추가 아이템',
      price: 50000,
      description: '결제일로부터 30일 동안 게시물 등록 한도가 10개 증가합니다.',
      type: 'post_limit_10',
      image: '/images/ads/post_add_10.png'
    },
    {
      id: 8,
      name: '게시물 20개 추가 아이템',
      price: 70000,
      description: '결제일로부터 30일 동안 게시물 등록 한도가 20개 증가합니다.',
      type: 'post_limit_20',
      image: '/images/ads/post_add_20.png'
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
            🛒 다잇독 광고 스토어
          </h1>
          <p style={{ color: '#666', fontSize: '1.05rem', lineHeight: '1.6' }}>
            판매율을 극대화하는 다양한 맞춤형 광고 아이템을 만나보세요.<br/>
            결제하신 광고 아이템은 관리자 확인 후 즉시 <b style={{color: 'var(--primary-dark)'}}>보유 아이템 현황</b>으로 지급됩니다.
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
                {item.type === 'test_100' ? '테스트 결제 진행' : (item.type.startsWith('post_limit') ? '구독(추가) 혜택 안내' : '광고 위치 및 결제 안내')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 무통장 입금 안내 모달 */}
      {isModalOpen && selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>
          <div className="fade-in" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', display: 'flex', gap: '30px' }} onClick={e => e.stopPropagation()}>
            
            {/* 왼쪽: 아이템 미리보기 */}
            <div style={{ flex: 1, borderRight: '1px solid #eee', paddingRight: '20px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#333', marginBottom: '15px' }}>
                {selectedItem.type.startsWith('post_limit') ? '📦 정기구독 혜택 상세' : (selectedItem.type === 'test_100' ? '🛠️ 테스트 결제 상세' : '📺 광고 노출 위치 미리보기')}
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
                  편리하고 안전한 결제 방식을 선택하여 광고를 신청하세요.<br/>
                  가상계좌 입금의 경우, 입금이 완료되면 광고가 즉시 시작됩니다.
                </p>

                {/* 결제 수단 선택 라디오/버튼 그룹 */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button
                    onClick={() => setPayMethod('card')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: payMethod === 'card' ? '2px solid var(--primary)' : '1px solid #ddd',
                      backgroundColor: payMethod === 'card' ? '#fffbf0' : '#fff',
                      fontWeight: 'bold',
                      color: payMethod === 'card' ? 'var(--primary-dark)' : '#555',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    💳 신용카드 / 간편결제
                  </button>
                  <button
                    onClick={() => setPayMethod('vbank')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: payMethod === 'vbank' ? '2px solid var(--primary)' : '1px solid #ddd',
                      backgroundColor: payMethod === 'vbank' ? '#fffbf0' : '#fff',
                      fontWeight: 'bold',
                      color: payMethod === 'vbank' ? 'var(--primary-dark)' : '#555',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    🏦 가상계좌 (무통장)
                  </button>
                </div>

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

                    // 1. 다잇독 백엔드에 임시 광고 신청 생성
                    const { data: requestData, error: requestError } = await api.ads.requestAdPurchase({
                      ad_type: selectedItem.type,
                      title: selectedItem.name,
                      price: selectedItem.price,
                      duration: 7 // 기본 노출 기간 7일
                    });

                    if (requestError || !requestData || !requestData.adId) {
                      alert('광고 신청 도중 오류가 발생했습니다: ' + (requestError || '알 수 없는 오류'));
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
                      pg: 'html5_inicis', // 포트원 공식 데모 계정에 연결된 이니시스 웹표준 PG 연동
                      pay_method: payMethod,
                      merchant_uid: merchantUid,
                      name: selectedItem.name,
                      amount: selectedItem.price,
                      buyer_email: currentUser.email || '',
                      buyer_name: currentUser.nickname || currentUser.email || '',
                      buyer_tel: currentUser.phone || '',
                      m_redirect_url: window.location.origin + '/mypage'
                    };

                    window.IMP.request_pay(paymentData, async (rsp) => {
                      if (rsp.success) {
                        // 3. 백엔드 결제 검증 호출
                        const { data: verifyData, error: verifyError } = await api.payment.verify(
                          rsp.imp_uid,
                          rsp.merchant_uid,
                          rsp.paid_amount || selectedItem.price,
                          adId
                        );

                        setIsSubmitting(false);

                        if (verifyError) {
                          setIsModalOpen(false);
                          navigate('/mypage', { state: { paymentError: verifyError } });
                          return;
                        }

                        if (payMethod === 'vbank') {
                          alert(`✅ 가상계좌 발급 완료!\n\n은행: ${rsp.vbank_name}\n계좌번호: ${rsp.vbank_num}\n예금주: ${rsp.vbank_holder}\n기한: ${rsp.vbank_date}\n\n입금이 완료되면 자동으로 광고가 노출됩니다.`);
                          setIsModalOpen(false);
                          navigate('/mypage');
                        } else {
                          setIsModalOpen(false);
                          navigate('/mypage', { state: { paymentSuccess: true } });
                        }
                      } else {
                        setIsSubmitting(false);
                        setIsModalOpen(false);
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
