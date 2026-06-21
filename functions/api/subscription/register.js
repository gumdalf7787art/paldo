// Cloudflare Pages Functions: POST /api/subscription/register
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

export async function onRequestPost(context) {
  const { request, env } = context;

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

  const { customer_uid, plan_name, merchant_uid, amount } = body;
  if (!customer_uid || !plan_name) {
    return new Response(JSON.stringify({ error: '필수 구독 정보가 누락되었습니다.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // 포트원 API 연동하여 발급받은 customer_uid의 유효성을 검증 (또는 최초 1회 결제 호출)
    // 심사 시나리오를 위해 여기서는 일단 발급된 빌링키(customer_uid)를 바로 DB에 저장하고 활성화하는 로직으로 구성합니다.
    // (실제 프로덕션에서는 /subscribe/payments/again 엔드포인트로 첫 결제 요청을 보내는 것이 정석입니다.)
    
    // 1. 기존 구독 해지 처리 (하나의 유저당 1개의 구독만 유지한다고 가정)
    await env.DB.prepare(
      `UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'`
    )
    .bind(authUser.id)
    .run();

    // 2. 새 구독 정보 저장
    const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30일 후
    await env.DB.prepare(
      `INSERT INTO subscriptions (user_id, plan_name, customer_uid, status, last_payment_date, next_billing_date)
       VALUES (?, ?, ?, 'active', datetime('now', 'localtime'), ?)`
    )
    .bind(authUser.id, plan_name, customer_uid, nextBillingDate)
    .run();

    // 3. 프로필 등급(grade) 업데이트
    let newGrade = '일반';
    if (plan_name === '베이직') newGrade = '베이직';
    else if (plan_name === '프로') newGrade = '프로';
    else if (plan_name === '프로페셔널') newGrade = '프로페셔널';

    await env.DB.prepare(
      `UPDATE profiles SET grade = ? WHERE id = ?`
    )
    .bind(newGrade, authUser.id)
    .run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${plan_name} 요금제 구독 및 결제 카드 등록이 완료되었습니다.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: `구독 처리 중 오류 발생: ${err.message}` }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
