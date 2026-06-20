export const runtime = 'edge';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: GET/POST /api/notifications

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

// GET 요청 처리 (알림 조회)
export async function GET(request) {
  const env = getRequestContext().env;
  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return createResponse({ error: '로그인이 필요한 작업입니다.' }, 401);
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT id, user_id, type, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC'
    )
      .bind(authUser.id)
      .all();

    return createResponse(results);
  } catch (err) {
    return createResponse({ error: `알림 조회 실패: ${err.message}` }, 500);
  }
}

// POST 요청 처리 (전체 읽음 또는 신규 생성)
export async function POST(request) {
  const env = getRequestContext().env;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

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

  // 1. 전체 알림 읽음 처리 (read_all)
  if (action === 'read_all') {
    try {
      await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
        .bind(authUser.id)
        .run();

      return createResponse({ success: true, message: '모든 알림을 읽음 처리했습니다.' });
    } catch (err) {
      return createResponse({ error: `알림 읽음 처리 실패: ${err.message}` }, 500);
    }
  }

  // 단일 알림 읽음 처리 (read)
  if (action === 'read') {
    const { id } = body;
    if (!id) return createResponse({ error: '알림 ID가 필요합니다.' }, 400);
    try {
      await env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
        .bind(id, authUser.id)
        .run();
      return createResponse({ success: true });
    } catch (err) {
      return createResponse({ error: `단일 알림 읽음 처리 실패: ${err.message}` }, 500);
    }
  }

  // 2. 신규 알림 생성 (주로 시스템이 트리거하며, 로그인 인증 없이도 등록 가능해야 하는 경우도 있음)
  const { user_id, type, message } = body;
  if (!user_id || !message) {
    return createResponse({ error: '대상 유저 ID와 알림 메시지는 필수입니다.' }, 400);
  }

  try {
    await env.DB.prepare('INSERT INTO notifications (user_id, type, message, is_read) VALUES (?, ?, ?, 0)')
      .bind(user_id, type || 'system', message)
      .run();

    return createResponse({ success: true, message: '알림이 성공적으로 등록되었습니다.' });
  } catch (err) {
    return createResponse({ error: `알림 등록 실패: ${err.message}` }, 500);
  }
}
