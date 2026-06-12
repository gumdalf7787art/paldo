PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE profiles (
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
, store_header_image TEXT, store_contact TEXT, kakao_channel TEXT, store_description TEXT, store_address TEXT, store_additional_images TEXT);
INSERT INTO "profiles" ("id","email","password","nickname","phone","address","profile_image","role","grade","completed_adoption_count","created_at","store_header_image","store_contact","kakao_channel","store_description","store_address","store_additional_images") VALUES('87e94663-1d49-460f-836b-0f41fe15c9e0','goodduck2@naver.com','8cba74c2290f85e6d94b52147c6d6d9211690f046ab65af481b2be7626e1f2e0','최고관리자','','','/api/images?key=dogs%2F87e94663-1d49-460f-836b-0f41fe15c9e0_1781068941143_evbted.jpg','admin','일반',0,'2026-06-10 04:17:09',NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "profiles" ("id","email","password","nickname","phone","address","profile_image","role","grade","completed_adoption_count","created_at","store_header_image","store_contact","kakao_channel","store_description","store_address","store_additional_images") VALUES('763956b8-a383-44ff-b31a-ef256027cbdb','blueprime1@daum.net','8cba74c2290f85e6d94b52147c6d6d9211690f046ab65af481b2be7626e1f2e0','공식 판매처','','','/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781082952501_c3iva5.png','seller','일반',0,'2026-06-10 05:23:07','/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781082415218_c34ivl.png','010-1234-1234',NULL,'하이.. 늘 이쁘고 멋진 아이들을 소개해줄께요..','서울 00구 00동 00번지','["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781082415469_msue4v.png","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781082415826_qh9k5i.png","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781082416034_9t5wou.png","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781082416277_ky0lcl.png","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781082416543_b8yaj1.png"]');
INSERT INTO "profiles" ("id","email","password","nickname","phone","address","profile_image","role","grade","completed_adoption_count","created_at","store_header_image","store_contact","kakao_channel","store_description","store_address","store_additional_images") VALUES('c132a1c9-07e4-45fc-bc9d-112eef13e755','test_verify_1781075958747@test.com','870266392ce3ae61c88f44857828f2dca6095f2ebe9c12b7bf1af4a21b6fa260','','','','','buyer','일반',0,'2026-06-10 07:19:18',NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE dogs (
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
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(3,'말티즈','띵띵이',110,135,'2026-03-10',0,NULL,'전국','암컷','3개월','2차 접종 완료',0,replace('🤍 크림색 말티즈 공주님 가족을 찾습니다 🤍\n\n사랑스러운 크림색 말티즈 3개월 여아를 소개합니다. 부드러운 크림빛 털과 동그란 눈망울, 앙증맞은 외모가 매력적인 아이입니다. 사람을 좋아하고 애교가 많아 처음 만나는 사람에게도 금세 마음을 여는 밝고 사랑스러운 성격을 가지고 있습니다.\n\n호기심이 많고 건강하게 성장하고 있으며, 장난감을 가지고 노는 것을 좋아하는 활발한 모습과 품에 안기면 얌전하게 안겨 있는 순한 모습을 함께 가진 매력적인 아이입니다. 현재 건강 상태 양호하며 기본 건강관리와 위생관리를 꾸준히 진행하고 있습니다.\n\n말티즈는 털 빠짐이 적고 실내 생활에 잘 적응하는 견종으로 많은 분들에게 사랑받고 있습니다. 특히 이 아이는 크림색의 은은하고 고급스러운 모색이 돋보여 더욱 특별한 매력을 느끼실 수 있습니다.\n\n소중한 가족으로 평생 함께해 주실 보호자님을 기다리고 있습니다. 단순한 분양이 아닌 좋은 인연을 이어간다는 마음으로 상담해 드리고 있으니 궁금하신 사항은 언제든 편하게 문의해 주세요. 사랑과 책임감으로 함께해 주실 따뜻한 가족을 기다립니다. 🐶💕','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781077732723_ed2cz2.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781077732950_f90rsn.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781077733181_dfmv0d.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781077733455_64w4sh.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781077733692_x86uj3.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 07:48:53');
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(4,'말티즈','인절미',100,120,'2026-04-10',0,NULL,'전국','수컷','2개월','2차 접종 완료',0,replace('🐶 사랑스러운 말티즈 왕자님 가족을 찾습니다 🐶\n\n2개월 된 건강한 말티즈 남아를 소개합니다. 새하얀 털과 까만 눈망울이 매력적인 아이로, 사람을 좋아하고 애교가 많아 누구에게나 사랑받을 수 있는 성격을 가지고 있습니다. 호기심이 많고 활발하면서도 품에 안기면 얌전하게 안겨 있는 사랑스러운 아이입니다.\n\n현재 건강 상태 양호하며 기본 건강검진을 완료하였습니다. 어린 시기부터 위생과 사회성 관리에 신경 쓰며 정성껏 돌보고 있습니다. 말티즈 특유의 밝고 영리한 성격으로 초보 반려인도 함께 생활하기 좋은 견종입니다.\n\n평생 가족이 되어 주실 좋은 보호자님을 기다리고 있습니다. 단순한 분양이 아닌 소중한 인연을 이어간다는 마음으로 상담해 드리고 있으니 궁금하신 사항은 언제든 편하게 문의해 주세요. 사랑과 책임감으로 함께해 주실 가족분들의 연락을 기다립니다. 💙','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781077861729_2nz9kq.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781077861989_xnzkr6.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781077862197_sk5dpp.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781077862444_gwulcl.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781077862674_v2b908.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 07:51:02');
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(5,'포메라니안','깽깽이',150,180,'2026-03-10',0,NULL,'전국','수컷','3개월','접종완료',0,replace('🖤🤍 특별한 매력의 포메라니안 왕자님 가족을 찾습니다 🤍🖤\n\n사랑스러운 3개월 포메라니안 남아를 소개합니다. 순백의 털 사이로 검은색 포인트가 자연스럽게 어우러진 독특하고 매력적인 모색을 가진 아이로, 한눈에 시선을 사로잡는 귀여운 외모가 돋보입니다. 동그란 눈망울과 풍성한 털, 앙증맞은 체형까지 포메라니안의 매력을 그대로 갖춘 아이입니다.\n\n사람을 좋아하고 애교가 많으며 밝고 활발한 성격을 가지고 있습니다. 새로운 환경에도 호기심을 보이며 장난감을 가지고 노는 것을 좋아하고, 보호자 곁에 머무르며 관심을 받는 것도 무척 좋아하는 사랑스러운 성격입니다.\n\n현재 건강하게 성장하고 있으며 기본 건강관리와 위생관리를 꾸준히 진행하고 있습니다. 포메라니안 특유의 영리함과 친화력을 갖추고 있어 초보 반려인도 함께 생활하기 좋은 아이입니다.\n\n평생 함께할 소중한 가족을 기다리고 있습니다. 단순한 분양이 아닌 좋은 인연을 이어간다는 마음으로 상담해 드리고 있으니 궁금하신 사항은 언제든 편하게 문의해 주세요. 사랑과 책임감으로 아이를 가족으로 맞이해 주실 따뜻한 보호자님을 기다립니다. 🐶💕','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781078102454_4j15if.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781078102686_jamzm9.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781078102922_8g1ogd.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781078103297_ijtowy.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781078103699_b0vlc1.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 07:55:03');
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(6,'포메라니안','뽀송이',150,190,'2026-04-10',0,'https://www.youtube.com/shorts/ZUkqaxsb_vM','전국','수컷','2개월','2차 접종 완료',0,replace('🤍 순백의 포메라니안 왕자님 가족을 찾습니다 🤍\n\n사랑스러운 2개월 포메라니안 남아를 소개합니다. 새하얀 솜사탕 같은 풍성한 털과 까만 눈망울, 작은 체구가 매력적인 아이로 보는 순간 미소가 절로 나오는 귀여움을 가지고 있습니다. 아직 아기 강아지답게 호기심이 많고 장난기 넘치는 성격이며 사람을 좋아해 곁에 다가와 애교를 부리는 사랑스러운 아이입니다.\n\n포메라니안 특유의 밝고 영리한 성격을 가지고 있어 보호자와의 교감이 뛰어나며, 새로운 환경에도 비교적 잘 적응하는 편입니다. 품에 안기면 얌전하게 안겨 있으면서도 내려놓으면 신나게 뛰어노는 건강하고 활발한 모습을 보여주고 있습니다.\n\n현재 건강하게 성장 중이며 기본적인 건강관리와 위생관리를 꾸준히 진행하고 있습니다. 순백의 아름다운 모색과 풍성한 털, 귀여운 외모를 갖춘 매력적인 아이로 평생 함께할 가족을 기다리고 있습니다.\n\n소중한 반려견이 아닌 가족으로 맞이해 주실 따뜻한 보호자님을 찾고 있습니다. 책임감과 사랑으로 함께해 주실 분들의 문의를 기다리며, 궁금하신 사항은 언제든 편하게 상담해 드리겠습니다. 🐶💕','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781078571882_b2lid2.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781078572127_4au0hy.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781078572334_q9p0ij.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781078572540_ukdpaz.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781078573716_yq5r29.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 08:02:53');
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(7,'골든리트리버','순딩이',150,200,'2026-04-10',0,'https://www.youtube.com/shorts/XkrMu8fnMWE','전국','암컷','2개월','2차 접종 완료',0,replace('💛 사랑스러운 골든리트리버 공주님 가족을 찾습니다 💛\n\n밝고 순한 성격이 매력적인 2개월 골든리트리버 여아를 소개합니다. 부드러운 황금빛 털과 동그란 눈망울, 통통한 체형이 너무나 사랑스러운 아이입니다. 사람을 좋아하고 애교가 많아 처음 만나는 사람에게도 금세 다가가는 친화력을 가지고 있으며, 호기심이 많고 활발하게 뛰어노는 건강한 모습을 보여주고 있습니다.\n\n골든리트리버는 온순하고 영리한 성격으로 세계적으로 많은 사랑을 받는 견종입니다. 특히 아이는 보호자와의 교감을 좋아하고 사람 곁에 머무는 것을 즐기는 성향을 가지고 있어 가족견으로 매우 적합합니다.\n\n현재 건강하게 성장 중이며 기본적인 건강관리와 위생관리를 꾸준히 진행하고 있습니다. 평생 함께할 따뜻한 가족을 기다리고 있으며, 단순한 분양이 아닌 소중한 인연을 이어간다는 마음으로 상담해 드리고 있습니다. 사랑과 책임감으로 아이를 가족으로 맞이해 주실 보호자님의 문의를 기다립니다. 🐶💕','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781079365177_2gm6kb.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781079365401_t8xi09.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781079365631_x6va9h.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781079365860_a1gerl.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781079366087_ca0li6.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 08:16:06');
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(8,'말티푸','크리미',160,160,'2026-04-06',0,NULL,'전국','수컷','2개월','2차접종 완료',0,replace('🤍 크림색 말티푸 왕자님 가족을 찾습니다 🤍\n\n사랑스러운 2개월 크림색 말티푸 남아를 소개합니다. 부드러운 크림빛 털과 동그란 눈망울, 곰인형을 닮은 귀여운 외모가 매력적인 아이입니다. 작은 체구에 애교가 넘치고 사람을 좋아하는 성격을 가지고 있어 처음 만나는 사람에게도 금세 다가와 관심을 표현하는 사랑스러운 왕자님입니다.\n\n말티푸는 말티즈의 애교와 푸들의 영리함을 함께 가진 견종으로 많은 사랑을 받고 있습니다. 이 아이 역시 호기심이 많고 밝은 성격을 가지고 있으며 장난감을 가지고 노는 것을 좋아하고 보호자와 교감하는 시간을 즐깁니다. 품에 안기면 얌전하게 안겨 있는 순한 모습도 함께 가지고 있어 더욱 매력적입니다.\n\n현재 건강하게 성장 중이며 기본적인 건강관리와 위생관리를 꾸준히 진행하고 있습니다. 크림색의 은은하고 고급스러운 모색과 풍성한 털, 사랑스러운 외모를 가진 특별한 아이입니다.\n\n평생 함께할 따뜻한 가족을 기다리고 있습니다. 단순한 분양이 아닌 소중한 인연을 이어간다는 마음으로 상담해 드리고 있으니 궁금하신 사항은 언제든 편하게 문의해 주세요. 사랑과 책임감으로 아이를 가족으로 맞이해 주실 보호자님의 연락을 기다립니다. 🐶💕','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781094812100_sahu3p.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781094812341_8f6c2r.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781094812626_39cea1.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781094812840_4il305.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781094813160_s77kt9.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 12:33:33');
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(9,'푸들','장난감',125,NULL,'2026-04-01',0,NULL,'전국','수컷','2개월','',0,replace('🧸 똑똑한 토이푸들 왕자님 가족을 찾습니다 🧸\n\n사랑스러운 2개월 토이푸들 남아를 소개합니다. 동글동글한 눈망울과 풍성한 곱슬털, 귀여운 외모는 물론 토이푸들 특유의 영리함까지 갖춘 매력적인 아이입니다. 사람을 좋아하고 애교가 많아 보호자 곁을 졸졸 따라다니며 관심과 사랑을 표현하는 사랑스러운 성격을 가지고 있습니다.\n\n토이푸들은 세계적으로 지능이 높은 견종으로 알려져 있으며 보호자와의 교감 능력이 뛰어나 교육과 훈련 적응력이 좋은 편입니다. 이 아이 역시 호기심이 많고 주변 환경에 대한 관심이 높아 성장 과정에서 더욱 기대가 되는 아이입니다. 장난감을 가지고 노는 것을 좋아하고 새로운 것을 배우는 데에도 적극적인 모습을 보여주고 있습니다.\n\n현재 건강하게 성장 중이며 기본적인 건강관리와 위생관리를 꾸준히 진행하고 있습니다. 실내 생활에 적합하고 털 날림이 비교적 적어 많은 분들에게 사랑받는 견종입니다.\n\n평생 함께할 가족을 기다리고 있습니다. 단순한 분양이 아닌 소중한 인연을 이어간다는 마음으로 상담해 드리고 있으니 궁금하신 사항은 언제든 편하게 문의해 주세요. 사랑과 책임감으로 아이를 가족으로 맞이해 주실 보호자님의 연락을 기다립니다. 🐶💙','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095079015_4svmtk.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095079288_t06chv.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095079512_pn7xgm.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095079751_n55aas.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095079968_t9xfq3.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 12:38:00');
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(10,'보더콜리','콜리',145,180,'2026-03-09',0,NULL,'전국','암컷','3개월','접종완료',0,replace('🖤🤍 똑똑하고 사랑스러운 보더콜리 공주님 가족을 찾습니다 🤍🖤\n\n사랑스러운 3개월 보더콜리 여아를 소개합니다. 초롱초롱한 눈망울과 매력적인 모색, 균형 잡힌 체형을 가진 건강하고 활발한 아이입니다. 사람을 좋아하고 애교가 많으며 보호자와 함께하는 시간을 즐기는 사랑스러운 성격을 가지고 있습니다.\n\n보더콜리는 세계적으로 가장 영리한 견종 중 하나로 알려져 있으며 학습 능력과 집중력이 뛰어난 것이 큰 장점입니다. 이 아이 역시 호기심이 많고 새로운 환경에 대한 적응력이 좋아 성장 과정이 더욱 기대되는 아이입니다. 사람과의 교감을 좋아하고 주변 상황을 세심하게 살피는 똑똑한 모습을 자주 보여주고 있습니다.\n\n현재 건강하게 성장 중이며 기본 건강관리와 위생관리를 꾸준히 진행하고 있습니다. 활발하면서도 보호자에게 애정을 표현하는 따뜻한 성격을 가지고 있어 가족과 함께하는 반려견으로 매우 매력적인 아이입니다.\n\n평생 함께할 따뜻한 가족을 기다리고 있습니다. 단순한 분양이 아닌 소중한 인연을 이어간다는 마음으로 상담해 드리고 있으니 궁금하신 사항은 언제든 편하게 문의해 주세요. 사랑과 책임감으로 아이를 가족으로 맞이해 주실 보호자님의 연락을 기다립니다. 🐶💕','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095265408_nbhkep.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095265659_muoaoh.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095265864_px7q1x.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095266262_xe7fbh.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095266475_vfai41.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 12:41:06');
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(11,'시바견','세봉',140,190,'2026-03-26',0,NULL,'전국','암컷','2개월','접종 완료',0,replace('🧡 사랑스러운 시바견 공주님 가족을 찾습니다 🧡\n\n귀여운 2개월 시바견 여아를 소개합니다. 동그란 눈망울과 쫑긋 선 귀, 폭신한 털과 귀여운 표정이 매력적인 아이입니다. 아직 아기 강아지답게 호기심이 많고 활발하며, 주변을 탐색하는 것을 좋아하는 건강한 공주님입니다.\n\n시바견은 영리하고 깔끔한 성격으로 많은 사랑을 받는 견종입니다. 독립심이 있으면서도 보호자와의 교감을 중요하게 생각하며, 함께 시간을 보내다 보면 깊은 유대감을 형성하는 매력이 있습니다. 이 아이 역시 사람을 좋아하고 애교가 많아 보호자 곁에 다가와 관심을 표현하는 사랑스러운 모습을 보여주고 있습니다.\n\n현재 건강하게 성장 중이며 기본적인 건강관리와 위생관리를 꾸준히 진행하고 있습니다. 균형 잡힌 체형과 맑은 눈빛, 건강한 컨디션을 갖춘 아이로 앞으로의 성장이 더욱 기대되는 공주님입니다.\n\n평생 함께할 따뜻한 가족을 기다리고 있습니다. 단순한 분양이 아닌 소중한 인연을 이어간다는 마음으로 상담해 드리고 있으니 궁금하신 사항은 언제든 편하게 문의해 주세요. 사랑과 책임감으로 아이를 가족으로 맞이해 주실 보호자님의 연락을 기다립니다. 🐶💕','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095678215_q4f2ha.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095678463_d5yqwu.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095678701_fnwq4g.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095679013_ohfjbf.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095679301_dtewmy.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 12:47:59');
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(12,'불독','불불',105,120,'2026-04-01',0,NULL,'전국','수컷','2개월','2차 접종 완료',0,replace('🤎 듬직하고 사랑스러운 불독 왕자님 가족을 찾습니다 🤎\n\n귀여운 2개월 불독 남아를 소개합니다. 통통한 체형과 매력적인 주름, 동그란 눈망울이 돋보이는 사랑스러운 왕자님입니다. 아직 아기 강아지답게 호기심이 많고 장난기 넘치는 성격을 가지고 있으며, 사람을 무척 좋아해 보호자 곁에서 애교를 부리는 모습을 자주 보여주고 있습니다.\n\n불독은 듬직한 외모와 달리 온순하고 애정이 많은 성격으로 많은 사랑을 받는 견종입니다. 가족과 함께하는 시간을 좋아하며 보호자에게 깊은 애착을 형성하는 것이 특징입니다. 이 아이 역시 사람과의 교감을 즐기고 품에 안기면 얌전하게 안겨 있는 순한 모습을 가지고 있습니다.\n\n현재 건강하게 성장 중이며 기본적인 건강관리와 위생관리를 꾸준히 진행하고 있습니다. 탄탄한 골격과 건강한 컨디션, 귀여운 외모까지 갖춘 매력적인 아이로 앞으로의 성장이 더욱 기대됩니다.\n\n평생 함께할 따뜻한 가족을 기다리고 있습니다. 단순한 분양이 아닌 소중한 인연을 이어간다는 마음으로 상담해 드리고 있으니 궁금하신 사항은 언제든 편하게 문의해 주세요. 사랑과 책임감으로 아이를 가족으로 맞이해 주실 보호자님의 연락을 기다립니다. 🐶💙','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095912926_1ka67n.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095913293_cvjkds.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095913546_6at0g7.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095913776_5zcmbv.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781095914013_rd9hmz.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 12:51:54');
INSERT INTO "dogs" ("id","breed","nickname","price","original_price","birthday","is_negotiable","video_url","region","gender","age","vaccine","neutered","description","images","status","seller_id","created_at") VALUES(13,'웰쉬코기 카디건','웰웰',156,178,'2026-03-31',0,NULL,'전국','암컷','2개월','2차 접종 완료',0,replace('🧡 사랑스러운 웰시코기 공주님 가족을 찾습니다 🧡\n\n귀여운 2개월 웰시코기 여아를 소개합니다. 짧고 앙증맞은 다리와 쫑긋 선 귀, 초롱초롱한 눈망울이 매력적인 사랑스러운 공주님입니다. 아직 아기 강아지답게 호기심이 많고 활발하며, 사람을 좋아해 보호자 곁을 졸졸 따라다니며 애교를 부리는 모습을 자주 보여주고 있습니다.\n\n웰시코기는 밝고 명랑한 성격과 뛰어난 친화력으로 많은 사랑을 받는 견종입니다. 가족과 함께하는 시간을 좋아하고 사람과의 교감 능력이 뛰어나 반려견으로 매우 인기가 높습니다. 이 아이 역시 장난감을 가지고 노는 것을 좋아하며 새로운 환경에도 호기심을 보이는 건강하고 씩씩한 성격을 가지고 있습니다.\n\n현재 건강하게 성장 중이며 기본적인 건강관리와 위생관리를 꾸준히 진행하고 있습니다. 균형 잡힌 체형과 건강한 컨디션, 귀여운 외모까지 갖춘 매력적인 아이로 앞으로의 성장이 더욱 기대되는 공주님입니다.\n\n평생 함께할 따뜻한 가족을 기다리고 있습니다. 단순한 분양이 아닌 소중한 인연을 이어간다는 마음으로 상담해 드리고 있으니 궁금하신 사항은 언제든 편하게 문의해 주세요. 사랑과 책임감으로 아이를 가족으로 맞이해 주실 보호자님의 연락을 기다립니다. 🐶💕','\n',char(10)),'["/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781096124420_0nw4cc.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781096124695_oantu7.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781096124905_15blod.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781096125196_ravpmy.jpg","/api/images?key=dogs%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781096125437_rs28tu.jpg"]','available','763956b8-a383-44ff-b31a-ef256027cbdb','2026-06-10 12:55:25');
CREATE TABLE business_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    business_name TEXT NOT NULL,
    biz_no TEXT NOT NULL,
    animal_sale_no TEXT NOT NULL,
    status TEXT DEFAULT 'pending',             -- 'pending', 'approved', 'rejected'
    rejected_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, representative_name TEXT, phone TEXT, address TEXT, file_url TEXT,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);
INSERT INTO "business_applications" ("id","user_id","business_name","biz_no","animal_sale_no","status","rejected_reason","created_at","representative_name","phone","address","file_url") VALUES(1,'763956b8-a383-44ff-b31a-ef256027cbdb','팔도댕댕','123-456-7890','123-456-7890','rejected','ff','2026-06-10 05:29:56','홍길동','010-1234-5678',NULL,NULL);
INSERT INTO "business_applications" ("id","user_id","business_name","biz_no","animal_sale_no","status","rejected_reason","created_at","representative_name","phone","address","file_url") VALUES(2,'763956b8-a383-44ff-b31a-ef256027cbdb','팔도댕댕','123-456-9876','123-456-9877','rejected','ㄹㄹㄹ','2026-06-10 05:48:08','김댕댕','000-000-0000','서울시 노원구 상계동',NULL);
INSERT INTO "business_applications" ("id","user_id","business_name","biz_no","animal_sale_no","status","rejected_reason","created_at","representative_name","phone","address","file_url") VALUES(3,'763956b8-a383-44ff-b31a-ef256027cbdb','팔도댕댕','123-456-7890','123-456-7890','rejected','ㄹㄹㄹㄹㄹ','2026-06-10 05:53:49','김댕댕','000-000-0000','서울 노원구 상계동 ','/api/images?key=business%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781070829267_jfh7as.jpg');
INSERT INTO "business_applications" ("id","user_id","business_name","biz_no","animal_sale_no","status","rejected_reason","created_at","representative_name","phone","address","file_url") VALUES(4,'763956b8-a383-44ff-b31a-ef256027cbdb','팔도댕댕','123-456-7890','1234-5678-9012','approved',NULL,'2026-06-10 05:55:23','이댕댕','010-0000-0000','서울시 노원구 상계동','/api/images?key=business%2F763956b8-a383-44ff-b31a-ef256027cbdb_1781070923541_iteybz.jpg');
CREATE TABLE store_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    rating REAL DEFAULT 5.0,                   -- 평점 (1.0 ~ 5.0)
    content TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(seller_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE
);
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    type TEXT,                                 -- 'system', 'chat', 'adoption'
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,                 -- 0: 안읽음, 1: 읽음
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);
INSERT INTO "notifications" ("id","user_id","type","message","is_read","created_at") VALUES(1,'763956b8-a383-44ff-b31a-ef256027cbdb','system','판매자 자격 신청이 반려되었습니다. (반려사유: ff)',1,'2026-06-10 05:43:42');
INSERT INTO "notifications" ("id","user_id","type","message","is_read","created_at") VALUES(2,'763956b8-a383-44ff-b31a-ef256027cbdb','system','판매자 자격 신청이 반려되었습니다. (반려사유: ㄹㄹㄹ)',1,'2026-06-10 05:52:16');
INSERT INTO "notifications" ("id","user_id","type","message","is_read","created_at") VALUES(3,'763956b8-a383-44ff-b31a-ef256027cbdb','system','판매자 자격 신청이 반려되었습니다. (반려사유: ㄹㄹㄹㄹㄹ)',1,'2026-06-10 05:54:16');
CREATE TABLE chat_rooms (
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
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY(sender_id) REFERENCES profiles(id) ON DELETE CASCADE
);
CREATE TABLE analytics_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,                              -- 비로그인 유저일 경우 NULL 허용
    dog_id INTEGER,
    breed TEXT,
    action_type TEXT DEFAULT 'view',           -- 'view' (상세조회), 'bookmark' (찜하기)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(9,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:02:56');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(10,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:02:57');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(11,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:04:26');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(12,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:04:26');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(13,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:12:27');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(14,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:12:27');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(15,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:25:08');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(16,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:25:08');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(17,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:34:40');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(18,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:34:40');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(19,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:35:46');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(20,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:35:46');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(21,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:42:17');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(22,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 08:42:18');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(23,'763956b8-a383-44ff-b31a-ef256027cbdb',3,'말티즈','view','2026-06-10 08:42:29');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(24,'763956b8-a383-44ff-b31a-ef256027cbdb',3,'말티즈','view','2026-06-10 08:42:29');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(25,'763956b8-a383-44ff-b31a-ef256027cbdb',3,'말티즈','view','2026-06-10 08:42:51');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(26,'763956b8-a383-44ff-b31a-ef256027cbdb',3,'말티즈','view','2026-06-10 08:42:51');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(27,'763956b8-a383-44ff-b31a-ef256027cbdb',5,'포메라니안','view','2026-06-10 09:07:10');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(28,'763956b8-a383-44ff-b31a-ef256027cbdb',5,'포메라니안','view','2026-06-10 09:07:10');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(29,'763956b8-a383-44ff-b31a-ef256027cbdb',4,'말티즈','view','2026-06-10 09:11:27');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(30,'763956b8-a383-44ff-b31a-ef256027cbdb',4,'말티즈','view','2026-06-10 09:11:27');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(31,'763956b8-a383-44ff-b31a-ef256027cbdb',8,'말티푸','view','2026-06-10 12:34:31');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(32,'763956b8-a383-44ff-b31a-ef256027cbdb',8,'말티푸','view','2026-06-10 12:34:31');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(33,'763956b8-a383-44ff-b31a-ef256027cbdb',8,'말티푸','view','2026-06-10 12:34:45');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(34,'763956b8-a383-44ff-b31a-ef256027cbdb',8,'말티푸','view','2026-06-10 12:34:45');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(35,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 12:34:53');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(36,'763956b8-a383-44ff-b31a-ef256027cbdb',6,'포메라니안','view','2026-06-10 12:34:53');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(37,'763956b8-a383-44ff-b31a-ef256027cbdb',3,'말티즈','view','2026-06-10 12:35:30');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(38,'763956b8-a383-44ff-b31a-ef256027cbdb',3,'말티즈','view','2026-06-10 12:35:30');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(39,'763956b8-a383-44ff-b31a-ef256027cbdb',8,'말티푸','view','2026-06-10 12:35:39');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(40,'763956b8-a383-44ff-b31a-ef256027cbdb',8,'말티푸','view','2026-06-10 12:35:39');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(41,'763956b8-a383-44ff-b31a-ef256027cbdb',12,'불독','view','2026-06-11 10:18:28');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(42,'763956b8-a383-44ff-b31a-ef256027cbdb',12,'불독','view','2026-06-11 10:18:28');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(43,'763956b8-a383-44ff-b31a-ef256027cbdb',3,'말티즈','view','2026-06-11 10:18:43');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(44,'763956b8-a383-44ff-b31a-ef256027cbdb',3,'말티즈','view','2026-06-11 10:18:43');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(45,'763956b8-a383-44ff-b31a-ef256027cbdb',3,'말티즈','view','2026-06-11 10:27:02');
INSERT INTO "analytics_logs" ("id","user_id","dog_id","breed","action_type","created_at") VALUES(46,'763956b8-a383-44ff-b31a-ef256027cbdb',3,'말티즈','view','2026-06-11 10:27:02');
CREATE TABLE advertisements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending',             -- 'pending', 'active', 'ended'
    budget INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,                -- 광고 기간 (일 단위)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, dog_id INTEGER REFERENCES dogs(id) ON DELETE CASCADE, ad_type TEXT DEFAULT 'main', start_date TEXT, end_date TEXT, used_coupon_id INTEGER REFERENCES user_coupons(id) ON DELETE SET NULL,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);
CREATE TABLE coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    discount_rate INTEGER DEFAULT 0,           -- 할인율 (%)
    code TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
, auto_issue_type TEXT DEFAULT 'none', valid_until TEXT);
CREATE TABLE user_coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    coupon_id INTEGER NOT NULL,
    is_used INTEGER DEFAULT 0,                 -- 0: 미사용, 1: 사용됨
    used_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, expires_at TEXT,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
);
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,                     -- 신고자 ID
    target_id INTEGER NOT NULL,                -- 신고 대상 (dogs ID)
    type TEXT,                                 -- 신고 유형 ('허위매물', '스팸' 등)
    reason TEXT,                               -- 상세 이유
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(target_id) REFERENCES dogs(id) ON DELETE CASCADE
);
CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    dog_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(dog_id) REFERENCES dogs(id) ON DELETE CASCADE,
    UNIQUE(user_id, dog_id)                    -- 중복 관심등록 방지
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('business_applications',4);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('notifications',3);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('dogs',13);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('analytics_logs',46);
