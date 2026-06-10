-- Paldo Cloudflare D1 (SQLite) Database Schema

-- 1. 유저 프로필 테이블
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,                       -- Supabase Auth UUID 또는 커스텀 유저 ID
    email TEXT UNIQUE NOT NULL,
    password TEXT,                             -- 해싱된 비밀번호 보관용 컬럼 추가
    nickname TEXT,
    phone TEXT,
    address TEXT,
    profile_image TEXT,
    role TEXT DEFAULT 'buyer',                 -- 'buyer', 'seller', 'admin'
    grade TEXT DEFAULT '일반',                 -- 유저 등급
    completed_adoption_count INTEGER DEFAULT 0, -- 분양 완료 수
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);


-- 2. 강아지 매물 테이블
CREATE TABLE IF NOT EXISTS dogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    breed TEXT NOT NULL,                       -- 견종
    nickname TEXT NOT NULL,                    -- 강아지 이름/별명
    price INTEGER DEFAULT 0,                   -- 책임비/분양가
    original_price INTEGER,                    -- 최초 분양가 (할인 전 가격)
    birthday TEXT,                             -- 생일
    is_negotiable INTEGER DEFAULT 0,          -- 가격 협의 가능 여부 (0: 불가, 1: 가능)
    video_url TEXT,                            -- 유튜브/인스타 영상 링크
    region TEXT,                               -- 분양 지역
    gender TEXT,                               -- '남아', '여아'
    age TEXT,                                  -- 개월 수 또는 나이
    vaccine TEXT,                              -- 예방접종 차수 (예: '2차 접종완료')
    neutered INTEGER DEFAULT 0,                -- 중성화 여부 (0: 미완료, 1: 완료)
    description TEXT,                          -- 상세 설명
    images TEXT,                               -- 이미지 URL 리스트 (JSON 또는 쉼표 분리 문자열)
    status TEXT DEFAULT 'available',           -- 'available' (분양중), 'completed' (분양완료)
    seller_id TEXT,                            -- profiles(id) 외래키 연동
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(seller_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 3. 판매자 사업자 신청 테이블
CREATE TABLE IF NOT EXISTS business_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    business_name TEXT NOT NULL,
    biz_no TEXT NOT NULL,
    animal_sale_no TEXT NOT NULL,
    status TEXT DEFAULT 'pending',             -- 'pending', 'approved', 'rejected'
    rejected_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 4. 상점 리뷰 테이블
CREATE TABLE IF NOT EXISTS store_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    rating REAL DEFAULT 5.0,                   -- 평점 (1.0 ~ 5.0)
    content TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(seller_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 5. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    type TEXT,                                 -- 'system', 'chat', 'adoption'
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,                 -- 0: 안읽음, 1: 읽음
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 6. 1:1 채팅방 테이블
CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY,                       -- room_id (예: buyer_id + seller_id + dog_id 등의 조합 또는 UUID)
    seller_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    dog_id INTEGER,
    last_message TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(seller_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(buyer_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(dog_id) REFERENCES dogs(id) ON DELETE SET NULL
);

-- 7. 1:1 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY(sender_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 8. 행동/분석 로그 테이블 (맞춤형 개인화 추천 기반)
CREATE TABLE IF NOT EXISTS analytics_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,                              -- 비로그인 유저일 경우 NULL 허용
    dog_id INTEGER,
    breed TEXT,
    action_type TEXT DEFAULT 'view',           -- 'view' (상세조회), 'bookmark' (찜하기)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);

-- 9. 광고 신청 테이블
CREATE TABLE IF NOT EXISTS advertisements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending',             -- 'pending', 'active', 'ended'
    budget INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,                -- 광고 기간 (일 단위)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 10. 쿠폰 테이블
CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    discount_rate INTEGER DEFAULT 0,           -- 할인율 (%)
    code TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 11. 유저 보유 쿠폰 매핑 테이블
CREATE TABLE IF NOT EXISTS user_coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    coupon_id INTEGER NOT NULL,
    is_used INTEGER DEFAULT 0,                 -- 0: 미사용, 1: 사용됨
    used_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
);

-- 12. 매물 신고 테이블
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,                     -- 신고자 ID
    target_id INTEGER NOT NULL,                -- 신고 대상 (dogs ID)
    type TEXT,                                 -- 신고 유형 ('허위매물', '스팸' 등)
    reason TEXT,                               -- 상세 이유
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(target_id) REFERENCES dogs(id) ON DELETE CASCADE
);

-- 13. 유저 매물 북마크(관심 목록) 테이블
CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    dog_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(dog_id) REFERENCES dogs(id) ON DELETE CASCADE,
    UNIQUE(user_id, dog_id)                    -- 중복 관심등록 방지
);
