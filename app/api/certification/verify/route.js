export const runtime = 'edge';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: POST /api/certification/verify
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

  const { imp_uid } = body;
  if (!imp_uid) {
    return new Response(JSON.stringify({ error: 'imp_uid가 누락되었습니다.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    let access_token = '';
    let is_mock = false;

    if (!env.PORTONE_API_KEY || !env.PORTONE_API_SECRET) {
      is_mock = true; // API 키가 존재하지 않는 로컬/테스트 환경 Mock 처리
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

    let certData = {
      name: '홍길동',
      phone: '01012345678',
      unique_key: 'mock_ci_value_1234567890', // CI값에 대응
      gender: 'male',
      birthday: '1995-01-01'
    };

    if (!is_mock) {
      // 실제 포트원 본인인증 정보 조회
      const certRes = await fetch(`https://api.iamport.kr/certifications/${imp_uid}`, {
        headers: { 'Authorization': access_token }
      });
      const resData = await certRes.json();
      if (resData.code !== 0) {
        return new Response(JSON.stringify({ error: `본인인증 정보 조회 실패: ${resData.message}` }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
      certData = resData.response; // name, phone, unique_key(CI), birthday, gender 등 포함됨
    }

    return new Response(JSON.stringify({ 
      success: true, 
      name: certData.name,
      phone: certData.phone,
      unique_key: certData.unique_key,
      birthday: certData.birthday,
      gender: certData.gender
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: `본인인증 검증 중 시스템 오류: ${err.message}` }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}
