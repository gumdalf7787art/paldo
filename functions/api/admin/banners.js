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

function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const authUser = getAuthenticatedUser(request);

  if (!authUser || authUser.role !== 'admin') {
    return createResponse({ error: '관리자 권한이 필요합니다.' }, 403);
  }

  try {
    const body = await request.json();
    const { slot_key, image_url, link_url } = body;

    if (!slot_key || !image_url) {
      return createResponse({ error: '슬롯 키와 이미지 URL은 필수입니다.' }, 400);
    }

    // 슬롯 당 최대 3개까지만 허용 (방어 로직)
    const countQuery = await env.DB.prepare('SELECT count(*) as cnt FROM system_banners WHERE slot_key = ?').bind(slot_key).first();
    if (countQuery && countQuery.cnt >= 3) {
      return createResponse({ error: '해당 슬롯에는 이미 3개의 배너가 등록되어 있습니다.' }, 400);
    }

    const insert = await env.DB.prepare(
      'INSERT INTO system_banners (slot_key, image_url, link_url) VALUES (?, ?, ?)'
    ).bind(slot_key, image_url, link_url || null).run();

    if (insert.success) {
      return createResponse({ success: true, message: '배너가 성공적으로 등록되었습니다.' });
    } else {
      throw new Error('데이터베이스 오류');
    }
  } catch (err) {
    return createResponse({ error: `배너 등록 실패: ${err.message}` }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const authUser = getAuthenticatedUser(request);

  if (!authUser || authUser.role !== 'admin') {
    return createResponse({ error: '관리자 권한이 필요합니다.' }, 403);
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return createResponse({ error: '배너 ID가 필요합니다.' }, 400);
    }

    const result = await env.DB.prepare('DELETE FROM system_banners WHERE id = ?').bind(id).run();

    if (result.success) {
      return createResponse({ success: true, message: '배너가 성공적으로 삭제되었습니다.' });
    } else {
      throw new Error('데이터베이스 오류');
    }
  } catch (err) {
    return createResponse({ error: `배너 삭제 실패: ${err.message}` }, 500);
  }
}
