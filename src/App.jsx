import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import Header from './components/Header'
import { HeroCarousel, AdSections, AdoptionList, PopularBreeds } from './components/Sections'
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

// 페이지 뷰 트래킹 컴포넌트
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const trackView = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        
        // 상세 페이지 ID 추출 (State 또는 Query Parameter)
        const searchParams = new URLSearchParams(location.search);
        const dogId = location.state?.dog?.id || searchParams.get('id');
        
        // 상세 페이지(/detail)는 DetailPage 컴포넌트 내부에서 더 정밀하게(순차적 실행) 기록하므로 여기서는 제외
        if (location.pathname === '/detail') return;

        await supabase.from('analytics_logs').insert([{
          user_id: user?.id || null,
          event_type: 'page_view',
          page_path: fullPath
        }]);
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }
    };
    trackView();
  }, [location.pathname, location.search]);

  return null;
};

const BrandIntro = () => (
  <section className="fade-in" style={{ 
    padding: '40px 0 30px', 
    textAlign: 'center', 
    background: 'linear-gradient(to bottom, #fff, var(--bg-primary))',
    borderBottom: '1px solid #f0f0f0'
  }}>
    <div className="container">
      <div style={{ 
        display: 'inline-block', 
        padding: '4px 12px', 
        backgroundColor: 'var(--primary-light)', 
        color: 'var(--primary-dark)', 
        borderRadius: '30px', 
        fontSize: '0.75rem', 
        fontWeight: '800',
        marginBottom: '12px',
        boxShadow: '0 2px 5px rgba(38, 166, 154, 0.1)'
      }}>
        ✨ CLEAN ADOPTION
      </div>
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: '800', 
        marginBottom: '8px', 
        lineHeight: '1.2',
        color: 'var(--body-text)'
      }}>
        허위 매물 없는 <span style={{ color: 'var(--primary)' }}>클린 분양</span>
      </h1>
      <p style={{ 
        fontSize: '1rem', 
        color: 'var(--muted-text)', 
        fontWeight: '500', 
        maxWidth: '600px', 
        margin: '0 auto' 
      }}>
        안심하고 새로운 가족을 만나보세요. <b>팔도댕댕은 검증된 사업자만 함께합니다.</b>
      </p>
    </div>
  </section>
)

const Home = () => (
  <main>
    <BrandIntro />
    <HeroCarousel />
    <PopularBreeds />
    <SearchBar />
    <AdSections />
    <AdoptionList />
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
          <Route path="/store/:sellerId" element={<StorePage />} />
          <Route path="/breed/:breedName" element={<BreedPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
        <footer style={{ 
          padding: '60px 0', 
          backgroundColor: 'var(--body-text)', 
          color: 'rgba(255,255,255,0.6)',
          marginTop: '100px'
        }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: 'white', marginBottom: '10px' }}>팔도댕댕</h2>
                <p>© 2024 Paldo Dang-Dang. All rights reserved.</p>
              </div>
              <div style={{ display: 'flex', gap: '30px' }}>
                <span>개인정보처리방침</span>
                <span>이용약관</span>
                <span>사업자정보확인</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
