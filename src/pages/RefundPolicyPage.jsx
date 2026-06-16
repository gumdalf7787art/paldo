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
          본 약관은 주식회사 블루프라임이 운영하는 반려견 안심 분양 매칭 플랫폼 <strong>'다잇독(DAITDOG)'</strong>에서 제공하는 서비스 및 결제, 환불에 관한 조건과 절차를 규정합니다. 안전하고 신뢰할 수 있는 분양 및 광고 서비스를 위해 이용 전에 반드시 숙지해 주시기 바랍니다.
        </p>
      </div>

      {/* 약관 상세 내용 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
        
        {/* 1부 */}
        <section style={{ backgroundColor: '#fff', border: '1px solid #eef2f7', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary-dark)', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
            1부. [소비자 대상] 안심 분양 및 에스크로 결제 정책
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제1조 (목적)</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.6' }}>
                본 약관은 주식회사 블루프라임(이하 '회사')이 운영하는 반려견 안심 분양 매칭 플랫폼 '다잇독(DAITDOG)'(이하 '플랫폼')에서 제공하는 결제, 중개 서비스 및 환불에 관한 조건과 절차를 규정함을 목적으로 합니다.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제2조 (구매안전 에스크로 서비스 및 구매확정)</h3>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>[안심결제 보장]</strong> 회사는 거래의 신뢰도를 높이고 소비자를 보호하기 위해, 소비자가 결제한 분양대금(또는 예약금)을 입점 매장에 즉시 지급하지 않고 안전하게 보관하는 구매안전(에스크로) 서비스를 기본 적용합니다.</li>
                <li><strong>[구매확정의 정의]</strong> 소비자가 플랫폼을 통해 매장을 방문하여 반려견을 안전하게 인도받고 확인한 후 플랫폼 내에서 '구매확정' 버튼을 누르면, 회사는 보관 중이던 결제대금에서 수수료를 공제한 후 입점 매장(소상공인)에 정산 절차를 진행합니다.</li>
                <li><strong>[7일 자동 구매확정]</strong> 소비자가 결제를 완료한 시점(또는 지정된 매장 방문 예정일)으로부터 7일 이내에 직접 '구매확정' 또는 '환불/취소 요청'을 하지 않는 경우, 거래가 정상적으로 완료된 것으로 간주하여 7일째 되는 날 밤 24:00에 시스템에 의해 자동으로 구매확정이 처리됩니다.</li>
                <li style={{ color: '#d9534f', fontWeight: '500' }}>⚠️ 자동 구매확정이 완료된 이후에는 플랫폼 시스템을 통한 강제 취소 및 환불이 불가능하며, 회사는 분쟁 해결의 당사자가 아닙니다. 이후의 모든 분쟁은 입점 매장 자체의 약관, 당사자 간의 합의 또는 소비자분쟁조정위원회 등 공인된 기관을 통한 협의 결과에 따라 당사자 간에 해결해야 합니다. (면책 조항)</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제3조 (분양 예약 및 매칭 취소/환불 규정)</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>소비자가 플랫폼에서 결제를 완료한 후, 매장을 방문하여 반려견을 최종 인도받기 전 취소를 요청할 경우의 환불 기준은 다음과 같습니다.</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', marginBottom: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '10px', border: '1px solid #eee' }}>취소 요청 시점</th>
                    <th style={{ padding: '10px', border: '1px solid #eee' }}>환불 비율</th>
                    <th style={{ padding: '10px', border: '1px solid #eee' }}>비고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #eee' }}>결제 후 24시간 이내 취소 시</td>
                    <td style={{ padding: '10px', border: '1px solid #eee', fontWeight: 'bold', color: '#2ecc71' }}>100% 전액 환불</td>
                    <td style={{ padding: '10px', border: '1px solid #eee' }}>이유 불문 환불</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #eee' }}>매장 방문 예정일 1일 전까지 취소</td>
                    <td style={{ padding: '10px', border: '1px solid #eee', fontWeight: 'bold', color: '#2ecc71' }}>100% 전액 환불</td>
                    <td style={{ padding: '10px', border: '1px solid #eee' }}>-</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid #eee' }}>매장 방문 예정일 1일 전 ~ 당일 취소</td>
                    <td style={{ padding: '10px', border: '1px solid #eee', fontWeight: 'bold', color: '#e74c3c' }}>예약금의 50% 공제 후 환불</td>
                    <td style={{ padding: '10px', border: '1px solid #eee' }}>매장 사정으로 인한 취소 시에는 100% 전액 환불</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제4조 (인도 후 환불 및 보상 기준)</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666', lineHeight: '1.6' }}>
                반려견을 최종 인도(입양)받은 이후 질병이나 건강상의 문제가 발생하거나 고지된 정보와 상이한 경우, 공정거래위원회 고시 '소비자분쟁해결기준' 및 관계 법령에 의거하여 입점 매장의 책임 하에 다음과 같이 보상이 진행됩니다.
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>[인도 후 15일 이내 폐사 시]</strong> 동종의 반려견으로 교환 또는 분양 금액 전액 환불</li>
                <li><strong>[인도 후 15일 이내 질병 발생 시]</strong> 입점 매장의 책임 하에 제휴 동물병원 등을 통한 무상 치료 지원 (단, 매장이 지정한 기한 내에 치료가 불가능하다고 판단될 경우 교환 또는 분양 금액 환불)</li>
                <li><strong>[고지된 정보와 상이할 경우]</strong> 인도 시점에 플랫폼에 등록된 프로필 정보(견종, 성별, 생년월일, 백신 접종 현황 등) 또는 매장이 사전에 확약한 건강 상태가 실제 인도받은 반려견의 정보와 명백히 다를 경우, 소비자는 인도를 거부하거나 인도 후 7일 이내에 계약 해지 및 분양 금액 전액 환불을 요구할 수 있습니다.</li>
                <li style={{ color: '#7f8c8d' }}><strong>[플랫폼 면책 고지]</strong> 회사는 반려견의 매칭과 결제를 지원하는 중개 플랫폼으로서, 반려견 인도 이후 발생한 건강 상태, 질병, 고지 정보 상이 등의 분쟁을 직접 해결하거나 대리하지 않습니다. 모든 분쟁은 거래 당사자(소비자와 입점 매장) 간의 직접 협의를 원칙으로 하며, 협의가 불가능할 경우 한국소비자원 소비자분쟁조정위원회 등 정식 기관의 조정 절차를 거쳐 진행됩니다. 회사는 이 과정에서 중재 및 자료 제공에만 협조합니다.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2부 */}
        <section style={{ backgroundColor: '#fff', border: '1px solid #eef2f7', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#3498db', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
            2부. [사업자 대상] 광고 및 정기 구독 서비스 정책
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제5조 (광고 및 정기 구독 서비스의 정의)</h3>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>[유료 광고 서비스]</strong> 입점 매장(사업자)은 플랫폼 내 노출 효과를 극대화하기 위해 회사가 제공하는 다양한 형태의 유료 광고 아이템을 건별 또는 기간제로 구매하여 사용할 수 있습니다.</li>
                <li><strong>[정기 구독 서비스]</strong> 회사는 입점 매장의 효율적인 마케팅과 플랫폼 기능 활용을 지원하기 위해, 다양한 등급별 월별 정기 구독 요금제를 운영합니다. 본 서비스는 이용자가 등록한 결제 수단을 통해 매월 정기적으로 자동으로 결제가 갱신되는 정기 결제 상품입니다.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제6조 (사업자 광고/구독 서비스 취소 및 환불 규정)</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666', lineHeight: '1.6' }}>회사는 소상공인과의 상생을 원칙으로 하되, 시스템 악용 방지를 위해 아래와 같이 합리적인 환불 기준을 적용합니다.</p>
              
              <div style={{ backgroundColor: '#fcfcfd', border: '1px solid #eaecf0', borderRadius: '12px', padding: '18px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#333', fontWeight: 'bold' }}>📢 유료 광고 서비스 취소/환불</h4>
                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>광고 구매 후 실제 광고 노출(집행)이 시작되기 전에 취소를 요청할 경우: <strong>100% 전액 환불</strong></li>
                  <li>광고 노출이 시작된 이후 중도 취소를 요청할 경우: 광고가 집행된 일수만큼 일할 계산(하루 단위 차감) 및 <strong>환불 위약금(잔여 금액의 10%)을 공제</strong>한 후 나머지 금액을 환불합니다.</li>
                  <li>일회성 소모형 기능 아이템은 구매 후 사용 즉시 효력이 발생하므로 환불이 불가능합니다.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: '#fcfcfd', border: '1px solid #eaecf0', borderRadius: '12px', padding: '18px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#333', fontWeight: 'bold' }}>🔄 정기 구독 서비스 취소/환불</h4>
                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>정기 구독 결제 후 해당 회차에 플랫폼이 제공하는 구독 혜택(유료 기능 사용, 전용 권한 등)을 단 한 번도 이용하지 않고 7일 이내 취소를 요청한 경우: <strong>100% 전액 환불</strong></li>
                  <li>결제 후 7일이 경과했거나, 해당 월의 혜택 및 유료 기능을 이미 1회 이상 사용한 경우: 당월은 정상 이용으로 간주되어 중도 환불이 불가능하며, <strong>'다음 달 자동 정기 결제 해지' 예약</strong>으로 처리됩니다.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제7조 (부정행위 시 이용 제한 및 광고 몰수)</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.6' }}>
                입점 매장이 허위 분양 정보 등록, 불법 반려견 거래, 소비자 기만 행위 등으로 인해 플랫폼 이용 약관을 위반하여 '강제 탈퇴' 또는 '이용 정지' 처분을 받을 경우, 기존에 구매하여 진행 중이던 유료 광고 및 정기 구독 서비스 잔여 금액은 일체 환불되지 않고 소멸합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 3부 */}
        <section style={{ backgroundColor: '#fff', border: '1px solid #eef2f7', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#27ae60', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
            3부. [공통] 결제 수단별 처리 프로세스
          </h2>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제8조 (결제 및 환불 처리 프로세스)</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>신용카드 및 간편결제:</strong> 플랫폼에서 취소 승인 즉시 결제 대행사(PG)를 통해 카드사로 취소 요청이 전달되며, 카드사 사정에 따라 영업일 기준 최대 30일 후 한도 복구 또는 환급됩니다.</li>
              <li><strong>무통장 입금 (가상계좌):</strong> 가상계좌 결제 취소 시, 회원이 입력한 본인 명의의 환불 계좌로 영업일 기준 최대 30일 이내에 현금으로 안전하게 입금됩니다.</li>
              <li><strong>정기 결제(빌링):</strong> 정기 구독 서비스는 등록된 결제 수단을 통해 매월 자동 청구되며, 해지 신청 시 다음 결제 예정일부터 청구가 중단됩니다.</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
};

export default RefundPolicyPage;
