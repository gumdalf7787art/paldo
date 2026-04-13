import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabaseClient';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [emailStatus, setEmailStatus] = useState(''); // '', 'invalid', 'valid', 'duplicate'
  const [passwordMatch, setPasswordMatch] = useState(null); // null, true, false
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  
  const navigate = useNavigate();

  // 실시간 이메일 형식 체크
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email === '') {
      setEmailStatus('');
    } else if (!emailRegex.test(email)) {
      setEmailStatus('invalid');
    } else {
      setEmailStatus('valid');
      // 실제 프로젝트에서는 여기서 수강 중복 체크 API를 호출할 수 있습니다.
    }
  }, [email]);

  // 실시간 비밀번호 일치 체크
  useEffect(() => {
    if (confirmPassword === '') {
      setPasswordMatch(null);
    } else {
      setPasswordMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Auth 회원가입 (nickname을 메타데이터로 함께 전달)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setEmailStatus('duplicate');
          throw new Error('이미 가입되어 있는 이메일 입니다.');
        }
        throw authError;
      }

      // 2. 이제 프로필은 수파베이스 트리거가 자동으로 생성해줍니다.
      if (authData.user) {
        alert('회원가입 요청이 완료되었습니다! 이메일 인증 후 로그인이 가능합니다.');
        navigate('/login');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEmailMsg = () => {
    if (emailStatus === 'invalid') return { text: '이메일 형식이 아닙니다.', color: '#FF5252' };
    if (emailStatus === 'valid') return { text: '이메일 형식 완료', color: 'var(--primary)' };
    if (emailStatus === 'duplicate') return { text: '이미 가입되어 있는 이메일 입니다.', color: '#FF5252' };
    return null;
  };

  const emailMsg = getEmailMsg();

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
        maxWidth: '500px', 
        padding: '50px 40px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
          <Logo />
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--secondary)' }}>새로운 가족 찾기의 시작</h2>
        <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginBottom: '35px' }}>
          아직 가족을 찾지 못한 아이들이 기다리고 있어요
        </p>

        <form onSubmit={handleSignup} style={{ display: 'grid', gap: '15px', textAlign: 'left', marginBottom: '30px' }}>
          <div>
            <label style={labelStyle}>닉네임</label>
            <input 
              type="text" 
              placeholder="댕댕이사랑" 
              style={inputStyle} 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>이메일 주소</label>
            <input 
              type="email" 
              placeholder="example@paldo.com" 
              style={{ ...inputStyle, borderColor: emailMsg ? emailMsg.color : '#eee' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailMsg && (
              <p style={{ fontSize: '0.8rem', marginTop: '6px', color: emailMsg.color, fontWeight: '600' }}>
                {emailMsg.text}
              </p>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>비밀번호</label>
              <input 
                type="password" 
                placeholder="8자리 이상" 
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
                placeholder="동일하게 입력" 
                style={{ ...inputStyle, borderColor: passwordMatch === false ? '#FF5252' : (passwordMatch === true ? 'var(--primary)' : '#eee') }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {passwordMatch === false && (
                <p style={{ fontSize: '0.8rem', marginTop: '6px', color: '#FF5252', fontWeight: '600' }}>
                  비밀번호가 일치하지 않습니다.
                </p>
              )}
              {passwordMatch === true && (
                <p style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--primary)', fontWeight: '600' }}>
                  비밀번호 일치
                </p>
              )}
            </div>
          </div>

          <div style={{ 
            marginTop: '10px', padding: '20px', backgroundColor: '#fcfcfc', 
            borderRadius: '12px', border: '1px solid #f0f0f0', display: 'grid', gap: '10px' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={checkLineStyle}>
                  <input type="checkbox" id="all" style={{ accentColor: 'var(--primary)' }} required />
                  <label htmlFor="all" style={{ fontWeight: '700', fontSize: '0.9rem' }}>모든 약관에 전체 동의 (필수)</label>
                </div>
                <span 
                  onClick={() => setIsTermsOpen(!isTermsOpen)}
                  style={{ fontSize: '0.75rem', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {isTermsOpen ? '닫기' : '내용 보기'}
                </span>
              </div>
              
              {isTermsOpen && (
                <div className="fade-in" style={{ 
                  marginTop: '10px', padding: '15px', backgroundColor: '#fff', 
                  border: '1px solid #eee', borderRadius: '8px', height: '150px', 
                  overflowY: 'auto', fontSize: '0.8rem', color: '#666', lineHeight: '1.5', textAlign: 'left'
                }}>
                  <strong>[팔도댕댕 서비스 이용약관]</strong><br/><br/>
                  제1조 (목적)<br/>
                  본 약관은 팔도댕댕 플랫폼이 제공하는 모든 서비스의 이용 조건 및 절차에 관한 권리와 의무를 규정함을 목적으로 합니다.<br/><br/>
                  제2조 (회원의 의무)<br/>
                  1. 회원은 반려동물의 정보를 허위로 등록해서는 안 됩니다.<br/>
                  2. 생명을 존중하며 상호 예의를 갖춘 분양 문화를 조성해야 합니다.<br/>
                  3. 허위 정보 게시 및 유해 콘텐츠 등록 시 예고 없이 계정이 중지될 수 있습니다.<br/><br/>
                  제3조 (책임의 한계)<br/>
                  팔도댕댕은 중개 플랫폼으로서 판매자와 구매자 간의 직접적인 거래 과정에서 발생하는 사고나 분쟁에 대해 법적 책임을 지지 않습니다. 거래 전 반드시 상대방의 정보를 확인하세요.<br/><br/>
                  제4조 (개인정보 보호)<br/>
                  수집된 닉네임과 이메일은 원활한 서비스 매칭 및 공지사항 전달을 위해 사용되며, 관계 법령에 따라 철저히 보호됩니다.
                </div>
              )}
            </div>
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
            {loading ? '처리 중...' : '가족이 되어주기 (회원가입)'}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '40px 0', borderTop: '1px solid #eee' }}>
          <span style={{ 
            position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: '#fff', padding: '0 15px', color: '#bbb', fontSize: '0.8rem'
          }}>소셜 계정으로 가입</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
          <div style={socialBtnStyle('#FEE500')} title="카카오 가입">K</div>
          <div style={socialBtnStyle('#03C75A')} title="네이버 가입">N</div>
          <div style={socialBtnStyle('#fff', '#eee')} title="구글 가입">G</div>
        </div>

        <div style={{ fontSize: '0.95rem', color: 'var(--muted-text)' }}>
          이미 계정이 있으신가요? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>로그인</Link>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: '#ccc' }}>
            가장 따뜻한 가족을 만나는 첫 걸음을 팔도댕댕과 함께하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--muted-text)', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #eee', outline: 'none', fontSize: '1rem', transition: 'var(--transition)' };
const checkLineStyle = { display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted-text)', cursor: 'pointer' };
const socialBtnStyle = (bg, border) => ({
  width: '50px', height: '50px', borderRadius: '50%', backgroundColor: bg, border: border ? `1px solid ${border}` : 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '800', fontSize: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
});

export default SignupPage;
