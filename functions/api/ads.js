// Cloudflare Pages Functions: GET/POST /api/ads

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

// GET 요청 처리 (활성화된 광고 목록 조회 및 카운트 조회)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const action = url.searchParams.get('action');
  const status = url.searchParams.get('status') || 'active';
  const adType = url.searchParams.get('ad_type');
  const breed = url.searchParams.get('breed');
  const region = url.searchParams.get('region');

  // 1. 광고 수 카운트 조회 (예: 메인광고 슬롯 제한 체크용)
  if (action === 'count') {
    try {
      let countSql = 'SELECT COUNT(*) as count FROM advertisements WHERE status = ?';
      const countBindings = [status];
      if (adType) {
        countSql += ' AND ad_type = ?';
        countBindings.push(adType);
      }
      
      const row = await env.DB.prepare(countSql)
        .bind(...countBindings)
        .first();
      return createResponse({ count: row?.count || 0 });
    } catch (err) {
      return createResponse({ error: `광고 수 계산 실패: ${err.message}` }, 500);
    }
  }

  // 2. 광고 목록 조회 (기본값)
  try {
    let sql = `
      SELECT 
        a.id as ad_id, a.user_id as ad_user_id, a.title as ad_title, a.status as ad_status,
        a.ad_type, a.start_date, a.end_date, a.used_coupon_id,
        d.id, d.breed, d.nickname, d.price, d.original_price, d.birthday, 
        d.is_negotiable, d.video_url, d.region, d.gender, d.age, 
        d.vaccine, d.neutered, d.description, d.images, d.status, d.seller_id, d.created_at
      FROM advertisements a
      INNER JOIN dogs d ON a.dog_id = d.id
      WHERE a.status = ?
    `;
    const bindings = [status];

    if (adType) {
      sql += ' AND a.ad_type = ?';
      bindings.push(adType);
    }

    if (breed && breed !== '전체') {
      sql += ' AND d.breed = ?';
      bindings.push(breed);
    }

    if (region && region !== '전국') {
      sql += ' AND d.region = ?';
      bindings.push(region);
    }

    sql += ' ORDER BY a.created_at DESC';

    const { results } = await env.DB.prepare(sql)
      .bind(...bindings)
      .all();

    const cleanResults = results.map(row => {
      let images = [];
      if (row.images) {
        try {
          images = JSON.parse(row.images);
        } catch (e) {
          images = row.images.split(',').filter(Boolean);
        }
      }
      return {
        ...row,
        images,
        image_url: images[0] || '',
        additional_images: images.slice(1)
      };
    });

    return createResponse(cleanResults);
  } catch (err) {
    return createResponse({ error: `광고 목록 조회 실패: ${err.message}` }, 500);
  }
}

// POST 요청 처리 (광고 신청 등록 및 즉시 사용 처리)
export async function onRequestPost(context) {
  const { request, env } = context;

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

  const { dog_id, ad_type, title, duration, used_coupon_id } = body;
  if (!dog_id || !ad_type || !title || !duration) {
    return createResponse({ error: '필수 광고 설정 정보(dog_id, ad_type, title, duration)가 누락되었습니다.' }, 400);
  }

  try {
    // 1. 본인 소유의 사용 가능한 쿠폰 여부 확인
    if (used_coupon_id) {
      const userCoupon = await env.DB.prepare('SELECT id FROM user_coupons WHERE id = ? AND user_id = ? AND is_used = 0')
        .bind(used_coupon_id, authUser.id)
        .first();
      
      if (!userCoupon) {
        return createResponse({ error: '유효하지 않거나 이미 사용된 쿠폰입니다.' }, 400);
      }
    }

    // 2. 광고 날짜 계산
    const startDate = new Date().toISOString();
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + parseInt(duration));
    const endDate = endDateObj.toISOString();

    // 3. 광고 내역 저장 (D1 DML)
    await env.DB.prepare(
      `INSERT INTO advertisements (
        user_id, dog_id, ad_type, title, status, duration, start_date, end_date, used_coupon_id
      ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)`
    )
      .bind(authUser.id, dog_id, ad_type, title, parseInt(duration), startDate, endDate, used_coupon_id || null)
      .run();

    // 4. 쿠폰을 사용한 경우 사용 완료 처리
    if (used_coupon_id) {
      await env.DB.prepare('UPDATE user_coupons SET is_used = 1, used_at = ? WHERE id = ?')
        .bind(startDate, used_coupon_id)
        .run();
    }

    return createResponse({ 
      success: true, 
      message: '광고가 정상적으로 적용되었습니다.',
      endDate
    });
  } catch (err) {
    return createResponse({ error: `광고 설정 실패: ${err.message}` }, 500);
  }
}
