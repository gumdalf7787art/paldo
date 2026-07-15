// Cloudflare Pages Functions: GET/POST /api/store

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
  } catch {
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

const DUMMY_STORE_DETAILS = {
  'dummy-store-1': {
    profile: {
      id: 'dummy-store-1',
      email: 'cheongdam@paldodog.com',
      nickname: '도그하우스 청담본점',
      phone: '02-543-9876',
      address: '서울특별시 강남구 청담동 89-4',
      profile_image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=150',
      role: 'seller',
      grade: 'VIP 파트너',
      completed_adoption_count: 142,
      store_header_image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=600',
      store_contact: '02-543-9876',
      kakao_channel: 'https://pf.kakao.com/_cheongdam',
      store_description: '청담동 고품격 프리미엄 반려동물 케어 및 전문 브리딩 비즈니스 솔루션을 제공하는 플래그십 매장입니다.\n\n365일 전문 수의사 공동 케어와 넓은 야외 테라스를 제공하며, 안전한 분양 문화를 선도합니다.',
      store_address: '서울특별시 강남구 청담동 89-4',
      store_additional_images: JSON.stringify([
        'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400'
      ])
    },
    biz: {
      business_name: '도그하우스 청담본점',
      biz_no: '120-88-12345',
      animal_sale_no: '제 3220000-037-2023-0001호'
    },
    reviews: [
      { id: 101, rating: 5, content: '매장 환경이 정말 쾌적하고 직원분들이 너무 친절해서 믿음이 갔습니다.', created_at: '2026-05-10T10:00:00Z', nickname: '행복맘', profile_image: '' },
      { id: 102, rating: 5, content: '소개해주신 가이드대로 케어하니 아이가 금방 적응하네요. 최고입니다!', created_at: '2026-06-01T15:30:00Z', nickname: '쿠키아빠', profile_image: '' }
    ]
  },
  'dummy-store-2': {
    profile: {
      id: 'dummy-store-2',
      email: 'mapo@paldodog.com',
      nickname: '퍼피랜드 마포점',
      phone: '02-712-3456',
      address: '서울특별시 마포구 도화동 173',
      profile_image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
      role: 'seller',
      grade: '안심 파트너',
      completed_adoption_count: 89,
      store_header_image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=600',
      store_contact: '02-712-3456',
      kakao_channel: 'https://pf.kakao.com/_mapo',
      store_description: '안전하고 투명한 반려동물 건강 검진 솔루션과 1:1 맞춤 홈케어 컨설팅을 제공하는 안심 매장입니다.\n\n각 개체별 건강검진 인증서를 발급하여 안전성을 철저히 보증합니다.',
      store_address: '서울특별시 마포구 도화동 173',
      store_additional_images: JSON.stringify([
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=400'
      ])
    },
    biz: {
      business_name: '퍼피랜드 마포점',
      biz_no: '105-86-98765',
      animal_sale_no: '제 3130000-037-2022-0002호'
    },
    reviews: [
      { id: 201, rating: 5, content: '건강검진서를 상세하게 설명해주셔서 너무 고마웠습니다.', created_at: '2026-05-18T11:00:00Z', nickname: '아리맘', profile_image: '' }
    ]
  },
  'dummy-store-3': {
    profile: {
      id: 'dummy-store-3',
      email: 'songdo@paldodog.com',
      nickname: '댕댕이 하우스 송도',
      phone: '032-831-7788',
      address: '인천광역시 연수구 송도동 23-3',
      profile_image: 'https://images.unsplash.com/photo-1537151608828-ea2b117b62e4?auto=format&fit=crop&q=80&w=150',
      role: 'seller',
      grade: '우수 상점',
      completed_adoption_count: 76,
      store_header_image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600',
      store_contact: '032-831-7788',
      kakao_channel: 'https://pf.kakao.com/_songdo',
      store_description: '송도 국제도시 최대 규모의 펫 아카데미 및 B2B 위생 안심 케어 서비스 인증 파트너사입니다.\n\n아이들이 넓고 자연친화적인 공간에서 뛰어놀 수 있게 설계된 도심 속 펫 파라다이스입니다.',
      store_address: '인천광역시 연수구 송도동 23-3',
      store_additional_images: JSON.stringify([
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=400'
      ])
    },
    biz: {
      business_name: '댕댕이 하우스 송도',
      biz_no: '131-81-24680',
      animal_sale_no: '제 3520000-037-2024-0003호'
    },
    reviews: []
  },
  'dummy-store-4': {
    profile: {
      id: 'dummy-store-4',
      email: 'centum@paldodog.com',
      nickname: '해피퍼피 부산센텀',
      phone: '051-744-1234',
      address: '부산광역시 해운대구 우동 1400',
      profile_image: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?auto=format&fit=crop&q=80&w=150',
      role: 'seller',
      grade: '우수 상점',
      completed_adoption_count: 110,
      store_header_image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=600',
      store_contact: '051-744-1234',
      kakao_channel: 'https://pf.kakao.com/_centum',
      store_description: '부산 경남권 최고의 매장 인프라와 첨단 IoT 헬스 케어 모니터링 시스템을 도입한 혁신 매장입니다.\n\n개체별 바이탈 모니터링 기기를 구축하여 건강하고 과학적인 사육 환경을 보장합니다.',
      store_address: '부산광역시 해운대구 우동 1400',
      store_additional_images: JSON.stringify([
        'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?auto=format&fit=crop&q=80&w=400'
      ])
    },
    biz: {
      business_name: '해피퍼피 부산센텀',
      biz_no: '603-81-13579',
      animal_sale_no: '제 3390000-037-2023-0004호'
    },
    reviews: []
  },
  'dummy-store-5': {
    profile: {
      id: 'dummy-store-5',
      email: 'bundang@paldodog.com',
      nickname: '조이펫 분당수지점',
      phone: '031-708-5678',
      address: '경기도 성남시 분당구 정자동 16-2',
      profile_image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=150',
      role: 'seller',
      grade: '일반 파트너',
      completed_adoption_count: 55,
      store_header_image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600',
      store_contact: '031-708-5678',
      kakao_channel: 'https://pf.kakao.com/_bundang',
      store_description: '동물 행동 전문가의 전문 컨설팅 서비스와 프리미엄 유기농 식단 분석 서비스를 상시 제공합니다.\n\n사회성 교육 프로그램을 매장 내 무료 참관식으로 제공하고 있습니다.',
      store_address: '경기도 성남시 분당구 정자동 16-2',
      store_additional_images: JSON.stringify([])
    },
    biz: {
      business_name: '조이펫 분당수지점',
      biz_no: '129-87-11223',
      animal_sale_no: '제 3780000-037-2023-0005호'
    },
    reviews: []
  },
  'dummy-store-6': {
    profile: {
      id: 'dummy-store-6',
      email: 'ilsan@paldodog.com',
      nickname: '골든퍼피 일산점',
      phone: '031-901-4321',
      address: '경기도 고양시 일산동구 장항동 740',
      profile_image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=150',
      role: 'seller',
      grade: '안심 파트너',
      completed_adoption_count: 67,
      store_header_image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=600',
      store_contact: '031-901-4321',
      kakao_channel: 'https://pf.kakao.com/_ilsan',
      store_description: '자연 친화적 환경 설계와 엄격한 혈통 보존 및 독자적 위생 위탁 관리 라이선스를 보유한 정식 파트너입니다.\n\n일산 최대 호수공원 근방 훈련소 협업 네트워킹을 지원합니다.',
      store_address: '경기도 고양시 일산동구 장항동 740',
      store_additional_images: JSON.stringify([])
    },
    biz: {
      business_name: '골든퍼피 일산점',
      biz_no: '128-86-44556',
      animal_sale_no: '제 3940000-037-2024-0006호'
    },
    reviews: []
  },
  'dummy-store-7': {
    profile: {
      id: 'dummy-store-7',
      email: 'gwangju@paldodog.com',
      nickname: '스위트하우스 광주점',
      phone: '062-371-9988',
      address: '광주광역시 서구 치평동 1200',
      profile_image: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=150',
      role: 'seller',
      grade: '일반 파트너',
      completed_adoption_count: 42,
      store_header_image: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&q=80&w=600',
      store_contact: '062-371-9988',
      kakao_channel: 'https://pf.kakao.com/_gwangju',
      store_description: '24시간 무중단 스마트 매니지먼트 시스템과 협업 전문 의료진의 보증 케어 네트워크를 구축하였습니다.\n\n안심 홈딜리버리 홈케어 에이전트 매니저가 늘 함께 동행합니다.',
      store_address: '광주광역시 서구 치평동 1200',
      store_additional_images: JSON.stringify([])
    },
    biz: {
      business_name: '스위트하우스 광주점',
      biz_no: '409-86-77889',
      animal_sale_no: '제 4100000-037-2023-0007호'
    },
    reviews: []
  },
  'dummy-store-8': {
    profile: {
      id: 'dummy-store-8',
      email: 'daegu@paldodog.com',
      nickname: '엔젤퍼피 대구수성점',
      phone: '053-755-1122',
      address: '대구광역시 수성구 범어동 45-1',
      profile_image: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=150',
      role: 'seller',
      grade: 'VIP 파트너',
      completed_adoption_count: 125,
      store_header_image: 'https://images.unsplash.com/photo-1444212477490-ca407925329e?auto=format&fit=crop&q=80&w=600',
      store_contact: '053-755-1122',
      kakao_channel: 'https://pf.kakao.com/_daegu',
      store_description: '동대구 최대 규모의 안심 사후 관리 센터 운영 및 안심 펫 라이프 토탈 케어 서비스를 회원 특전으로 지원합니다.\n\n대구 수성 프리미엄 가맹점으로 철저한 사후 보증 2년제를 실시합니다.',
      store_address: '대구광역시 수성구 범어동 45-1',
      store_additional_images: JSON.stringify([])
    },
    biz: {
      business_name: '엔젤퍼피 대구수성점',
      biz_no: '502-86-99001',
      animal_sale_no: '제 3440000-037-2022-0008호'
    },
    reviews: []
  }
};

// GET 요청 처리 (상점 프로필 및 리뷰 목록 조회)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const sellerId = url.searchParams.get('seller_id');

  // 더미 스토어에 대한 인핸스드 리다이렉팅
  if (sellerId && sellerId.startsWith('dummy-store-')) {
    const dummy = DUMMY_STORE_DETAILS[sellerId] || DUMMY_STORE_DETAILS['dummy-store-1'];
    if (action === 'reviews') {
      return createResponse(dummy.reviews);
    }
    const profileCopy = { ...dummy.profile };
    if (profileCopy.store_additional_images) {
      try {
        profileCopy.store_additional_images = JSON.parse(profileCopy.store_additional_images);
      } catch {
        profileCopy.store_additional_images = [];
      }
    } else {
      profileCopy.store_additional_images = [];
    }
    return createResponse({
      profile: profileCopy,
      biz: dummy.biz,
      business: dummy.biz,
      active_count: 3,
      reviews: dummy.reviews
    });
  }

  if (!sellerId) {
    if (action === 'list') {
      try {
        const { results: stores } = await env.DB.prepare(
          'SELECT id, nickname, profile_image, store_header_image, store_description, store_address, store_contact FROM profiles WHERE role = "seller" ORDER BY created_at DESC LIMIT 10'
        ).all();
        return createResponse(stores);
      } catch (err) {
        return createResponse({ error: `매장 목록 조회 실패: ${err.message}` }, 500);
      }
    }
    return createResponse({ error: '판매자 ID는 필수입니다.' }, 400);
  }

  // 1. 리뷰 목록 조회 (action = reviews)
  if (action === 'reviews') {
    try {
      // 해당 판매자의 리뷰들 조회
      const { results: reviews } = await env.DB.prepare(
        'SELECT r.id, r.seller_id, r.reviewer_id, r.rating, r.content, r.created_at, p.nickname, p.profile_image FROM store_reviews r LEFT JOIN profiles p ON r.reviewer_id = p.id WHERE r.seller_id = ? ORDER BY r.created_at DESC'
      )
        .bind(sellerId)
        .all();

      return createResponse(reviews);
    } catch (err) {
      return createResponse({ error: `리뷰 목록 조회 실패: ${err.message}` }, 500);
    }
  }

  // 2. 상점 프로필 상세 조회 (기본값)
  try {
    const profile = await env.DB.prepare('SELECT id, email, nickname, phone, address, profile_image, role, grade, completed_adoption_count, created_at, store_header_image, store_contact, kakao_channel, store_description, store_address, store_additional_images FROM profiles WHERE id = ?')
      .bind(sellerId)
      .first();

    if (!profile) {
      return createResponse({ error: '상점을 찾을 수 없습니다.' }, 404);
    }

    // JSON 문자열 파싱
    if (profile.store_additional_images) {
      try {
        profile.store_additional_images = JSON.parse(profile.store_additional_images);
      } catch {
        profile.store_additional_images = [];
      }
    } else {
      profile.store_additional_images = [];
    }

    // 사업자 신청 승인 이력 조회
    const biz = await env.DB.prepare('SELECT business_name, biz_no, animal_sale_no FROM business_applications WHERE user_id = ? AND status = "approved"')
      .bind(sellerId)
      .first();

    // 현재 분양중인 게시물 수 조회
    const activeCountResult = await env.DB.prepare('SELECT COUNT(*) as count FROM dogs WHERE seller_id = ? AND status = "available"')
      .bind(sellerId)
      .first();
    const active_count = activeCountResult ? activeCountResult.count : 0;

    // 해당 상점에 대한 리뷰들 조회
    const { results: reviews } = await env.DB.prepare(
      'SELECT r.id, r.seller_id, r.reviewer_id, r.rating, r.content, r.created_at, p.nickname, p.profile_image FROM store_reviews r LEFT JOIN profiles p ON r.reviewer_id = p.id WHERE r.seller_id = ? ORDER BY r.created_at DESC'
    )
      .bind(sellerId)
      .all();

    return createResponse({
      profile,
      biz: biz || null,
      business: biz || null,
      active_count,
      reviews: reviews || []
    });
  } catch (err) {
    return createResponse({ error: `상점 정보 조회 실패: ${err.message}` }, 500);
  }
}

// POST 요청 (리뷰 쓰기)
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
  } catch {
    body = {};
  }

  // 리뷰 작성
  if (action === 'create_review') {
    const { seller_id, rating, content } = body;
    if (!seller_id || rating === undefined) {
      return createResponse({ error: '판매자 ID와 평점은 필수 입력 사항입니다.' }, 400);
    }

    try {
      // 본인 스스로에게 리뷰를 다는 것 방지
      if (seller_id === authUser.id) {
        return createResponse({ error: '자신의 상점에는 리뷰를 작성할 수 없습니다.' }, 400);
      }

      await env.DB.prepare(
        'INSERT INTO store_reviews (seller_id, reviewer_id, rating, content) VALUES (?, ?, ?, ?)'
      )
        .bind(seller_id, authUser.id, rating, content || '')
        .run();

      return createResponse({ success: true, message: '리뷰가 정상적으로 등록되었습니다.' });
    } catch (err) {
      return createResponse({ error: `리뷰 등록 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 요청 액션입니다.' }, 400);
}
