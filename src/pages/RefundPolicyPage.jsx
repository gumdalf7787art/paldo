import React from 'react';
import { useNavigate } from 'react-router-dom';

const RefundPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container fade-in" style={{ padding: '60px 20px', minHeight: '80vh', maxWidth: '800px', margin: '0 auto' }}>
      {/* 상단 네비게이션 및 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Daitdog Policies</span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1a1a1a', marginTop: '5px', marginBottom: '0' }}>
            서비스 이용 및 환불 정책
          </h1>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            padding: '10px 20px', 
            borderRadius: '10px', 
            backgroundColor: '#f5f5f7', 
            color: '#333', 
            border: 'none', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e5ea'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#f5f5f7'}
        >
          <span>← 이전으로</span>
        </button>
      </div>

      {/* 안내 문구 */}
      <div style={{ backgroundColor: '#f9f9fb', borderLeft: '4px solid var(--primary)', padding: '20px', borderRadius: '0 12px 12px 0', marginBottom: '40px' }}>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: '1.6' }}>
          본 약관은 주식회사 블루프라임이 운영하는 반려동물 매장 정보 제공 및 관리 솔루션 플랫폼 <strong>'다잇독(DAITDOG)'</strong>에서 제공하는 서비스 및 결제, 환불에 관한 조건과 절차를 규정합니다. 안전하고 신뢰할 수 있는 플랫폼 이용 서비스를 위해 이용 전에 반드시 숙지해 주시기 바랍니다.
        </p>
      </div>

      {/* 약관 상세 내용 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
        
        {/* 광고 및 구독 약관 메인 */}
        <section style={{ backgroundColor: '#fff', border: '1px solid #eef2f7', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary-dark)', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
            다잇독 비즈니스 멤버십 및 플랫폼 이용료 환불 규정
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제1조 (목적)</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.6' }}>
                본 약관은 주식회사 블루프라임(이하 '회사')이 운영하는 반려동물 매장 정보 및 관리 솔루션 플랫폼 '다잇독(DAITDOG)'(이하 '플랫폼')에서 제공하는 사업자용 유료 서비스(비즈니스 멤버십 및 플랫폼 서비스 이용권) 결제 및 환불에 관한 조건과 절차를 규정함을 목적으로 합니다.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제2조 (비즈니스 멤버십 및 서비스 이용권의 정의)</h3>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>[프리미엄 이용 서비스]</strong> 입점 매장(사업자)은 플랫폼 내 효율적인 매장 관리 및 맞춤형 스토어 기능을 적용하기 위해 회사가 제공하는 추가 기능 이용 서비스를 기간제로 구매하여 사용할 수 있습니다.</li>
                <li><strong>[정기 멤버십 서비스]</strong> 회사는 입점 매장의 편리한 매장 관리와 플랫폼 기능(매장 소식 및 정보 관리 한도 증대 등)을 지원하기 위해 등급별 비즈니스 멤버십(SaaS) 서비스를 운영합니다. 본 서비스는 매월 자동으로 결제가 갱신되는 정기 결제형 서비스입니다.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제3조 (유료 서비스 취소 및 환불 규정)</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666', lineHeight: '1.6' }}>회사는 소상공인과의 상생을 원칙으로 하되, 시스템 악용 방지를 위해 아래와 같이 합리적인 환불 기준을 적용합니다.</p>
              
              <div style={{ backgroundColor: '#fcfcfd', border: '1px solid #eaecf0', borderRadius: '12px', padding: '18px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#333', fontWeight: 'bold' }}>📢 프리미엄 이용 서비스 취소/환불</h4>
                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>이용권 구매 후 실제 서비스가 개시되기 전에 취소를 요청할 경우: <strong>100% 전액 환불</strong></li>
                  <li>서비스가 개시된 이후 중도 취소를 요청할 경우: 서비스가 제공된 일수만큼 일할 계산(하루 단위 차감) 및 <strong>환불 위약금(잔여 금액의 10%)을 공제</strong>한 후 나머지 금액을 환불합니다.</li>
                  <li>일회성 소모형 기능 아이템은 구매 후 사용 즉시 효력이 발생하므로 환불이 불가능합니다.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: '#fcfcfd', border: '1px solid #eaecf0', borderRadius: '12px', padding: '18px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#333', fontWeight: 'bold' }}>🔄 정기 멤버십 서비스 취소/환불</h4>
                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>멤버십 결제 후 해당 회차에 플랫폼이 제공하는 멤버십 혜택(유료 기능 사용, 전용 권한 등)을 단 한 번도 이용하지 않고 7일 이내 취소를 요청한 경우: <strong>100% 전액 환불</strong></li>
                  <li>결제 후 7일이 경과했거나, 해당 월의 멤버십 혜택 및 기능을 이미 1회 이상 사용한 경우: 당월은 정상 이용으로 간주되어 중도 환불이 불가능하며, <strong>'다음 달 자동 정기 결제 해지' 예약</strong>으로 처리됩니다.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제4조 (부정행위 시 이용 제한)</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.6' }}>
                입점 매장이 허위 정보 등록, 소비자 기만 행위 등으로 인해 플랫폼 이용 약관을 위반하여 '강제 탈퇴' 또는 '이용 정지' 처분을 받을 경우, 기존에 구매하여 진행 중이던 프리미엄 서비스 및 정기 멤버십 서비스 잔여 금액은 일체 환불되지 않고 소멸합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 결제 수단별 처리 프로세스 */}
        <section style={{ backgroundColor: '#fff', border: '1px solid #eef2f7', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#27ae60', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
            결제 수단별 처리 및 환불 프로세스
          </h2>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제5조 (결제 및 환불 처리 프로세스)</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>신용카드 및 간편결제:</strong> 플랫폼에서 취소 승인 즉시 결제 대행사(PG)를 통해 카드사로 취소 요청이 전달되며, 카드사 사정에 따라 영업일 기준 최대 3~7일(최대 30일) 후 한도 복구 또는 환급됩니다.</li>
              <li><strong>무통장 입금 (가상계좌):</strong> 가상계좌 결제 취소 시, 회원이 입력한 본인 명의의 환불 계좌로 영업일 기준 최대 5일(최대 30일) 이내에 현금으로 입금됩니다.</li>
              <li><strong>정기 결제(빌링):</strong> 정기 멤버십 서비스는 등록된 결제 수단을 통해 매월 자동 청구되며, 해지 신청 시 다음 결제 예정일부터 청구가 중단됩니다.</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
};

export default RefundPolicyPage;
