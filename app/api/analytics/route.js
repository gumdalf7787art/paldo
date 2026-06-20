export const runtime = 'edge';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: POST /api/analytics

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

// POST 요청 처리 (행동로그 기록)
export async function POST(request) {
  const env = getRequestContext().env;

  const authUser = getAuthenticatedUser(request);
  const userId = authUser ? authUser.id : null; // 로그인하지 않은 사용자도 기록 허용

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const { dog_id, breed, action_type } = body;
  if (!dog_id || !breed) {
    return createResponse({ error: '매물 ID(dog_id)와 견종(breed)은 필수 정보입니다.' }, 400);
  }

  try {
    // 로그 인서트
    await env.DB.prepare(
      'INSERT INTO analytics_logs (user_id, dog_id, breed, action_type) VALUES (?, ?, ?, ?)'
    )
      .bind(userId, dog_id, breed, action_type || 'view')
      .run();

    return createResponse({ success: true, message: '행동로그가 정상적으로 기록되었습니다.' });
  } catch (err) {
    // 분석 로그의 실패가 핵심 비즈니스 흐름을 막지 않도록 로깅만 에러 없이 리턴
    return createResponse({ success: false, error: err.message }, 200);
  }
}
