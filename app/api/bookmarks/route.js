export const dynamic = 'force-dynamic';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Cloudflare Pages Functions: GET/POST /api/bookmarks

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

// GET 요청 처리 (북마크 목록 조회 및 특정 매물 북마크 여부 확인)
export async function GET(request) {
  const env = getCloudflareContext().env;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return createResponse({ error: '로그인이 필요한 작업입니다.' }, 401);
  }

  // 1. 특정 매물 찜 여부 체크
  if (action === 'check') {
    const dogId = url.searchParams.get('dog_id');
    if (!dogId) {
      return createResponse({ error: '매물 ID(dog_id)는 필수입니다.' }, 400);
    }

    try {
      const row = await env.DB.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND dog_id = ?')
        .bind(authUser.id, dogId)
        .first();

      return createResponse({ bookmarked: !!row });
    } catch (err) {
      return createResponse({ bookmarked: false, error: err.message }, 500);
    }
  }

  // 2. 내 북마크 매물 목록 전체 조회 (기본값)
  try {
    const { results } = await env.DB.prepare(
      'SELECT d.* FROM bookmarks b JOIN dogs d ON b.dog_id = d.id WHERE b.user_id = ? ORDER BY b.created_at DESC'
    )
      .bind(authUser.id)
      .all();

    // 이미지 배열 변환
    const cleanResults = results.map(dog => {
      let images = [];
      if (dog.images) {
        try {
          images = JSON.parse(dog.images);
        } catch (e) {
          images = dog.images.split(',').filter(Boolean);
        }
      }
      return { ...dog, images };
    });

    return createResponse(cleanResults);
  } catch (err) {
    return createResponse({ error: `북마크 조회 실패: ${err.message}` }, 500);
  }
}

// POST 요청 처리 (북마크 토글)
export async function POST(request) {
  const env = getCloudflareContext().env;
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

  // 찜하기 토글 (toggle)
  if (action === 'toggle') {
    const { dog_id } = body;
    if (!dog_id) {
      return createResponse({ error: '매물 ID(dog_id)는 필수입니다.' }, 400);
    }

    try {
      // 이미 찜했는지 체크
      const row = await env.DB.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND dog_id = ?')
        .bind(authUser.id, dog_id)
        .first();

      if (row) {
        // 존재한다면 삭제
        await env.DB.prepare('DELETE FROM bookmarks WHERE user_id = ? AND dog_id = ?')
          .bind(authUser.id, dog_id)
          .run();
        return createResponse({ bookmarked: false, message: '북마크가 해제되었습니다.' });
      } else {
        // 없다면 추가
        await env.DB.prepare('INSERT INTO bookmarks (user_id, dog_id) VALUES (?, ?)')
          .bind(authUser.id, dog_id)
          .run();
        return createResponse({ bookmarked: true, message: '북마크에 등록되었습니다.' });
      }
    } catch (err) {
      return createResponse({ error: `북마크 변경 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 요청 액션입니다.' }, 400);
}
