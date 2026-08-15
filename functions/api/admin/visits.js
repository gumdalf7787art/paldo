// Cloudflare Pages Functions: GET /api/admin/visits
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

export async function onRequestGet(context) {
  const { request, env } = context;

  // 관리자 권한 확인 (선택 사항이지만 안전을 위해 추가)
  const authHeader = request.headers.get('Authorization');
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (payload && payload.role === 'admin') isAdmin = true;
  }
  // 로컬 테스트용이거나 토큰 없이도 일단 허용하려면 아래 블록 주석 처리
  /*
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  */

  const url = new URL(request.url);
  const period = url.searchParams.get('period') || 'daily'; // 'daily', 'weekly', 'monthly'

  try {
    // 자동 테이블 생성 보장 (조회 시에도 테이블 없으면 에러나지 않도록)
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS site_visits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    let query = '';
    
    // SQLite timezone offset (+9 hours for KST)
    if (period === 'daily') {
      // 최근 14일간 일별 고유 세션 수
      query = `
        SELECT date(created_at, '+9 hours') as label, COUNT(DISTINCT session_id) as count
        FROM site_visits
        WHERE created_at >= date('now', '-14 days')
        GROUP BY label
        ORDER BY label ASC
      `;
    } else if (period === 'weekly') {
      // 주간 고유 세션 수
      query = `
        SELECT strftime('%Y-%W', created_at, '+9 hours') as label, COUNT(DISTINCT session_id) as count
        FROM site_visits
        WHERE created_at >= date('now', '-90 days')
        GROUP BY label
        ORDER BY label ASC
      `;
    } else if (period === 'monthly') {
      // 최근 12개월 월별 고유 세션 수
      query = `
        SELECT strftime('%Y-%m', created_at, '+9 hours') as label, COUNT(DISTINCT session_id) as count
        FROM site_visits
        WHERE created_at >= date('now', '-365 days')
        GROUP BY label
        ORDER BY label ASC
      `;
    }

    const { results } = await env.DB.prepare(query).all();

    const todayQuery = `
      SELECT COUNT(DISTINCT session_id) as count
      FROM site_visits
      WHERE date(created_at, '+9 hours') = date('now', '+9 hours')
    `;
    const todayResult = await env.DB.prepare(todayQuery).first();
    const todayCount = todayResult ? todayResult.count : 0;

    let referrers = [];
    let keywords = [];
    try {
      const exactLabel = url.searchParams.get('exact_label');
      let condition = '';
      let bindings = [];
      
      if (exactLabel) {
        if (period === 'daily') condition = "date(created_at, '+9 hours') = ?";
        else if (period === 'weekly') condition = "strftime('%Y-%W', created_at, '+9 hours') = ?";
        else if (period === 'monthly') condition = "strftime('%Y-%m', created_at, '+9 hours') = ?";
        bindings.push(exactLabel);
      } else {
        if (period === 'daily') condition = "created_at >= date('now', '-14 days')";
        else if (period === 'weekly') condition = "created_at >= date('now', '-90 days')";
        else if (period === 'monthly') condition = "created_at >= date('now', '-365 days')";
      }

      const refQuery = `
        SELECT referrer, COUNT(DISTINCT session_id) as count
        FROM site_visits
        WHERE ${condition} AND referrer IS NOT NULL AND referrer != ''
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 20
      `;
      const stmtRef = env.DB.prepare(refQuery);
      const { results: refResults } = await (bindings.length > 0 ? stmtRef.bind(...bindings).all() : stmtRef.all());
      referrers = refResults;

      const kwQuery = `
        SELECT keyword, COUNT(DISTINCT session_id) as count
        FROM site_visits
        WHERE ${condition} AND keyword IS NOT NULL AND keyword != ''
        GROUP BY keyword
        ORDER BY count DESC
        LIMIT 20
      `;
      const stmtKw = env.DB.prepare(kwQuery);
      const { results: kwResults } = await (bindings.length > 0 ? stmtKw.bind(...bindings).all() : stmtKw.all());
      keywords = kwResults;
    } catch (e) {
      // Columns might not exist yet
    }

    return new Response(JSON.stringify({ success: true, data: results, todayCount, referrers, keywords }), { 
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
