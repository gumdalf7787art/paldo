-- 견종별 쿠폰 종류 생성 (이미 있으면 무시)
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (105, '견종별 히어로 페이지 광고권', 100, 'BREED_HERO_AD', 'none', 'breed_main', '2030-12-31');
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (106, '견종별 추천 광고권', 100, 'BREED_RECOMMEND_AD', 'none', 'breed_recommend', '2030-12-31');
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (107, '견종별 인기 스토어 광고권', 100, 'BREED_POPULAR_AD', 'none', 'breed_popular', '2030-12-31');
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (108, '견종별 스페셜 광고권', 100, 'BREED_SPECIAL_AD', 'none', 'breed_special', '2030-12-31');

-- 견종별 히어로 페이지 10장 발급
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 105, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 105, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 105, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 105, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 105, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 105, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 105, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 105, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 105, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 105, 0 FROM profiles WHERE email = 'b@naver.com';

-- 견종별 추천 20장 발급
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 106, 0 FROM profiles WHERE email = 'b@naver.com';

-- 견종별 인기 스토어 20장 발급
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 107, 0 FROM profiles WHERE email = 'b@naver.com';

-- 견종별 스페셜 20장 발급
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 108, 0 FROM profiles WHERE email = 'b@naver.com';
