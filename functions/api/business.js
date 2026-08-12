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
        'INSERT INTO business_applications (user_id, business_name, representative_name, phone, address, biz_no, animal_sale_no, status, file_url, animal_sale_file_url) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?, ?)'
      )
        .bind(
          authUser.id,
          business_name,
          representative_name || '',
          phone || '',
          address || '',
          biz_no,
          animal_sale_no,
          fileUrl,
          animalSaleFileUrl
        )
        .run();

      return createResponse({ success: true, message: '판매자 자격 신청서가 성공적으로 접수되었습니다.' });
    } catch (err) {
      return createResponse({ error: `신청서 제출 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 요청 액션입니다.' }, 400);
}
