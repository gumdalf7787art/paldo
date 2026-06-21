import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: GET /api/payment/history
export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

export async function GET(request) {
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
    // 사용자의 결제 내역 가져오기
    const { results: payments } = await env.DB.prepare(`
      SELECT * FROM payments
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(authUser.id).all();

    if (!payments || payments.length === 0) {
      return new Response(JSON.stringify({ history: [] }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // 광고 ID 추출
    const adIds = [];
    payments.forEach(p => {
      const match = p.merchant_uid.match(/merchant_ad_(\d+)/);
      if (match) adIds.push(Number(match[1]));
    });

    const adMap = {};
    if (adIds.length > 0) {
      const placeholders = adIds.map(() => '?').join(',');
      const { results: ads } = await env.DB.prepare(`
        SELECT id, title FROM advertisements WHERE id IN (${placeholders})
      `).bind(...adIds).all();

      if (ads) {
        ads.forEach(ad => {
          adMap[ad.id] = ad.title;
        });
      }
    }

    // 이름 매핑
    const history = payments.map(p => {
      let itemName = p.merchant_uid; // 기본값
      const match = p.merchant_uid.match(/merchant_ad_(\d+)/);
      if (match) {
        const adId = Number(match[1]);
        if (adMap[adId]) itemName = adMap[adId];
      } else if (p.merchant_uid.includes('sub')) {
        itemName = '파트너스 구독 결제';
      }

      return {
        ...p,
        item_name: itemName
      };
    });

    return new Response(JSON.stringify({ history }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
