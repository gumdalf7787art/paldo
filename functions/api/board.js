// Cloudflare Pages Functions: GET/POST /api/board

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

// R2 이미지 업로드 헬퍼
async function uploadImagesToR2(images_base64, userId, env) {
  if (!images_base64 || images_base64.length === 0) return '[]';
  const urls = [];
  for (let i = 0; i < images_base64.length; i++) {
    const base64Str = images_base64[i];
    
    // 이미 R2 주소(URL) 형태라면 그대로 추가
    if (!base64Str.startsWith('data:')) {
      urls.push(base64Str);
      continue;
    }

    if (!env.R2) {
      console.warn('R2 bucket binding is not available. Skipping image upload.');
      continue;
    }

    try {
      const parts = base64Str.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const binary = atob(parts[1]);
      const bytes = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) {
        bytes[j] = binary.charCodeAt(j);
      }
      const arrayBuffer = bytes.buffer;
      const fileExt = contentType.split('/')[1] || 'jpg';
      const randomId = Math.random().toString(36).substring(2, 8);
      const key = `board/${userId}_${Date.now()}_${randomId}_${i}.${fileExt}`;

      await env.R2.put(key, arrayBuffer, {
        httpMetadata: { contentType }
      });
      urls.push(`/api/images?key=${encodeURIComponent(key)}`);
    } catch (e) {
      console.error('Image upload failed:', e);
    }
  }
  return JSON.stringify(urls);
}

