import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom'
import { api } from './lib/api'
import Header from './components/Header'
import BottomNavigation from './components/BottomNavigation'
import { MobileProvider, useMobile } from './context/MobileContext'
import { HeroCarousel, AdSections, AdoptionList, LoginWidget, PersonalRecommendWidget, LatestCommunityWidget } from './components/Sections'
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


// 메인 페이지 노출용 최신 커뮤니티 글 위젯은 Sections.jsx로 이동됨
const PartnerBanner = () => {
  const { isMobile } = useMobile();
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('paldodog_partner_banner_closed') !== 'true';
  });

  if (!isVisible) return null;

  const handleClose = () => {
    localStorage.setItem('paldodog_partner_banner_closed', 'true');
    setIsVisible(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '16px 20px' : '24px 30px',
      marginBottom: isMobile ? '12px' : '20px',
      position: 'relative',
      boxShadow: '0 8px 30px rgba(38, 166, 154, 0.08)',
      border: '1px solid rgba(38, 166, 154, 0.15)',
      overflow: 'hidden',
      animation: 'fadeIn 0.6s ease forwards'
    }}>
      {/* 은은한 원형 데코레이션 배경 */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.3)',
        zIndex: 1
      }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, paddingRight: isMobile ? '24px' : '40px' }}>
          <h3 style={{
            fontSize: isMobile ? '1.05rem' : '1.4rem',
            fontWeight: '800',
            color: '#004D40',
            marginBottom: isMobile ? '8px' : '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🤝 팔도댕댕 파트너스 매장 관리 솔루션(SaaS) 안내
          </h3>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '1rem',
            lineHeight: '1.6',
            color: '#00695C',
            fontWeight: '500'
          }}>
            <p style={{ fontWeight: '700', fontSize: isMobile ? '0.9rem' : '1.05rem', color: '#004D40', marginBottom: '6px' }}>
              올바른 반려문화의 시작
            </p>
            <p style={{ margin: '4px 0' }}>
              팔도댕댕은 반려동물 매장의 효율적인 정보 관리와 디지털 전환을 돕는 <strong style={{ color: '#004D40', borderBottom: '2px solid #00796B', paddingBottom: '2px' }}>'B2B 매장 통합 관리(SaaS) 플랫폼'</strong>입니다.
            </p>
            <p style={{ margin: '4px 0' }}>
              팔도댕댕은 관련 법률을 준수하며, 플랫폼 내에서 <strong style={{ color: '#c62828' }}>플랫폼 내 상품 거래 및 소비자 대상 결제 기능은 제공하지 않습니다.</strong>
            </p>
            <p style={{ margin: '4px 0' }}>
              팔도댕댕이 제공하는 전자결제 서비스는 오직 파트너사분들의 <strong style={{ color: '#004D40' }}>'매장 관리 ERP 솔루션 사용료 및 프리미엄 파트너스 멤버십 구독료' 결제용 무형 소프트웨어 서비스</strong>입니다.
            </p>
            <p style={{ margin: '8px 0 0 0', fontWeight: '700', color: '#00796B' }}>
              체계적이고 편리한 매장 관리 솔루션을 경험해보세요!
            </p>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          style={{
            background: 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: isMobile ? '26px' : '32px',
            height: isMobile ? '26px' : '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#004D40',
            fontWeight: 'bold',
            fontSize: isMobile ? '0.9rem' : '1.1rem',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
          title="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
};


const Home = () => {
  const { isMobile } = useMobile();

  if (isMobile) {
    // 📱 모바일 최적화 메인 페이지
    return (
      <main style={{ padding: '0 12px', backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '40px', marginTop: '0px', paddingTop: '10px' }}>
        {/* 모바일 메인 페이지 히어로 섹션 위에 파트너 모집 배너 추가 */}

        {/* 1. 가로형 배너 */}
        <div style={{ marginBottom: '15px' }}>
          <HeroCarousel />
        </div>
        
        {/* 2. 검색창 */}
        <div style={{ position: 'relative', zIndex: 10, marginBottom: isMobile ? '-15px' : '12px' }}>
          <SearchBar />
        </div>
        
        {/* 6. 우수 매장 소개 */}
        <div style={{ marginBottom: '10px' }}>
          <PersonalRecommendWidget />
        </div>

        {/* 4. 커뮤니티 최근 이야기 */}
        <div style={{ marginBottom: '10px' }}>
          <LatestCommunityWidget />
        </div>


        {/* 3. 최신 입양 리스트 (안심/인기/스페셜 분양 광고 섹션) */}
        <div style={{ padding: '0', marginTop: '0px', marginBottom: '5px', position: 'relative', zIndex: 5 }}>
          <AdSections />
        </div>

        {/* 5. 일반 분양 리스트 (전체 분양 리스트) */}
        <div style={{ padding: '0', marginBottom: '15px' }}>
          <AdoptionList />
        </div>

      </main>
    );
  }

  // 💻 PC버전 메인 페이지
  return (
    <main className="container" style={{ padding: '0 20px' }}>
      {/* 메인 페이지 히어로 섹션 위에 파트너 모집 배너 추가 */}

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
          
          {/* 1. 우수 매장 소개 */}
          <PersonalRecommendWidget />

          {/* 2. 커뮤니티 최근 이야기 */}
          <LatestCommunityWidget />
          
          {/* 3. 안심 입양 가이드 */}
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
        </div>
      </div>
    </main>
  );
};

function Footer() {
  const { isMobile } = useMobile();
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);

  return (
    <footer style={{ 
      padding: isMobile ? '30px 15px' : '60px 0', 
      backgroundColor: 'var(--body-text)', 
      color: 'rgba(255,255,255,0.6)',
      marginTop: isMobile ? '40px' : '100px',
      fontSize: isMobile ? '12px' : '14px'
    }}>
      <div className={isMobile ? "" : "container"}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'flex-start', 
          gap: isMobile ? '20px' : '30px' 
        }}>
          <div>
            <h2 style={{ color: 'white', fontSize: isMobile ? '1.2rem' : '1.5rem', marginBottom: '10px' }}>팔도댕댕</h2>
            
            {isMobile ? (
              <div style={{ marginBottom: '15px' }}>
                <button 
                  onClick={() => setShowCompanyDetails(!showCompanyDetails)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.8)',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '10px'
                  }}
                >
                  🏢 사업자 정보 {showCompanyDetails ? '접기 ▲' : '펼치기 ▼'}
                </button>
                {showCompanyDetails && (
                  <div style={{ 
                    fontSize: '11px', 
                    lineHeight: '1.8', 
                    color: 'rgba(255,255,255,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    주식회사 블루프라임 &nbsp;|&nbsp; 대표자 : 김덕규<br />
                    사업자등록번호 : 153-87-03544 &nbsp;|&nbsp; 통신판매업신고번호 : 제 2025-서울노원-0724 호<br />
                    주소 : 서울특별시 노원구 상계로23다길 13-8, 101동 11층 1101호(상계동, 노원 아이파크)<br />
                    고객센터 : 010-3046-9821 &nbsp;|&nbsp; 이메일 : goodduck2@naver.com
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgba(255,255,255,0.5)', marginBottom: '15px' }}>
                주식회사 블루프라임 &nbsp;|&nbsp; 대표자 : 김덕규 &nbsp;|&nbsp; 사업자등록번호 : 153-87-03544 &nbsp;|&nbsp; 통신판매업신고번호 : 제 2025-서울노원-0724 호<br />
                주소 : 서울특별시 노원구 상계로23다길 13-8, 101동 11층 1101호(상계동, 노원 아이파크)<br />
                고객센터 : 010-3046-9821 &nbsp;|&nbsp; 이메일 : goodduck2@naver.com
              </div>
            )}
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>© 2026 PaldoDog. All rights reserved.</p>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: isMobile ? '12px' : '25px', 
            flexWrap: 'wrap',
            borderTop: isMobile ? '1px solid rgba(255,255,255,0.1)' : 'none',
            paddingTop: isMobile ? '15px' : '0'
          }}>
            <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>개인정보처리방침</Link>
            <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>이용약관</Link>
            <Link to="/refund" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 'bold' }}>환불정책</Link>
            <a href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=1538703544" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>사업자정보확인</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const { isMobile } = useMobile();
  return (
    <div className="App" style={{ paddingBottom: isMobile ? '68px' : '0px' }}>
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
      <BottomNavigation />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <MobileProvider>
        <AppContent />
      </MobileProvider>
    </Router>
  )
}

export default App
