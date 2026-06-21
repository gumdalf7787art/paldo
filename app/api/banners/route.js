export const dynamic = 'force-dynamic';
import { getCloudflareContext } from '@opennextjs/cloudflare';

function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}

export async function GET(request) {
  try {
    let env;
    try {
      const context = getCloudflareContext();
      env = context ? context.env : null;
    } catch (e) {
      env = null;
    }

    if (!env || !env.DB) {
      return createResponse({ error: 'Cloudflare D1 Database binding is missing or getCloudflareContext failed.' }, 500);
    }

  try {
    const { results } = await env.DB.prepare(`
      SELECT id, slot_key, image_url, link_url
      FROM system_banners
      ORDER BY created_at ASC
    `).all();

    // Group by slot_key
    const grouped = {
      main_sidebar: [],
      main_bottom_a: [],
      main_bottom_b: [],
      breed_sidebar: []
    };

    if (results) {
      for (const banner of results) {
        if (grouped[banner.slot_key]) {
          grouped[banner.slot_key].push(banner);
        }
      }
    }

    return createResponse(grouped);
  } catch (err) {
    return createResponse({ error: `배너 조회 실패: ${err.message}` }, 500);
  }
  } catch (outerErr) {
    return createResponse({ error: `상위 배너 GET 핸들러 예외: ${outerErr.message}` }, 500);
  }
}
