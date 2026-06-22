import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { api } from '../lib/api';

const Header = () => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState('user');
  const [nickname, setNickname] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  async function fetchNotifications() {
    const { data } = await api.notifications.getList();
    if (data) {
      setNotifications(data.slice(0, 20));
      const unreadCount = data.filter(n => !n.is_read).length;
      setTotalUnreadCount(unreadCount);
    }
  }

  useEffect(() => {
    const initSession = async () => {
      const { data: sessionData } = await api.auth.getSession();
      const session = sessionData?.session;
      setSession(session);
      if (session?.user) {
        const { data: profileData } = await api.auth.getUser();
        if (profileData) {
          setRole(profileData.role || 'user');
          setNickname(profileData.nickname || profileData.email?.split('@')[0] || '사용자');
        }
        fetchNotifications();
      } else {
        setRole('user');
        setNickname('');
        setNotifications([]);
        setTotalUnreadCount(0);
      }
    };

    initSession();

    window.addEventListener('auth-change', initSession);
    return () => window.removeEventListener('auth-change', initSession);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  // 15초 폴링으로 알림 자동 갱신
  useEffect(() => {
    if (!session?.user?.id) return;

    const runFetch = () => fetchNotifications();
    setTimeout(runFetch, 0);
    const intervalId = setInterval(runFetch, 15000);

    const handleUpdate = () => runFetch();
    window.addEventListener('notifications-updated', handleUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, [session?.user?.id]);

  const handleLogout = async () => {
    await api.auth.logout();
    setSession(null);
    setRole('user');
    setNotifications([]);
    setTotalUnreadCount(0);
    window.dispatchEvent(new Event('auth-change'));
    alert('로그아웃되었습니다.');
    navigate('/');
  };

  const markAsRead = async (id, link_url) => {
    // 백엔드 상태 반영
    await api.notifications.markAsRead(id);
    
    // 프론트엔드 상태 반영
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setTotalUnreadCount(prev => Math.max(0, prev - 1));
    setShowDropdown(false);
    
    // 다른 컴포넌트(MyPage 등)에 알림 상태 변경을 알리기 위한 이벤트 발송
    window.dispatchEvent(new Event('notifications-updated'));

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
          
          {/* 헤더 중앙 리브랜딩 슬로건 (2개 카피 배치) */}
          <div className="header-slogans-container" style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            pointerEvents: 'none'
          }}>
            {/* 왼쪽 카피 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '3px'
            }}>
              <span style={{ 
                fontSize: '0.92rem', 
                fontWeight: '700', 
                color: 'var(--primary)', 
                letterSpacing: '-0.3px',
                lineHeight: '1.2'
              }}>
                세상의 모든 강아지
              </span>
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: '500', 
                color: '#64748b', 
                letterSpacing: '-0.3px',
                lineHeight: '1.2'
              }}>
                여기 다 있다. 다잇독.
              </span>
            </div>

            {/* 구분 세로선 */}
            <div style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#e2e8f0'
            }} />

            {/* 오른쪽 카피 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '3px'
            }}>
              <span style={{ 
                fontSize: '0.92rem', 
                fontWeight: '700', 
                color: 'var(--primary)', 
                letterSpacing: '-0.3px',
                lineHeight: '1.2'
              }}>
                허위매물 없는 클린분양
              </span>
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: '500', 
                color: '#64748b', 
                letterSpacing: '-0.3px',
                lineHeight: '1.2'
              }}>
                다잇독이 만들어갑니다.
              </span>
            </div>
          </div>

          <div className="nav-group" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link to="/community" style={{ ...navLinkStyle, marginRight: '10px' }} className="nav-link">🐾 커뮤니티</Link>
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
                              {n.type === 'chat' && '💬 다잇톡 메시지'}
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

                <div style={{ position: 'relative' }} ref={userDropdownRef}>
                  <button 
                    onClick={() => setShowUserDropdown(!showUserDropdown)} 
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--body-text)',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                  >
                    <span>👤 {nickname}님</span>
                    <span style={{ fontSize: '0.65rem', color: '#888' }}>▼</span>
                  </button>

                  {showUserDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '45px',
                      right: '0',
                      width: '160px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                      border: '1px solid #cbd5e1',
                      overflow: 'hidden',
                      zIndex: 1001,
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '6px 0'
                    }}>
                      {role === 'admin' && (
                        <Link 
                          to="/admin" 
                          onClick={() => setShowUserDropdown(false)}
                          className="header-dropdown-item"
                        >
                          👑 관리자 모드
                        </Link>
                      )}
                      
                      <Link 
                        to="/mypage" 
                        onClick={() => setShowUserDropdown(false)}
                        className="header-dropdown-item"
                      >
                        👤 마이페이지
                      </Link>

                      <Link 
                        to="/mypage" 
                        state={{ tab: 'chats' }}
                        onClick={() => setShowUserDropdown(false)}
                        className="header-dropdown-item"
                      >
                        💬 다잇톡메시지
                      </Link>

                      {role !== 'user' && (
                        <Link 
                          to="/subscription" 
                          onClick={() => setShowUserDropdown(false)}
                          className="header-dropdown-item"
                          style={{ color: '#9b59b6', fontWeight: 'bold' }}
                        >
                          💎 파트너스 멤버십
                        </Link>
                      )}

                      <div style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }} />

                      <button 
                        onClick={() => {
                          setShowUserDropdown(false);
                          handleLogout();
                        }}
                        className="header-dropdown-item"
                        style={{ color: '#e53e3e' }}
                      >
                        🚪 로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>


    </>
  );
};

const navLinkStyle = { backgroundColor: 'transparent', color: 'var(--muted-text)', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center' };
const navBtnStyle = { backgroundColor: 'var(--primary)', color: 'var(--white)', padding: '10px 25px', borderRadius: '30px', fontSize: '0.95rem', fontWeight: '700', boxShadow: '0 4px 15px rgba(38, 166, 154, 0.3)', border: 'none', cursor: 'pointer' };
const bellBtnStyle = { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' };
const badgeStyle = { position: 'absolute', top: '0', right: '0', backgroundColor: '#ff4757', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '50%', padding: '2px 5px', border: '2px solid white' };
const dropdownStyle = { position: 'absolute', top: '50px', right: '-80px', width: '300px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #eee', overflow: 'hidden', zIndex: 1001 };
const notiItemStyle = { padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', transition: 'background-color 0.2s' };


export default Header;
