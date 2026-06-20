import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: GET/POST /api/auth

// SHA-256 비밀번호 단방향 해싱 함수
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 가벼운 인증 토큰 발행 (Base64 인코딩)
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7일 유효
  };
  // Unicode 안전한 Base64 변환
  const utf8Bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  const len = utf8Bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary);
}

// 토큰 해독 및 유효성 검증
function verifyToken(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now()) {
      return null; // 만료됨
    }
    return payload;
  } catch (e) {
    return null; // 변조/오류
  }
}

// 공통 토큰 파서 헬퍼
function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// CORS 응답 생성
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// OPTIONS 프리플라이트 처리
export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// GET 요청 처리 (세션 확인 및 쿠폰 조회)
export async function GET(request) {
  const env = getRequestContext().env;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const user = getAuthenticatedUser(request);
  
  if (!user) {
    return createResponse({ error: '인증 세션이 유효하지 않습니다.' }, 401);
  }

  // 1. 내 쿠폰 목록 조회
  if (action === 'coupons') {
    try {
      const { results: coupons } = await env.DB.prepare(`
        SELECT uc.id, uc.user_id, uc.coupon_id, uc.is_used, uc.used_at, uc.created_at, uc.expires_at,
               c.name, c.discount_rate, c.code, c.ad_type
        FROM user_coupons uc
        INNER JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.user_id = ? AND uc.is_used = 0
      `)
        .bind(user.id)
        .all();

      return createResponse(coupons);
    } catch (err) {
      return createResponse({ error: `쿠폰 조회 오류: ${err.message}` }, 500);
    }
  }

  // 2. D1 DB에서 최신 정보 조회 (기본값)
  try {
    const dbUser = await env.DB.prepare(`
      SELECT p.id, p.email, p.nickname, p.phone, p.address, p.profile_image, p.role, p.grade, 
             p.completed_adoption_count, p.created_at,
             p.store_header_image, p.store_contact, p.kakao_channel, p.store_description, p.store_address, p.store_additional_images,
             b.business_name, b.biz_no, b.animal_sale_no
      FROM profiles p
      LEFT JOIN business_applications b ON p.id = b.user_id AND b.status = 'approved'
      WHERE p.id = ?
    `)
      .bind(user.id)
      .first();

    if (!dbUser) {
      return createResponse({ error: '존재하지 않는 사용자 계정입니다.' }, 404);
    }

    // JSON 문자열 파싱
    if (dbUser.store_additional_images) {
      try {
        dbUser.store_additional_images = JSON.parse(dbUser.store_additional_images);
      } catch (e) {
        dbUser.store_additional_images = [];
      }
    } else {
      dbUser.store_additional_images = [];
    }

    return createResponse({ user: dbUser });
  } catch (err) {
    return createResponse({ error: `DB 조회 오류: ${err.message}` }, 500);
  }
}

