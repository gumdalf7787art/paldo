// Cloudflare Pages Functions: GET/POST /api/comments

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
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// POST 요청 처리 (댓글 등록 및 삭제)
export async function onRequestPost(context) {
  const { request, env } = context;
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

  // 1. 댓글 등록
  if (action === 'create') {
    const { post_id, content } = body;
    if (!post_id || !content || !content.trim()) {
      return createResponse({ error: '댓글 내용을 입력해 주세요.' }, 400);
    }

    try {
      // 대상 게시글 존재 여부 확인
      const post = await env.DB.prepare('SELECT id FROM board_posts WHERE id = ?').bind(post_id).first();
      if (!post) {
        return createResponse({ error: '존재하지 않는 게시글입니다.' }, 404);
      }

      await env.DB.prepare(`
        INSERT INTO board_comments (post_id, user_id, content)
        VALUES (?, ?, ?)
      `).bind(post_id, authUser.id, content.trim()).run();

      return createResponse({ success: true, message: '댓글이 성공적으로 등록되었습니다.' });
    } catch (err) {
      return createResponse({ error: `댓글 작성 실패: ${err.message}` }, 500);
    }
  }

  // 2. 댓글 삭제
  if (action === 'delete') {
    const { id } = body;
    if (!id) {
      return createResponse({ error: '댓글 ID가 누락되었습니다.' }, 400);
    }

    try {
      // 기존 댓글 조회
      const comment = await env.DB.prepare('SELECT user_id FROM board_comments WHERE id = ?').bind(id).first();
      if (!comment) {
        return createResponse({ error: '존재하지 않는 댓글입니다.' }, 404);
      }

      // 본인 혹은 관리자 여부 확인
      if (comment.user_id !== authUser.id && authUser.role !== 'admin') {
        return createResponse({ error: '댓글 삭제 권한이 없습니다.' }, 403);
      }

      await env.DB.prepare('DELETE FROM board_comments WHERE id = ?').bind(id).run();

      return createResponse({ success: true, message: '댓글이 삭제되었습니다.' });
    } catch (err) {
      return createResponse({ error: `댓글 삭제 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 요청 액션입니다.' }, 400);
}
