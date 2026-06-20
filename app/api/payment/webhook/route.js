export const runtime = 'edge';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: POST /api/payment/webhook
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

export async function POST(request) {
  const env = getRequestContext().env;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const { imp_uid, merchant_uid, status } = body;
  if (!imp_uid || !merchant_uid || !status) {
    return new Response('Invalid webhook payload', { status: 400 });
  }

  try {
    // 1. merchant_uid에서 ad_id 추출 (형식: merchant_ad_123_178...)
    const match = merchant_uid.match(/merchant_ad_(\d+)_/);
    if (!match) {
      return new Response('Ignored: Not our standard payment format', { status: 200 });
    }
    const adId = parseInt(match[1]);

    // 2. 포트원 API 연동하여 웹훅 정보 신뢰성 검증
    let access_token = '';
    let is_mock = false;

    if (!env.PORTONE_API_KEY || !env.PORTONE_API_SECRET) {
      is_mock = true; // API 키가 설정되지 않은 개발 환경
    } else {
      try {
        const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imp_key: env.PORTONE_API_KEY,
            imp_secret: env.PORTONE_API_SECRET
          })
        });
        const tokenData = await tokenRes.json();
        if (tokenData.code === 0) {
          access_token = tokenData.response.access_token;
        } else {
          is_mock = true;
        }
      } catch (err) {
        is_mock = true;
      }
    }

    let portone_amount = 0;
    let portone_status = status;
    let portone_pay_method = 'card';
    let buyer_id = '';

    if (is_mock) {
      // Mock 환경
      const paymentRecord = await env.DB.prepare(
        `SELECT amount, user_id FROM payments WHERE merchant_uid = ?`
      )
      .bind(merchant_uid)
      .first();

      portone_amount = paymentRecord ? paymentRecord.amount : 0;
      buyer_id = paymentRecord ? paymentRecord.user_id : 'system';
    } else {
      // 실제 포트원 조회
      const payRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
        headers: { 'Authorization': access_token }
      });
      const payData = await payRes.json();
      if (payData.code !== 0) {
        return new Response(`Validation Failed: ${payData.message}`, { status: 400 });
      }
      const payment = payData.response;
      portone_amount = payment.amount;
      portone_status = payment.status;
      portone_pay_method = payment.pay_method;
      
      // payments 테이블에 정보가 아직 없다면 advertisements에서 user_id를 조회
      const adRecord = await env.DB.prepare(
        `SELECT user_id FROM advertisements WHERE id = ?`
      )
      .bind(adId)
      .first();
      buyer_id = adRecord ? adRecord.user_id : 'unknown';
    }

    // 3. DB에 결제 상태 동기화 및 갱신
    await env.DB.prepare(
      `INSERT OR REPLACE INTO payments (user_id, imp_uid, merchant_uid, amount, pay_method, status)
       VALUES (
         COALESCE((SELECT user_id FROM payments WHERE merchant_uid = ?), ?),
         ?, ?, ?, ?, ?
       )`
    )
    .bind(merchant_uid, buyer_id, imp_uid, merchant_uid, portone_amount, portone_pay_method, portone_status)
    .run();

    // 4. 광고 활성화 처리
    const ad = await env.DB.prepare(
      `SELECT duration FROM advertisements WHERE id = ?`
    )
    .bind(adId)
    .first();

    if (portone_status === 'paid' && ad) {
      // 결제 완료: 광고 활성화 및 기간 산정
      await env.DB.prepare(
        `UPDATE advertisements 
         SET status = 'active', 
             start_date = datetime('now', 'localtime'), 
             end_date = datetime('now', '+' || ? || ' days', 'localtime') 
         WHERE id = ?`
      )
      .bind(ad.duration || 7, adId)
      .run();
    } else if (portone_status === 'cancelled') {
      // 결제 취소: 광고 상태 ended로 중지
      await env.DB.prepare(
        `UPDATE advertisements SET status = 'ended' WHERE id = ?`
      )
      .bind(adId)
      .run();
    }

    return new Response(JSON.stringify({ success: true, message: 'Webhook processed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
