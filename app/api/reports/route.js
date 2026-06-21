export const dynamic = 'force-dynamic';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: POST /api/reports

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
export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// POST 요청 처리 (신고 등록)
export async function POST(request) {
  const env = getRequestContext().env;

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

  const { target_id, type, reason } = body;
  if (!target_id || !type) {
    return createResponse({ error: '신고 대상 매물 ID와 신고 사유 유형은 필수입니다.' }, 400);
  }

  try {
    // 신고 접수
    await env.DB.prepare(
      'INSERT INTO reports (user_id, target_id, type, reason) VALUES (?, ?, ?, ?)'
    )
      .bind(authUser.id, target_id, type, reason || '')
      .run();

    return createResponse({ success: true, message: '신고가 정상적으로 접수되었습니다. 운영진이 검토할 예정입니다.' });
  } catch (err) {
    return createResponse({ error: `신고 접수 실패: ${err.message}` }, 500);
  }
}
