import { getRequestContext } from '@cloudflare/next-on-pages';

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
  const env = getRequestContext().env;

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
}
