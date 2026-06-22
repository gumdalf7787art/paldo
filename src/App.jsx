import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom'
import { api } from './lib/api'
import Header from './components/Header'
import { HeroCarousel, AdSections, AdoptionList, LoginWidget, PersonalRecommendWidget } from './components/Sections'
import SearchBar from './components/SearchBar'
import DetailPage from './pages/DetailPage'
import MyPage from './pages/MyPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AdminPage from './pages/AdminPage'
import UploadForm from './components/UploadForm'
import AdSetupPage from './pages/AdSetupPage'
import StorePage from './pages/StorePage'
import BreedPage from './pages/BreedPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdStorePage from './pages/AdStorePage'
import RefundPolicyPage from './pages/RefundPolicyPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import SubscriptionPage from './pages/SubscriptionPage'
import CommunityPage from './pages/CommunityPage'
import CommunityDetailPage from './pages/CommunityDetailPage'
import CommunityWritePage from './pages/CommunityWritePage'

// 페이지 뷰 트래킹 컴포넌트
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const trackView = async () => {
      try {
        await api.auth.getUser();
        
        // 상세 페이지 ID 추출 (State 또는 Query Parameter)
        const searchParams = new URLSearchParams(location.search);
        const dogId = location.state?.dog?.id || searchParams.get('id');
        
        // 상세 페이지(/detail)는 DetailPage 컴포넌트 내부에서 더 정밀하게 기록
        if (location.pathname === '/detail' && dogId) {
          const breed = location.state?.dog?.breed || '';
          await api.analytics.logActivity(dogId, breed, 'view');
        }
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }
    };
    trackView();
  }, [location.pathname, location.search]);

  return null;
};


const Home = () => (
  <main className="container" style={{ padding: '0 20px' }}>
    {/* 1. 최상단 가로형 대표 강아지 홍보 배너 배치 */}
    <HeroCarousel />
    
    {/* 2. 검색창 배치 및 인기견종 통합 */}
    <SearchBar />
    
    {/* 3. 2컬럼 레이아웃 (Main 콘텐츠 / Sidebar 위젯) */}
    <div className="main-portal-layout">
      {/* 좌측 메인 영역 */}
      <div className="portal-main-col">
        <AdSections />
        <AdoptionList />
      </div>
      
      {/* 우측 사이드바 영역 */}
      <div className="portal-side-col">
        <LoginWidget />
        
        {/* 입양 안내 위젯 */}
        <div style={{
          backgroundColor: '#FFF8F6',
          border: '1px solid #FFECE5',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: 'var(--shadow)',
          marginBottom: '10px'
        }}>
          <h4 style={{ color: '#E65100', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            💡 안심 입양 가이드
          </h4>
          <ul style={{ fontSize: '0.8rem', color: '#6D4C41', display: 'flex', flexDirection: 'column', gap: '6px', padding: 0, listStyle: 'none' }}>
            <li>• 분양 시 반드시 <b>동물판매업 등록번호</b>를 확인하세요.</li>
            <li>• 직접 매장을 방문하여 아이의 건강 상태를 살피는 것이 좋습니다.</li>
            <li>• 계약서 작성 시 15일 이내 폐사/질병에 대한 보상 조건을 확인하세요.</li>
          </ul>
        </div>

        {/* 맞춤형 개별 추천 위젯 */}
        <PersonalRecommendWidget />
      </div>
    </div>
  </main>
)

function App() {
  return (
    <Router>
      <div className="App">
        <AnalyticsTracker />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/detail" element={<DetailPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/upload" element={<UploadForm />} />
          <Route path="/ad-setup/:id" element={<AdSetupPage />} />
          <Route path="/ad-store" element={<AdStorePage />} />
          <Route path="/store/:sellerId" element={<StorePage />} />
          <Route path="/breed/:breedName" element={<BreedPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/refund" element={<RefundPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/:id" element={<CommunityDetailPage />} />
          <Route path="/community/write" element={<CommunityWritePage />} />
        </Routes>
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
                <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>개인정보처리방침</Link>
                <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>이용약관</Link>
                <Link to="/refund" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 'bold' }}>환불정책</Link>
                <a href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=1538703544" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>사업자정보확인</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
