// GET /api/auth/kakao
// 카카오 로그인 콜백 API
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  const origin = url.origin;

  if (error) {
    return Response.redirect(`${origin}/login?error=${encodeURIComponent(error)}`, 302);
  }

  if (!code) {
    return Response.redirect(`${origin}/login?error=${encodeURIComponent('인가 코드가 없습니다.')}`, 302);
  }

  try {
    // 1. 카카오 토큰 요청
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: env.KAKAO_CLIENT_ID,
        redirect_uri: `${origin}/api/auth/kakao`,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return Response.redirect(`${origin}/login?error=${encodeURIComponent(tokenData.error_description || '토큰 요청 실패')}`, 302);
    }

    const { access_token } = tokenData;

    // 2. 카카오 사용자 정보 요청
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) {
      return Response.redirect(`${origin}/login?error=${encodeURIComponent('사용자 정보 획득 실패')}`, 302);
    }

    const kakaoId = userData.id;
    const email = userData.kakao_account?.email || `kakao_${kakaoId}@daitdog.com`;
    const nickname = userData.properties?.nickname || userData.kakao_account?.profile?.nickname || `카카오회원_${kakaoId.toString().slice(-4)}`;
    const profileImage = userData.properties?.profile_image || userData.kakao_account?.profile?.profile_image_url || '';

    // 3. DB에서 유저 조회 및 가입 처리
    let user = await env.DB.prepare('SELECT * FROM profiles WHERE email = ?').bind(email).first();

    if (!user) {
      // 신규 가입
      const newId = crypto.randomUUID();
      // 임시 난수 패스워드 생성
      const randomPassword = btoa(Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => String.fromCharCode(b)).join(''));
      const hashedPassword = await hashPassword(randomPassword);

      await env.DB.prepare(
        'INSERT INTO profiles (id, email, password, nickname, profile_image, role, grade) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(newId, email, hashedPassword, nickname, profileImage, 'buyer', '일반').run();

      user = {
        id: newId,
        email,
        role: 'buyer'
      };
    }

    // 4. 세션 토큰 생성
    const token = generateToken(user);

    // 5. 프론트엔드로 리다이렉트 (토큰 전달)
    return Response.redirect(`${origin}/login?token=${token}`, 302);

  } catch (err) {
    return Response.redirect(`${origin}/login?error=${encodeURIComponent(err.message)}`, 302);
  }
}

// 헬퍼 함수들
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7일 유효
  };
  const utf8Bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  const len = utf8Bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary);
}
