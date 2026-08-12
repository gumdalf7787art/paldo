import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

// --- 이미지 리사이징 & 압축 헬퍼 함수 ---
const resizeImageToBase64 = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const SignupPage = () => {
  const [tab, setTab] = useState('buyer'); // 'buyer' or 'seller'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 파트너 사업자 입력 항목
  const [bizName, setBizName] = useState('');
  const [bizNo, setBizNo] = useState('');
  const [animalNo, setAnimalNo] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizFile, setBizFile] = useState(null);
  const [bizFileBase64, setBizFileBase64] = useState('');
  const [bizFileName, setBizFileName] = useState('');

  const [emailStatus, setEmailStatus] = useState(''); // '', 'invalid', 'valid', 'duplicate'
  const [passwordMatch, setPasswordMatch] = useState(null); // null, true, false
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  
  const navigate = useNavigate();

  // 페이지 진입 시 항상 최상단 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 실시간 이메일 형식 체크
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email === '') {
      setEmailStatus('');
    } else if (!emailRegex.test(email)) {
      setEmailStatus('invalid');
    } else {
      setEmailStatus('valid');
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



  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBizFile(file);
    setBizFileName(file.name);
    
    if (file.type.startsWith('image/')) {
      try {
        const base64 = await resizeImageToBase64(file, 1200, 1200, 0.75);
        setBizFileBase64(base64);
      } catch (err) {
        console.error('이미지 압축 실패:', err);
        const base64 = await fileToBase64(file);
        setBizFileBase64(base64);
      }
    } else {
      const base64 = await fileToBase64(file);
      setBizFileBase64(base64);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (tab === 'seller') {
      if (!bizName.trim() || !bizNo.trim() || !animalNo.trim() || !bizAddress.trim()) {
        alert('파트너 사업자 정보를 모두 입력해 주세요.');
        return;
      }
      if (!bizFile) {
        alert('사업자등록증 파일을 반드시 첨부해 주세요.');
        return;
      }
    }
    
    setLoading(true);
    try {
      const { data: userData, error: signupError } = await api.auth.signup(email, password, {
        nickname: nickname,
        phone: ''
      });

      if (signupError) {
        if (signupError.includes('사용 중인 이메일')) {
          setEmailStatus('duplicate');
        }
        throw new Error(signupError);
      }

      if (userData) {
        if (tab === 'seller') {
          // 세션 토큰이 확보된 상태에서 즉시 사업자 인증 신청을 동시에 완료
          const { error: applyError } = await api.business.apply({
            business_name: bizName,
            representative_name: nickname,
            phone: '',
            address: bizAddress,
            biz_no: bizNo,
            animal_sale_no: animalNo,
            file_base64: bizFileBase64,
            file_name: bizFileName,
          });

          if (applyError) {
            alert('회원가입은 완료되었으나, 사업자 인증 신청 중 오류가 발생했습니다: ' + applyError);
            navigate('/mypage');
            return;
          }

          alert('🎉 회원가입 및 사업자 등록 신청이 함께 접수되었습니다! 최대 24시간 내 심사가 완료됩니다.');
          navigate('/mypage');
        } else {
          alert('회원가입이 완료되었습니다!');
          navigate('/login');
        }
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

  const handleKakaoSignup = () => {
    const redirectUri = `${window.location.origin}/api/auth/kakao`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=1e125441d9fd216da9509e331e584cd4&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  const handleNaverSignup = () => {
    const redirectUri = `${window.location.origin}/api/auth/naver`;
    const state = Math.random().toString(36).substring(2, 11);
    localStorage.setItem('naver_state', state);
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=Q2vmXowiBqzcUgm13IF0&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    window.location.href = naverAuthUrl;
  };

  const handleGoogleSignup = () => {
    const redirectUri = `${window.location.origin}/api/auth/google`;
    const state = Math.random().toString(36).substring(2, 11);
    localStorage.setItem('google_state', state);
    const clientId = '231325371389-u2sstvm5bhqnr1jg6gt73v598iudoddu' + '.apps.googleusercontent.com';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('openid email profile')}&state=${state}`;
    window.location.href = googleAuthUrl;
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
        maxWidth: '500px', 
        padding: '50px 40px',
        textAlign: 'center'
      }}>


        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--secondary)' }}>새로운 가족 찾기의 시작</h2>
        <p style={{ color: 'var(--muted-text)', fontSize: '0.95rem', marginBottom: '25px' }}>
          아직 가족을 찾지 못한 아이들이 기다리고 있어요
        </p>

        {/* 회원 가입 구분 탭 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', backgroundColor: '#f5f5f5', padding: '6px', borderRadius: '14px' }}>
          <button
            type="button"
            onClick={() => setTab('buyer')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: tab === 'buyer' ? 'white' : 'transparent',
              color: tab === 'buyer' ? 'var(--primary-dark)' : '#777',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: tab === 'buyer' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            일반 가입
          </button>
          <button
            type="button"
            onClick={() => setTab('seller')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: tab === 'seller' ? 'white' : 'transparent',
              color: tab === 'seller' ? 'var(--primary-dark)' : '#777',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: tab === 'seller' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            사업자 가입
          </button>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'grid', gap: '15px', textAlign: 'left', marginBottom: '30px' }}>
          <div style={{ position: 'relative', margin: '20px 0', borderTop: '1px solid #eee' }}>
            <span style={{ 
              position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#fff', padding: '0 15px', color: '#bbb', fontSize: '0.8rem'
            }}>소셜 계정으로 3초만에 가입</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={socialBtnStyle('#FEE500')} title="카카오 가입" onClick={handleKakaoSignup}>카카오</div>
            <div style={socialBtnStyle('#03C75A', null, '#fff')} title="네이버 가입" onClick={handleNaverSignup}>네이버</div>
            <div style={socialBtnStyle('#fff', '#ddd', '#333')} title="구글 가입" onClick={handleGoogleSignup}>구글</div>
          </div>

          {tab === 'seller' && (
            <div style={{ textAlign: 'center', color: '#ff6b6b', fontSize: '0.8rem', marginTop: '5px', marginBottom: '10px', fontWeight: 'bold', wordBreak: 'keep-all', lineHeight: '1.4' }}>
              💡 사업자 가입시 소셜 계정으로 회원가입할 경우<br/>[마이페이지]에서 사업자 정보를 별도로 추가하셔야 정상 승인 처리됩니다.
            </div>
          )}

          <div style={{ position: 'relative', margin: '20px 0', borderTop: '1px solid #eee' }}>
            <span style={{ 
              position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#fff', padding: '0 15px', color: '#bbb', fontSize: '0.8rem'
            }}>또는 이메일로 가입</span>
          </div>

          <div>
            <label style={labelStyle}>닉네임 (실명)</label>
            <input 
              type="text" 
              placeholder="홍길동" 
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

          {/* 파트너 사업자 입력 영역 */}
          {tab === 'seller' && (
            <div className="fade-in" style={{
              padding: '20px',
              backgroundColor: '#fafafa',
              borderRadius: '14px',
              border: '1px solid #eee',
              display: 'grid',
              gap: '15px',
              marginTop: '10px',
              marginBottom: '10px'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary-dark)', margin: '0 0 5px 0' }}>Store Information (사업자 인증 정보)</h3>
              
              <div>
                <label style={labelStyle}>상호명 (사업장 이름)</label>
                <input
                  type="text"
                  placeholder="예: 팔도댕댕 펫샵"
                  style={inputStyle}
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  required={tab === 'seller'}
                />
              </div>

              <div>
                <label style={labelStyle}>사업자등록번호</label>
                <input
                  type="text"
                  placeholder="10자리 숫자 입력 (- 제외)"
                  style={inputStyle}
                  value={bizNo}
                  onChange={e => setBizNo(e.target.value.replace(/[^0-9]/g, ''))}
                  required={tab === 'seller'}
                />
              </div>

              <div>
                <label style={labelStyle}>동물판매업등록번호</label>
                <input
                  type="text"
                  placeholder="동물판매업 등록번호 입력"
                  style={inputStyle}
                  value={animalNo}
                  onChange={e => setAnimalNo(e.target.value)}
                  required={tab === 'seller'}
                />
              </div>

              <div>
                <label style={labelStyle}>매장 실 주소</label>
                <input
                  type="text"
                  placeholder="매장의 실제 주소를 정확하게 입력해주세요."
                  style={inputStyle}
                  value={bizAddress}
                  onChange={e => setBizAddress(e.target.value)}
                  required={tab === 'seller'}
                />
              </div>

              <div>
                <label style={labelStyle}>사업자등록증 또는 관련 증빙 서류 첨부</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  required={tab === 'seller'}
                  style={{ display: 'block', marginTop: '5px' }}
                />
                {bizFileName && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '5px', fontWeight: 'bold' }}>
                    📎 첨부파일: {bizFileName}
                  </p>
                )}
              </div>
            </div>
          )}

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
                  팔도댕댕은 회원 간의 원활한 정보 공유 및 소통을 지원하는 시스템 제공자로서 회원 간의 직접적인 교류 과정에서 발생하는 사고나 분쟁에 대해 책임을 지지 않습니다. 거래 전 상대방의 정보를 확인하세요.<br/><br/>
                  제4조 (개인정보 보호)<br/>
                  수집된 닉네임과 이메일은 원활한 서비스 제공 및 공지사항 전달을 위해 사용되며, 관계 법령에 따라 철저히 보호됩니다.
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
            {loading ? '처리 중...' : (tab === 'seller' ? '파트너사 가입 및 승인 신청하기' : '가족이 되어주기 (회원가입)')}
          </button>
        </form>



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
const socialBtnStyle = (bg, border, color = '#333') => ({
  flex: 1, height: '46px', borderRadius: '23px', backgroundColor: bg, border: border ? `1px solid ${border}` : 'none', color: color,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
});

export default SignupPage;
