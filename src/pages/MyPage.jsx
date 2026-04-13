import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';

const regions = [
  '서울시', '인천시', '경기도', '부산시', '대구시', '대전시', '광주시', '울산시', 
  '강원도', '충청남도', '충청북도', '경상남도', '경상북도', '전라남도', '전라북도', '제주도', '세종시'
];

// 이미지 리사이징 헬퍼 함수
const resizeImage = (file, maxWidth = 1024, maxHeight = 1024) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const MyPage = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // 폼 상태 관리
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // 스토어 관리 상태
  const [storeHeader, setStoreHeader] = useState(null);
  const [storeHeaderPreview, setStoreHeaderPreview] = useState(null);
  const [storeContact, setStoreContact] = useState('');
  const [kakaoChannel, setKakaoChannel] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeUploading, setStoreUploading] = useState(false);
  const [bizNo, setBizNo] = useState('');
  const [animalSaleNo, setAnimalSaleNo] = useState('');
  const [storeImages, setStoreImages] = useState([]); // File 또는 URL 배열
  const [storeImagePreviews, setStoreImagePreviews] = useState([]);

  // 비밀번호 변경 상태
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(null);

  // 관심아이, 채팅, 통계, 관리 데이터
  const [bookmarks, setBookmarks] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [myDogs, setMyDogs] = useState([]); 
  const [dogStats, setDogStats] = useState({});
  const [chartData, setChartData] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [myNotifications, setMyNotifications] = useState([]);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // 첫 페이지는 대시보드(dashboard)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [businessApp, setBusinessApp] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (location.state?.tab === 'notifications') {
      setActiveTab('notifications');
      // 처리가 완료되면 state를 비워 리렌더링 시 반복 실행 방지
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.openRoomId && chatRooms.length > 0) {
      const room = chatRooms.find(r => r.id === location.state.openRoomId);
      if (room) {
        setSelectedRoom(room);
        setActiveTab('chats');
        // 처리가 완료되면 state를 비워 리렌더링 시 반복 실행 방지
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, chatRooms, navigate, location.pathname]);

  useEffect(() => {
    if (newPassword && confirmPassword) {
      setPasswordMatch(newPassword === confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [newPassword, confirmPassword]);

  // 대화방 실시간 업데이트 감지 (안읽음 빨간 점 등 자동 갱신)
  useEffect(() => {
    if (!session?.user?.id) return;

    const roomSubscription = supabase
      .channel('chat_rooms_list_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_rooms'
      }, () => {
        fetchChatRooms(session.user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSubscription);
    };
  }, [session?.user?.id]);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    // 관리자의 광고 만료 자동 처리 함수 호출
    await supabase.rpc('check_and_expire_ads');

    if (!session) {
      navigate('/login');
      return;
    }
    setSession(session);

    // 1. 프로필
    let { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profileData) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert([{ 
          id: session.user.id, 
          nickname: session.user.user_metadata?.nickname || '새로운가족',
          role: 'user',
          grade: 'Bronze'
        }])
        .select().single();
      profileData = newProfile;
    }

    if (profileData) {
      setProfile(profileData);
      setNickname(profileData.nickname || '팔도회원');
      setPhone(profileData.phone || '');
      setAddress(profileData.address || '');
      setProfileImage(profileData.profile_image || null);

      setStoreHeader(profileData.store_header_image || null);
      setStoreContact(profileData.store_contact || '');
      setKakaoChannel(profileData.kakao_channel || '');
      setStoreDescription(profileData.store_description || '');
      setStoreAddress(profileData.store_address || '');
      setBizNo(profileData.biz_no || '');
      setAnimalSaleNo(profileData.animal_sale_no || '');
      
      const additionalImgs = profileData.store_additional_images || [];
      setStoreImages(additionalImgs);
      setStoreImagePreviews(additionalImgs);
    }

    // 2. 찜 목록
    const { data: bookmarkData } = await supabase
      .from('bookmarks')
      .select('dogs(*)')
      .eq('user_id', session.user.id);

    if (bookmarkData) {
      const activeDogs = bookmarkData.map(b => b.dogs).filter(d => d && d.status === 'available');
      setBookmarks(activeDogs);
    }

    // 3. 채팅방 및 알림
    if (session.user.id) {
      fetchChatRooms(session.user.id);
      fetchMyNotifications(session.user.id);
    }

    // 4. 사업자 신청
    const { data: bData } = await supabase
      .from('business_applications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle();
    setBusinessApp(bData);

    // 5. 사업자 기능: 게시물, 통계, 쿠폰 등
    if (profileData && (profileData.role === 'seller' || profileData.role === 'admin')) {
      await fetchSellerData(session.user.id);
      
      const { data: couponsData } = await supabase
        .from('user_coupons')
        .select(`
          *,
          coupons:coupon_id(*)
        `)
        .eq('user_id', session.user.id);
      if (couponsData) {
        // 데이터 구조 평탄화 (렌더링 편의를 위해)
        const formatted = couponsData.map(uc => ({
          ...uc,
          // Join 결과가 null일 경우(RLS 등)를 대비한 대체값 적용
          coupon_name: uc.coupons?.display_name || '광고 쿠폰',
          benefit_type: uc.coupons?.benefit_type || 'ad_exemption'
        }));
        setUserCoupons(formatted);
      }
    }

    setLoading(false);
  };

  const fetchSellerData = async (userId) => {
    // 1. 내 게시물 가져오기
    const { data: dogsData } = await supabase
      .from('dogs')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    setMyDogs(dogsData || []);

    // 2. 게시물별 통계 가져오기 (새로운 RPC 호출)
    const { data: statsData } = await supabase
      .rpc('get_seller_dog_stats', { target_seller_id: userId });

    const statsMap = {};
    if (statsData) {
      statsData.forEach(item => {
        statsMap[item.dog_id] = { views: Number(item.view_count) || 0, likes: Number(item.like_count) || 0 };
      });
    }
    setDogStats(statsMap);

    // 3. 차트용 일간 전역 통계 가져오기 (새로운 RPC 호출)
    const { data: dailyData } = await supabase
      .rpc('get_seller_daily_views', { target_seller_id: userId });

    let chartArr = [];
    if (dailyData && dailyData.length > 0) {
      chartArr = dailyData.map(d => ({
        date: new Date(d.view_date).toLocaleDateString(), 
        views: Number(d.daily_views) || 0
      }));
    } else {
      // 데이터가 없으면 오늘 기준으로 0점 더미 추가
      chartArr.push({ date: new Date().toLocaleDateString(), views: 0 });
    }
    setChartData(chartArr);
  };

  const fetchChatRooms = async (userId) => {
    // 1. 채팅방 기본 정보와 닉네임 가져오기
    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select(`
        *, 
        dogs(nickname, breed, image_url), 
        buyer:profiles!chat_rooms_buyer_id_fkey(nickname, profile_image), 
        seller:profiles!chat_rooms_seller_id_fkey(nickname, profile_image)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    
    if (rooms && rooms.length > 0) {
      // 2. 판매자들의 업체명(business_name) 추가로 가져오기
      const sellerIds = [...new Set(rooms.map(r => r.seller_id))];
      const { data: bizData } = await supabase
        .from('business_applications')
        .select('user_id, business_name')
        .in('user_id', sellerIds)
        .eq('status', 'approved');
      
      // 3. 업체명 매핑
      const enrichedRooms = rooms.map(room => {
        const biz = bizData?.find(b => b.user_id === room.seller_id);
        return {
          ...room,
          seller_business_name: biz?.business_name || room.seller?.nickname || '판매자'
        };
      });
      
      setChatRooms(enrichedRooms);
    } else {
      setChatRooms([]);
    }
  };

  const fetchMyNotifications = async (userId) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setMyNotifications(data);
  };

  const handleReadAllNotifications = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id);
    setMyNotifications(prev => prev.map(n => ({...n, is_read: true})));
    
    // 헤더 및 다른 탭에 즉시 동기화 신호 전송
    await supabase.channel(`public:notifications:${session.user.id}`).send({
      type: 'broadcast',
      event: 'REFRESH_NOTIFICATIONS',
      payload: { userId: session.user.id }
    });

    alert('모두 읽음 처리되었습니다.');
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    let result = '';
    if (value.length < 4) result = value;
    else if (value.length < 7) result = value.substr(0, 3) + '-' + value.substr(3);
    else if (value.length < 11) result = value.substr(0, 3) + '-' + value.substr(3, 3) + '-' + value.substr(6);
    else result = value.substr(0, 3) + '-' + value.substr(3, 4) + '-' + value.substr(7);
    setPhone(result);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    let avatarUrl = profileImage;

    try {
      if (profileImagePreview && typeof profileImage !== 'string') {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `profile_${session.user.id}_${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('business-docs').upload(fileName, profileImage);
        if (!uploadError) {
          const { data } = supabase.storage.from('business-docs').getPublicUrl(fileName);
          avatarUrl = data.publicUrl;
        }
      }

      const { error } = await supabase.from('profiles').update({ nickname, phone, address, profile_image: avatarUrl }).eq('id', session.user.id);
      if (!error) {
        alert('저장되었습니다.');
        setIsEditingProfile(false);
        setProfile({ ...profile, nickname, phone, address, profile_image: avatarUrl });
        setProfileImage(avatarUrl);
      } else {
        alert('저장 실패: ' + error.message);
      }
    } catch (err) {
      alert('저장 실패: ' + err.message);
    }
    setLoading(false);
  };

  const handleUpdateStore = async () => {
    setStoreUploading(true);
    let bannerUrl = storeHeader;

    try {
      if (storeHeaderPreview && storeHeader) {
        // 이미지가 객체(File)인 경우 새롭게 업로드
        if (typeof storeHeader !== 'string') {
          const fileExt = storeHeader.name.split('.').pop();
          const fileName = `store_${session.user.id}_${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('business-docs').upload(fileName, storeHeader);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('business-docs').getPublicUrl(fileName);
          bannerUrl = data.publicUrl;
        }
      }

      // 스토어 추가 사진첩 업로드 처리
      const finalStoreImages = [];
      for (const img of storeImages) {
        if (typeof img === 'string') {
          finalStoreImages.push(img); // 기존 URL 유지
        } else {
          // 신규 파일 업로드
          const fileExt = img.name.split('.').pop();
          const fileName = `store_gallery_${session.user.id}_${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('business-docs').upload(fileName, img);
          if (!uploadError) {
            const { data } = supabase.storage.from('business-docs').getPublicUrl(fileName);
            finalStoreImages.push(data.publicUrl);
          }
        }
      }

      const { error } = await supabase.from('profiles').update({
        store_header_image: bannerUrl,
        store_contact: storeContact,
        kakao_channel: kakaoChannel,
        store_description: storeDescription,
        store_address: storeAddress,
        biz_no: bizNo,
        animal_sale_no: animalSaleNo,
        store_additional_images: finalStoreImages
      }).eq('id', session.user.id);

      if (error) throw error;
      alert('스토어 정보가 저장되었습니다.');
      setStoreHeader(bannerUrl);
      setStoreImages(finalStoreImages);
      setStoreImagePreviews(finalStoreImages);
    } catch (err) {
      alert('저장 실패: ' + err.message);
    } finally {
      setStoreUploading(false);
    }
  };

  const handleStoreImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (storeImages.length + files.length > 10) {
      alert('스토어 사진은 최대 10장까지만 등록 가능합니다.');
      return;
    }

    const newImages = [...storeImages];
    const newPreviews = [...storeImagePreviews];

    for (const file of files) {
      // 리사이징 처리
      const resizedBlob = await resizeImage(file);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      
      newImages.push(resizedFile);
      newPreviews.push(URL.createObjectURL(resizedBlob));
    }

    setStoreImages(newImages);
    setStoreImagePreviews(newPreviews);
  };

  const removeStoreImage = (index) => {
    setStoreImages(prev => prev.filter((_, i) => i !== index));
    setStoreImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePassword = async () => {
    if (!passwordMatch || newPassword.length < 6) return alert('비밀번호를 확인해주세요.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      alert('비밀번호가 변경되었습니다.');
      setNewPassword(''); setConfirmPassword(''); setIsChangingPassword(false);
    } else {
      alert(error.message);
    }
  };

  const handleDeletePost = async (dogId) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    const { error } = await supabase.from('dogs').delete().eq('id', dogId);
    if (!error) {
      alert('삭제되었습니다.');
      setMyDogs(prev => prev.filter(d => d.id !== dogId));
    }
  };

  const handleCompleteAdoption = async (dogId) => {
    if (!window.confirm('분양 완료 처리를 진행합니다.\n\n※ 서버 용량 확보를 위해 해당 사진/게시물은 즉시 삭제되며, 스토어 누적 달성 카운트는 1회 증가합니다. 진행하시겠습니까?')) return;
    
    const currentCount = profile.completed_adoption_count || 0;
    const newCount = currentCount + 1;

    // 1. 프로필 테이블에 분양 건수 증가 업데이트
    const { error: updateError } = await supabase.from('profiles').update({ completed_adoption_count: newCount }).eq('id', session.user.id);
    
    if (updateError) {
      return alert('완료 처리 실패: ' + updateError.message);
    }

    // 2. 해당 개시물 원본에서 영구 삭제
    const { error: deleteError } = await supabase.from('dogs').delete().eq('id', dogId);
    
    if (!deleteError) {
      alert(`분양 완료 처리되었습니다! (누적 완료 달성: ${newCount}건)`);
      setProfile({ ...profile, completed_adoption_count: newCount });
      setMyDogs(prev => prev.filter(d => d.id !== dogId));
    }
  };

  const handleEditPost = (dog) => navigate('/upload', { state: { editDog: dog } });

  if (loading && !profile) {
    return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
  }

  const isSeller = profile?.role === 'seller' || profile?.role === 'admin';
  const totalViews = Object.values(dogStats).reduce((acc, curr) => acc + curr.views, 0);

  const navBtnStyle = (tabId) => ({
    width: '100%', padding: '15px 20px', borderRadius: '12px', border: 'none',
    backgroundColor: activeTab === tabId ? 'var(--primary-dark)' : 'transparent',
    color: activeTab === tabId ? 'white' : '#555',
    textAlign: 'left', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: '10px'
  });

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 3fr', gap: '30px' }}>
          
          {/* 사이드바 */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {profile?.profile_image ? (
                  <img src={profile.profile_image} alt="프사" style={{ ...avatarStyle, objectFit: 'cover' }} />
                ) : (
                  <div style={avatarStyle}>🐶</div>
                )}
                <h3 style={{ margin: '15px 0 5px', fontWeight: '800', fontSize: '1.2rem' }}>{profile?.nickname}</h3>
                <p style={{ color: '#999', fontSize: '0.85rem' }}>{session?.user?.email}</p>
                {isSeller && <span style={{ display: 'inline-block', marginTop: '10px', padding: '4px 10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>⭐ 인증 사업자</span>}
              </div>

              {/* 내비게이션 메뉴 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle('dashboard')}>🏠 대시보드</button>
                {isSeller && (
                  <>
                    <button onClick={() => navigate('/upload')} style={{ ...navBtnStyle('upload'), color: 'var(--primary)', fontWeight: '900' }}>➕ 분양등록</button>
                    <button onClick={() => setActiveTab('posts')} style={navBtnStyle('posts')}>🐶 게시물관리</button>
                    <button onClick={() => setActiveTab('store')} style={navBtnStyle('store')}>🏪 내 스토어 관리</button>
                    <button onClick={() => setActiveTab('ads')} style={navBtnStyle('ads')}>📢 광고관리</button>
                    <button onClick={() => setActiveTab('stats')} style={navBtnStyle('stats')}>📊 통계확인</button>
                  </>
                )}
                <button onClick={() => setActiveTab('chats')} style={navBtnStyle('chats')}>💬 팔톡</button>
                <button onClick={() => setActiveTab('bookmarks')} style={navBtnStyle('bookmarks')}>💝 관심아이</button>
                <button onClick={() => setActiveTab('notifications')} style={navBtnStyle('notifications')}>🔔 알림내역</button>
              </div>

              {/* 설정, 로그아웃 */}
              <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={{ ...actionBtnStyle, fontSize: '0.85rem', marginBottom: '10px' }}>⚙️ 프로필 설정</button>
                <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} style={{ ...actionBtnStyle, color: '#ff4757', border: 'none' }}>로그아웃</button>

                {profile?.role === 'user' && (
                  !businessApp ? (
                    <button onClick={() => setIsApplyModalOpen(true)} style={{ ...actionBtnStyle, border: 'none', background: 'none', color: '#888', fontSize: '0.75rem', textDecoration: 'underline' }}>사업자로 등록하기</button>
                  ) : (
                    businessApp.status === 'pending' ? <div style={{ fontSize:'0.75rem', color:'var(--primary)', textAlign:'center' }}>사업자 등록 검토 중</div> : null
                  )
                )}
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 영역 */}
          <main>
            <div className="glass-card" style={{ padding: '40px', minHeight: '700px' }}>
              
              {/* === 프로필 편집 화면 === */}
              {isEditingProfile && (
                <div className="fade-in" style={{ marginBottom: '40px', padding: '30px', backgroundColor: '#fcfcfc', borderRadius: '15px', border: '1px solid #eee' }}>
                  <h3 style={{ marginBottom: '20px' }}>프로필 설정</h3>

                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#eee', overflow: 'hidden', flexShrink: 0 }}>
                      {profileImagePreview || profileImage ? (
                        <img src={profileImagePreview || profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="프사 미리보기" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🐶</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>프로필 사진 변경</label>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setProfileImage(file);
                          setProfileImagePreview(URL.createObjectURL(file));
                        }
                      }} style={{ ...inputStyle, padding: '8px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={labelStyle}>닉네임</label>
                      <input value={nickname} onChange={e => setNickname(e.target.value)} style={inputStyle}/>
                    </div>
                    <div>
                      <label style={labelStyle}>연락처</label>
                      <input value={phone} onChange={handlePhoneChange} placeholder="010-0000-0000" style={inputStyle}/>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>지역</label>
                      <select value={address} onChange={e => setAddress(e.target.value)} style={inputStyle}>
                        <option value="">지역 선택</option>
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <button onClick={handleUpdateProfile} style={{ ...miniBtnStyle, padding: '12px 20px' }}>저장하기</button>
                    <button onClick={() => setIsEditingProfile(false)} style={{ ...miniBtnStyle, padding: '12px 20px', marginLeft: '10px', backgroundColor: '#eee', color: '#666' }}>취소</button>
                  </div>

                  {/* 비밀번호 변경 구역 */}
                  <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    {!isChangingPassword ? (
                       <button onClick={() => setIsChangingPassword(true)} style={{ ...actionBtnStyle, width: 'auto', padding: '8px 15px', fontSize: '0.85rem' }}>비밀번호 변경하기</button>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px', maxWidth: '300px' }}>
                        <input type="password" placeholder="새 비밀번호" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
                        <input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ ...inputStyle, borderColor: passwordMatch === false ? '#FF5252' : (passwordMatch ? 'var(--primary)' : '#eee') }} />
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={handleUpdatePassword} style={miniBtnStyle}>변경 완료</button>
                          <button onClick={() => setIsChangingPassword(false)} style={{ ...miniBtnStyle, backgroundColor: '#eee', color: '#666' }}>취소</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === 하위 탭 콘텐츠 === */}
              {activeTab === 'dashboard' && (
                <div className="fade-in">
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '30px' }}>{profile?.nickname}님의 대시보드</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    {isSeller ? (
                      <>
                        <StatBox title="총 방문자 분석" value={totalViews} suffix="명" color="#F5A623" icon="👀" onClick={() => setActiveTab('stats')} />
                        <StatBox title="전체 게시물" value={myDogs.length} suffix="건" color="var(--primary)" icon="🐶" onClick={() => setActiveTab('posts')} />
                        <StatBox title="진행중인 팔톡" value={chatRooms.length} suffix="건" color="#4A90E2" icon="💬" onClick={() => setActiveTab('chats')} />
                      </>
                    ) : (
                      <>
                        <StatBox title="관심아이" value={bookmarks.length} suffix="마리" color="var(--primary)" icon="💝" onClick={() => setActiveTab('bookmarks')} />
                        <StatBox title="진행중인 팔톡" value={chatRooms.length} suffix="건" color="#F5A623" icon="💬" onClick={() => setActiveTab('chats')} />
                      </>
                    )}
                  </div>
                  
                  {/* 최신 알림 및 요약 */}
                  <div style={{ padding: '20px', backgroundColor: '#fcfcfc', borderRadius: '15px', border: '1px solid #eee' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>최근 대화 (팔톡)</h3>
                    {chatRooms.slice(0, 3).map(room => (
                      <div 
                        key={room.id} 
                        onClick={() => {
                          setSelectedRoom(room);
                          setActiveTab('chats');
                        }} 
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', padding: '12px 15px', borderBottom: '1px solid #eee', borderRadius: '10px', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div><b>{room.dogs?.nickname}</b>에 대한 문의 ({room.last_message})</div>
                        <div style={{ color: '#888', fontSize: '0.85rem' }}>{new Date(room.updated_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                    {chatRooms.length === 0 && <div style={{ color: '#aaa', fontSize: '0.9rem' }}>최근 대화 내역이 없습니다.</div>}
                  </div>
                </div>
              )}

              {activeTab === 'posts' && isSeller && (
                <div className="fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>게시물 관리</h2>
                    <button onClick={() => navigate('/upload')} style={miniBtnStyle}>+ 새 분양등록</button>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                          <th style={thStyle}>사진</th>
                          <th style={thStyle}>견종/이름</th>
                          <th style={thStyle}>지역/가격</th>
                          <th style={thStyle}>성과 (조회/찜)</th>
                          <th style={thStyle}>상태</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myDogs.map(dog => (
                          <tr key={dog.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tdStyle}><img src={dog.image_url} alt="dog" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}/></td>
                            <td style={tdStyle}>
                              <strong>{dog.breed}</strong><br/>
                              <span style={{ fontSize: '0.85rem', color: '#666' }}>{dog.nickname} ({dog.gender})</span>
                            </td>
                            <td style={tdStyle}>{dog.region}<br/><b>{dog.price === 0 ? '무료' : dog.price + '만'}</b></td>
                            <td style={tdStyle}>
                              <div style={{ fontSize: '0.85rem', color: '#666' }}>👀 조회: <b>{dogStats[dog.id]?.views || 0}</b></div>
                              <div style={{ fontSize: '0.85rem', color: '#ff6b6b' }}>💝 찜: <b>{dogStats[dog.id]?.likes || 0}</b></div>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ padding: '4px 8px', backgroundColor: '#eefbe7', color: '#7ed321', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>분양중</span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <button onClick={() => handleCompleteAdoption(dog.id)} style={{ ...tableBtnStyle, backgroundColor: '#7ed321', color: 'white', fontWeight: 'bold' }}>💖 분양완료</button>
                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                  <button onClick={() => handleEditPost(dog)} style={{ ...tableBtnStyle, flex: 1 }}>수정</button>
                                  <button onClick={() => handleDeletePost(dog.id)} style={{ ...tableBtnStyle, backgroundColor: '#ff6b6b', color: 'white', flex: 1 }}>삭제</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {myDogs.length === 0 && <div style={emptyStyle}>등록된 분양글이 없습니다.</div>}
                  </div>
                </div>
              )}

              {activeTab === 'store' && isSeller && (
                <div className="fade-in">
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '30px' }}>내 스토어 관리</h2>
                  <div style={{ padding: '30px', backgroundColor: '#fcfcfc', borderRadius: '15px', border: '1px solid #eee' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={labelStyle}>상단 배너 이미지 (16:9 비율 권장, 자동 크롭)</label>
                      {storeHeaderPreview || storeHeader ? (
                        <div style={{ position: 'relative', marginBottom: '10px' }}>
                          <img src={storeHeaderPreview || storeHeader} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '10px', display: 'block' }} alt="배너 미리보기" />
                          <button onClick={() => { setStoreHeader(null); setStoreHeaderPreview(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>삭제</button>
                        </div>
                      ) : null}
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setStoreHeader(file);
                          setStoreHeaderPreview(URL.createObjectURL(file));
                        }
                      }} style={inputStyle} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={labelStyle}>상호명 (자동 연동)</label>
                        <input value={businessApp?.business_name || '등록된 상호명 없음'} disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5', color: '#888' }} />
                      </div>
                      <div>
                         <label style={labelStyle}>사업자등록번호</label>
                         <input value={bizNo} onChange={e => setBizNo(e.target.value)} placeholder="000-00-00000" style={inputStyle} />
                      </div>
                      <div>
                         <label style={labelStyle}>동물판매등록번호</label>
                         <input value={animalSaleNo} onChange={e => setAnimalSaleNo(e.target.value)} placeholder="제0000-0000-0000호" style={inputStyle} />
                      </div>
                      <div>
                         <label style={labelStyle}>스토어 문의 연락처</label>
                         <input value={storeContact} onChange={e => setStoreContact(e.target.value)} placeholder="010-0000-0000" style={inputStyle} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={labelStyle}>카카오채널 URL (선택)</label>
                      <input value={kakaoChannel} onChange={e => setKakaoChannel(e.target.value)} placeholder="예: http://pf.kakao.com/_xxxxxx" style={inputStyle} />
                      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>등록하면 상세 페이지에 '카카오톡으로 상담하기' 버튼이 노출됩니다.</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                        <span>스토어 소개글</span>
                        <span style={{ color: storeDescription.length > 500 ? 'red' : '#999' }}>{storeDescription.length}/500</span>
                      </label>
                      <textarea value={storeDescription} onChange={e => setStoreDescription(e.target.value)} maxLength={500} rows={4} placeholder="스토어를 멋지게 소개해 주세요. (최대 500자)" style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                      <label style={labelStyle}>스토어 실 주소</label>
                      <input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="오프라인 매장 주소를 입력해 주세요." style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                      <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                        <span>스토어 사진첩 (최대 10장, 웹 최적화 리사이징 적용)</span>
                        <span>{storeImages.length} / 10</span>
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                        {storeImagePreviews.map((src, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eee' }}>
                            <img src={src} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt={`스토어 사진 ${idx + 1}`} />
                            <button 
                              onClick={() => removeStoreImage(idx)} 
                              style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,107,107,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {storeImages.length < 10 && (
                          <label style={{ width: '100%', paddingTop: '100%', position: 'relative', border: '2px dashed #ddd', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexDirection: 'column', gap: '5px', color: '#888', gridColumn: 'auto' }}>
                             <input type="file" accept="image/*" multiple onChange={handleStoreImagesChange} style={{ display: 'none' }} />
                             <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                               <span style={{ fontSize: '1.5rem' }}>+</span>
                               <span style={{ fontSize: '0.8rem' }}>사진 추가</span>
                             </div>
                          </label>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button onClick={handleUpdateStore} disabled={storeUploading} style={{ ...miniBtnStyle, padding: '12px 30px', fontSize: '1rem' }}>
                        {storeUploading ? '저장 중...' : '스토어 정보 저장하기'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ads' && isSeller && (
                <div className="fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>광고 관리</h2>
                  </div>
                  
                  <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                          <th style={thStyle}>사진</th>
                          <th style={thStyle}>견종/이름</th>
                          <th style={thStyle}>상태</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>광고 설정</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myDogs.map(dog => (
                          <tr key={dog.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tdStyle}><img src={dog.image_url} alt="dog" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}/></td>
                            <td style={tdStyle}>
                              <strong>{dog.breed}</strong><br/>
                              <span style={{ fontSize: '0.85rem', color: '#666' }}>{dog.nickname} ({dog.gender})</span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ padding: '4px 8px', backgroundColor: '#eefbe7', color: '#7ed321', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>분양중</span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button onClick={() => navigate(`/ad-setup/${dog.id}`)} style={{ ...tableBtnStyle, backgroundColor: 'var(--primary-dark)', color: 'white', border: 'none', fontWeight: 'bold', padding: '10px 15px' }}>📢 광고 설정하기</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {myDogs.length === 0 && <div style={emptyStyle}>등록된 분양글이 없습니다.</div>}
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '15px' }}>보유 쿠폰 목록</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                    {userCoupons.length > 0 ? userCoupons.map(coupon => (
                      <div key={coupon.id} style={{ padding: '20px', border: '1px solid #eee', borderRadius: '15px', backgroundColor: '#fffbf0', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '50px', height: '50px', backgroundColor: '#ffd700', borderRadius: '50%', opacity: 0.2 }}></div>
                        <h4 style={{ margin: '0 0 10px 0', color: '#e6a800' }}>🎁 {coupon.coupon_name}</h4>
                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>
                          {(() => {
                             const type = coupon.benefit_type;
                             if (type === 'ad_exemption') return '일반 광고비 100% 면제';
                             if (type === 'ad_main') return '메인 최상단 광고 1회 이용권';
                             if (type === 'ad_safe_1m') return '안심분양 강조 광고 (1개월)';
                             if (type === 'ad_popular_1m') return '인기분양 강조 광고 (1개월)';
                             if (type === 'ad_special_1m') return '스페셜분양 강조 광고 (1개월)';
                             if (type && type.startsWith('post_reg')) {
                                const m = type.split('_')[2];
                                return `게시물 등록 ${m} 쿠폰 (월 20개 가능)`;
                             }
                             return '플랫폼 서비스 이용 쿠폰';
                          })()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: coupon.is_used ? '#aaa' : 'var(--primary)', fontWeight: 'bold' }}>{coupon.is_used ? '사용 완료' : '사용 가능'}</div>
                      </div>
                    )) : (
                      <div style={{ color: '#aaa', fontSize: '0.9rem', padding: '20px', border: '1px dashed #ddd', borderRadius: '10px', textAlign: 'center' }}>보유 중인 광고 쿠폰이 없습니다.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && isSeller && (
                <div className="fade-in">
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '30px' }}>통계 확인</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '30px' }}>
                    <div className="glass-card" style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>최근 7일 조회수 트렌드</h3>
                      <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" fontSize={12} stroke="#999" />
                            <YAxis fontSize={12} stroke="#999" />
                            <RechartsTooltip />
                            <Line type="monotone" dataKey="views" name="일별방문자" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>인기 게시물 통계 (찜 많은 순)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {myDogs.sort((a,b) => (dogStats[b.id]?.likes || 0) - (dogStats[a.id]?.likes || 0)).slice(0, 4).map((dog, idx) => (
                          <div key={dog.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '30px', height: '30px', backgroundColor: idx === 0 ? 'var(--primary)' : '#eee', color: idx === 0 ? 'white' : '#555', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{idx + 1}</div>
                            <img src={dog.image_url} style={{ width: '40px', height: '40px', borderRadius: '5px', objectFit: 'cover' }} alt=""/>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{dog.nickname} ({dog.breed})</div>
                              <div style={{ color: '#888', fontSize: '0.8rem' }}>찜 {dogStats[dog.id]?.likes || 0}개</div>
                            </div>
                          </div>
                        ))}
                        {myDogs.length === 0 && <div style={{ color: '#ccc' }}>통계 데이터가 없습니다.</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'chats' && (
                <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px', height: '700px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #eee', overflow: 'hidden' }}>
                  {/* 좌측: 대화 목록 */}
                  <div style={{ borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>팔톡 대화목록</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {chatRooms.length === 0 ? (
                        <div style={{ ...emptyStyle, paddingTop: '50px' }}>진행 중인 대화가 없습니다.</div>
                      ) : (
                        chatRooms.map(room => (
                          <div 
                            key={room.id} 
                            onClick={async () => {
                              setSelectedRoom(room);
                              // 읽음 처리 로직 (DB 업데이트)
                              const isBuyer = session.user.id === room.buyer_id;
                              const updateData = isBuyer ? { buyer_has_unread: false } : { seller_has_unread: false };
                              await supabase.from('chat_rooms').update(updateData).eq('id', room.id);
                              
                              // 로컬 상태 즉시 갱신 (빨간 점 제거)
                              setChatRooms(prev => prev.map(r => r.id === room.id ? { ...r, ...updateData } : r));
                            }} 
                            style={{ 
                              ...chatRoomItemStyle, 
                              borderRadius: '0', 
                              border: 'none', 
                              borderBottom: '1px solid #f5f5f5',
                              backgroundColor: selectedRoom?.id === room.id ? '#fff0f0' : 'white',
                              transition: 'all 0.2s',
                              position: 'relative'
                            }}
                          >
                            <img src={room.dogs?.image_url} alt="dog" style={{ width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   {/* 상대방 정보 표시 (구매자/판매자에 따라 다름) */}
                                   <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                     {session.user.id === room.buyer_id ? (
                                       // 내가 구매자라면: 업체명 - 강아지
                                       <span style={{ color: 'var(--primary-dark)' }}>{room.seller_business_name} <span style={{ fontWeight: '400', color: '#888', fontSize: '0.9rem' }}>- {room.dogs?.nickname}</span></span>
                                     ) : (
                                       // 내가 판매자라면: 구매자닉네임 - 강아지
                                       <span style={{ color: '#333' }}>{room.buyer?.nickname} <span style={{ fontWeight: '400', color: '#888', fontSize: '0.9rem' }}>- {room.dogs?.nickname}</span></span>
                                     )}
                                   </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                   {/* 안읽음 표시 */}
                                   {((session.user.id === room.buyer_id && room.buyer_has_unread) || 
                                     (session.user.id === room.seller_id && room.seller_has_unread)) && (
                                     <span style={{ width: '8px', height: '8px', backgroundColor: '#e63946', borderRadius: '50%' }}></span>
                                   )}
                                   {/* 게시물 바로가기 버튼 */}
                                   <button 
                                     onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       window.open(`/detail?id=${room.dog_id}`, '_blank');
                                     }}
                                     style={{ 
                                       padding: '3px 8px', 
                                       fontSize: '0.75rem', 
                                       backgroundColor: 'var(--primary-dark)', 
                                       color: 'white', 
                                       border: 'none', 
                                       borderRadius: '6px', 
                                       cursor: 'pointer',
                                       fontWeight: 'bold',
                                       minWidth: '70px'
                                     }}
                                   >
                                     게시물 🔗
                                   </button>
                                </div>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{room.last_message || '대화를 시작해주세요.'}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 우측: 대화 세부 창 */}
                  <div style={{ height: '100%', backgroundColor: '#fcfcfc', position: 'relative' }}>
                    {selectedRoom ? (
                      <ChatWindow 
                        room={selectedRoom} 
                        userId={session.user.id} 
                        onClose={() => { 
                          setSelectedRoom(null); 
                          fetchChatRooms(session.user.id); 
                        }} 
                      />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💬</div>
                        <div>대화방을 선택하여 상담을 시작해 보세요.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'bookmarks' && (
                <div className="fade-in">
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '30px' }}>관심아이</h2>
                  {bookmarks.length === 0 ? (
                    <div style={emptyStyle}>아직 찜한 아이가 없네요.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                      {bookmarks.map(dog => (
                        <Card key={dog.id} type="small" data={{ ...dog, image: dog.image_url, date: new Date(dog.created_at).toLocaleDateString() }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>알림 내역</h2>
                    {myNotifications.length > 0 && (
                      <button onClick={handleReadAllNotifications} style={{ ...miniBtnStyle, backgroundColor: '#eee', color: '#666' }}>모두 읽음 처리</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {myNotifications.length === 0 ? (
                      <div style={emptyStyle}>받은 알림이 없습니다.</div>
                    ) : (
                      myNotifications.map(n => (
                        <div key={n.id} style={{ ...chatRoomItemStyle, backgroundColor: n.is_read ? '#fafafa' : '#fff', borderLeft: n.is_read ? '1px solid #eee' : '5px solid var(--primary-dark)', paddingLeft: '25px', opacity: n.is_read ? 0.7 : 1 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', fontWeight: 'bold', marginBottom: '5px' }}>
                              {n.type === 'chat' && '💬 팔톡 메시지'}
                              {n.type === 'bookmark' && '💝 새로운 찜'}
                              {n.type === 'coupon' && '🎁 쿠폰 도착'}
                              {n.type === 'system' && '📢 전체 공지'}
                            </div>
                            <div style={{ fontSize: '1.05rem', color: '#333', fontWeight: n.is_read ? 'normal' : 'bold' }}>{n.message}</div>
                            <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '10px' }}>{new Date(n.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {isApplyModalOpen && <BusinessApplyModal userId={session.user.id} onClose={() => setIsApplyModalOpen(false)} onSuccess={setBusinessApp} />}
    </div>
  );
};

// --- 자식 컴포넌트: 통계 박스 ---
const StatBox = ({ title, value, suffix, color, icon, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      padding: '25px', 
      borderRadius: '20px', 
      border: '1px solid #eee', 
      backgroundColor: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '20px', 
      boxShadow: '0 5px 15px rgba(0,0,0,0.02)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => { if(onClick) e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }}
    onMouseLeave={(e) => { if(onClick) e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.02)'; }}
  >
    <div style={{ width: '50px', height: '50px', borderRadius: '15px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{icon}</div>
    <div>
      <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '5px' }}>{title}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#333' }}>{(value || 0).toLocaleString()}<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>{suffix}</span></div>
    </div>
  </div>
);

// --- 나머지 기존 컴포넌트들 (BusinessApplyModal, ChatWindow) ---
const BusinessApplyModal = ({ userId, onClose, onSuccess }) => {
  const [form, setForm] = useState({ bizName: '', repName: '', phone: '', address: '', bizNo: '', animalNo: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('사업자등록증 파일을 첨부해 주세요.');
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('business-docs').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('business-docs').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('business_applications').insert([{
        user_id: userId, business_name: form.bizName, representative_name: form.repName,
        phone: form.phone, address: form.address, biz_no: form.bizNo, animal_sale_no: form.animalNo, file_url: publicUrl
      }]);
      if (dbError) throw dbError;

      alert('사업자 등록 신청 완료!');
      onClose();
      const { data } = await supabase.from('business_applications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      onSuccess(data);
    } catch (err) {
      alert('신청 실패: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div className="glass-card" style={{ width: '450px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '10px' }}>사업자 등록 신청</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
          <div><label style={labelStyle}>사업장 이름</label><input required style={inputStyle} value={form.bizName} onChange={e => setForm({...form, bizName: e.target.value})} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>대표 이름</label><input required style={inputStyle} value={form.repName} onChange={e => setForm({...form, repName: e.target.value})} /></div>
            <div><label style={labelStyle}>핸드폰</label><input required style={inputStyle} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          </div>
          <div><label style={labelStyle}>주소</label><input required style={inputStyle} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div><label style={labelStyle}>사업자등록번호</label><input required style={inputStyle} value={form.bizNo} onChange={e => setForm({...form, bizNo: e.target.value})} /></div>
          <div><label style={labelStyle}>동물판매업번호</label><input required style={inputStyle} value={form.animalNo} onChange={e => setForm({...form, animalNo: e.target.value})} /></div>
          <div><label style={labelStyle}>파일첨부</label><input type="file" required onChange={e => setFile(e.target.files[0])} /></div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" disabled={uploading} style={{ ...miniBtnStyle, flex: 1, padding: '15px' }}>확인</button>
            <button type="button" onClick={onClose} style={{ ...miniBtnStyle, backgroundColor: '#eee', color: '#666', flex: 1 }}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChatWindow = ({ room, userId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef();

  const fetchMessages = async () => {
    const { data } = await supabase.from('chat_messages').select('*').eq('room_id', room.id).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase.channel(`room_${room.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${room.id}` }, (payload) => {
      setMessages(prev => [...prev, payload.new]);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room.id]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { 
      room_id: room.id, 
      sender_id: userId, 
      content: input, 
      created_at: new Date().toISOString() 
    };

    // 로컬 상태 즉시 업데이트 (메시지가 바로 뜨도록)
    setMessages(prev => [...prev, newMessage]);
    const currentInput = input;
    setInput('');

    const { error } = await supabase.from('chat_messages').insert([newMessage]);
    if (!error) {
      // 상대방을 '안읽음' 상태로 업데이트
      const isBuyer = userId === room.buyer_id;
      const updateData = { 
        last_message: currentInput, 
        updated_at: new Date().toISOString(),
        [isBuyer ? 'seller_has_unread' : 'buyer_has_unread']: true 
      };
      await supabase.from('chat_rooms').update(updateData).eq('id', room.id);
    } else {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  };

  const getAvatar = (msg) => {
    if (msg.sender_id === room.buyer_id) return room.buyer?.profile_image;
    if (msg.sender_id === room.seller_id) return room.seller?.profile_image;
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ ...chatHeaderStyle }}>
        <div><div style={{ fontWeight: '800' }}>{room.dogs?.nickname} 상담</div></div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }} 
          style={{ 
            background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer',
            padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          &times;
        </button>
      </div>
      <div ref={scrollRef} style={messageAreaStyle}>
        {messages.map((msg, i) => {
           const isMe = msg.sender_id === userId;
           const avatarUrl = getAvatar(msg);
           return (
             <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', marginBottom: '15px' }}>
               <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#eee', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="프사" /> : <span style={{ fontSize: '1.2rem' }}>🐶</span>}
               </div>
               <div style={{ padding: '10px 15px', borderRadius: '15px', maxWidth: '70%', backgroundColor: isMe ? 'var(--primary)' : '#f0f0f0', color: isMe ? 'white' : '#333' }}>
                 {msg.content}
               </div>
             </div>
           );
        })}
      </div>
      <form onSubmit={sendMessage} style={chatInputAreaStyle}>
        <input value={input} onChange={(e) => setInput(e.target.value)} style={chatInputStyle} />
        <button type="submit" style={sendBtnStyle}>전송</button>
      </form>
    </div>
  );
};

const avatarStyle = { width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: '3px solid white', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' };
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--muted-text)', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', outline: 'none', backgroundColor: 'white', fontSize: '0.95rem' };
const actionBtnStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' };
const miniBtnStyle = { padding: '8px 15px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-dark)', color: 'white', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '700' };
const emptyStyle = { textAlign: 'center', color: '#ccc', paddingTop: '100px', fontSize: '1.1rem' };
const chatRoomItemStyle = { display: 'flex', gap: '15px', padding: '20px', borderRadius: '15px', border: '1px solid #eee', cursor: 'pointer', backgroundColor: 'white' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const chatHeaderStyle = { padding: '20px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const messageAreaStyle = { flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column' };
const chatInputAreaStyle = { padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: 'white' };
const chatInputStyle = { flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #eee', outline: 'none' };
const sendBtnStyle = { padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '800', cursor: 'pointer' };
const thStyle = { padding: '12px', fontSize: '0.85rem', color: '#666' };
const tdStyle = { padding: '12px', fontSize: '0.9rem', color: '#444' };
const tableBtnStyle = { padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.8rem' };

export default MyPage;
