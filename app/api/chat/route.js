import { getRequestContext } from '@cloudflare/next-on-pages';

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

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// GET: 채팅방 목록 / 메시지 내역 조회
export async function GET(request) {
  const env = getRequestContext().env;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const authUser = getAuthenticatedUser(request);
  if (!authUser) return createResponse({ error: '로그인이 필요합니다.' }, 401);

  // 메시지 내역 조회
  if (action === 'messages') {
    const roomId = url.searchParams.get('room_id');
    if (!roomId) return createResponse({ error: 'room_id는 필수입니다.' }, 400);
    try {
      const { results: messages } = await env.DB.prepare(
        `SELECT m.id, m.room_id, m.sender_id, m.message, m.is_read, m.created_at,
                p.nickname AS sender_nickname, p.profile_image AS sender_profile_image
         FROM chat_messages m
         LEFT JOIN profiles p ON m.sender_id = p.id
         WHERE m.room_id = ?
         ORDER BY m.created_at ASC`
      ).bind(roomId).all();
      return createResponse(messages);
    } catch (err) {
      return createResponse({ error: `메시지 조회 실패: ${err.message}` }, 500);
    }
  }

  // 채팅방 목록 조회 (buyer_has_unread, seller_has_unread 포함)
  try {
    const { results: rooms } = await env.DB.prepare(
      `SELECT r.id, r.seller_id, r.buyer_id, r.dog_id, r.last_message, r.updated_at, r.created_at,
              r.buyer_has_unread, r.seller_has_unread,
              p_buyer.nickname AS buyer_nickname, p_buyer.profile_image AS buyer_profile_image,
              p_seller.nickname AS seller_nickname, p_seller.profile_image AS seller_profile_image,
              d.nickname AS dog_nickname, d.breed AS dog_breed, json_extract(d.images, '$[0]') AS dog_image_url
       FROM chat_rooms r
       LEFT JOIN profiles p_buyer ON r.buyer_id = p_buyer.id
       LEFT JOIN profiles p_seller ON r.seller_id = p_seller.id
       LEFT JOIN dogs d ON r.dog_id = d.id
       WHERE r.buyer_id = ? OR r.seller_id = ?
       ORDER BY r.updated_at DESC`
    ).bind(authUser.id, authUser.id).all();
    return createResponse(rooms);
  } catch (err) {
    return createResponse({ error: `채팅방 목록 조회 실패: ${err.message}` }, 500);
  }
}

// POST: 채팅방 개설 / 메시지 전송 / 읽음 처리
export async function POST(request) {
  const env = getRequestContext().env;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const authUser = getAuthenticatedUser(request);
  if (!authUser) return createResponse({ error: '로그인이 필요합니다.' }, 401);

  let body;
  try { body = await request.json(); } catch (e) { body = {}; }

  // 1:1 채팅방 개설
  if (action === 'create_room') {
    const { seller_id, buyer_id, dog_id } = body;
    if (!seller_id || !buyer_id || !dog_id) {
      return createResponse({ error: '판매자, 구매자, 매물 ID는 필수입니다.' }, 400);
    }
    const roomId = `${buyer_id}_${seller_id}_${dog_id}`;
    try {
      const existing = await env.DB.prepare('SELECT id FROM chat_rooms WHERE id = ?').bind(roomId).first();
      if (existing) return createResponse({ success: true, room_id: roomId, created: false });
      await env.DB.prepare(
        'INSERT INTO chat_rooms (id, seller_id, buyer_id, dog_id, last_message) VALUES (?, ?, ?, ?, "")'
      ).bind(roomId, seller_id, buyer_id, dog_id).run();
      return createResponse({ success: true, room_id: roomId, created: true });
    } catch (err) {
      return createResponse({ error: `채팅방 생성 실패: ${err.message}` }, 500);
    }
  }

  // 메시지 전송 + 상대방 unread 플래그 1로 설정
  if (action === 'send_message') {
    const { room_id, message } = body;
    if (!room_id || !message) {
      return createResponse({ error: '채팅방 ID와 메시지는 필수입니다.' }, 400);
    }
    try {
      await env.DB.prepare(
        'INSERT INTO chat_messages (room_id, sender_id, message) VALUES (?, ?, ?)'
      ).bind(room_id, authUser.id, message).run();

      const room = await env.DB.prepare('SELECT seller_id, buyer_id FROM chat_rooms WHERE id = ?')
        .bind(room_id).first();

      if (room) {
        const isBuyer = authUser.id === room.buyer_id;
        if (isBuyer) {
          // 구매자가 보냄 → 판매자 unread = 1
          await env.DB.prepare(
            'UPDATE chat_rooms SET last_message = ?, updated_at = CURRENT_TIMESTAMP, seller_has_unread = 1 WHERE id = ?'
          ).bind(message, room_id).run();
        } else {
          // 판매자가 보냄 → 구매자 unread = 1
          await env.DB.prepare(
            'UPDATE chat_rooms SET last_message = ?, updated_at = CURRENT_TIMESTAMP, buyer_has_unread = 1 WHERE id = ?'
          ).bind(message, room_id).run();
        }
        const targetUserId = isBuyer ? room.seller_id : room.buyer_id;
        await env.DB.prepare(
          'INSERT INTO notifications (user_id, type, message, is_read) VALUES (?, "chat", ?, 0)'
        ).bind(targetUserId, `${authUser.nickname || '누군가'}님으로부터 새 채팅 메시지가 도착했습니다.`).run();
      } else {
        await env.DB.prepare(
          'UPDATE chat_rooms SET last_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(message, room_id).run();
      }

      return createResponse({ success: true });
    } catch (err) {
      return createResponse({ error: `메시지 전송 실패: ${err.message}` }, 500);
    }
  }

  // 채팅방 읽음 처리 (자신의 unread 플래그를 0으로)
  if (action === 'mark_read') {
    const { room_id } = body;
    if (!room_id) return createResponse({ error: 'room_id는 필수입니다.' }, 400);
    try {
      const room = await env.DB.prepare('SELECT seller_id, buyer_id FROM chat_rooms WHERE id = ?')
        .bind(room_id).first();
      if (!room) return createResponse({ error: '채팅방을 찾을 수 없습니다.' }, 404);

      const isBuyer = authUser.id === room.buyer_id;
      if (isBuyer) {
        await env.DB.prepare('UPDATE chat_rooms SET buyer_has_unread = 0 WHERE id = ?').bind(room_id).run();
      } else {
        await env.DB.prepare('UPDATE chat_rooms SET seller_has_unread = 0 WHERE id = ?').bind(room_id).run();
      }

      // 상대방이 보낸 메시지를 읽음 처리
      await env.DB.prepare(
        'UPDATE chat_messages SET is_read = 1 WHERE room_id = ? AND sender_id != ?'
      ).bind(room_id, authUser.id).run();

      return createResponse({ success: true });
    } catch (err) {
      return createResponse({ error: `읽음 처리 실패: ${err.message}` }, 500);
    }
  }

  return createResponse({ error: '지원하지 않는 액션입니다.' }, 400);
}
