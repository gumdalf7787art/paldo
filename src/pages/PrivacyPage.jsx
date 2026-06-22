import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container fade-in" style={{ padding: '60px 20px', minHeight: '80vh', maxWidth: '800px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Daitdog Policies</span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1a1a1a', marginTop: '5px', marginBottom: '0' }}>
            개인정보처리방침
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

      {/* 방침 내용 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', backgroundColor: '#fff', border: '1px solid #eef2f7', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', fontSize: '0.9rem', color: '#555', lineHeight: '1.7' }}>
        
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제1조 (개인정보의 수집 항목 및 이용 목적)</h2>
          <p style={{ margin: '0 0 10px 0' }}>
            주식회사 블루프라임(이하 '회사')은 다잇독(DAITDOG) 플랫폼의 안정적인 서비스 제공, 고객 문의 응대, 결제 처리, 마케팅 분석을 위해 필요한 최소한의 회원 개인정보를 수집하고 있습니다.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px', border: '1px solid #eee' }}>수집 대상</th>
                <th style={{ padding: '10px', border: '1px solid #eee' }}>수집 항목</th>
                <th style={{ padding: '10px', border: '1px solid #eee' }}>이용 목적</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #eee' }}>일반 소비자 회원</td>
                <td style={{ padding: '10px', border: '1px solid #eee' }}>이메일(아이디), 비밀번호, 닉네임, 연락처, 기기 식별값</td>
                <td style={{ padding: '10px', border: '1px solid #eee' }}>회원 식별, 분양 상담 연동 및 시스템 알림 발송</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #eee' }}>입점 매장 (사업자)</td>
                <td style={{ padding: '10px', border: '1px solid #eee' }}>사업자명, 대표자명, 주소, 연락처, 동물판매업 등록번호, 사업자등록번호</td>
                <td style={{ padding: '10px', border: '1px solid #eee' }}>신원 확인, 분양 매장 정보 명시, 멤버십 결제 처리 및 파트너 관리</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #eee' }}>결제 진행 시</td>
                <td style={{ padding: '10px', border: '1px solid #eee' }}>카드사 정보, 은행명, 환불용 본인명의 계좌번호 정보 등 (PG사 처리)</td>
                <td style={{ padding: '10px', border: '1px solid #eee' }}>비즈니스 멤버십 및 플랫폼 서비스 이용료 결제/환불 처리</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제2조 (개인정보의 보유 및 이용 기간)</h2>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            <li>회원의 개인정보는 원칙적으로 회원가입 시부터 서비스를 정식으로 이용하며 계정을 유지하는 동안에만 보유합니다.</li>
            <li>회원 탈퇴 즉시 수집된 모든 데이터는 영구 복구 불가능한 형태로 완전 파기되나, 관계 법령에 따라 아래와 같은 보존 의무가 명시된 경우 특정 기간 보관할 수 있습니다:
              <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제3조 (개인정보의 제3자 제공 및 공유)</h2>
          <p style={{ margin: 0 }}>
            회사는 회원의 동의 없이 수집된 개인정보를 다른 제3자에게 임의로 제공하지 않습니다. 단, <strong>'분양 매장 정보 제공 및 상담 서비스'를 정상적으로 수행하기 위한 당사자 간의 정보 교환(소비자가 특정 입점 매장에 상담 신청 시 해당 매장에 소비자 정보 제공)</strong>과 같이 서비스 제공 목적상 불가피하거나 관계 법령에 따른 요구가 있을 경우에만 제한적으로 제공됩니다.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제4조 (개인정보 처리의 위탁)</h2>
          <p style={{ margin: '0 0 10px 0' }}>
            회사는 원활한 결제 및 본인인증 서비스 제공을 위하여 다음과 같이 개인정보 처리 업무를 외부 전문업체에 위탁하여 운영하고 있습니다.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px', border: '1px solid #eee' }}>수탁업체 (위탁을 받는 자)</th>
                <th style={{ padding: '10px', border: '1px solid #eee' }}>위탁 업무 내용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #eee', fontWeight: 'bold' }}>포트원 (주식회사 포트원)</td>
                <td style={{ padding: '10px', border: '1px solid #eee' }}>신용카드, 간편결제(카카오페이/네이버페이/토스페이 등), 가상계좌 등을 통한 전자결제 서비스 대행 및 본인인증 대행</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#333', marginBottom: '12px' }}>제5조 (회원의 권리와 행사방법)</h2>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>회원은 언제든지 마이페이지 설정을 통해 자신의 개인정보를 조회, 수정할 수 있습니다.</li>
            <li>회원은 언제든 플랫폼을 통해 '회원탈퇴'를 신청하여 회사에게 수집 중단을 요구할 권리가 있으며, 회사는 지체 없이 계정을 삭제하고 파기합니다.</li>
          </ul>
        </section>

        <section style={{ borderTop: '1px solid #eee', paddingTop: '20px', color: '#999', fontSize: '0.8rem' }}>
          <p style={{ margin: 0 }}>시행일자: 2024년 6월 21일</p>
        </section>

      </div>
    </div>
  );
};

export default PrivacyPage;
