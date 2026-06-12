-- 005_add_coupon_types.sql
-- 1. Add coupon_type to existing coupons table
ALTER TABLE coupons ADD COLUMN coupon_type TEXT DEFAULT 'discount';

-- 2. Add description to coupons table to show to users
ALTER TABLE coupons ADD COLUMN description TEXT;

-- 3. Insert initial seed data for the 4 coupon types
INSERT INTO coupons (name, code, coupon_type, description, auto_issue_type)
VALUES 
  ('S급 히어로 패스', 'S_HERO_PASS', 'ad_hero_main', '메인 페이지 최상단 히어로 슬라이드에 7일간 노출됩니다.', 'signup'),
  ('A급 프리미엄 패스', 'A_PREMIUM_PASS', 'ad_main_premium', '메인 페이지 안심/인기/스페셜 분양 섹션에 7일간 노출됩니다.', 'signup'),
  ('B급 품종 1등 패스', 'B_BREED_PASS', 'ad_breed_premium', '품종별 상세 페이지 프리미엄 스폰서 섹션에 7일간 노출됩니다.', 'signup'),
  ('1회 게시권', '1_TIME_POST', 'post_ticket', '분양글 1마리를 추가로 등록할 수 있는 기본 게시권입니다.', 'signup');
