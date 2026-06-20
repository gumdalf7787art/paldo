import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: GET /api/images

function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function GET(request) {
  const env = getRequestContext().env;
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return createResponse({ error: '조회할 파일 Key가 누락되었습니다.' }, 400);
  }

  if (!env.R2) {
    return createResponse({ error: 'R2 스토리지 바인딩이 설정되지 않았습니다.' }, 500);
  }

  try {
    const object = await env.R2.get(key);
    if (!object) {
      return createResponse({ error: '해당 이미지를 찾을 수 없습니다.' }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=86400');

    // Content-Type 보강 처리
    if (!headers.has('content-type') || headers.get('content-type') === 'text/plain') {
      const ext = key.split('.').pop().toLowerCase();
      if (ext === 'png') headers.set('content-type', 'image/png');
      else if (ext === 'gif') headers.set('content-type', 'image/gif');
      else if (ext === 'webp') headers.set('content-type', 'image/webp');
      else headers.set('content-type', 'image/jpeg');
    }

    // 스트림을 직접 반환하여 메모리 낭비 없이 클라이언트에 파일 제공
    return new Response(object.body, {
      headers
    });
  } catch (err) {
    return createResponse({ error: `이미지 조회 중 오류 발생: ${err.message}` }, 500);
  }
}
