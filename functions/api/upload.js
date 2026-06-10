// Cloudflare Pages Functions: POST /api/upload

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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

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

export async function onRequestPost(context) {
  const { request, env } = context;
  
  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return createResponse({ error: '로그인이 필요한 작업입니다.' }, 401);
  }

  if (!env.R2) {
    return createResponse({ error: 'R2 스토리지 바인딩이 설정되지 않았습니다.' }, 500);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return createResponse({ error: '업로드할 파일이 전송되지 않았습니다.' }, 400);
    }

    const isString = typeof file === 'string';
    const fileSize = isString ? file.length : (file.size || 0);

    // 파일 크기 검증 (예: 5MB)
    if (fileSize > 5 * 1024 * 1024) {
      return createResponse({ error: '파일 크기는 최대 5MB까지 가능합니다.' }, 400);
    }

    // 고유 키 생성
    const fileName = (!isString && file.name) ? file.name : 'file.jpg';
    const fileExt = fileName.split('.').pop() || 'jpg';
    const randomId = Math.random().toString(36).substring(2, 8);
    const key = `dogs/${authUser.id}_${Date.now()}_${randomId}.${fileExt}`;

    // 바이너리 데이터 및 Content-Type 추출
    let arrayBuffer;
    let contentType = 'image/jpeg';

    if (isString) {
      if (file.startsWith('data:')) {
        const parts = file.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const binary = atob(parts[1]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        contentType = 'text/plain';
        arrayBuffer = new TextEncoder().encode(file).buffer;
      }
    } else {
      contentType = file.type || 'image/jpeg';
      if (typeof file.arrayBuffer === 'function') {
        try {
          arrayBuffer = await file.arrayBuffer();
        } catch (e) {
          arrayBuffer = null;
        }
      }
      if (!arrayBuffer) {
        if (typeof file.stream === 'function') {
          try {
            const reader = file.stream().getReader();
            const chunks = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }
            const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
              result.set(chunk, offset);
              offset += chunk.length;
            }
            arrayBuffer = result.buffer;
          } catch (streamErr) {
            arrayBuffer = await new Response(file).arrayBuffer();
          }
        } else {
          arrayBuffer = await new Response(file).arrayBuffer();
        }
      }
    }

    // R2 업로드
    await env.R2.put(key, arrayBuffer, {
      httpMetadata: { contentType }
    });

    // 서빙용 상대경로 반환
    const publicUrl = `/api/images?key=${encodeURIComponent(key)}`;
    return createResponse({ success: true, url: publicUrl, key });
  } catch (err) {
    return createResponse({ error: `파일 업로드 중 오류가 발생했습니다: ${err.message}` }, 500);
  }
}
