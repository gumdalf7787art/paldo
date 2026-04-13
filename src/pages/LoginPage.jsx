import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabaseClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      alert('로그인되었습니다!');
      navigate('/');
    } catch (error) {
      alert('로그인 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return alert('이메일을 입력해 주세요.');
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert('비밀번호 재설정 메일이 발송되었습니다. 메일함을 확인해 주세요!');
      setShowForgotModal(false);
    } catch (error) {
      alert('메일 발송 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '50px 40px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
          <Logo />
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--secondary)' }}>반가워요! 팔도댕댕입니다.</h2>
        <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginBottom: '40px' }}>
          가장 따뜻한 가족을 만나는 첫 걸음
        </p>

        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={labelStyle}>이메일 아이디</label>
            <input 
              type="email" 
              placeholder="example@paldo.com" 
              style={inputStyle} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={labelStyle}>비밀번호</label>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              style={inputStyle} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            disabled={loading}
            style={{
              marginTop: '15px', padding: '15px', borderRadius: '12px',
              backgroundColor: loading ? '#ccc' : 'var(--primary)', 
              color: 'white',
              fontWeight: '700', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(38, 166, 154, 0.3)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}>
            {loading ? '로그인 중...' : '로그인하기'}
          </button>
        </form>

        <div style={{ textAlign: 'right', marginBottom: '30px' }}>
            <span 
              onClick={() => setShowForgotModal(true)}
              style={{ fontSize: '0.85rem', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}
            >
              비밀번호를 잊으셨나요?
            </span>
        </div>

        <div style={{ position: 'relative', margin: '40px 0', borderTop: '1px solid #eee' }}>
          <span style={{ 
            position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: '#fff', padding: '0 15px', color: '#bbb', fontSize: '0.8rem'
          }}>소셜 로그인</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
          <div style={socialBtnStyle('#FEE500')} title="카카오 로그인">K</div>
          <div style={socialBtnStyle('#03C75A')} title="네이버 로그인">N</div>
          <div style={socialBtnStyle('#fff', '#eee')} title="구글 로그인">G</div>
        </div>

        <div style={{ fontSize: '0.95rem', color: 'var(--muted-text)' }}>
          아직 회원이 아니신가요? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '700' }}>회원가입</Link>
        </div>

        <div style={{ marginTop: '50px', padding: '15px', backgroundColor: '#F1F8F7', borderRadius: '12px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', fontWeight: '600' }}>
            💌 아직 가족을 찾지 못한 아이들이 기다리고 있어요
          </p>
        </div>

        {/* 비밀번호 찾기 모달 */}
        {showForgotModal && (
          <div style={modalOverlayStyle}>
             <div className="glass-card fade-in" style={modalContentStyle}>
                <h3 style={{ marginBottom: '15px' }}>비밀번호 찾기</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>
                  가입하신 이메일 주소를 입력하시면<br/>비밀번호 재설정 링크를 보내드립니다.
                </p>
                <form onSubmit={handleForgotPassword}>
                  <input 
                    type="email" 
                    placeholder="example@paldo.com" 
                    style={{ ...inputStyle, marginBottom: '20px' }}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer' }}
                    >
                      취소
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {loading ? '발송 중...' : '메일 발송'}
                    </button>
                  </div>
                </form>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--muted-text)', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #eee', outline: 'none', fontSize: '1rem' };
const socialBtnStyle = (bg, border) => ({
  width: '50px', height: '50px', borderRadius: '50%', backgroundColor: bg, border: border ? `1px solid ${border}` : 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '800', fontSize: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
});

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const modalContentStyle = {
  width: '90%', maxWidth: '400px', padding: '40px', textAlign: 'center'
};

export default LoginPage;
