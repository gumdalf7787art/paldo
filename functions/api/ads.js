// Cloudflare Pages Functions: POST /api/ads

// 토큰 해독 및 유효성 검증
function verifyToken(token) {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// OPTIONS 프리플라이트 처리
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// POST 요청 처리 (광고 신청 등록)
export async function onRequestPost(context) {
  const { request, env } = context;

  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return createResponse({ error: '로그인이 필요한 작업입니다.' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const { title, budget, duration } = body;
  if (!title || budget === undefined || !duration) {
    return createResponse({ error: '광고 제목, 예산, 기간 정보는 필수입니다.' }, 400);
  }

  try {
    await env.DB.prepare(
      'INSERT INTO advertisements (user_id, title, status, budget, duration) VALUES (?, ?, "pending", ?, ?)'
    )
      .bind(authUser.id, title, budget, duration)
      .run();

    return createResponse({ success: true, message: '광고 신청이 정상적으로 완료되었습니다. 관리자 승인 후 집행됩니다.' });
  } catch (err) {
    return createResponse({ error: `광고 신청 실패: ${err.message}` }, 500);
  }
}
