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

    // 포트원 SDK 초기화 (다잇독 가맹점 코드)
    if (window.IMP) {
      window.IMP.init('imp62573664');
    }
  }, []);

  const plans = [
    {
      id: 'basic',
      name: '베이직',
      price: 30000,
      description: '소규모 브리더를 위한 합리적인 플랜',
      features: ['매월 게시물 5개 한도 추가', '기본 뱃지 제공', '전용 고객 센터 지원'],
      color: '#4A90E2'
    },
    {
      id: 'pro',
      name: '프로',
      price: 50000,
      description: '가장 많은 판매자들이 선택하는 플랜',
      features: ['매월 게시물 15개 한도 추가', '프로 전용 프리미엄 뱃지 제공', '상위 노출 확률 20% 증가', '스토어 통계 제공'],
      color: 'var(--primary)',
      isPopular: true
    },
    {
      id: 'professional',
      name: '프로페셔널',
      price: 100000,
      description: '대형 켄넬 및 펫샵을 위한 무제한 플랜',
      features: ['매월 게시물 한도 무제한', 'VVIP 황금 뱃지 제공', '상위 노출 확률 50% 증가', '전담 1:1 매니저 배정', '스토어 배너 무료 제작'],
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
      pg: 'html5_inicis.INIBillTst', // 이니시스 정기결제(빌링) 데모
      pay_method: 'card',
      merchant_uid: merchantUid,
      name: `다잇독 비즈니스 멤버십 (${plan.name})`,
      amount: 0, // 정기결제 빌링키 발급용
      customer_uid: customerUid, // ❗빌링키 발급을 위한 필수 파라미터
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
      <div style={{ textAlign: 'center', marginTop: '50px', color: '#888', fontSize: '0.85rem' }}>
        * 정기 요금 결제를 등록하시면 매월 선택하신 결제일에 서비스 이용료가 자동으로 청구됩니다. 언제든지 마이페이지에서 해지(비활성화)할 수 있습니다.
      </div>
    </div>
  );
};

export default SubscriptionPage;
