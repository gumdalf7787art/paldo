export const dynamic = 'force-dynamic';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Cloudflare Pages Functions: GET/POST/DELETE /api/dogs

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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// OPTIONS 프리플라이트 처리
export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// GET 요청 처리 (목록 필터링 또는 상세 조회)
export async function GET(request) {
  try {
    let env;
    try {
      const context = getRequestContext();
      env = context ? context.env : null;
    } catch (e) {
      env = null;
    }

    if (!env || !env.DB) {
      return createResponse({ error: 'Cloudflare D1 Database binding is missing or getRequestContext failed.' }, 500);
    }

    const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // 1. 단일 매물 상세 조회
  if (id) {
    try {
      const dog = await env.DB.prepare(`
        SELECT d.*, p.nickname AS seller_nickname, b.business_name AS seller_business_name
        FROM dogs d
        LEFT JOIN profiles p ON d.seller_id = p.id
        LEFT JOIN business_applications b ON d.seller_id = b.user_id AND b.status = 'approved'
        WHERE d.id = ?
      `)
        .bind(id)
        .first();

      if (!dog) {
        return createResponse({ error: '매물을 찾을 수 없습니다.' }, 404);
      }

      // JSON 이미지 배열 파싱 복원 및 Supabase 규격 합성
      let images = [];
      if (dog.images) {
        try {
          images = JSON.parse(dog.images);
        } catch (e) {
          images = dog.images.split(',').filter(Boolean);
        }
      }
      
      const enrichedDog = {
        ...dog,
        images,
        image_url: images[0] || '',
        additional_images: images.slice(1)
      };

      return createResponse(enrichedDog);
    } catch (err) {
      return createResponse({ error: `매물 상세 조회 실패: ${err.message}` }, 500);
    }
  }

  // 2. 목록 필터링 조회
  const breed = url.searchParams.get('breed');
  const gender = url.searchParams.get('gender');
  const status = url.searchParams.get('status');
  const seller_id = url.searchParams.get('seller_id');
  const exclude_id = url.searchParams.get('exclude_id');
  const limit = url.searchParams.get('limit');

  try {
    let sql = `
      SELECT d.*, p.nickname AS seller_nickname, b.business_name AS seller_business_name
      FROM dogs d
      LEFT JOIN profiles p ON d.seller_id = p.id
      LEFT JOIN business_applications b ON d.seller_id = b.user_id AND b.status = 'approved'
      WHERE 1=1
    `;
    const bindings = [];

    if (breed) {
      sql += ' AND d.breed = ?';
      bindings.push(breed);
    }
    if (gender) {
      sql += ' AND d.gender = ?';
      bindings.push(gender);
    }
    if (status) {
      sql += ' AND d.status = ?';
      bindings.push(status);
    }
    if (seller_id) {
      sql += ' AND d.seller_id = ?';
      bindings.push(seller_id);
    }
    if (exclude_id) {
      sql += ' AND d.id != ?';
      bindings.push(exclude_id);
    }

    sql += ' ORDER BY d.created_at DESC';

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit)) {
        sql += ' LIMIT ?';
        bindings.push(parsedLimit);
      }
    }

    const { results } = await env.DB.prepare(sql)
      .bind(...bindings)
      .all();

    // 반환 데이터의 images 컬럼을 JSON 배열로 복원 및 image_url, additional_images 합성
    const cleanResults = results.map(dog => {
      let images = [];
      if (dog.images) {
        try {
          images = JSON.parse(dog.images);
        } catch (e) {
          images = dog.images.split(',').filter(Boolean);
        }
      }
      return { 
        ...dog, 
        images,
        image_url: images[0] || '',
        additional_images: images.slice(1)
      };
    });

    return createResponse(cleanResults);
  } catch (err) {
    return createResponse({ error: `매물 목록 조회 실패: ${err.message}` }, 500);
  }
  } catch (outerErr) {
    return createResponse({ error: `상위 GET 핸들러 예외: ${outerErr.message}` }, 500);
  }
}

