import './globals.css';
import Header from '../src/components/Header'; // 기존 컴포넌트 재사용

export const metadata = {
  title: '다잇독 - 프리미엄 반려견 분양',
  description: '건강하고 예쁜 반려견 분양 플랫폼, 다잇독입니다.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <div className="App">
          <Header />
          {children}
          <footer style={{ 
            padding: '60px 0', 
            backgroundColor: 'var(--body-text)', 
            color: 'rgba(255,255,255,0.6)',
            marginTop: '100px'
          }}>
            <div className="container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '30px' }}>
                <div>
                  <h2 style={{ color: 'white', marginBottom: '10px' }}>다잇독</h2>
                  <div style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgba(255,255,255,0.5)', marginBottom: '15px' }}>
                    주식회사 블루프라임 &nbsp;|&nbsp; 대표자 : 김덕규 &nbsp;|&nbsp; 사업자등록번호 : 153-87-03544<br />
                    주소 : 서울특별시 노원구 상계로23다길 13-8, 101동 11층 1101호(상계동, 노원 아이파크)<br />
                    고객센터 : 010-3046-9821 &nbsp;|&nbsp; 이메일 : goodduck2@naver.com
                  </div>
                  <p style={{ fontSize: '12px' }}>© 2026 Daitdog. All rights reserved.</p>
                </div>
                <div style={{ display: 'flex', gap: '25px', fontSize: '14px', flexWrap: 'wrap' }}>
                  <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>개인정보처리방침</a>
                  <a href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>이용약관</a>
                  <a href="/refund" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 'bold' }}>환불정책</a>
                  <a href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=1538703544" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>사업자정보확인</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
