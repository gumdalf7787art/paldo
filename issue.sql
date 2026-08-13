-- Insert Coupons
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (101, '히어로 페이지 광고권', 100, 'HERO_PAGE_AD', 'none', 'main', '2030-12-31');
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (102, '추천 광고권', 100, 'RECOMMEND_AD', 'none', 'recommend', '2030-12-31');
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (103, '인기 스토어 광고권', 100, 'POPULAR_AD', 'none', 'popular', '2030-12-31');
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (104, '스페셜 광고권', 100, 'SPECIAL_AD', 'none', 'special', '2030-12-31');

-- Add to b@naver.com
-- Let's create a temporary table for repetitive inserts
CREATE TEMP TABLE Numbers (n INTEGER);
INSERT INTO Numbers VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20);

INSERT INTO user_coupons (user_id, coupon_id, is_used)
SELECT p.id, 101, 0
FROM profiles p
JOIN Numbers n ON n.n <= 10
WHERE p.email = 'b@naver.com';

INSERT INTO user_coupons (user_id, coupon_id, is_used)
SELECT p.id, 102, 0
FROM profiles p
JOIN Numbers n ON n.n <= 20
WHERE p.email = 'b@naver.com';

INSERT INTO user_coupons (user_id, coupon_id, is_used)
SELECT p.id, 103, 0
FROM profiles p
JOIN Numbers n ON n.n <= 20
WHERE p.email = 'b@naver.com';

INSERT INTO user_coupons (user_id, coupon_id, is_used)
SELECT p.id, 104, 0
FROM profiles p
JOIN Numbers n ON n.n <= 20
WHERE p.email = 'b@naver.com';
