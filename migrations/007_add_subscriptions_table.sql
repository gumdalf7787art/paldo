-- 15. 정기 구독 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,                   -- 'basic', 'pro', 'professional'
    customer_uid TEXT NOT NULL,                -- 포트원 빌링키 (정기결제용 카드 고유키)
    status TEXT DEFAULT 'active',              -- 'active', 'cancelled', 'failed'
    last_payment_date TEXT,
    next_billing_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);