// GET 요청 처리 (게시글 리스트 및 상세 조회)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  // 1. 게시글 목록 조회
  if (action === 'list') {
    const category = url.searchParams.get('category') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    try {
      let query = `
        SELECT p.id, p.user_id, p.category, p.title, p.images, p.views, p.created_at, u.nickname, u.profile_image, u.role
        FROM board_posts p
        LEFT JOIN profiles u ON p.user_id = u.id
        WHERE 1=1
      `;
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM board_posts p 
        LEFT JOIN profiles u ON p.user_id = u.id 
        WHERE 1=1
      `;
      const params = [];
      const countParams = [];

      if (category !== 'all') {
        query += ` AND p.category = ?`;
        countQuery += ` AND p.category = ?`;
        params.push(category);
        countParams.push(category);
      }

      if (search) {
        query += ` AND (p.title LIKE ? OR p.content LIKE ?)`;
        countQuery += ` AND (p.title LIKE ? OR p.content LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
        countParams.push(searchPattern, searchPattern);
      }

      // 공지사항(notice) 카테고리가 항상 상단에 먼저 나오도록 1차 정렬 후 최신 작성순 정렬
      query += ` ORDER BY CASE WHEN p.category = 'notice' THEN 0 ELSE 1 END, p.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const totalResult = await env.DB.prepare(countQuery).bind(...countParams).first();
      const list = await env.DB.prepare(query).bind(...params).all();

      return createResponse({
        posts: list.results || [],
        total: totalResult ? totalResult.total : 0,
        page,
        limit
      });
    } catch (err) {
      return createResponse({ error: `게시글 목록 조회 실패: ${err.message}` }, 500);
    }
  }

  // 2. 게시글 상세 조회
  if (action === 'detail') {
    const id = url.searchParams.get('id');
    if (!id) {
      return createResponse({ error: '게시글 ID가 누락되었습니다.' }, 400);
    }

    try {
      // 조회수 증가
      await env.DB.prepare('UPDATE board_posts SET views = views + 1 WHERE id = ?').bind(id).run();

      // 본글 정보 및 작성자 정보
      const post = await env.DB.prepare(`
        SELECT p.id, p.user_id, p.category, p.title, p.content, p.images, p.views, p.created_at, p.updated_at, u.nickname, u.profile_image, u.role
        FROM board_posts p
        LEFT JOIN profiles u ON p.user_id = u.id
        WHERE p.id = ?
      `).bind(id).first();

      if (!post) {
        return createResponse({ error: '존재하지 않는 게시글입니다.' }, 404);
      }

      // 댓글 리스트
      const comments = await env.DB.prepare(`
        SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.nickname, u.profile_image, u.role
        FROM board_comments c
        LEFT JOIN profiles u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `).bind(id).all();

      return createResponse({
        post,
        comments: comments.results || []
      });
    } catch (err) {
      return createResponse({ error: `게시글 상세 조회 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 요청 액션입니다.' }, 400);
}

// POST 요청 처리 (게시글 생성, 수정, 삭제)
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

  // 1. 게시글 생성
  if (action === 'create') {
    const { category, title, content, images_base64 } = body;
    if (!category || !title || !content) {
      return createResponse({ error: '필수 정보(카테고리, 제목, 내용)가 누락되었습니다.' }, 400);
    }

    // 권한 검증
    if (category === 'notice' && authUser.role !== 'admin') {
      return createResponse({ error: '공지사항은 관리자만 작성할 수 있습니다.' }, 403);
    }
    if (category === 'store_story' && authUser.role !== 'seller' && authUser.role !== 'admin') {
      return createResponse({ error: '매장 소식은 사업자(파트너스) 회원만 작성할 수 있습니다.' }, 403);
    }

    try {
      const imagesJson = await uploadImagesToR2(images_base64, authUser.id, env);

      const result = await env.DB.prepare(`
        INSERT INTO board_posts (user_id, category, title, content, images)
        VALUES (?, ?, ?, ?, ?)
      `).bind(authUser.id, category, title, content, imagesJson).run();

      return createResponse({ success: true, message: '게시글이 성공적으로 등록되었습니다.', id: result.meta?.last_row_id });
    } catch (err) {
      return createResponse({ error: `게시글 등록 실패: ${err.message}` }, 500);
    }
  }

  // 2. 게시글 수정
  if (action === 'update') {
    const { id, category, title, content, images_base64 } = body;
    if (!id || !category || !title || !content) {
      return createResponse({ error: '필수 정보가 누락되었습니다.' }, 400);
    }

    try {
      // 기존 글 확인
      const post = await env.DB.prepare('SELECT user_id FROM board_posts WHERE id = ?').bind(id).first();
      if (!post) {
        return createResponse({ error: '존재하지 않는 게시글입니다.' }, 404);
      }

      // 본인 작성자 여부 혹은 관리자 여부 검사
      if (post.user_id !== authUser.id && authUser.role !== 'admin') {
        return createResponse({ error: '수정 권한이 없습니다.' }, 403);
      }

      // 카테고리별 수정 권한 다시 한번 검사
      if (category === 'notice' && authUser.role !== 'admin') {
        return createResponse({ error: '공지사항은 관리자만 적용 가능합니다.' }, 403);
      }
      if (category === 'store_story' && authUser.role !== 'seller' && authUser.role !== 'admin') {
        return createResponse({ error: '매장 스토리는 사업자 회원만 작성 가능합니다.' }, 403);
      }

      const imagesJson = await uploadImagesToR2(images_base64, authUser.id, env);

      await env.DB.prepare(`
        UPDATE board_posts
        SET category = ?, title = ?, content = ?, images = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(category, title, content, imagesJson, id).run();

      return createResponse({ success: true, message: '게시글이 수정되었습니다.' });
    } catch (err) {
      return createResponse({ error: `게시글 수정 실패: ${err.message}` }, 500);
    }
  }

  // 3. 게시글 삭제
  if (action === 'delete') {
    const { id } = body;
    if (!id) {
      return createResponse({ error: '게시글 ID가 누락되었습니다.' }, 400);
    }

    try {
      // 기존 글 확인
      const post = await env.DB.prepare('SELECT user_id FROM board_posts WHERE id = ?').bind(id).first();
      if (!post) {
        return createResponse({ error: '존재하지 않는 게시글입니다.' }, 404);
      }

      // 본인 작성자 혹은 관리자 확인
      if (post.user_id !== authUser.id && authUser.role !== 'admin') {
        return createResponse({ error: '삭제 권한이 없습니다.' }, 403);
      }

      await env.DB.prepare('DELETE FROM board_posts WHERE id = ?').bind(id).run();

      return createResponse({ success: true, message: '게시글이 안전하게 삭제되었습니다.' });
    } catch (err) {
      return createResponse({ error: `게시글 삭제 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 요청 액션입니다.' }, 400);
}
