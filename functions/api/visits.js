// Cloudflare Pages Functions: POST /api/visits
export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS 프리플라이트 처리
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  try {
    // 자동 테이블 생성 (없을 경우)
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS site_visits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const { session_id } = await request.json();
    
    if (session_id) {
      await env.DB.prepare('INSERT INTO site_visits (session_id) VALUES (?)').bind(session_id).run();
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