// POST 요청 처리 (가입, 로그인, 정보수정 등)
export async function POST(request) {
  const env = getRequestContext().env;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  // 1. 회원가입 (signup)
  if (action === 'signup') {
    const { email, password, nickname, phone, address, profile_image } = body;
    if (!email || !password) {
      return createResponse({ error: '이메일과 비밀번호는 필수 입력사항입니다.' }, 400);
    }

    try {
      // 이메일 중복 확인
      const existing = await env.DB.prepare('SELECT id FROM profiles WHERE email = ?')
        .bind(email)
        .first();
      if (existing) {
        return createResponse({ error: '이미 사용 중인 이메일 주소입니다.' }, 409);
      }

      const userId = crypto.randomUUID();
      const hashedPassword = await hashPassword(password);

      // 사용자 생성
      await env.DB.prepare(
        'INSERT INTO profiles (id, email, password, nickname, phone, address, profile_image, role, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(userId, email, hashedPassword, nickname || '', phone || '', address || '', profile_image || '', 'buyer', '일반')
        .run();

      const newUser = { id: userId, email, nickname, phone, address, profile_image, role: 'buyer', grade: '일반' };
      const token = generateToken(newUser);

      return createResponse({ user: newUser, token });
    } catch (err) {
      return createResponse({ error: `회원가입 실패: ${err.message}` }, 500);
    }
  }

  // 2. 로그인 (login)
  if (action === 'login') {
    const { email, password } = body;
    if (!email || !password) {
      return createResponse({ error: '이메일과 비밀번호를 모두 입력해 주세요.' }, 400);
    }

    try {
      const hashedPassword = await hashPassword(password);
      const user = await env.DB.prepare('SELECT * FROM profiles WHERE email = ? AND password = ?')
        .bind(email, hashedPassword)
        .first();

      if (!user) {
        return createResponse({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
      }

      // 보안상 비밀번호는 제외하고 전송
      const cleanUser = { ...user };
      delete cleanUser.password;

      const token = generateToken(cleanUser);
      return createResponse({ user: cleanUser, token });
    } catch (err) {
      return createResponse({ error: `로그인 오류: ${err.message}` }, 500);
    }
  }

  // 3. 로그아웃 (logout)
  if (action === 'logout') {
    return createResponse({ success: true });
  }

  // 4. 프로필 정보 수정 (update_profile)
  if (action === 'update_profile') {
    const authUser = getAuthenticatedUser(request);
    if (!authUser) return createResponse({ error: '로그인이 필요합니다.' }, 401);

    const { 
      nickname, phone, address, profile_image,
      store_header_image, store_contact, kakao_channel, store_description, store_address, store_additional_images,
      completed_adoption_count
    } = body;

    let additionalImagesStr = undefined;
    if (store_additional_images !== undefined) {
      additionalImagesStr = Array.isArray(store_additional_images) 
        ? JSON.stringify(store_additional_images) 
        : store_additional_images;
    }

    let finalNickname = nickname;
    if (authUser.role === 'seller') {
      const app = await env.DB.prepare('SELECT business_name FROM business_applications WHERE user_id = ? AND status = "approved" ORDER BY created_at DESC LIMIT 1').bind(authUser.id).first();
      if (app && app.business_name) {
        finalNickname = app.business_name;
      }
    }

    try {
      // 유저 정보 업데이트
      await env.DB.prepare(`
        UPDATE profiles 
        SET nickname = COALESCE(?, nickname), 
            phone = COALESCE(?, phone), 
            address = COALESCE(?, address), 
            profile_image = COALESCE(?, profile_image),
            store_header_image = COALESCE(?, store_header_image),
            store_contact = COALESCE(?, store_contact),
            kakao_channel = COALESCE(?, kakao_channel),
            store_description = COALESCE(?, store_description),
            store_address = COALESCE(?, store_address),
            store_additional_images = COALESCE(?, store_additional_images),
            completed_adoption_count = COALESCE(?, completed_adoption_count)
        WHERE id = ?
      `)
        .bind(
          finalNickname !== undefined ? finalNickname : null,
          phone !== undefined ? phone : null,
          address !== undefined ? address : null,
          profile_image !== undefined ? profile_image : null,
          store_header_image !== undefined ? store_header_image : null,
          store_contact !== undefined ? store_contact : null,
          kakao_channel !== undefined ? kakao_channel : null,
          store_description !== undefined ? store_description : null,
          store_address !== undefined ? store_address : null,
          additionalImagesStr !== undefined ? additionalImagesStr : null,
          completed_adoption_count !== undefined ? completed_adoption_count : null,
          authUser.id
        )
        .run();

      // 수정된 최신 사용자 정보 조회 (JOIN 추가)
      const updatedUser = await env.DB.prepare(`
        SELECT p.id, p.email, p.nickname, p.phone, p.address, p.profile_image, p.role, p.grade, 
               p.completed_adoption_count, p.created_at,
               p.store_header_image, p.store_contact, p.kakao_channel, p.store_description, p.store_address, p.store_additional_images,
               b.business_name, b.biz_no, b.animal_sale_no
        FROM profiles p
        LEFT JOIN business_applications b ON p.id = b.user_id AND b.status = 'approved'
        WHERE p.id = ?
      `)
        .bind(authUser.id)
        .first();

      // JSON 문자열 파싱
      if (updatedUser && updatedUser.store_additional_images) {
        try {
          updatedUser.store_additional_images = JSON.parse(updatedUser.store_additional_images);
        } catch (e) {
          updatedUser.store_additional_images = [];
        }
      } else if (updatedUser) {
        updatedUser.store_additional_images = [];
      }

      return createResponse(updatedUser);
    } catch (err) {
      return createResponse({ error: `프로필 수정 실패: ${err.message}` }, 500);
    }
  }

  // 5. 비밀번호 변경 (update_password)
  if (action === 'update_password') {
    const authUser = getAuthenticatedUser(request);
    if (!authUser) return createResponse({ error: '로그인이 필요합니다.' }, 401);

    const { password } = body;
    if (!password) {
      return createResponse({ error: '새로운 비밀번호를 입력해 주세요.' }, 400);
    }

    try {
      const hashedPassword = await hashPassword(password);
      await env.DB.prepare('UPDATE profiles SET password = ? WHERE id = ?')
        .bind(hashedPassword, authUser.id)
        .run();

      return createResponse({ success: true, message: '비밀번호가 안전하게 변경되었습니다.' });
    } catch (err) {
      return createResponse({ error: `비밀번호 변경 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원되지 않는 요청 액션입니다.' }, 400);
}
