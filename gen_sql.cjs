const fs = require('fs');

let sql = `
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (101, '히어로 페이지 광고권', 100, 'HERO_PAGE_AD', 'none', 'main', '2030-12-31');
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (102, '추천 광고권', 100, 'RECOMMEND_AD', 'none', 'recommend', '2030-12-31');
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (103, '인기 스토어 광고권', 100, 'POPULAR_AD', 'none', 'popular', '2030-12-31');
INSERT OR IGNORE INTO coupons (id, name, discount_rate, code, auto_issue_type, ad_type, valid_until) VALUES (104, '스페셜 광고권', 100, 'SPECIAL_AD', 'none', 'special', '2030-12-31');
`;

const email = 'b@naver.com';

// 10 hero coupons
for(let i=0; i<10; i++) {
  sql += `INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 101, 0 FROM profiles WHERE email = '${email}';\n`;
}

// 20 recommend coupons
for(let i=0; i<20; i++) {
  sql += `INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 102, 0 FROM profiles WHERE email = '${email}';\n`;
}

// 20 popular coupons
for(let i=0; i<20; i++) {
  sql += `INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 103, 0 FROM profiles WHERE email = '${email}';\n`;
}

// 20 special coupons
for(let i=0; i<20; i++) {
  sql += `INSERT INTO user_coupons (user_id, coupon_id, is_used) SELECT id, 104, 0 FROM profiles WHERE email = '${email}';\n`;
}

fs.writeFileSync('issue2.sql', sql);
