import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container fade-in" style={{ padding: '60px 20px', minHeight: '80vh', maxWidth: '800px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Daitdog Policies</span>
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
            본 약관은 주식회사 블루프라임(이하 '회사')이 운영하는 반려견 안심 분양 매칭 플랫폼 '다잇독(DAITDOG)'(이하 '플랫폼')에서 제공하는 웹/앱 기반 정보 매칭 서비스 및 구매 에스크로 안전 결제 등 플랫폼 서비스의 이용과 관련하여, 회사와 회원의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제2조 (회원의 의무 및 행위 제한)</h2>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            <li>회원은 회원가입 또는 프로필 등록 시 반드시 실제 정보(실명, 실제 상호, 실제 분양 반려견의 상세 정보 등)를 등록하여야 하며, 도용이나 거짓 정보를 입력해서는 안 됩니다.</li>
            <li>입점 매장(사업자 회원)은 농림축산식품부 또는 소관 관청에 적법하게 등록된 '동물판매업' 등록 정보를 명시하고 판매업 규정을 철저히 준수해야 합니다.</li>
            <li>회원은 생명을 존중하며 상호 예의를 갖춘 건전한 분양 매칭 문화를 조성할 책임이 있으며, 욕설, 기만, 사기 및 타인의 개인정보 무단 유출 등 위법 행위를 하여서는 안 됩니다.</li>
            <li>회원은 본 플랫폼이 규정한 결제 시스템을 우회하여 회원 간의 오프라인 직접 거래(이른바 '직거래')를 유도하거나 회사의 시스템 수수료를 부정하게 회피하려 해서는 안 됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제3조 (서비스 제공 및 정산)</h2>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            <li>회사는 안전한 반려견 거래 매칭을 위해 안심 분양 및 대금 예치(에스크로) 서비스를 기본 제공합니다.</li>
            <li>소비자 회원이 분양 예약을 위해 결제한 예약금 또는 분양 대금은 구매자가 플랫폼 내에서 인도 확인 후 '구매확정' 버튼을 누르거나, 결제일로부터 7일간 환불 요청이 접수되지 않아 자동으로 구매확정 처리될 때까지 회사가 안전하게 보관합니다.</li>
            <li>구매확정이 완료된 건은 플랫폼 시스템에 의해 보관 대금 중 회사의 소정 수수료를 차감한 후 입점 매장(소상공인)으로 정산 처리됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제4조 (이용 제한 및 서비스 영구 중지)</h2>
          <p style={{ margin: 0 }}>
            회사는 다음 중 하나에 해당하는 경우, 해당 회원의 이용 계정을 경고 없이 일시 정지하거나 영구 탈퇴 처리할 수 있습니다.
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>동물판매업 미등록 상태에서 상업적 분양글을 지속적으로 올리는 경우</li>
            <li>반려견의 허위 건강 프로필(백신 접종, 연령 등)을 조작하여 올리는 경우</li>
            <li>정당한 사유 없는 취소, 노쇼(No-Show)를 반복하여 플랫폼의 평판을 저해하는 경우</li>
            <li>불법 수입, 불법 번식견의 매매 등 관계 법령에 위반되는 행위를 하거나 알선한 경우</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제5조 (책임의 한계 및 면책 고지)</h2>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            <li>회사는 반려견 분양의 당사자들을 중개하고 안전한 거래를 지원하는 플랫폼 시스템 서비스 제공자로서, 인도된 반려동물의 개별 건강 상태, 성격, 백신 접종 내역의 진위 등에 관한 보증 책임을 부담하지 않습니다.</li>
            <li>인도 이후의 분양 반려견에 대한 건강 분쟁, 폐사 및 질병 관련 분쟁은 거래 당사자(소비자와 입점 매장) 간의 직접 해결을 원칙으로 하며, 분쟁 해결은 소비자분쟁해결기준과 관할 관계 법령에 따라 당사자 간에 직접 처리해야 합니다.</li>
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
