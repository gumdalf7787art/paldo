import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 비밀번호 일치 실시간 체크
    if (confirmPassword === '') {
      setPasswordMatch(null);
    } else {
      setPasswordMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      alert('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      // Supabase: 현재 세션(링크 타고 들어옴)의 사용자의 정보를 업데이트
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      alert('비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해 주세요.');
      // 변경 후 로그아웃 처리하여 깔끔하게 재로그인 유도
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      alert('비밀번호 변경 실패: ' + error.message);
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
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
          <Logo />
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--secondary)' }}>비밀번호 재설정</h2>
        <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginBottom: '35px' }}>
          새롭게 사용할 비밀번호를 입력해 주세요.
        </p>

        <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: '20px', textAlign: 'left' }}>
          <div>
            <label style={labelStyle}>새 비밀번호</label>
            <input 
              type="password" 
              placeholder="6자리 이상 입력" 
              style={inputStyle} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>비밀번호 확인</label>
            <input 
              type="password" 
              placeholder="동일하게 한 번 더 입력" 
              style={{ ...inputStyle, borderColor: passwordMatch === false ? '#FF5252' : (passwordMatch === true ? 'var(--primary)' : '#eee') }} 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordMatch === false && <p style={errorMsgStyle}>비밀번호가 일치하지 않습니다.</p>}
            {passwordMatch === true && <p style={successMsgStyle}>비밀번호가 일치합니다.</p>}
          </div>

          <button 
            disabled={loading || !passwordMatch}
            style={{
              marginTop: '10px', padding: '15px', borderRadius: '12px',
              backgroundColor: (loading || !passwordMatch) ? '#ccc' : 'var(--primary)', 
              color: 'white',
              fontWeight: '700', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(38, 166, 154, 0.3)',
              cursor: (loading || !passwordMatch) ? 'not-allowed' : 'pointer',
              border: 'none'
            }}>
            {loading ? '변경 중...' : '비밀번호 변경 완료'}
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--muted-text)', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #eee', outline: 'none', fontSize: '1rem', boxSizing: 'border-box' };
const errorMsgStyle = { fontSize: '0.8rem', marginTop: '6px', color: '#FF5252', fontWeight: '600' };
const successMsgStyle = { fontSize: '0.8rem', marginTop: '6px', color: 'var(--primary)', fontWeight: '600' };

export default ResetPasswordPage;
