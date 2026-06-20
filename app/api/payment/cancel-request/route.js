import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: POST /api/payment/cancel-request
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

  try {
    const { payment_id } = await request.json();
    if (!payment_id) {
      return new Response(JSON.stringify({ error: '결제 ID가 필요합니다.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // 결제 소유자 확인
    const payment = await env.DB.prepare(
      `SELECT * FROM payments WHERE id = ? AND user_id = ?`
    ).bind(payment_id, authUser.id).first();

    if (!payment) {
      return new Response(JSON.stringify({ error: '결제 내역을 찾을 수 없거나 권한이 없습니다.' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    if (payment.status !== 'paid') {
      return new Response(JSON.stringify({ error: '결제 완료 상태인 항목만 취소를 요청할 수 있습니다.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // 상태 업데이트 (취소 요청됨)
    await env.DB.prepare(
      `UPDATE payments SET status = 'cancel_requested' WHERE id = ?`
    ).bind(payment_id).run();

    return new Response(JSON.stringify({ success: true, message: '취소 요청이 접수되었습니다.' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
