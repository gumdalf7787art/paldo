import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { api } from '../lib/api';

const Header = () => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState('user');
  const [notifications, setNotifications] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const initSession = async () => {
      const { data: sessionData } = await api.auth.getSession();
      const session = sessionData?.session;
      setSession(session);
      if (session?.user) {
        const { data: profileData } = await api.auth.getUser();
        if (profileData) setRole(profileData.role || 'user');
        fetchNotifications();
      }
    };

    initSession();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifications() {
    const { data } = await api.notifications.getList();
    if (data) {
      setNotifications(data.slice(0, 20));
      const unreadCount = data.filter(n => !n.is_read).length;
      setTotalUnreadCount(unreadCount);
    }
  }

  // 15초 폴링으로 알림 자동 갱신
  useEffect(() => {
    if (!session?.user?.id) return;

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 15000);

    return () => clearInterval(intervalId);
  }, [session?.user?.id]);

  const handleLogout = async () => {
    await api.auth.logout();
    setSession(null);
    setRole('user');
    setNotifications([]);
    setTotalUnreadCount(0);
    alert('로그아웃되었습니다.');
    navigate('/');
  };

  const markAsRead = async (id, link_url) => {
    // 로컬 즉시 반영
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setTotalUnreadCount(prev => Math.max(0, prev - 1));
    setShowDropdown(false);
    if (link_url) {
      if(link_url === '/mypage') navigate('/mypage', { state: { tab: 'notifications' }});
      else navigate(link_url);
    }
  };

  return (
    <>
      <header className="fade-in header-responsive" style={{
        width: '100%', borderBottom: '1px solid rgba(0,0,0,0.05)',
        backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 1000
      }}>
        <div className="container header-content" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          height: '80px',
          position: 'relative'
        }}>
          <Link to="/"><Logo /></Link>
          
          {/* 헤더 중앙 클린분양 슬로건 */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
            gap: '3px'
          }}>
            <span style={{ 
              fontSize: '0.95rem', 
              fontWeight: '700', 
              color: 'var(--primary)', 
              letterSpacing: '-0.3px',
              lineHeight: '1.2'
            }}>
              허위매물 없는 클린분양
            </span>
            <span style={{ 
              fontSize: '0.82rem', 
              fontWeight: '500', 
              color: '#64748b', 
              letterSpacing: '-0.3px',
              lineHeight: '1.2'
            }}>
              팔도댕댕이 만들어갑니다.
            </span>
          </div>

          <div className="nav-group" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {!session ? (
              <>
                <Link to="/login" style={navLinkStyle} className="nav-link">로그인</Link>
                <Link to="/signup" style={navBtnStyle} className="nav-btn">회원가입</Link>
              </>
            ) : (
              <>
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button onClick={() => setShowDropdown(!showDropdown)} style={bellBtnStyle}>
                    🔔
                    {totalUnreadCount > 0 && <span style={badgeStyle}>{totalUnreadCount > 9 ? '9+' : totalUnreadCount}</span>}
                  </button>

                  {showDropdown && (
                    <div style={dropdownStyle}>
                      <div style={{ padding: '15px', borderBottom: '1px solid #eee', fontWeight: '800', display: 'flex', justifyContent: 'space-between' }}>
                        <span>새로운 알림</span>
                        <Link to="/mypage" state={{ tab: 'notifications' }} onClick={() => setShowDropdown(false)} style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline' }}>모두 보기</Link>
                      </div>
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.slice(0, 5).map(n => (
                          <div key={n.id} onClick={() => markAsRead(n.id, n.link_url)} style={{ ...notiItemStyle, backgroundColor: n.is_read ? 'white' : '#f0fdf4' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 'bold', marginBottom: '4px' }}>
                              {n.type === 'chat' && '💬 팔톡 메시지'}
                              {n.type === 'bookmark' && '💝 새로운 찜'}
                              {n.type === 'coupon' && '🎁 쿠폰 도착'}
                              {n.type === 'system' && '📢 전체 공지'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#333' }}>{n.message}</div>
                            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '5px' }}>{new Date(n.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                        {notifications.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>알림이 없습니다.</div>}
                      </div>
                    </div>
                  )}
                </div>

                {role === 'admin' && (
                  <Link to="/admin" style={{ ...navLinkStyle, color: 'var(--primary-dark)', fontWeight: '800' }}>👑 관리자 모드</Link>
                )}
                <Link to="/mypage" style={navLinkStyle}>마이페이지</Link>
                <button onClick={handleLogout} style={navBtnStyle}>로그아웃</button>
              </>
            )}
          </div>
        </div>
      </header>

      {toastMsg && (
        <div className="fade-in" style={toastStyle}>
          <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary-dark)', marginBottom: '5px' }}>
            {toastMsg.type === 'chat' && '💬 팔톡'}
            {toastMsg.type === 'bookmark' && '💝 찜'}
            {toastMsg.type === 'coupon' && '🎁 쿠폰'}
            {toastMsg.type === 'system' && '📢 공지'}
          </div>
          <div style={{ fontSize: '0.95rem', color: '#333' }}>{toastMsg.message}</div>
        </div>
      )}
    </>
  );
};

const navLinkStyle = { backgroundColor: 'transparent', color: 'var(--muted-text)', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center' };
const navBtnStyle = { backgroundColor: 'var(--primary)', color: 'var(--white)', padding: '10px 25px', borderRadius: '30px', fontSize: '0.95rem', fontWeight: '700', boxShadow: '0 4px 15px rgba(38, 166, 154, 0.3)', border: 'none', cursor: 'pointer' };
const bellBtnStyle = { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' };
const badgeStyle = { position: 'absolute', top: '0', right: '0', backgroundColor: '#ff4757', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '50%', padding: '2px 5px', border: '2px solid white' };
const dropdownStyle = { position: 'absolute', top: '50px', right: '-80px', width: '300px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #eee', overflow: 'hidden', zIndex: 1001 };
const notiItemStyle = { padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', transition: 'background-color 0.2s' };
const toastStyle = { position: 'fixed', bottom: '30px', right: '30px', backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', borderLeft: '5px solid var(--primary)', zIndex: 9999, minWidth: '250px' };

export default Header;
