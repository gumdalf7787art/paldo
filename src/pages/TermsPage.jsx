import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container fade-in" style={{ padding: '60px 20px', minHeight: '80vh', maxWidth: '800px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>PaldoDog Policies</span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1a1a1a', marginTop: '5px', marginBottom: '0' }}>
            서비스 이용약관
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

      {/* 약관 내용 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', backgroundColor: '#fff', border: '1px solid #eef2f7', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', fontSize: '0.9rem', color: '#555', lineHeight: '1.7' }}>
        
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제1조 (목적)</h2>
          <p style={{ margin: 0 }}>
            본 약관은 주식회사 블루프라임(이하 '회사')이 운영하는 반려동물 매장 정보 제공 및 관리 솔루션 플랫폼 '팔도댕댕(DAITDOG)'(이하 '플랫폼')에서 제공하는 정보 제공 서비스 및 비즈니스 멤버십 이용료 결제 등 플랫폼 서비스의 이용과 관련하여, 회사와 회원의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제2조 (회원의 의무 및 행위 제한)</h2>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            <li>회원은 회원가입 또는 프로필 등록 시 반드시 실제 정보(실명, 실제 상호, 실제 운영 매장의 상세 정보 등)를 등록하여야 하며, 도용이나 거짓 정보를 입력해서는 안 됩니다.</li>
            <li>입점 매장(사업자 회원)은 농림축산식품부 또는 소관 관청에 적법하게 등록된 사업자 정보 및 영업 등록 정보를 명시하고 관련 법령을 철저히 준수해야 합니다.</li>
            <li>회원은 상호 예의를 갖춘 올바른 반려동물 문화를 조성할 책임이 있으며, 욕설, 기만, 사기 및 타인의 개인정보 무단 유출 등 위법 행위를 하여서는 안 됩니다.</li>
            <li>회원은 본 플랫폼이 규정한 서비스 이용 요금 결제를 부정하게 회피하거나 플랫폼의 정상적인 서비스 제공을 방해해서는 안 됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제3조 (서비스 제공 및 요금 결제)</h2>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            <li>회사는 반려동물 매장의 위치, 소개, 소식 정보를 제공하고 비즈니스 회원의 매장 디지털 정보 관리 및 운영 분석을 돕는 플랫폼 서비스를 제공합니다.</li>
            <li>비즈니스 회원은 플랫폼 내에서 제공하는 추가 관리 기능 및 비즈니스 멤버십(SaaS) 서비스를 이용하기 위해 회사가 규정한 서비스 이용요금을 결제해야 합니다.</li>
            <li>회원은 플랫폼 서비스 이용 중 발생할 수 있는 환불에 대해 회사가 정한 환불 정책을 준수해야 합니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제4조 (이용 제한 및 서비스 영구 중지)</h2>
          <p style={{ margin: 0 }}>
            회사는 다음 중 하나에 해당하는 경우, 해당 회원의 이용 계정을 경고 없이 일시 정지하거나 영구 탈퇴 처리할 수 있습니다.
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>적법한 관련 영업 등록 없이 상업적인 매장 정보를 등록하거나 허위 매장 정보를 게시하는 경우</li>
            <li>매장 정보 및 관련 혜택(쿠폰, 소식 등)을 허위로 조작하여 게시하는 경우</li>
            <li>정당한 사유 없는 취소, 노쇼(No-Show) 유도 등을 반복하여 플랫폼의 신뢰도를 저해하는 경우</li>
            <li>관련 법령을 위반하여 불법적인 영업 활동을 영위하거나 이를 알선하는 정보를 등록한 경우</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제5조 (책임의 한계 및 면책 고지)</h2>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            <li>회사는 매장 정보의 등록 및 관리 시스템을 지원하는 플랫폼 서비스 제공자로서, 파트너사가 개별적으로 등록한 매장 정보 및 소식 정보의 정확성과 신뢰성에 대해 보증 책임을 부담하지 않습니다.</li>
            <li>이용자가 매장 정보 및 소식을 토대로 오프라인 매장 방문 및 문의를 진행하는 과정에서 발생하는 당사자 간의 거래 및 계약상의 모든 문제(계약 불이행, 결제 분쟁 등)는 거래 당사자(소비자와 입점 매장) 간 직접 해결을 원칙으로 하며, 회사는 이에 대해 어떠한 법적 책임도 지지 않습니다.</li>
            <li>회사는 천재지변, 분산서비스거부(DDoS) 공격 등 불가항력적인 서버 오류 및 정전 등의 장애에 대하여 책임지지 않습니다.</li>
          </ol>
        </section>

        <section style={{ borderTop: '1px solid #eee', paddingTop: '20px', color: '#999', fontSize: '0.8rem' }}>
          <p style={{ margin: 0 }}>시행일자: 2024년 6월 21일</p>
        </section>

      </div>
    </div>
  );
};

export default TermsPage;
