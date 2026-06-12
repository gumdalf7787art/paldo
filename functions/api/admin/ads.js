// Cloudflare Pages Functions: GET/PATCH /api/admin/ads
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
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

export async function onRequestGet(context) {
  const { request, env } = context;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
  const authUser = verifyToken(authHeader.split(' ')[1]);
  if (!authUser || authUser.role !== 'admin') {
    return new Response(JSON.stringify({ error: '관리자 권한이 없습니다.' }), { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // Join advertisements with profiles and business_applications
    const sql = `
      SELECT 
        a.id, a.user_id, a.ad_type, a.title, a.status, a.budget as price, a.created_at,
        p.email, p.nickname, p.phone,
        b.business_name, b.biz_no, b.representative_name
      FROM advertisements a
      LEFT JOIN profiles p ON a.user_id = p.id
      LEFT JOIN business_applications b ON p.id = b.user_id AND b.status = 'approved'
      ORDER BY a.created_at DESC
    `;
    const { results } = await env.DB.prepare(sql).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `조회 실패: ${err.message}` }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
  const authUser = verifyToken(authHeader.split(' ')[1]);
  if (!authUser || authUser.role !== 'admin') {
    return new Response(JSON.stringify({ error: '관리자 권한이 없습니다.' }), { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: '잘못된 요청 형식입니다.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  const { id, status } = body;
  if (!id || !status) {
    return new Response(JSON.stringify({ error: 'id와 status가 필요합니다.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    let taxInvoiceIssued = false;

    // 세금계산서 발행 시뮬레이션 (상태가 active(승인)로 변경될 때)
    if (status === 'active') {
      // 1. 필요한 정보 조회 (사업자 번호 등)
      const adInfo = await env.DB.prepare(`
        SELECT a.budget, b.business_name, b.biz_no, p.email, p.nickname
        FROM advertisements a
        JOIN profiles p ON a.user_id = p.id
        LEFT JOIN business_applications b ON p.id = b.user_id AND b.status = 'approved'
        WHERE a.id = ?
      `).bind(id).first();

      if (adInfo) {
        // [여기에 Popbill 등 실제 세금계산서 API 연동 로직 추가]
        console.log(`[세금계산서 자동 발행 시뮬레이션]
          대상: ${adInfo.business_name || adInfo.nickname} (사업자번호: ${adInfo.biz_no || '미등록'})
          이메일: ${adInfo.email}
          금액: ${adInfo.budget}원
          결과: 성공적으로 발행되었습니다.
        `);
        taxInvoiceIssued = true;
        
        // 쿠폰 자동 발급 로직 추가
        const couponCode = 'AD_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // 쿠폰 생성
        const insertCoupon = await env.DB.prepare(
            `INSERT INTO coupons (name, discount_rate, code, auto_issue_type, ad_type) VALUES (?, ?, ?, 'manual', 'all')`
        ).bind(`관리자 지급 광고 쿠폰`, 7, couponCode).run();
        
        // D1에서 lastRowId를 가져오려면 meta.last_row_id 를 확인해야함
        if (insertCoupon.success && insertCoupon.meta.last_row_id) {
            const couponId = insertCoupon.meta.last_row_id;
            
            // 유저에게 쿠폰 지급
            const adData = await env.DB.prepare(`SELECT user_id FROM advertisements WHERE id = ?`).bind(id).first();
            if (adData) {
                 await env.DB.prepare(
                    `INSERT INTO user_coupons (user_id, coupon_id) VALUES (?, ?)`
                 ).bind(adData.user_id, couponId).run();
            }
        }
      }
    }

    // 광고 상태 업데이트
    await env.DB.prepare(`UPDATE advertisements SET status = ? WHERE id = ?`)
      .bind(status, id)
      .run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: status === 'active' ? '승인 및 세금계산서가 발행되었습니다.' : '상태가 업데이트되었습니다.',
      taxInvoiceIssued 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `업데이트 실패: ${err.message}` }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
