import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { supabase } from '../lib/supabaseClient';

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
    const fetchProfile = async (userId) => {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (data) setRole(data.role);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchNotifications(session.user.id);
        fetchUnreadCount(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchNotifications(session.user.id);
        fetchUnreadCount(session.user.id);
      } else {
        setRole('user');
        setNotifications([]);
        setTotalUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
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

  const fetchNotifications = async (userId) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setNotifications(data);
  };

  const fetchUnreadCount = async (userId) => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    setTotalUnreadCount(count || 0);
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`public:notifications:${session.user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${session.user.id}` 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications((prev) => [payload.new, ...prev]);
          setToastMsg(payload.new);
          setTimeout(() => setToastMsg(null), 5000); 
          fetchUnreadCount(session.user.id);
        } else {
          // UPDATE, DELETE 시에도 리프레시
          fetchNotifications(session.user.id);
          fetchUnreadCount(session.user.id);
        }
      })
      .on('broadcast', { event: 'REFRESH_NOTIFICATIONS' }, () => {
        fetchNotifications(session.user.id);
        fetchUnreadCount(session.user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('로그아웃되었습니다.');
    navigate('/');
  };

  const markAsRead = async (id, link_url) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchUnreadCount(session.user.id);
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setShowDropdown(false);
    if (link_url) {
      if(link_url === '/mypage') navigate('/mypage', { state: { tab: 'notifications' }});
      else navigate(link_url);
    }
  };

  return (
    <>
      <header className="fade-in" style={{
        width: '100%', padding: '20px 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
        backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 1000
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/"><Logo /></Link>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {!session ? (
              <>
                <Link to="/login" style={navLinkStyle}>로그인</Link>
                <Link to="/signup" style={navBtnStyle}>회원가입</Link>
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
