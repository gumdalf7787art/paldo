// Cloudflare Pages Functions: GET/POST /api/admin

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

// 공통 토큰 파서 및 관리자 검증
function getAuthenticatedAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user || user.role !== 'admin') return null; // 관리자 권한 필수
  return user;
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

// GET 요청 처리 (통계 및 각종 데이터 목록 조회)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const adminUser = getAuthenticatedAdmin(request);
  if (!adminUser) {
    return createResponse({ error: '관리자 권한이 필요합니다.' }, 403);
  }

  // 1. 대시보드 통계 조회 (action = stats)
  if (action === 'stats') {
    try {
      const uCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM profiles').first('count');
      const dCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM dogs').first('count');
      const appCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM business_applications WHERE status = "pending"').first('count');
      const rCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM reports').first('count');

      return createResponse({
        userCount: uCount || 0,
        dogCount: dCount || 0,
        pendingApplications: appCount || 0,
        reportCount: rCount || 0
      });
    } catch (err) {
      return createResponse({ error: `통계 조회 실패: ${err.message}` }, 500);
    }
  }

  // 2. 전체 유저 목록 조회 (action = users)
  if (action === 'users') {
    try {
      const { results: users } = await env.DB.prepare(
        'SELECT id, email, nickname, phone, address, role, grade, completed_adoption_count, created_at FROM profiles ORDER BY created_at DESC'
      ).all();
      return createResponse(users);
    } catch (err) {
      return createResponse({ error: `유저 목록 조회 실패: ${err.message}` }, 500);
    }
  }

  // 3. 전체 매물 목록 조회 (action = dogs)
  if (action === 'dogs') {
    try {
      const { results: dogs } = await env.DB.prepare('SELECT * FROM dogs ORDER BY created_at DESC').all();
      return createResponse(dogs);
    } catch (err) {
      return createResponse({ error: `매물 목록 조회 실패: ${err.message}` }, 500);
    }
  }

  // 4. 전체 쿠폰 목록 조회 (action = coupons)
  if (action === 'coupons') {
    try {
      const { results: coupons } = await env.DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
      return createResponse(coupons);
    } catch (err) {
      return createResponse({ error: `쿠폰 조회 실패: ${err.message}` }, 500);
    }
  }

  // 5. 판매자 신청 내역 목록 조회 (action = applications)
  if (action === 'applications') {
    try {
      const { results: apps } = await env.DB.prepare(
        'SELECT a.*, p.nickname, p.email FROM business_applications a JOIN profiles p ON a.user_id = p.id ORDER BY a.created_at DESC'
      ).all();
      return createResponse(apps);
    } catch (err) {
      return createResponse({ error: `신청 내역 조회 실패: ${err.message}` }, 500);
    }
  }

  // 6. 신고 내역 목록 조회 (action = reports)
  if (action === 'reports') {
    try {
      const { results: reports } = await env.DB.prepare(
        'SELECT r.*, p.nickname AS reporter_nickname, d.nickname AS target_dog_name FROM reports r JOIN profiles p ON r.user_id = p.id JOIN dogs d ON r.target_id = d.id ORDER BY r.created_at DESC'
      ).all();
      return createResponse(reports);
    } catch (err) {
      return createResponse({ error: `신고 내역 조회 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 관리자 조회 액션입니다.' }, 400);
}

// POST 요청 처리 (승인/반려/쿠폰생성/등급수정 등)
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const adminUser = getAuthenticatedAdmin(request);
  if (!adminUser) {
    return createResponse({ error: '관리자 권한이 필요합니다.' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  // 1. 판매자 신청 승인 (approve_app)
  if (action === 'approve_app') {
    const { id, user_id } = body;
    if (!id || !user_id) {
      return createResponse({ error: '신청서 ID와 유저 ID는 필수입니다.' }, 400);
    }

    try {
      // D1 트랜잭션 대신 개별 순차 실행
      await env.DB.prepare('UPDATE business_applications SET status = "approved" WHERE id = ?').bind(id).run();
      await env.DB.prepare('UPDATE profiles SET role = "seller" WHERE id = ?').bind(user_id).run();
      
      // 알림 생성
      await env.DB.prepare(
        'INSERT INTO notifications (user_id, type, message) VALUES (?, "system", "축하합니다! 판매자 자격 신청이 최종 승인되었습니다. 이제 분양 매물을 등록하실 수 있습니다.")'
      )
        .bind(user_id)
        .run();

      return createResponse({ success: true, message: '판매자 자격 신청이 승인 처리되었습니다.' });
    } catch (err) {
      return createResponse({ error: `승인 처리 중 오류: ${err.message}` }, 500);
    }
  }

  // 2. 판매자 신청 반려 (reject_app)
  if (action === 'reject_app') {
    const { id, reason } = body;
    if (!id || !reason) {
      return createResponse({ error: '신청서 ID와 반려 사유는 필수입니다.' }, 400);
    }

    try {
      const app = await env.DB.prepare('SELECT user_id FROM business_applications WHERE id = ?').bind(id).first();
      if (!app) {
        return createResponse({ error: '해당 신청서를 찾을 수 없습니다.' }, 404);
      }

      await env.DB.prepare('UPDATE business_applications SET status = "rejected", rejected_reason = ? WHERE id = ?')
        .bind(reason, id)
        .run();

      // 알림 생성
      await env.DB.prepare(
        'INSERT INTO notifications (user_id, type, message) VALUES (?, "system", ?)'
      )
        .bind(app.user_id, `판매자 자격 신청이 반려되었습니다. (반려사유: ${reason})`)
        .run();

      return createResponse({ success: true, message: '판매자 자격 신청이 반려 처리되었습니다.' });
    } catch (err) {
      return createResponse({ error: `반려 처리 중 오류: ${err.message}` }, 500);
    }
  }

  // 3. 유저 등급 변경 (update_grade)
  if (action === 'update_grade') {
    const { user_id, grade } = body;
    if (!user_id || !grade) {
      return createResponse({ error: '유저 ID와 등급 명칭은 필수입니다.' }, 400);
    }

    try {
      await env.DB.prepare('UPDATE profiles SET grade = ? WHERE id = ?').bind(grade, user_id).run();
      return createResponse({ success: true, message: `사용자 등급이 ${grade}(으)로 성공적으로 조정되었습니다.` });
    } catch (err) {
      return createResponse({ error: `등급 조정 실패: ${err.message}` }, 500);
    }
  }

  // 4. 쿠폰 신규 생성 (create_coupon)
  if (action === 'create_coupon') {
    const { name, discount_rate, code } = body;
    if (!name || discount_rate === undefined || !code) {
      return createResponse({ error: '쿠폰 이름, 할인율, 코드는 필수입니다.' }, 400);
    }

    try {
      await env.DB.prepare('INSERT INTO coupons (name, discount_rate, code) VALUES (?, ?, ?)')
        .bind(name, discount_rate, code)
        .run();
      return createResponse({ success: true, message: '쿠폰이 성공적으로 생성되었습니다.' });
    } catch (err) {
      return createResponse({ error: `쿠폰 생성 실패: ${err.message}` }, 500);
    }
  }

  // 5. 전체 유저 대상 쿠폰 발급 (issue_all)
  if (action === 'issue_all') {
    const { coupon_id } = body;
    if (!coupon_id) {
      return createResponse({ error: '발행할 쿠폰 ID는 필수입니다.' }, 400);
    }

    try {
      // profiles 테이블의 모든 사용자에게 쿠폰 매핑 일괄 인서트
      await env.DB.prepare(
        'INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, ?, 0 FROM profiles'
      )
        .bind(coupon_id)
        .run();

      return createResponse({ success: true, message: '모든 사용자에게 쿠폰이 정상 발급되었습니다.' });
    } catch (err) {
      return createResponse({ error: `전체 쿠폰 발급 실패: ${err.message}` }, 500);
    }
  }

  // 6. 개별 유저 대상 쿠폰 발급 (issue_user)
  if (action === 'issue_user') {
    const { coupon_id, user_id } = body;
    if (!coupon_id || !user_id) {
      return createResponse({ error: '쿠폰 ID와 사용자 ID는 필수입니다.' }, 400);
    }

    try {
      await env.DB.prepare('INSERT INTO user_coupons (user_id, coupon_id, is_used) VALUES (?, ?, 0)')
        .bind(user_id, coupon_id)
        .run();

      return createResponse({ success: true, message: '대상 사용자에게 쿠폰이 정상 발급되었습니다.' });
    } catch (err) {
      return createResponse({ error: `개별 쿠폰 발급 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 관리자 요청 액션입니다.' }, 400);
}
