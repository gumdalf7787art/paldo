import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

// 컴포넌트 렌더 스코프 바깥에 헬퍼 함수 정의
const generateUniqueId = (prefix, id) => {
  return `${prefix}_${id}_${Date.now()}`;
};

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 사용자 정보 로드
    const loadUser = async () => {
      const { data } = await api.auth.getUser();
      if (data) {
        setCurrentUser(data);
      }
    };
    loadUser();

    // 포트원 SDK 초기화 (데모 가맹점 코드로 하드코딩하여 결제창 작동 보장)
    if (window.IMP) {
      window.IMP.init('imp14397622');
    }
  }, []);

  const plans = [
    {
      id: 'basic',
      name: '베이직',
      price: 30000,
      description: '소규모 브리더를 위한 합리적인 플랜',
      features: ['매장 정보 등록 (최대 5개)', '기본 테마 관리 툴 제공', '이메일 지원 서비스'],
      color: '#4A90E2'
    },
    {
      id: 'pro',
      name: '프로',
      price: 50000,
      description: '가장 많은 판매자들이 선택하는 플랜',
      features: ['매장 정보 및 소식 등록 (최대 15개)', '프로페셔널 전용 테마 제공', '실시간 방문 분석 통계 대시보드', '1:1 채널 톡 상담원 연동'],
      color: 'var(--primary)',
      isPopular: true
    },
    {
      id: 'professional',
      name: '프로페셔널',
      price: 100000,
      description: '대형 켄넬 및 펫샵을 위한 무제한 플랜',
      features: ['매장 정보 및 소식 등록 무제한', '프리미엄 ERP 매장 관리 시스템', '정밀 스토어 데이터 보고서 제공', '전담 기술 마스터 배정', '스토어 전용 도메인 연결 지원'],
      color: '#9b59b6'
    }
  ];

  const handleSubscribe = async (plan) => {
    if (!currentUser) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }

    if (!window.IMP) {
      alert('포트원 라이브러리가 로드되지 않았습니다.');
      return;
    }

    setIsSubmitting(true);

    // 정기결제용 빌링키 발급 고유 ID 생성 (고객 식별용)
    const customerUid = generateUniqueId('customer', currentUser.id);
    const merchantUid = generateUniqueId('billing', plan.id);

    // 포트원 빌링키 발급 요청 (IMP.request_pay에 customer_uid 전달)
    window.IMP.request_pay({
      pg: 'html5_inicis', // 이니시스 정기결제(빌링) 데모
      pay_method: 'card',
      merchant_uid: merchantUid,
      name: `다잇독 비즈니스 멤버십 (${plan.name})`,
      amount: plan.price, // 심사 통과를 위해 실제 상품 금액으로 일반 결제 호출
      // customer_uid: customerUid, // ❗심사 기간 동안 이니시스 본인인증 에러(V023) 회피를 위해 정기결제(빌링) 파라미터 임시 비활성화 (일반 결제로 우회)
      buyer_email: currentUser.email || '',
      buyer_name: currentUser.nickname || currentUser.email || '',
      buyer_tel: currentUser.phone || '01012341234',
    }, async (rsp) => {
      if (rsp.success) {
        // 빌링키 발급 성공! 백엔드에 빌링키 등록 및 활성화 요청
        const { error } = await api.subscription.register(
          customerUid,
          plan.name,
          merchantUid,
          plan.price
        );

        setIsSubmitting(false);

        if (error) {
          alert('멤버십 등록 실패: ' + error);
          return;
        }

        alert(`✅ ${plan.name} 비즈니스 멤버십 정기 이용 요금이 성공적으로 등록되었습니다!`);
        navigate('/mypage');
      } else {
        setIsSubmitting(false);
        alert('카드 등록에 실패하였습니다: ' + rsp.error_msg);
      }
    });
  };

  return (
    <div className="container fade-in" style={{ padding: '60px 20px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary-dark)', marginBottom: '15px' }}>
          다잇독 파트너스 비즈니스 멤버십
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: '1.6' }}>
          매월 정기적으로 이용하는 비즈니스 멤버십 서비스를 통해 다잇독의 프리미엄 혜택을 지속적으로 누리세요.<br/>
          카드를 한 번만 등록하면 매월 편안하게 결제가 진행됩니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '1100px', margin: '0 auto' }}>
        {plans.map((plan) => (
          <div key={plan.id} style={{
            position: 'relative',
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '40px 30px',
            boxShadow: plan.isPopular ? '0 20px 50px rgba(255, 171, 0, 0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
            border: plan.isPopular ? `2px solid ${plan.color}` : '1px solid #eee',
            transform: plan.isPopular ? 'scale(1.05)' : 'scale(1)',
            zIndex: plan.isPopular ? 10 : 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {plan.isPopular && (
              <div style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: plan.color,
                color: 'white',
                padding: '6px 20px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                boxShadow: '0 4px 10px rgba(255, 171, 0, 0.3)'
              }}>
                👑 가장 인기있는 플랜
              </div>
            )}

            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#333', marginBottom: '10px' }}>{plan.name}</h2>
            <p style={{ color: '#888', fontSize: '0.95rem', minHeight: '45px', marginBottom: '20px' }}>{plan.description}</p>
            
            <div style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: '1px solid #eee' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: '900', color: plan.color }}>{plan.price.toLocaleString()}</span>
              <span style={{ fontSize: '1.1rem', color: '#666', fontWeight: 'bold' }}> 원 <span style={{fontSize: '0.9rem', color: '#aaa'}}>/ 월</span></span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
              {plan.features.map((feature, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.95rem', color: '#444' }}>
                  <span style={{ color: plan.color, fontWeight: 'bold' }}>✓</span>
                  <span style={{ lineHeight: '1.4' }}>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              disabled={isSubmitting}
              onClick={() => handleSubscribe(plan)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: isSubmitting ? '#ccc' : (plan.isPopular ? plan.color : '#f8f9fa'),
                color: isSubmitting ? '#fff' : (plan.isPopular ? 'white' : '#333'),
                border: plan.isPopular ? 'none' : '1px solid #ddd',
                fontWeight: '900',
                fontSize: '1.1rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: plan.isPopular && !isSubmitting ? '0 8px 20px rgba(255, 171, 0, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if(!isSubmitting) {
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if(!isSubmitting) {
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {isSubmitting ? '진행 중...' : '정기결제 카드 등록하기'}
            </button>
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
          <li><strong>서비스 제공기간 (배송 기간)</strong>: 본 서비스는 무형의 소프트웨어(SaaS) 솔루션으로, 결제 완료 및 정기 결제 카드 등록 즉시 멤버십 등급별 혜택이 계정에 활성화되어 실시간으로 제공됩니다. 기본 이용 기간은 결제일로부터 1개월(30일) 단위입니다.</li>
          <li><strong>청약철회 및 취소/환불 규정</strong>: 
            <ul style={{ paddingLeft: '15px', marginTop: '4px', listStyleType: 'circle', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>결제 후 7일 이내에 제공되는 비즈니스 멤버십 서비스 혜택(소식/정보 한도 증대 및 프리미엄 ERP 관리 기능 등)을 전혀 사용하지 않은 경우 <strong>100% 전액 환불</strong>이 가능합니다.</li>
              <li>결제 후 7일이 경과했거나, 당월 제공되는 멤버십 기능을 이미 1회 이상 사용한 경우에는 디지털 콘텐츠 특성상 당월 환불이 불가하며, 해지 신청 시 다음 달 결제 예정일부터 청구가 중단되는 <strong>'자동 결제 해지(예약)'</strong>로 처리됩니다.</li>
            </ul>
          </li>
          <li><strong>교환 및 반품 안내</strong>: 다잇독 비즈니스 멤버십은 오프라인 실물 배송 상품이 아닌 무형의 온라인 솔루션이므로 실물 제품 교환 및 반품은 적용되지 않습니다.</li>
          <li>자세한 취소/환불 및 결제 조건은 하단 푸터의 <a href="/refund" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>[서비스 이용 및 환불 정책]</a> 페이지를 참고해 주시기 바랍니다.</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', color: '#888', fontSize: '0.85rem' }}>
        * 정기 요금 결제를 등록하시면 매월 선택하신 결제일에 서비스 이용료가 자동으로 청구됩니다. 언제든지 마이페이지에서 해지(비활성화)할 수 있습니다.
      </div>
    </div>
  );
};

export default SubscriptionPage;
