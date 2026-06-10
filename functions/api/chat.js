// Cloudflare Pages Functions: GET/POST /api/chat

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

// GET 요청 처리 (채팅방 목록 및 메시지 내역 조회)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const authUser = getAuthenticatedUser(request);
  if (!authUser) {
    return createResponse({ error: '로그인이 필요한 작업입니다.' }, 401);
  }

  // 1. 특정 채팅방 메시지 내역 조회 (action = messages)
  if (action === 'messages') {
    const roomId = url.searchParams.get('room_id');
    if (!roomId) {
      return createResponse({ error: '채팅방 ID(room_id)는 필수입니다.' }, 400);
    }

    try {
      const { results: messages } = await env.DB.prepare(
        'SELECT m.id, m.room_id, m.sender_id, m.message, m.created_at, p.nickname AS sender_nickname, p.profile_image AS sender_profile_image FROM chat_messages m LEFT JOIN profiles p ON m.sender_id = p.id WHERE m.room_id = ? ORDER BY m.created_at ASC'
      )
        .bind(roomId)
        .all();

      return createResponse(messages);
    } catch (err) {
      return createResponse({ error: `메시지 내역 조회 실패: ${err.message}` }, 500);
    }
  }

  // 2. 참여 중인 채팅방 목록 전체 조회 (action = rooms 또는 기본값)
  try {
    const { results: rooms } = await env.DB.prepare(
      `SELECT r.id, r.seller_id, r.buyer_id, r.dog_id, r.last_message, r.updated_at, r.created_at,
              p_buyer.nickname AS buyer_nickname, p_buyer.profile_image AS buyer_profile_image,
              p_seller.nickname AS seller_nickname, p_seller.profile_image AS seller_profile_image,
              d.nickname AS dog_nickname, d.breed AS dog_breed
       FROM chat_rooms r
       LEFT JOIN profiles p_buyer ON r.buyer_id = p_buyer.id
       LEFT JOIN profiles p_seller ON r.seller_id = p_seller.id
       LEFT JOIN dogs d ON r.dog_id = d.id
       WHERE r.buyer_id = ? OR r.seller_id = ?
       ORDER BY r.updated_at DESC`
    )
      .bind(authUser.id, authUser.id)
      .all();

    return createResponse(rooms);
  } catch (err) {
    return createResponse({ error: `채팅방 목록 조회 실패: ${err.message}` }, 500);
  }
}

// POST 요청 처리 (채팅방 개설 및 메시지 전송)
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
  } catch (e) {
    body = {};
  }

  // 1. 1:1 채팅방 개설 (create_room)
  if (action === 'create_room') {
    const { seller_id, buyer_id, dog_id } = body;
    if (!seller_id || !buyer_id || !dog_id) {
      return createResponse({ error: '판매자, 구매자, 매물 ID는 필수입니다.' }, 400);
    }

    const roomId = `${buyer_id}_${seller_id}_${dog_id}`;

    try {
      // 이미 방이 있는지 검사
      const existing = await env.DB.prepare('SELECT id FROM chat_rooms WHERE id = ?')
        .bind(roomId)
        .first();

      if (existing) {
        return createResponse({ success: true, room_id: roomId, created: false });
      }

      // 방 신규 생성
      await env.DB.prepare(
        'INSERT INTO chat_rooms (id, seller_id, buyer_id, dog_id, last_message) VALUES (?, ?, ?, ?, "")'
      )
        .bind(roomId, seller_id, buyer_id, dog_id)
        .run();

      return createResponse({ success: true, room_id: roomId, created: true });
    } catch (err) {
      return createResponse({ error: `채팅방 생성 실패: ${err.message}` }, 500);
    }
  }

  // 2. 메시지 전송 (send_message)
  if (action === 'send_message') {
    const { room_id, message } = body;
    if (!room_id || !message) {
      return createResponse({ error: '채팅방 ID와 메시지 내용은 필수입니다.' }, 400);
    }

    try {
      // 1) 메시지 저장
      await env.DB.prepare(
        'INSERT INTO chat_messages (room_id, sender_id, message) VALUES (?, ?, ?)'
      )
        .bind(room_id, authUser.id, message)
        .run();

      // 2) 채팅방의 마지막 메시지 및 시간 갱신
      await env.DB.prepare(
        'UPDATE chat_rooms SET last_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
        .bind(message, room_id)
        .run();

      // 3) 상대방 유저 확인 (알림 전송 목적)
      const room = await env.DB.prepare('SELECT seller_id, buyer_id, dog_id FROM chat_rooms WHERE id = ?')
        .bind(room_id)
        .first();

      if (room) {
        const targetUserId = authUser.id === room.buyer_id ? room.seller_id : room.buyer_id;
        // 알림 테이블에 비동기성 알림 등록
        await env.DB.prepare(
          'INSERT INTO notifications (user_id, type, message, is_read) VALUES (?, "chat", ?, 0)'
        )
          .bind(targetUserId, `${authUser.nickname || '누군가'}님으로부터 새로운 채팅 메시지가 도착했습니다.`)
          .run();
      }

      return createResponse({ success: true, message: '메시지가 성공적으로 전송되었습니다.' });
    } catch (err) {
      return createResponse({ error: `메시지 전송 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 요청 액션입니다.' }, 400);
}
