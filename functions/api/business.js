// Cloudflare Pages Functions: GET/POST /api/business

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

// NTS 국세청 사업자등록 상태조회 API 호출
async function checkBusinessStatus(bizNo) {
  const apiKey = "2b12557f058a486cf715373f86fb47e4bea6970b9e512e9d47678f2a951da15d";
  const url = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        "b_no": [bizNo.replace(/-/g, '')]
      })
    });
    
    if (!response.ok) {
       return { apiError: true };
    }
    
    const result = await response.json();
    if (result && result.data && result.data.length > 0) {
      return result.data[0];
    }
    return { apiError: true };
  } catch (e) {
    console.error("NTS API Error:", e);
    return { apiError: true };
  }
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

// GET 요청 처리 (신청 내역 조회)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  // 사업자등록번호 중복 체크 (action = check_biz_no)
  if (action === 'check_biz_no') {
    const biz_no = url.searchParams.get('biz_no');
    if (!biz_no) return createResponse({ error: '사업자등록번호가 필요합니다.' }, 400);
    try {
      const duplicateBizNo = await env.DB.prepare(
        'SELECT id FROM business_applications WHERE biz_no = ? AND status IN ("pending", "approved")'
      )
        .bind(biz_no)
        .first();
      return createResponse({ is_duplicate: !!duplicateBizNo });
    } catch (err) {
      return createResponse({ error: `조회 실패: ${err.message}` }, 500);
    }
  }

  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return createResponse({ error: '로그인이 필요한 작업입니다.' }, 401);
  }

  // 최근 신청 1건 조회 (action = last_application)
  if (action === 'last_application') {
    try {
      const app = await env.DB.prepare(
        'SELECT id, user_id, business_name, representative_name, phone, address, biz_no, animal_sale_no, status, rejected_reason, file_url, created_at FROM business_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
      )
        .bind(authUser.id)
        .first();

      return createResponse(app || null);
    } catch (err) {
      return createResponse({ error: `신청 내역 조회 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 요청 액션입니다.' }, 400);
}

// POST 요청 처리 (신청서 제출)
export async function onRequestPost(context) {
  const { request, env } = context;
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

  // 사업자 자격 신청 (apply)
  if (action === 'apply') {
    const { business_name, representative_name, phone, address, biz_no, animal_sale_no, file_base64, file_name, animal_sale_file_base64, animal_sale_file_name } = body;
    if (!business_name || !address || !biz_no || !animal_sale_no) {
      return createResponse({ error: '모든 신청 항목(상호명, 주소, 등록번호 등)은 필수 입력 사항입니다.' }, 400);
    }
    if (!file_base64 || !animal_sale_file_base64) {
      return createResponse({ error: '사업자등록증과 동물판매업 등록증 파일은 필수 첨부 사항입니다.' }, 400);
    }

    try {
      // 중복 사업자등록번호 체크
      const duplicateBizNo = await env.DB.prepare(
        'SELECT id FROM business_applications WHERE biz_no = ? AND status IN ("pending", "approved")'
      )
        .bind(biz_no)
        .first();

      if (duplicateBizNo) {
        return createResponse({ error: '중복된 사업자등록번호입니다. 관리자에게 이메일로 문의하세요.' }, 400);
      }

      // 이미 승인되었거나 심사 중인 신청서가 있는지 체크 (기존 유저 체크)
      const existing = await env.DB.prepare(
        'SELECT status FROM business_applications WHERE user_id = ? AND status IN ("pending", "approved")'
      )
        .bind(authUser.id)
        .first();

      if (existing) {
        if (existing.status === 'approved') {
          return createResponse({ error: '이미 판매자 승인이 완료된 계정입니다.' }, 400);
        } else {
          return createResponse({ error: '이미 심사 중인 신청서가 있습니다. 잠시만 기다려 주세요.' }, 400);
        }
      }

      // --- 국세청 사업자 진위 확인 ---
      let newStatus = "pending";
      const ntsResult = await checkBusinessStatus(biz_no);
      if (!ntsResult.apiError) {
        if (ntsResult.b_stt_cd === "01") {
          newStatus = "approved"; // 정상 영업중 -> 자동 승인
        } else if (ntsResult.b_stt_cd === "02" || ntsResult.b_stt_cd === "03") {
          return createResponse({ error: `해당 사업자는 [${ntsResult.b_stt}] 상태입니다. 가입이 불가합니다.` }, 400);
        } else if (ntsResult.tax_type && ntsResult.tax_type.includes("등록되지 않은")) {
          return createResponse({ error: '국세청에 등록되지 않은 사업자등록번호입니다. 번호를 확인해 주세요.' }, 400);
        }
      }

      // R2 파일 업로드 처리
      let fileUrl = null;
      let animalSaleFileUrl = null;
      if (env.R2) {
        try {
          if (file_base64) {
            const parts = file_base64.split(',');
            const mimeMatch = parts[0].match(/:(.*?);/);
            const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const binary = atob(parts[1]);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const arrayBuffer = bytes.buffer;

            const fileExt = (file_name || 'file.jpg').split('.').pop() || 'jpg';
            const randomId = Math.random().toString(36).substring(2, 8);
            const key = `business/${authUser.id}_${Date.now()}_${randomId}.${fileExt}`;

            await env.R2.put(key, arrayBuffer, {
              httpMetadata: { contentType }
            });
            fileUrl = `/api/images?key=${encodeURIComponent(key)}`;
          }

          if (animal_sale_file_base64) {
            const parts = animal_sale_file_base64.split(',');
            const mimeMatch = parts[0].match(/:(.*?);/);
            const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const binary = atob(parts[1]);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const arrayBuffer = bytes.buffer;

            const fileExt = (animal_sale_file_name || 'file.jpg').split('.').pop() || 'jpg';
            const randomId = Math.random().toString(36).substring(2, 8);
            const key = `business/animal_${authUser.id}_${Date.now()}_${randomId}.${fileExt}`;

            await env.R2.put(key, arrayBuffer, {
              httpMetadata: { contentType }
            });
            animalSaleFileUrl = `/api/images?key=${encodeURIComponent(key)}`;
          }
        } catch (uploadErr) {
          console.error('Business file upload to R2 failed:', uploadErr);
          return createResponse({ error: `증빙 서류 업로드 실패: ${uploadErr.message}` }, 500);
        }
      }

      // 신청서 등록
      await env.DB.prepare(
        'INSERT INTO business_applications (user_id, business_name, representative_name, phone, address, biz_no, animal_sale_no, status, file_url, animal_sale_file_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(
          authUser.id,
          business_name,
          representative_name || '',
          phone || '',
          address || '',
          biz_no,
          animal_sale_no,
          newStatus,
          fileUrl,
          animalSaleFileUrl
        )
        .run();

      if (newStatus === "approved") {
        await env.DB.prepare('UPDATE profiles SET role = "seller" WHERE id = ?').bind(authUser.id).run();
        
        // 파트너 창립 멤버 특별 쿠폰 구성 (총 25장) 자동 발급
        const couponSpecs = [
          { name: '메인 히어로 광고 쿠폰', code: 'WELCOME_MAIN', ad_type: 'main', count: 4 },
          { name: '메인 추천 광고 쿠폰', code: 'WELCOME_REC', ad_type: 'recommend', count: 3 },
          { name: '메인 인기 광고 쿠폰', code: 'WELCOME_POP', ad_type: 'popular', count: 3 },
          { name: '메인 스페셜 광고 쿠폰', code: 'WELCOME_SPC', ad_type: 'special', count: 3 },
          { name: '견종별 히어로 광고 쿠폰', code: 'WELCOME_B_MAIN', ad_type: 'breed_main', count: 3 },
          { name: '견종별 추천 광고 쿠폰', code: 'WELCOME_B_REC', ad_type: 'breed_recommend', count: 3 },
          { name: '견종별 인기 광고 쿠폰', code: 'WELCOME_B_POP', ad_type: 'breed_popular', count: 3 },
          { name: '견종별 스페셜 광고 쿠폰', code: 'WELCOME_B_SPC', ad_type: 'breed_special', count: 3 }
        ];

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 6);
        const expiresAtStr = expiresAt.toISOString();

        for (const spec of couponSpecs) {
          let coupon = await env.DB.prepare('SELECT id FROM coupons WHERE code = ?').bind(spec.code).first();
          if (!coupon) {
            await env.DB.prepare('INSERT INTO coupons (name, discount_rate, code, auto_issue_type, ad_type) VALUES (?, 100, ?, "welcome", ?)')
              .bind(spec.name, spec.code, spec.ad_type)
              .run();
            coupon = await env.DB.prepare('SELECT id FROM coupons WHERE code = ?').bind(spec.code).first();
          }

          if (coupon && coupon.id) {
            for (let i = 0; i < spec.count; i++) {
              await env.DB.prepare('INSERT INTO user_coupons (user_id, coupon_id, expires_at, is_used) VALUES (?, ?, ?, 0)')
                .bind(authUser.id, coupon.id, expiresAtStr)
                .run();
            }
          }
        }
        
        // 알림 생성
        await env.DB.prepare(
          'INSERT INTO notifications (user_id, type, message) VALUES (?, "system", "🎉 축하합니다! 판매자 자격 신청이 승인되었고, 웰컴 광고 쿠폰이 지급되었습니다.")'
        )
          .bind(authUser.id)
          .run();
      }

      // 1. 파트너(사업자)에게 가입 완료 알림톡 발송 (카카오 알림톡)
      if (newStatus === "approved" && env.ALIGO_API_KEY && env.ALIGO_USER_ID && env.ALIGO_SENDER && phone) {
        try {
          const alimtalkMsg = `안녕하세요.\n팔도댕댕이 파트너스 회원가입이 완료되었습니다.\n\n국세청 정상 사업자로 확인되어 즉시 입점 승인 처리되었으니, 지금 바로 PC에서 팔도댕댕이에 접속하여 아이들의 분양 정보를 등록해 보세요!\n\n* 추후 관리자의 서류 확인 과정에서 보완이 필요할 경우 별도로 안내될 수 있습니다.`;
          
          const params = new URLSearchParams();
          params.append('apikey', env.ALIGO_API_KEY);
          params.append('userid', env.ALIGO_USER_ID);
          params.append('senderkey', env.ALIGO_SENDER_KEY || '82c0b59e854a5348f4cee724681b4c3a28b35845');
          params.append('tpl_code', 'UK_3258');
          params.append('sender', env.ALIGO_SENDER);
          params.append('receiver_1', phone.replace(/-/g, ''));
          params.append('subject_1', '팔도댕댕 파트너스 입점 안내');
          params.append('message_1', alimtalkMsg);

          await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
        } catch (e) {
          console.error("Alimtalk send error:", e);
        }
      }

      // 2. 관리자 알림 문자 발송 (Aligo SMS)
      if (env.ALIGO_API_KEY && env.ALIGO_USER_ID && env.ALIGO_SENDER && env.ADMIN_PHONE) {
        try {
          const smsMsg = newStatus === "approved"
            ? `[자동승인 완료]\n상호명: ${business_name}\n대표자: ${representative_name || ''}\n서류 사후검토 요망.`
            : `[팔도댕댕 입점신청]\n상호명: ${business_name}\n대표자: ${representative_name || ''}\n승인 처리 요망.`;
          
          const params = new URLSearchParams();
          params.append('key', env.ALIGO_API_KEY);
          params.append('userid', env.ALIGO_USER_ID);
          params.append('sender', env.ALIGO_SENDER);
          params.append('receiver', env.ADMIN_PHONE);
          params.append('msg', smsMsg);
          // params.append('testmode_yn', 'Y'); // 알리고 테스트 모드 적용 시 주석 해제

          await fetch('https://apis.aligo.in/send/', {
            method: 'POST',
            body: params,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            }
          });
        } catch (smsErr) {
          console.error('Aligo SMS 발송 실패:', smsErr);
          // 문자 발송 실패가 전체 신청 실패로 이어지지 않도록 예외 처리
        }
      }

      return createResponse({ success: true, status: newStatus, message: '판매자 자격 신청서가 접수되었습니다.' });
    } catch (err) {
      return createResponse({ error: `신청서 제출 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 요청 액션입니다.' }, 400);
}
