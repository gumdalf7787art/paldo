-- Migration: Add payments table to store transaction logs
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    imp_uid TEXT UNIQUE NOT NULL,             -- 포트원 결제 고유 거래 ID
    merchant_uid TEXT UNIQUE NOT NULL,        -- 다잇독 자체 주문 고유 번호
    amount INTEGER NOT NULL,                  -- 결제 금액
    pay_method TEXT NOT NULL,                 -- card, vbank, trans 등
    status TEXT NOT NULL DEFAULT 'ready',      -- paid, ready, cancelled, failed
    vbank_num TEXT,                           -- 가상계좌 번호
    vbank_name TEXT,                          -- 가상계좌 은행명
    vbank_holder TEXT,                        -- 가상계좌 예금주
    vbank_date TEXT,                          -- 가상계좌 입금 기한
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);
