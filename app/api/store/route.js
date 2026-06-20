export const runtime = 'edge';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: GET/POST /api/store

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
  } catch {
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

// GET 요청 처리 (상점 프로필 및 리뷰 목록 조회)
export async function GET(request) {
  const env = getRequestContext().env;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const sellerId = url.searchParams.get('seller_id');

  if (!sellerId) {
    return createResponse({ error: '판매자 ID는 필수입니다.' }, 400);
  }

  // 1. 리뷰 목록 조회 (action = reviews)
  if (action === 'reviews') {
    try {
      // 해당 판매자의 리뷰들 조회
      const { results: reviews } = await env.DB.prepare(
        'SELECT r.id, r.seller_id, r.reviewer_id, r.rating, r.content, r.created_at, p.nickname, p.profile_image FROM store_reviews r LEFT JOIN profiles p ON r.reviewer_id = p.id WHERE r.seller_id = ? ORDER BY r.created_at DESC'
      )
        .bind(sellerId)
        .all();

      return createResponse(reviews);
    } catch (err) {
      return createResponse({ error: `리뷰 목록 조회 실패: ${err.message}` }, 500);
    }
  }

  // 2. 상점 프로필 상세 조회 (기본값)
  try {
    const profile = await env.DB.prepare('SELECT id, email, nickname, phone, address, profile_image, role, grade, completed_adoption_count, created_at, store_header_image, store_contact, kakao_channel, store_description, store_address, store_additional_images FROM profiles WHERE id = ?')
      .bind(sellerId)
      .first();

    if (!profile) {
      return createResponse({ error: '상점을 찾을 수 없습니다.' }, 404);
    }

    // JSON 문자열 파싱
    if (profile.store_additional_images) {
      try {
        profile.store_additional_images = JSON.parse(profile.store_additional_images);
      } catch {
        profile.store_additional_images = [];
      }
    } else {
      profile.store_additional_images = [];
    }

    // 사업자 신청 승인 이력 조회
    const biz = await env.DB.prepare('SELECT business_name, biz_no, animal_sale_no FROM business_applications WHERE user_id = ? AND status = "approved"')
      .bind(sellerId)
      .first();

    // 현재 분양중인 게시물 수 조회
    const activeCountResult = await env.DB.prepare('SELECT COUNT(*) as count FROM dogs WHERE seller_id = ? AND status = "available"')
      .bind(sellerId)
      .first();
    const active_count = activeCountResult ? activeCountResult.count : 0;

    // 해당 상점에 대한 리뷰들 조회
    const { results: reviews } = await env.DB.prepare(
      'SELECT r.id, r.seller_id, r.reviewer_id, r.rating, r.content, r.created_at, p.nickname, p.profile_image FROM store_reviews r LEFT JOIN profiles p ON r.reviewer_id = p.id WHERE r.seller_id = ? ORDER BY r.created_at DESC'
    )
      .bind(sellerId)
      .all();

    return createResponse({
      profile,
      biz: biz || null,
      business: biz || null,
      active_count,
      reviews: reviews || []
    });
  } catch (err) {
    return createResponse({ error: `상점 정보 조회 실패: ${err.message}` }, 500);
  }
}

// POST 요청 (리뷰 쓰기)
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
  } catch {
    body = {};
  }

  // 리뷰 작성
  if (action === 'create_review') {
    const { seller_id, rating, content } = body;
    if (!seller_id || rating === undefined) {
      return createResponse({ error: '판매자 ID와 평점은 필수 입력 사항입니다.' }, 400);
    }

    try {
      // 본인 스스로에게 리뷰를 다는 것 방지
      if (seller_id === authUser.id) {
        return createResponse({ error: '자신의 상점에는 리뷰를 작성할 수 없습니다.' }, 400);
      }

      await env.DB.prepare(
        'INSERT INTO store_reviews (seller_id, reviewer_id, rating, content) VALUES (?, ?, ?, ?)'
      )
        .bind(seller_id, authUser.id, rating, content || '')
        .run();

      return createResponse({ success: true, message: '리뷰가 정상적으로 등록되었습니다.' });
    } catch (err) {
      return createResponse({ error: `리뷰 등록 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 요청 액션입니다.' }, 400);
}
