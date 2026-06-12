import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdStorePage = () => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 상품 정보
  const items = [
    {
      id: 1,
      name: '메인페이지 메인배너',
      price: 50000,
      description: '메인페이지 최상단 슬라이드 배너에 노출됩니다.',
      type: 'main'
    },
    {
      id: 2,
      name: '품종별페이지 메인배너',
      price: 50000,
      description: '견종별 리스트 페이지 상단 1순위로 노출됩니다.',
      type: 'breed'
    },
    {
      id: 3,
      name: '메인페이지 안심분양',
      price: 30000,
      description: '메인페이지 안심분양 전용 스페셜 섹션에 노출됩니다.',
      type: 'safe'
    },
    {
      id: 4,
      name: '메인페이지 인기분양',
      price: 30000,
      description: '메인페이지 인기분양 섹션 상위 리스트에 노출됩니다.',
      type: 'popular'
    },
    {
      id: 5,
      name: '메인페이지 스페셜분양',
      price: 30000,
      description: '메인페이지 스페셜분양 섹션에 독점 노출됩니다.',
      type: 'special'
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
        {items.map(item => (
          <div key={item.id} className="glass-card" style={{ padding: '35px 25px', border: '1px solid #eef2f7', borderRadius: '20px', display: 'flex', flexDirection: 'column', transition: 'all 0.3s', backgroundColor: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
               onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.08)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.04)'; }}>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-block', padding: '6px 14px', backgroundColor: '#fffbf0', color: '#e6a800', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '20px', border: '1px solid #ffeeba' }}>
                ✨ 노출 보장 기간: 7일
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '15px', lineHeight: '1.4' }}>
                {renderAdName(item.name)}
              </h2>
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '1rem', minHeight: '50px' }}>
                {item.description}
              </p>
            </div>

            <div style={{ marginTop: '25px', paddingTop: '25px', borderTop: '2px dashed #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px' }}>
                <span style={{ color: '#888', fontSize: '1rem', fontWeight: 'bold' }}>정상가</span>
                <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary-dark)' }}>
                  {item.price.toLocaleString()} <span style={{ fontSize: '1.1rem', color: '#555' }}>원</span>
                </span>
              </div>
              <button 
                onClick={() => handlePurchaseClick(item)}
                style={{ width: '100%', padding: '18px', borderRadius: '14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(255, 171, 0, 0.3)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-dark)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary)'}
              >
                결제 안내 보기
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 무통장 입금 안내 모달 */}
      {isModalOpen && selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>
          <div className="fade-in" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '25px', width: '90%', maxWidth: '450px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏦</div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--primary-dark)', marginBottom: '10px' }}>무통장 입금 안내</h3>
              <p style={{ color: '#666', lineHeight: '1.5', fontSize: '0.95rem' }}>
                현재 결제 시스템 연동 중으로 <strong>무통장 입금</strong>만 가능합니다.<br/>
                아래 계좌로 입금 후 <strong>[확인 요청]</strong>을 눌러주시면<br/>관리자가 내역 확인 후 즉시 아이템을 지급해 드립니다.
              </p>
            </div>

            <div style={{ backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '18px', marginBottom: '30px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#666', fontSize: '0.95rem' }}>구매 상품</span>
                <strong style={{ color: '#333', fontSize: '0.95rem' }}>{selectedItem.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ color: '#666', fontSize: '0.95rem' }}>결제 금액</span>
                <strong style={{ color: '#ff4757', fontSize: '1.2rem' }}>{selectedItem.price.toLocaleString()}원</strong>
              </div>
              <div style={{ height: '1px', backgroundColor: '#ddd', margin: '20px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#666', fontSize: '0.95rem' }}>입금 은행</span>
                <strong style={{ fontSize: '0.95rem' }}>국민은행</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#666', fontSize: '0.95rem' }}>계좌 번호</span>
                <strong style={{ fontSize: '1.05rem', letterSpacing: '1px', color: 'var(--primary-dark)' }}>0000-0000-0000</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666', fontSize: '0.95rem' }}>예금주</span>
                <strong style={{ fontSize: '0.95rem' }}>블루프라임</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ flex: 1, padding: '16px', borderRadius: '14px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              >
                취소
              </button>
              <button 
                onClick={() => {
                  alert('✅ 입금 확인 요청이 전송되었습니다.\n관리자가 입금 내역을 확인하는 대로 신속하게 쿠폰을 지급해 드리겠습니다.');
                  setIsModalOpen(false);
                }}
                style={{ flex: 1.5, padding: '16px', borderRadius: '14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(255, 171, 0, 0.3)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-dark)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary)'}
              >
                입금 완료 / 확인 요청
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdStorePage;