// POST 요청 처리 (신규 등록 또는 수정)
export async function POST(request) {
  const env = getRequestContext().env;
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

  // 1. 매물 분양 상태 변경 (update_status)
  if (action === 'update_status') {
    const { id, status } = body;
    if (!id || !status) {
      return createResponse({ error: '매물 ID와 변경할 상태값은 필수입니다.' }, 400);
    }

    try {
      const dog = await env.DB.prepare('SELECT seller_id FROM dogs WHERE id = ?')
        .bind(id)
        .first();

      if (!dog) {
        return createResponse({ error: '존재하지 않는 매물입니다.' }, 404);
      }

      if (dog.seller_id !== authUser.id && authUser.role !== 'admin') {
        return createResponse({ error: '본인의 매물 상태만 수정할 수 있습니다.' }, 403);
      }

      await env.DB.prepare('UPDATE dogs SET status = ? WHERE id = ?')
        .bind(status, id)
        .run();

      return createResponse({ success: true, id, status });
    } catch (err) {
      return createResponse({ error: `상태 수정 실패: ${err.message}` }, 500);
    }
  }

  // 2. 매물 정보 수정 (update)
  if (action === 'update') {
    const { 
      id, breed, nickname, price, original_price, birthday, 
      is_negotiable, video_url, region, gender, age, vaccine, 
      neutered, description, images 
    } = body;

    if (!id || !breed || !nickname) {
      return createResponse({ error: '매물 ID, 견종, 강아지 이름은 필수 항목입니다.' }, 400);
    }

    try {
      const dog = await env.DB.prepare('SELECT seller_id FROM dogs WHERE id = ?')
        .bind(id)
        .first();

      if (!dog) {
        return createResponse({ error: '존재하지 않는 매물입니다.' }, 404);
      }

      if (dog.seller_id !== authUser.id && authUser.role !== 'admin') {
        return createResponse({ error: '수정 권한이 없습니다.' }, 403);
      }

      const imagesStr = Array.isArray(images) ? JSON.stringify(images) : '[]';

      await env.DB.prepare(
        `UPDATE dogs SET 
          breed = ?, 
          nickname = ?, 
          price = ?, 
          original_price = ?, 
          birthday = ?, 
          is_negotiable = ?, 
          video_url = ?, 
          region = ?, 
          gender = ?, 
          age = ?, 
          vaccine = ?, 
          neutered = ?, 
          description = ?, 
          images = ?
        WHERE id = ?`
      )
        .bind(
          breed,
          nickname,
          price !== undefined ? Number(price) : 0,
          original_price !== undefined && original_price !== null ? Number(original_price) : null,
          birthday || null,
          is_negotiable ? 1 : 0,
          video_url || null,
          region || '',
          gender || '남아',
          age || '',
          vaccine || '',
          neutered ? 1 : 0,
          description || '',
          imagesStr,
          id
        )
        .run();

      return createResponse({ success: true, id, nickname });
    } catch (err) {
      return createResponse({ error: `매물 수정 실패: ${err.message}` }, 500);
    }
  }

  // 3. 매물 신규 등록
  const { 
    breed, nickname, price, original_price, birthday, 
    is_negotiable, video_url, region, gender, age, vaccine, 
    neutered, description, images, used_coupon_id 
  } = body;

  if (!breed || !nickname) {
    return createResponse({ error: '견종과 강아지 이름은 필수 입력 항목입니다.' }, 400);
  }

  try {
    const profile = await env.DB.prepare('SELECT role FROM profiles WHERE id = ?')
      .bind(authUser.id)
      .first();

    if (!profile || (profile.role !== 'seller' && profile.role !== 'admin')) {
      return createResponse({ error: '판매자 자격 신청 승인 완료 후 매물을 등록할 수 있습니다.' }, 403);
    }

    const imagesStr = Array.isArray(images) ? JSON.stringify(images) : '[]';

    // 쿠폰 검증
    let coupon = null;
    if (used_coupon_id) {
      coupon = await env.DB.prepare(`
        SELECT uc.id, c.coupon_type, c.name 
        FROM user_coupons uc 
        JOIN coupons c ON uc.coupon_id = c.id 
        WHERE uc.id = ? AND uc.user_id = ? AND uc.is_used = 0
      `).bind(used_coupon_id, authUser.id).first();

      if (!coupon) {
        return createResponse({ error: '유효하지 않거나 이미 사용된 쿠폰입니다.' }, 400);
      }
    }

    const result = await env.DB.prepare(
      `INSERT INTO dogs (
        breed, nickname, price, original_price, birthday, 
        is_negotiable, video_url, region, gender, age, 
        vaccine, neutered, description, images, status, seller_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        breed, nickname, price !== undefined ? Number(price) : 0,
        original_price !== undefined && original_price !== null ? Number(original_price) : null,
        birthday || null, is_negotiable ? 1 : 0, video_url || null, region || '',
        gender || '남아', age || '', vaccine || '', neutered ? 1 : 0,
        description || '', imagesStr, 'available', authUser.id
      )
      .run();

    const newId = result.meta.last_row_id;

    // 쿠폰 사용 처리 및 광고 자동 등록
    if (coupon) {
      const now = new Date().toISOString();
      const endDateObj = new Date();
      endDateObj.setDate(endDateObj.getDate() + 7); // 기본 7일
      const endDate = endDateObj.toISOString();

      const stmts = [
        env.DB.prepare('UPDATE user_coupons SET is_used = 1, used_at = ? WHERE id = ?').bind(now, used_coupon_id)
      ];

      // 광고 쿠폰인 경우 advertisements 테이블에 인서트
      if (coupon.coupon_type.startsWith('ad_')) {
        let adType = 'main'; // 기본값
        if (coupon.coupon_type === 'ad_hero_main') adType = 'main_hero';
        else if (coupon.coupon_type === 'ad_main_premium') adType = 'main_premium';
        else if (coupon.coupon_type === 'ad_breed_premium') adType = 'breed_premium';

        stmts.push(
          env.DB.prepare(`
            INSERT INTO advertisements (user_id, dog_id, ad_type, title, status, duration, start_date, end_date, used_coupon_id)
            VALUES (?, ?, ?, ?, 'active', 7, ?, ?, ?)
          `).bind(authUser.id, newId, adType, `${coupon.name} 자동 적용`, now, endDate, used_coupon_id)
        );
      }

      await env.DB.batch(stmts);
    }

    return createResponse({ success: true, id: newId, nickname, used_coupon: coupon ? true : false });
  } catch (err) {
    return createResponse({ error: `매물 등록 실패: ${err.message}` }, 500);
  }
}

// DELETE 요청 처리 (매물 삭제)
export async function DELETE(request) {
  const env = getRequestContext().env;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return createResponse({ error: '로그인이 필요한 작업입니다.' }, 401);
  }

  if (!id) {
    return createResponse({ error: '삭제할 매물 ID가 필요합니다.' }, 400);
  }

  try {
    const dog = await env.DB.prepare('SELECT seller_id FROM dogs WHERE id = ?')
      .bind(id)
      .first();

    if (!dog) {
      return createResponse({ error: '존재하지 않는 매물입니다.' }, 404);
    }

    if (dog.seller_id !== authUser.id && authUser.role !== 'admin') {
      return createResponse({ error: '삭제 권한이 없습니다.' }, 403);
    }

    await env.DB.prepare('DELETE FROM dogs WHERE id = ?')
      .bind(id)
      .run();

    return createResponse({ success: true, message: '매물이 안전하게 삭제되었습니다.' });
  } catch (err) {
    return createResponse({ error: `매물 삭제 오류: ${err.message}` }, 500);
  }
}
