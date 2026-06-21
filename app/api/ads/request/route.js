export const dynamic = 'force-dynamic';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: POST /api/ads/request
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

export async function POST(request) {
  const env = getRequestContext().env;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
  const token = authHeader.split(' ')[1];
  const authUser = verifyToken(token);
  if (!authUser) {
    return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다.' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const { ad_type, title, price, duration } = body;
  
  if (!ad_type || !title || !price) {
    return new Response(JSON.stringify({ error: '필수 정보가 누락되었습니다.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // Insert into advertisements table as 'pending' and return the created ID
    const { results } = await env.DB.prepare(
      `INSERT INTO advertisements (user_id, ad_type, title, status, budget, duration) VALUES (?, ?, ?, 'pending', ?, ?) RETURNING id`
    )
    .bind(authUser.id, ad_type, title, price, duration || 7)
    .all();

    const adId = results[0].id;

    return new Response(JSON.stringify({ success: true, adId, message: '광고 구매 신청이 임시 완료되었습니다. 결제를 진행해주세요.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `신청 실패: ${err.message}` }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
