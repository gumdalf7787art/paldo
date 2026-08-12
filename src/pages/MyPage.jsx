/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import { useMobile } from '../context/MobileContext';
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
  const { isMobile } = useMobile();
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
  const [myAds, setMyAds] = useState([]);
  const [dogStats, setDogStats] = useState({});
  const [chartData, setChartData] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [myNotifications, setMyNotifications] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // 첫 페이지는 대시보드(dashboard)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [businessApp, setBusinessApp] = useState(null);

  // [임시 그룹 분류] 향후 UI 분기 처리를 위한 상태 정의
  const isSellerGroup1 = profile?.role === 'seller' && profile?.email === 'blueprime1@daum.net';
  const isSellerGroup2 = profile?.role === 'seller' && profile?.email !== 'blueprime1@daum.net';
  const isAdmin = profile?.role === 'admin';
  const isBuyer = profile?.role === 'buyer';

  useEffect(() => {
    fetchInitialData();
    
    const handleNotificationsUpdate = () => {
      fetchMyNotifications();
    };
    
    const handleBookmarkToggled = (e) => {
      const { dogId, bookmarked } = e.detail;
      // 관심 해제된 경우 목록에서 즉시 제거
      if (!bookmarked) {
        setBookmarks(prev => prev.filter(b => b.id !== dogId));
      }
    };
    
    window.addEventListener('notifications-updated', handleNotificationsUpdate);
    window.addEventListener('bookmark-toggled', handleBookmarkToggled);
    
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdate);
      window.removeEventListener('bookmark-toggled', handleBookmarkToggled);
    };
  }, []);
  const [paymentResultMsg, setPaymentResultMsg] = useState(null);

  // [Effect 1] URL 파라미터 / router state 감지 → sessionStorage에 저장
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // 토스페이 등 리다이렉트 결제 완료 (m_redirect_url로 넘어올 때)
    const paymentDone = searchParams.get('payment_done');
    const impUid = searchParams.get('imp_uid');
    const merchantUid = searchParams.get('merchant_uid');
    const impSuccess = searchParams.get('imp_success');

    if (paymentDone === 'true' && impUid && merchantUid) {
      // 1. URL에서 결제 관련 파라미터 추출
      const amount = searchParams.get('amount') || 0;
      const adId = searchParams.get('ad_id') || '';
      const payMethod = searchParams.get('pay_method') || 'tosspay';

      // 2. 서버로 결제 검증 (Verify) 요청 - 이 과정을 거쳐야 DB에 내역이 저장됨!
      api.payment.verify(impUid, merchantUid, amount, adId, payMethod).then(({ data, error }) => {
        if (error) {
          sessionStorage.setItem('paymentResult', JSON.stringify({ type: 'error', text: `❌ 결제 검증 실패: ${error}` }));
        } else {
          // 토스페이 리다이렉트 완료 → sessionStorage에 결과 저장
          sessionStorage.setItem('paymentResult', JSON.stringify({ type: 'success', text: '✅ 결제가 성공적으로 완료되었습니다! 멤버십 이용권이 지급되었습니다.' }));
        }
        
        // 결제 결과 리다이렉트로 돌아온 것이므로 무조건 결제 내역 탭으로 이동
        setActiveTab('payments');
        navigate('/mypage', { replace: true, state: {} });
        
        // 결제 내역 즉시 새로고침 (검증 로직 완료 후 호출)
        api.payment.getHistory().then(({ data: historyData }) => {
          if (historyData) setPaymentHistory(historyData);
        });
      });
    } else if (impUid && merchantUid) {
      // 기타 imp_uid 파라미터가 붙어 돌아오는 경우 (결제 도중 취소/실패 또는 파라미터 유실 등)
      if (impSuccess === 'false') {
        const errorMsg = searchParams.get('error_msg') || '결제에 실패하였습니다.';
        sessionStorage.setItem('paymentResult', JSON.stringify({ type: 'error', text: `❌ 결제 실패: ${errorMsg}` }));
        navigate('/mypage', { replace: true, state: {} });
      } else {
        // 성공인데 payment_done 등 다른 파라미터가 유실된 경우 복구 로직
        const match = merchantUid.match(/merchant_ad_(\d+)/);
        const adId = match ? match[1] : '';
        api.payment.verify(impUid, merchantUid, 0, adId, 'tosspay').then(({ data, error }) => {
          if (error) {
            sessionStorage.setItem('paymentResult', JSON.stringify({ type: 'error', text: `❌ 결제 검증 실패: ${error}` }));
          } else {
            sessionStorage.setItem('paymentResult', JSON.stringify({ type: 'success', text: '✅ 결제가 성공적으로 완료되었습니다! 멤버십 이용권이 지급되었습니다.' }));
          }
          setActiveTab('payments');
          navigate('/mypage', { replace: true, state: {} });
          api.payment.getHistory().then(({ data: historyData }) => {
            if (historyData) setPaymentHistory(historyData);
          });
        });
      }
    }

    // React Router state로 넘어오는 경우 (PC 콜백)
    if (location.state?.paymentSuccess) {
      sessionStorage.setItem('paymentResult', JSON.stringify({ type: 'success', text: '✅ 결제가 성공적으로 완료되었습니다! 멤버십 이용권이 지급되었습니다.' }));
      if (location.state?.openTab) setActiveTab(location.state.openTab);
      const newState = { ...location.state };
      delete newState.paymentSuccess;
      delete newState.openTab;
      navigate(location.pathname, { replace: true, state: newState });
      
      // 결제 내역 즉시 새로고침
      api.payment.getHistory().then(({ data }) => { if (data) setPaymentHistory(data); });
    } else if (location.state?.paymentError) {
      sessionStorage.setItem('paymentResult', JSON.stringify({ type: 'error', text: `❌ 결제 실패: ${location.state.paymentError}` }));
      const newState = { ...location.state };
      delete newState.paymentError;
      navigate(location.pathname, { replace: true, state: newState });
    } else if (location.state?.paymentReady && location.state?.vbank) {
      const v = location.state.vbank;
      const formattedDate = v.date ? new Date(v.date).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
      const msgText = `✅ 가상계좌 발급 완료! [${v.name} ${v.num}] / 금액: ${v.amount ? v.amount.toLocaleString() : '100'}원 / 기한: ${formattedDate} 까지 입금해주세요.`;
      sessionStorage.setItem('paymentResult', JSON.stringify({ type: 'success', text: msgText, vbankInfo: `${v.name} ${v.num}` }));
      if (location.state?.openTab) setActiveTab(location.state.openTab);
      const newState = { ...location.state };
      delete newState.paymentReady;
      delete newState.vbank;
      delete newState.openTab;
      window.history.replaceState(newState, '', '/mypage');
      // 결제 내역 즉시 새로고침
      api.payment.getHistory().then(({ data }) => { if (data) setPaymentHistory(data); });
    }
  }, [location.search, location.state]);

  // [Effect 2] sessionStorage에 결제 결과가 있으면 꺼내서 모달 표시 (Effect 1 이후 렌더링에서 실행됨)
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedResult = sessionStorage.getItem('paymentResult');
      if (storedResult) {
        try {
          setPaymentResultMsg(JSON.parse(storedResult));
          sessionStorage.removeItem('paymentResult');
        } catch (e) {
          console.error('결제 결과 파싱 실패', e);
        }
      }
    }, 300); // 300ms 딜레이로 React 렌더링 완료 후 실행 보장
    return () => clearTimeout(timer);
  }); // 의존성 배열 없음 = 매 렌더링마다 체크

  useEffect(() => {
    if (paymentResultMsg && paymentResultMsg.type === 'error') {
      const timer = setTimeout(() => {
        setPaymentResultMsg(null);
      }, 7000); // 에러 메시지만 7초 후 자동 닫힘
      return () => clearTimeout(timer);
    }
  }, [paymentResultMsg]);

  useEffect(() => {
    if (location.state?.tab === 'notifications') {
      setActiveTab('notifications');
      // 처리가 완료되면 state를 비워 리렌더링 시 반복 실행 방지
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.activeTab === 'chats' || location.state?.openRoomId) {
      if (activeTab !== 'chats') {
        setActiveTab('chats');
      }

      if (location.state.openRoomId) {
        if (chatRooms.length > 0) {
          const room = chatRooms.find(r => r.id === location.state.openRoomId);
          if (room) {
            setSelectedRoom(room);
            // 처리가 완료되면 state를 비워 리렌더링 시 반복 실행 방지
            navigate(location.pathname, { replace: true, state: {} });
          }
        }
      } else {
        // 방 ID 정보는 없고 단순 탭 전환만 필요한 경우 state를 비워 리렌더링 시 반복 방지
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, chatRooms, navigate, location.pathname, activeTab]);



  useEffect(() => {
    if (newPassword && confirmPassword) {
      setPasswordMatch(newPassword === confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [newPassword, confirmPassword]);


  const fetchInitialData = async () => {
    setLoading(true);
    const { data: sessionData } = await api.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      navigate('/login');
      return;
    }
    setSession(session);

    // 1. 프로필
    const { data: profileData } = await api.auth.getUser();

    if (profileData) {
      setProfile(profileData);
      setNickname(profileData.nickname || '팔도댕댕회원');
      setPhone(profileData.phone || '');
      setAddress(profileData.address || '');
      setProfileImage(profileData.profile_image || null);

      setStoreHeader(profileData.store_header_image || null);
      setStoreContact(profileData.store_contact || '');
      setStoreDescription(profileData.store_description || '');
      setStoreAddress(profileData.store_address || '');
      setBizNo(profileData.biz_no || '');
      setAnimalSaleNo(profileData.animal_sale_no || '');
      
      const additionalImgs = profileData.store_additional_images || [];
      setStoreImages(additionalImgs);
      setStoreImagePreviews(additionalImgs);
    }

    // 2. 찜 목록
    const { data: bookmarkData } = await api.bookmarks.getList();

    if (bookmarkData) {
      const activeDogs = bookmarkData.map(b => b.dogs || b).filter(d => d && d.status === 'available');
      setBookmarks(activeDogs);
    }

    // 3. 채팅방 및 알림
    if (session.user.id) {
      fetchChatRooms(session.user.id);
      fetchMyNotifications(session.user.id);
    }

    // 4. 사업자 신청
    const { data: bData } = await api.business.getLastApplication();
    setBusinessApp(bData);

    // 5. 사업자 기능: 게시물, 통계, 쿠폰 등
    if (profileData && (profileData.role === 'seller' || profileData.role === 'admin')) {
      await fetchSellerData(session.user.id);
      
      const { data: couponsData } = await api.coupons.getMyCoupons();
      if (couponsData && !couponsData.error) {
        setUserCoupons(couponsData);
      }
    }

    setLoading(false);
  };

  const fetchSellerData = async (userId) => {
    // 1. 내 게시물 가져오기
    const { data: dogsData } = await api.dogs.getList({ seller_id: userId });
    setMyDogs(dogsData || []);

    // 1.5. 진행 중인 내 광고 가져오기
    const { data: adsData } = await api.ads.getList({ user_id: userId, status: 'active' });
    setMyAds(adsData || []);

    // 2. 게시물별 통계 가져오기
    const statsMap = {};
    if (dogsData) {
      dogsData.forEach(item => {
        statsMap[item.id] = { views: Number(item.views_count) || 0, likes: Number(item.bookmarks_count) || 0 };
      });
    }
    setDogStats(statsMap);

    // 3. 차트용 일간 전역 통계 가져오기
    const { data: statsData } = await api.admin.getStats();
    let chartArr = [];
    if (statsData && statsData.dailyViews && statsData.dailyViews.length > 0) {
      chartArr = statsData.dailyViews.map(d => ({
        date: d.date, 
        views: Number(d.views) || 0
      }));
    } else {
      chartArr.push({ date: new Date().toLocaleDateString(), views: 0 });
    }
    setChartData(chartArr);

    // 4. 결제 내역 가져오기
    const { data: historyData } = await api.payment.getHistory();
    if (historyData) {
      setPaymentHistory(historyData);
    }
  };

  const fetchChatRooms = async () => {
    const { data: rooms } = await api.chat.getRooms();
    if (rooms && rooms.length > 0) {
      const enrichedRooms = rooms.map(room => {
        return {
          ...room,
          dogs: {
            nickname: room.dog_nickname,
            breed: room.dog_breed,
            image_url: room.dog_image_url
          },
          buyer: {
            nickname: room.buyer_nickname,
            profile_image: room.buyer_profile_image
          },
          seller: {
            nickname: room.seller_nickname,
            profile_image: room.seller_profile_image
          },
          seller_business_name: room.seller_nickname || '판매자'
        };
      });
      setChatRooms(enrichedRooms);
    } else {
      setChatRooms([]);
    }
  };

  const fetchMyNotifications = async () => {
    const { data } = await api.notifications.getList();
    if (data) setMyNotifications(data);
  };

  // 대화방 실시간 업데이트 감지 (폴링 방식으로 교체)
  useEffect(() => {
    if (!session?.user?.id) return;

    fetchChatRooms(session.user.id);
    const intervalId = setInterval(() => {
      fetchChatRooms(session.user.id);
    }, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [session?.user?.id]);

  const getAdInfo = (dogId) => {
    const activeAd = myAds.find(ad => ad.id === dogId && ad.ad_status === 'active');
    if (!activeAd) return null;
    
    const endDate = new Date(activeAd.end_date);
    const diff = endDate - new Date();
    const remainDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    const typeMap = { 'main': '메인 메인배너', 'breed': '품종별 메인배너', 'safe': '메인 안심분양', 'popular': '메인 인기분양', 'special': '메인 스페셜분양' };
    
    return {
      type: typeMap[activeAd.ad_type] || activeAd.ad_type,
      remainDays: remainDays > 0 ? remainDays : 0
    };
  };

  const renderAdName = (name) => {
    if (!name) return name;
    if (name.includes('메인페이지')) {
      const suffix = name.replace('메인페이지', '').trim();
      return <><span style={{ color: '#4A90E2' }}>메인페이지</span> <span style={{ color: '#333' }}>{suffix}</span></>;
    } else if (name.includes('품종별페이지')) {
      const suffix = name.replace('품종별페이지', '').trim();
      return <><span style={{ color: '#7ED321' }}>품종별페이지</span> <span style={{ color: '#333' }}>{suffix}</span></>;
    }
    return <span style={{ color: '#333' }}>{name}</span>;
  };

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    await api.notifications.markAsRead(id);
    setMyNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    // 헤더 상태 동기화용
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const handleReadAllNotifications = async () => {
    const { error } = await api.notifications.markAllAsRead();
    if (!error) {
      setMyNotifications(prev => prev.map(n => ({...n, is_read: true})));
      alert('모두 읽음 처리되었습니다.');
    } else {
      alert('알림 읽음 처리 실패: ' + error);
    }
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
        const resizedBlob = await resizeImage(profileImage);
        const fileName = profileImage?.name || 'avatar.jpg';
        const { data: uploadData, error: uploadError } = await api.uploadFile(resizedBlob, fileName);
        if (uploadError || !uploadData) {
          throw new Error(uploadError || '프로필 이미지 업로드에 실패했습니다.');
        }
        avatarUrl = uploadData.url;
      }

      const { error } = await api.auth.updateProfile({ nickname, phone, address, profile_image: avatarUrl });
      if (!error) {
        alert('저장되었습니다.');
        setIsEditingProfile(false);
        setProfile({ ...profile, nickname, phone, address, profile_image: avatarUrl });
        setProfileImage(avatarUrl);
        setProfileImagePreview(null);
        window.dispatchEvent(new Event('auth-change'));
      } else {
        alert('저장 실패: ' + error);
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
        if (typeof storeHeader !== 'string') {
          const resizedBlob = await resizeImage(storeHeader);
          const fileName = storeHeader?.name || 'banner.jpg';
          const { data: uploadData, error: uploadError } = await api.uploadFile(resizedBlob, fileName);
          if (uploadError || !uploadData) {
            throw new Error(uploadError || '배너 이미지 업로드에 실패했습니다.');
          }
          bannerUrl = uploadData.url;
        }
      }

      const finalStoreImages = [];
      for (const img of storeImages) {
        if (typeof img === 'string') {
          finalStoreImages.push(img);
        } else {
          const { data: uploadData, error: uploadError } = await api.uploadFile(img);
          if (uploadError || !uploadData) {
            throw new Error(uploadError || '스토어 이미지 업로드에 실패했습니다.');
          }
          finalStoreImages.push(uploadData.url);
        }
      }

      const { error } = await api.auth.updateProfile({
        store_header_image: bannerUrl || null,
        store_contact: storeContact || null,
        kakao_channel: null,
        store_description: storeDescription || null,
        store_address: storeAddress || null,
        store_additional_images: finalStoreImages || []
      });

      if (error) throw new Error(error);
      alert('스토어 정보가 저장되었습니다.');
      const { data: updatedProfile } = await api.auth.getUser();
      if (updatedProfile) {
        setProfile(updatedProfile);
        setStoreHeader(updatedProfile.store_header_image);
        setStoreHeaderPreview(null);
        setStoreImages(updatedProfile.store_additional_images || []);
        setStoreImagePreviews(updatedProfile.store_additional_images || []);
      }
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
    const { error } = await api.auth.updatePassword(newPassword);
    if (!error) {
      alert('비밀번호가 변경되었습니다.');
      setNewPassword(''); setConfirmPassword(''); setIsChangingPassword(false);
    } else {
      alert(error);
    }
  };

  const handleDeletePost = async (dogId) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    const { error } = await api.dogs.delete(dogId);
    if (!error) {
      alert('삭제되었습니다.');
      setMyDogs(prev => prev.filter(d => d.id !== dogId));
    } else {
      alert('삭제 실패: ' + error);
    }
  };

  const handleCompleteAdoption = async (dogId) => {
    if (!window.confirm('분양 완료 처리를 진행합니다.\n\n※ 서버 용량 확보를 위해 해당 사진/게시물은 즉시 삭제되며, 스토어 누적 달성 카운트는 1회 증가합니다. 진행하시겠습니까?')) return;
    
    const currentCount = profile.completed_adoption_count || 0;
    const newCount = currentCount + 1;

    const { error: updateError } = await api.auth.updateProfile({ completed_adoption_count: newCount });
    if (updateError) {
      return alert('완료 처리 실패: ' + updateError);
    }

    const { error: deleteError } = await api.dogs.delete(dogId);
    if (!deleteError) {
      alert(`분양 완료 처리되었습니다! (누적 완료 달성: ${newCount}건)`);
      setProfile({ ...profile, completed_adoption_count: newCount });
      setMyDogs(prev => prev.filter(d => d.id !== dogId));
    } else {
      alert('완료 후 게시물 제거 실패: ' + deleteError);
    }
  };

  const handleCancelPayment = async (paymentId) => {
    if (!window.confirm('정말로 결제를 취소하시겠습니까?\n\n* 취소 요청은 접수 후 관리자 승인을 거쳐 실제 환불 처리됩니다.')) return;
    
    setLoading(true);
    const { error } = await api.payment.requestCancel(paymentId);
    setLoading(false);

    if (error) {
      alert('취소 요청 중 오류가 발생했습니다: ' + error);
    } else {
      alert('✅ 결제 취소 요청이 정상적으로 접수되었습니다.\n(관리자 확인 후 최종 취소 완료 처리됩니다)');
      // 상태 업데이트
      setPaymentHistory(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'cancel_requested' } : p));
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

  // 모바일 탭 네비게이션용 메뉴 목록
  const navItems = [
    { id: 'dashboard', label: '🏠 대시보드' },
    ...(isSeller ? [
      { id: 'upload', label: '➕ 분양등록', action: () => navigate('/upload') },
      { id: 'posts', label: '🐶 게시물' },
      { id: 'store', label: '🏪 스토어' },
      { id: 'ads', label: '📢 비즈니스 서비스' },
      { id: 'payments', label: '💳 결제 관리' },
      { id: 'adStore', label: '🛒 단건구매 스토어', action: () => navigate('/ad-store') },
      { id: 'subscription', label: '💎 정기구매 스토어', action: () => navigate('/subscription') },
      { id: 'stats', label: '📊 통계' },
    ] : []),
    { id: 'chats', label: '💬 다잇톡' },
    { id: 'bookmarks', label: '💝 관심아이' },
    { id: 'notifications', label: '🔔 알림' },
  ];

  if (isMobile) {
    return (
      <div className="mobile-mypage-container" style={{ padding: '15px 15px 80px', backgroundColor: '#fdfdfd', minHeight: '100vh', position: 'relative' }}>
        {/* 결제 결과 풀스크린 커스텀 모달 */}
        {paymentResultMsg && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#fff', borderRadius: '16px', padding: '30px 20px', width: '100%', maxWidth: '380px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center', animation: 'fadeInDown 0.3s ease-out forwards',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'
            }}>
              <div style={{ fontSize: '48px' }}>{paymentResultMsg.type === 'success' ? '🎉' : '⚠️'}</div>
              <div style={{ fontWeight: '900', fontSize: '1.25rem', color: paymentResultMsg.type === 'success' ? '#234e52' : '#742a2a' }}>
                {paymentResultMsg.type === 'success' ? '결제 완료' : '결제 실패'}
              </div>
              <div style={{ color: '#4a5568', fontSize: '0.95rem', wordBreak: 'keep-all', lineHeight: '1.5', margin: '10px 0' }}>
                {paymentResultMsg.text}
              </div>
              {paymentResultMsg.vbankInfo && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(paymentResultMsg.vbankInfo);
                    alert('계좌 정보가 클립보드에 복사되었습니다: ' + paymentResultMsg.vbankInfo);
                  }} 
                  style={{ background: '#319795', border: 'none', color: 'white', padding: '12px', width: '100%', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', marginBottom: '8px' }}
                >
                  계좌 복사
                </button>
              )}
              <button 
                onClick={() => setPaymentResultMsg(null)} 
                style={{ background: '#edf2f7', border: '1px solid #cbd5e0', color: '#4a5568', padding: '12px', width: '100%', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem' }}
              >
                확인
              </button>
            </div>
          </div>
        )}

        {/* 1. 모바일 상단 프로필 영역 */}
        {!selectedRoom && (
          <div className="glass-card" style={{ marginBottom: '15px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {profile?.profile_image ? (
              <img src={profile.profile_image} alt="프사" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            ) : (
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🐶</div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.nickname}</div>
              <div style={{ color: '#999', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.email}</div>
              {isSeller && <span style={{ display: 'inline-block', marginTop: '2px', padding: '1px 6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold' }}>⭐ 인증 사업자</span>}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #eee', backgroundColor: 'transparent', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>⚙️</button>
              <button onClick={async () => { await api.auth.logout(); navigate('/'); }} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #eee', backgroundColor: 'transparent', fontSize: '0.75rem', fontWeight: '700', color: '#ff4757', cursor: 'pointer' }}>로그아웃</button>
            </div>
          </div>
        )}

        {/* 1.1 프로필 편집 폼 (모바일 대응) */}
        {isEditingProfile && !selectedRoom && (
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#fcfcfc', borderRadius: '15px', border: '1px solid #eee' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '1rem', fontWeight: '800' }}>프로필 설정</h3>

            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eee', overflow: 'hidden', flexShrink: 0 }}>
                {profileImagePreview || profileImage ? (
                  <img src={profileImagePreview || profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="미리보기" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🐶</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ ...labelStyle, fontSize: '0.75rem', marginBottom: '4px' }}>프로필 사진 변경</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setProfileImage(file);
                    setProfileImagePreview(URL.createObjectURL(file));
                  }
                }} style={{ ...inputStyle, padding: '6px', fontSize: '0.8rem' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={labelStyle}>닉네임</label>
                <input value={nickname} onChange={e => setNickname(e.target.value)} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>연락처</label>
                <input value={phone} onChange={handlePhoneChange} placeholder="010-0000-0000" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>지역</label>
                <select value={address} onChange={e => setAddress(e.target.value)} style={inputStyle}>
                  <option value="">지역 선택</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <button onClick={handleUpdateProfile} style={{ ...miniBtnStyle, flex: 1, padding: '10px' }}>저장하기</button>
              <button onClick={() => setIsEditingProfile(false)} style={{ ...miniBtnStyle, flex: 1, padding: '10px', backgroundColor: '#eee', color: '#666' }}>취소</button>
            </div>

            {/* 비밀번호 변경 */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              {!isChangingPassword ? (
                 <button onClick={() => setIsChangingPassword(true)} style={{ ...actionBtnStyle, padding: '8px 12px', fontSize: '0.8rem' }}>비밀번호 변경하기</button>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  <input type="password" placeholder="새 비밀번호" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
                  <input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ ...inputStyle, borderColor: passwordMatch === false ? '#FF5252' : (passwordMatch ? 'var(--primary)' : '#eee') }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleUpdatePassword} style={{ ...miniBtnStyle, flex: 1 }}>변경 완료</button>
                    <button onClick={() => setIsChangingPassword(false)} style={{ ...miniBtnStyle, flex: 1, backgroundColor: '#eee', color: '#666' }}>취소</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. 모바일 가로 탭 바 */}
        {!selectedRoom && (
          <div style={{
            display: 'flex', overflowX: 'auto', gap: '8px', padding: '10px 0',
            scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch',
            marginBottom: '15px'
          }}>
            {navItems.map(item => (
              <button
                key={item.id}
                style={{
                  flexShrink: 0, whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px',
                  border: activeTab === item.id ? 'none' : '1.5px solid #eee',
                  backgroundColor: activeTab === item.id ? 'var(--primary-dark)' : 'white',
                  color: activeTab === item.id ? 'white' : '#555',
                  fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer'
                }}
                onClick={() => {
                  if (item.action) item.action();
                  else setActiveTab(item.id);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* 3. 모바일 내부 컨텐츠 영역 */}
        {!selectedRoom && activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gap: '15px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '5px 0' }}>🏠 {profile?.nickname}님의 대시보드</h3>

            {/* 파트너 사업자 심사 상태 카드 */}
            {!isSeller && businessApp && businessApp.status === 'pending' && (
              <div className="fade-in" style={{
                padding: '20px',
                backgroundColor: '#f0f9ff',
                border: '1.5px solid #bae6fd',
                borderRadius: '14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '2rem' }}>⏳</span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0369a1' }}>🔒 입점 심사가 진행 중입니다 (최대 24시간 소요)</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#0a5c85', lineHeight: '1.4', wordBreak: 'keep-all' }}>
                  제출하신 서류 및 매장 정보를 확인하고 있습니다. 심사가 완료되면 푸시 알림 및 문자로 즉시 안내해 드립니다. 조금만 기다려주세요!
                </p>
              </div>
            )}

            {!isSeller && businessApp && businessApp.status === 'rejected' && (
              <div className="fade-in" style={{
                padding: '20px',
                backgroundColor: '#fff5f5',
                border: '1.5px solid #feb2b2',
                borderRadius: '14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '2rem' }}>⚠️</span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#9b1c1c' }}>입점 심사가 반려되었습니다</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#c92a2a', fontWeight: 'bold' }}>
                  반려 사유: {businessApp.rejected_reason || '사유 미기재 (고객센터에 문의해주세요)'}
                </p>
                <p style={{ margin: '5px 0 0', fontSize: '0.75rem', color: '#868e96', lineHeight: '1.4', wordBreak: 'keep-all' }}>
                  정보를 수정하여 다시 신청하시면 신속히 재심사를 진행하겠습니다.
                </p>
                <button
                  onClick={() => setIsApplyModalOpen(true)}
                  style={{
                    marginTop: '10px',
                    padding: '10px 20px',
                    backgroundColor: '#e53e3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(229, 62, 62, 0.2)'
                  }}
                >
                  정보 수정 후 재신청하기
                </button>
              </div>
            )}



            {/* 스토어 정보 미완성 CTA 배너 */}
            {isSeller && (!storeDescription || !storeAddress || !storeContact) && (
              <div className="fade-in" style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1.5px solid #fde68a',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🏪</span>
                  <span style={{ fontWeight: '900', fontSize: '0.95rem', color: '#92400e' }}>입점 효과 극대화하기: 스토어 정보 등록</span>
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>권장</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#b45309', lineHeight: '1.5', wordBreak: 'keep-all' }}>
                  스토어 소개글, 실 주소, 문의 연락처를 모두 완성하면 구매자가 매장 위치를 지도로 확인하고 즉시 다잇톡으로 상담을 요청할 수 있습니다. 스토어 신뢰도를 높여보세요!
                </p>
                <button
                  onClick={() => setActiveTab('store')}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '5px',
                    padding: '8px 14px',
                    backgroundColor: '#d97706',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(217, 119, 6, 0.15)',
                    transition: 'all 0.2s'
                  }}
                >
                  지금 스토어 정보 등록하기 →
                </button>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {isSeller ? (
                <>
                  <div onClick={() => setActiveTab('stats')} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '14px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.2rem' }}>👀</span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>방문자 분석</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{totalViews.toLocaleString()}명</span>
                  </div>
                  <div onClick={() => setActiveTab('posts')} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '14px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.2rem' }}>🐶</span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>전체 게시물</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{myDogs.length}건</span>
                  </div>
                  <div onClick={() => setActiveTab('chats')} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '14px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '1.2rem' }}>💬</span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>진행중인 다잇톡 상담</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{chatRooms.length}건</span>
                  </div>
                </>
              ) : (
                <>
                  <div onClick={() => setActiveTab('bookmarks')} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '14px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.2rem' }}>💝</span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>관심아이</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{bookmarks.length}마리</span>
                  </div>
                  <div onClick={() => setActiveTab('chats')} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '14px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.2rem' }}>💬</span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>진행중인 다잇톡</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{chatRooms.length}건</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '14px', border: '1px solid #eee', marginTop: '5px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '12px', color: '#333' }}>최근 다잇톡 상담</h4>
              {chatRooms.slice(0, 3).map(room => (
                <div 
                  key={room.id} 
                  onClick={() => {
                    setSelectedRoom(room);
                    setActiveTab('chats');
                  }} 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '10px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#333' }}>{room.dogs?.nickname || '강아지'} 문의</div>
                    <div style={{ fontSize: '0.75rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{room.last_message}</div>
                  </div>
                  <div style={{ color: '#999', fontSize: '0.7rem', flexShrink: 0 }}>{new Date(room.updated_at).toLocaleDateString()}</div>
                </div>
              ))}
              {chatRooms.length === 0 && <div style={{ color: '#bbb', fontSize: '0.8rem', padding: '15px 0', textAlign: 'center' }}>진행 중인 대화가 없습니다.</div>}
            </div>


          </div>
        )}

        {!selectedRoom && activeTab === 'posts' && isSeller && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>🐶 게시물 관리</h3>
              <button onClick={() => navigate('/upload')} style={{ ...miniBtnStyle, fontSize: '0.75rem', padding: '6px 12px' }}>+ 새 분양등록</button>
            </div>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {myDogs.map(dog => (
                <div key={dog.id} style={{ backgroundColor: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #eee', display: 'flex', gap: '12px' }}>
                  <img src={dog.image_url} alt="dog" style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#333' }}>{dog.breed}</span>
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#eefbe7', color: '#7ed321', borderRadius: '6px', fontWeight: 'bold' }}>분양중</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                        {dog.nickname} ({dog.gender}) · {dog.region}
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--primary-dark)', marginTop: '2px' }}>
                        {dog.price === 0 ? '무료분양' : `${dog.price}만원`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px dashed #f5f5f5', paddingTop: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>
                        👀 {dogStats[dog.id]?.views || 0}  💝 {dogStats[dog.id]?.likes || 0}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleCompleteAdoption(dog.id)} style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#7ed321', color: 'white', fontWeight: 'bold', border: 'none', fontSize: '0.7rem', cursor: 'pointer' }}>분양완료</button>
                        <button onClick={() => handleEditPost(dog)} style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#edf2f7', color: '#333', border: 'none', fontSize: '0.7rem', cursor: 'pointer' }}>수정</button>
                        <button onClick={() => handleDeletePost(dog.id)} style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#fff5f5', color: '#ff4757', border: 'none', fontSize: '0.7rem', cursor: 'pointer' }}>삭제</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {myDogs.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: '0.85rem' }}>등록된 게시물이 없습니다.</div>}
            </div>
          </div>
        )}

        {!selectedRoom && activeTab === 'store' && isSeller && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '15px' }}>🏪 내 스토어 관리</h3>
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '14px', border: '1px solid #eee', display: 'grid', gap: '15px' }}>
              <div>
                <label style={labelStyle}>상단 배너 이미지 (16:9 비율 권장)</label>
                {storeHeaderPreview || storeHeader ? (
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <img src={storeHeaderPreview || storeHeader} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', display: 'block' }} alt="배너 미리보기" />
                    <button onClick={() => { setStoreHeader(null); setStoreHeaderPreview(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>삭제</button>
                  </div>
                ) : null}
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setStoreHeader(file);
                    setStoreHeaderPreview(URL.createObjectURL(file));
                  }
                }} style={{ ...inputStyle, fontSize: '0.8rem', padding: '8px' }} />
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>상호명</label>
                  <input value={businessApp?.business_name || '등록된 상호명 없음'} disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5', color: '#888' }} />
                </div>
                <div>
                   <label style={labelStyle}>사업자등록번호</label>
                   <input value={businessApp?.biz_no || bizNo || '등록된 번호 없음'} disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5', color: '#888' }} />
                </div>
                <div>
                   <label style={labelStyle}>동물판매등록번호</label>
                   <input value={businessApp?.animal_sale_no || animalSaleNo || '등록된 번호 없음'} disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5', color: '#888' }} />
                </div>
                <div>
                   <label style={labelStyle}>스토어 문의 연락처</label>
                   <input value={storeContact} onChange={e => setStoreContact(e.target.value)} placeholder="010-0000-0000" style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                    <span>스토어 소개글</span>
                    <span style={{ color: storeDescription.length > 500 ? 'red' : '#999', fontSize: '0.75rem' }}>{storeDescription.length}/500</span>
                  </label>
                  <textarea value={storeDescription} onChange={e => setStoreDescription(e.target.value)} maxLength={500} rows={4} placeholder="스토어를 멋지게 소개해 주세요." style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={labelStyle}>스토어 실 주소</label>
                  <input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="오프라인 매장 주소를 입력해 주세요." style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                  <span>스토어 사진첩</span>
                  <span>{storeImages.length}/10장</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                  {storeImagePreviews.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                      <img src={src} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      <button 
                        onClick={() => removeStoreImage(idx)} 
                        style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(255,107,107,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '9px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {storeImages.length < 10 && (
                    <label style={{ width: '100%', paddingTop: '100%', position: 'relative', border: '1.5px dashed #ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888' }}>
                       <input type="file" accept="image/*" multiple onChange={handleStoreImagesChange} style={{ display: 'none' }} />
                       <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+</span>
                         <span style={{ fontSize: '0.65rem' }}>추가</span>
                       </div>
                    </label>
                  )}
                </div>
              </div>

              <button onClick={handleUpdateStore} disabled={storeUploading} style={{ ...miniBtnStyle, width: '100%', padding: '12px', fontSize: '0.9rem', marginTop: '5px' }}>
                {storeUploading ? '저장 중...' : '스토어 정보 저장하기'}
              </button>
            </div>
          </div>
        )}

        {!selectedRoom && activeTab === 'ads' && isSeller && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>📢 비즈니스 서비스</h3>
              <button onClick={() => navigate('/ad-store')} style={{ ...miniBtnStyle, fontSize: '0.75rem', padding: '6px 12px' }}>🛒 스토어 가기</button>
            </div>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '25px' }}>
              {myDogs.map(dog => {
                const adInfo = getAdInfo(dog.id);
                return (
                  <div key={dog.id} style={{ backgroundColor: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #eee', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img src={dog.image_url} alt="dog" style={{ width: '55px', height: '55px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{dog.breed} ({dog.nickname})</div>
                      {adInfo ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 'bold' }}>{adInfo.type} 적용 중</span>
                          <span style={{ fontSize: '0.7rem', color: '#ff4757', fontWeight: 'bold' }}>{adInfo.remainDays}일 남음</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '2px' }}>적용 중인 프리미엄 서비스 없음</div>
                      )}
                    </div>
                    <button onClick={() => navigate(`/ad-setup/${dog.id}`)} style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: 'var(--primary-dark)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>설정</button>
                  </div>
                );
              })}
              {myDogs.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', padding: '30px 0', fontSize: '0.85rem' }}>등록된 게시물이 없습니다.</div>}
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '10px' }}>보유 멤버십 이용권</h4>
            <div style={{ display: 'grid', gap: '10px' }}>
              {userCoupons.map(coupon => (
                <div key={coupon.user_coupon_id} style={{ padding: '14px', border: '1px solid #eee', borderRadius: '12px', backgroundColor: '#fffbf0', position: 'relative' }}>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#e6a800', fontWeight: '800' }}>🎁 {coupon.name}</h5>
                  <div style={{ fontSize: '0.7rem', color: '#e67e22', fontWeight: 'bold', marginBottom: '4px' }}>
                    기한: {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() + ' 까지' : '제한 없음'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{coupon.description}</div>
                </div>
              ))}
              {userCoupons.length === 0 && <div style={{ color: '#aaa', fontSize: '0.8rem', padding: '15px 0', textAlign: 'center' }}>보유한 이용권이 없습니다.</div>}
            </div>
          </div>
        )}

        {!selectedRoom && activeTab === 'stats' && isSeller && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '15px' }}>📊 통계 확인</h3>
            <div style={{ backgroundColor: 'white', padding: '14px', borderRadius: '14px', border: '1px solid #eee', marginBottom: '15px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '12px', color: '#333' }}>📈 조회수 트렌드 (최근 7일)</h4>
              <div style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={9} stroke="#aaa" />
                    <YAxis fontSize={9} stroke="#aaa" />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="views" name="방문자" stroke="var(--primary)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '14px', borderRadius: '14px', border: '1px solid #eee' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '12px', color: '#333' }}>🔥 인기 게시물 (찜 기준)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myDogs.sort((a,b) => (dogStats[b.id]?.likes || 0) - (dogStats[a.id]?.likes || 0)).slice(0, 4).map((dog, idx) => (
                  <div key={dog.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '22px', height: '22px', backgroundColor: idx === 0 ? 'var(--primary)' : '#f0f0f0', color: idx === 0 ? 'white' : '#555', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem' }}>{idx + 1}</div>
                    <img src={dog.image_url} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} alt=""/>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dog.nickname} ({dog.breed})</div>
                      <div style={{ color: '#888', fontSize: '0.7rem' }}>찜 {dogStats[dog.id]?.likes || 0}개</div>
                    </div>
                  </div>
                ))}
                {myDogs.length === 0 && <div style={{ color: '#ccc', fontSize: '0.8rem', textAlign: 'center' }}>데이터가 없습니다.</div>}
              </div>
            </div>
          </div>
        )}

        {!selectedRoom && activeTab === 'payments' && isSeller && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '5px' }}>💳 결제 내역 관리</h3>
            <p style={{ color: '#777', fontSize: '0.75rem', marginBottom: '15px' }}>멤버십 서비스 및 이용권 결제 목록입니다. 클릭 시 취소가 가능합니다.</p>

            <div style={{ display: 'grid', gap: '12px' }}>
              {paymentHistory.map(payment => (
                <div key={payment.id} style={{ backgroundColor: 'white', padding: '14px', borderRadius: '12px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.7rem', color: '#999' }}>
                      {new Date(payment.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      {payment.status === 'paid' && <span style={{ padding: '2px 6px', backgroundColor: '#e6fffa', color: '#319795', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold' }}>결제완료</span>}
                      {payment.status === 'ready' && <span style={{ padding: '2px 6px', backgroundColor: '#fffaf0', color: '#dd6b20', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold' }}>입금대기</span>}
                      {payment.status === 'cancel_requested' && <span style={{ padding: '2px 6px', backgroundColor: '#edf2f7', color: '#4a5568', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold' }}>취소 대기</span>}
                      {payment.status === 'cancelled' && <span style={{ padding: '2px 6px', backgroundColor: '#fff5f5', color: '#e53e3e', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold' }}>취소완료</span>}
                      {payment.status === 'failed' && <span style={{ padding: '2px 6px', backgroundColor: '#fff5f5', color: '#c53030', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold' }}>결제실패</span>}
                    </div>
                  </div>

                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#333', marginTop: '6px' }}>{payment.item_name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '2px' }}>주문번호: {payment.merchant_uid}</div>
                  
                  {payment.status === 'ready' && payment.vbank_num && (
                    <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #f0f0f0' }}>
                      <div style={{ color: '#e67e22', fontWeight: 'bold' }}>가상계좌: {payment.vbank_name} {payment.vbank_num}</div>
                      <div style={{ color: '#666', marginTop: '2px' }}>예금주: {payment.vbank_holder}</div>
                      <div style={{ color: '#e53e3e', marginTop: '2px' }}>기한: {payment.vbank_date ? new Date(payment.vbank_date).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'} 까지</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #f9f9f9', paddingTop: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#e67e22' }}>{payment.amount.toLocaleString()}원</span>
                    {payment.status === 'paid' && (
                      <button
                        onClick={() => handleCancelPayment(payment.id)}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #ffd2d2', backgroundColor: '#fff5f5', color: '#e53e3e', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        취소 요청
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {paymentHistory.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', padding: '30px 0', fontSize: '0.85rem' }}>결제 내역이 없습니다.</div>}
            </div>
          </div>
        )}

        {/* 톡 목록 및 톡방 렌더링 (모바일 전용 최적화) */}
        {activeTab === 'chats' && (
          <div style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
            {!selectedRoom ? (
              // 톡방 목록
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'white', borderRadius: '14px', border: '1px solid #eee', overflow: 'hidden' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0 }}>💬 다잇톡 상담 목록</h3>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {chatRooms.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#aaa', padding: '50px 0', fontSize: '0.85rem' }}>진행 중인 대화가 없습니다.</div>
                  ) : (
                    chatRooms.map(room => {
                      const hasUnread = session.user.id === room.buyer_id ? !!room.buyer_has_unread : !!room.seller_has_unread;
                      const opponentName = session.user.id === room.buyer_id ? (room.seller_nickname || '판매자') : (room.buyer_nickname || '구매자');
                      return (
                        <div
                          key={room.id}
                          onClick={() => {
                            setSelectedRoom(room);
                            if (hasUnread) {
                              api.chat.markRead(room.id).then(() => {
                                setChatRooms(prev => prev.map(r => r.id === room.id ? { ...r, buyer_has_unread: session.user.id === r.buyer_id ? 0 : r.buyer_has_unread, seller_has_unread: session.user.id === r.seller_id ? 0 : r.seller_has_unread } : r));
                              });
                            }
                          }}
                          style={{
                            display: 'flex', gap: '10px', padding: '12px 15px', borderBottom: '1px solid #f9f9f9',
                            backgroundColor: hasUnread ? '#fffaf0' : 'white', cursor: 'pointer', alignItems: 'center'
                          }}
                        >
                          {room.dog_image_url ? (
                            <img src={room.dog_image_url} alt="dog" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🐶</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {opponentName} <span style={{ color: '#999', fontWeight: '400', fontSize: '0.75rem' }}>· {room.dog_nickname || '강아지'}</span>
                              </div>
                              {hasUnread && <span style={{ padding: '1px 5px', backgroundColor: '#e63946', color: 'white', borderRadius: '8px', fontSize: '0.6rem', fontWeight: '900' }}>NEW</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                              {room.last_message || '대화를 시작해 보세요.'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              // 톡방 디테일 (모바일 화면을 채움)
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'white', borderRadius: '14px', border: '1px solid #eee', overflow: 'hidden' }}>
                <ChatWindow 
                  room={selectedRoom} 
                  userId={session.user.id} 
                  onClose={() => { 
                    setSelectedRoom(null); 
                    fetchChatRooms(session.user.id); 
                  }} 
                />
              </div>
            )}
          </div>
        )}

        {!selectedRoom && activeTab === 'bookmarks' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '15px' }}>💝 관심아이</h3>
            {bookmarks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: '0.85rem' }}>찜한 아이가 없습니다.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {bookmarks.map(dog => (
                  <Card key={dog.id} type="small" data={{ ...dog, image: dog.image_url, date: new Date(dog.created_at).toLocaleDateString() }} />
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedRoom && activeTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>🔔 알림 내역</h3>
              {myNotifications.length > 0 && (
                <button onClick={handleReadAllNotifications} style={{ ...miniBtnStyle, fontSize: '0.7rem', padding: '5px 10px', backgroundColor: '#edf2f7', color: '#4a5568', border: '1px solid #cbd5e0' }}>모두 읽음</button>
              )}
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {myNotifications.map(n => (
                <div key={n.id} onClick={() => handleMarkAsRead(n.id, n.is_read)} style={{ backgroundColor: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #eee', borderLeft: n.is_read ? '1px solid #eee' : '4px solid var(--primary-dark)', opacity: n.is_read ? 0.7 : 1, cursor: 'pointer' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary-dark)', fontWeight: 'bold' }}>
                    {n.type === 'chat' && '💬 다잇톡'}
                    {n.type === 'bookmark' && '💝 관심등록'}
                    {n.type === 'coupon' && '🎁 쿠폰'}
                    {n.type === 'system' && '📢 공지'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#333', marginTop: '4px', fontWeight: n.is_read ? 'normal' : 'bold' }}>{n.message}</div>
                  <div style={{ fontSize: '0.65rem', color: '#999', marginTop: '6px' }}>{new Date(n.created_at).toLocaleDateString()}</div>
                </div>
              ))}
              {myNotifications.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', padding: '30px 0', fontSize: '0.85rem' }}>받은 알림이 없습니다.</div>}
            </div>
          </div>
        )}

        {isApplyModalOpen && <BusinessApplyModal onClose={() => setIsApplyModalOpen(false)} onSuccess={setBusinessApp} />}
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 0', position: 'relative' }}>
      {/* 결제 결과 풀스크린 커스텀 모달 */}
      {paymentResultMsg && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '20px', padding: '40px 30px', width: '100%', maxWidth: '450px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)', textAlign: 'center', animation: 'fadeInDown 0.3s ease-out forwards',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
          }}>
            <div style={{ fontSize: '64px' }}>{paymentResultMsg.type === 'success' ? '🎉' : '⚠️'}</div>
            <div style={{ fontWeight: '900', fontSize: '1.5rem', color: paymentResultMsg.type === 'success' ? '#234e52' : '#742a2a' }}>
              {paymentResultMsg.type === 'success' ? '결제 완료' : '결제 실패'}
            </div>
            <div style={{ color: '#4a5568', fontSize: '1.1rem', wordBreak: 'keep-all', lineHeight: '1.5', margin: '15px 0' }}>
              {paymentResultMsg.text}
            </div>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              {paymentResultMsg.vbankInfo && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(paymentResultMsg.vbankInfo);
                    alert('계좌 정보가 클립보드에 복사되었습니다: ' + paymentResultMsg.vbankInfo);
                  }} 
                  style={{ flex: 1, background: '#319795', border: 'none', color: 'white', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.target.style.background = '#285e61'}
                  onMouseLeave={(e) => e.target.style.background = '#319795'}
                >
                  계좌 복사
                </button>
              )}
              <button 
                onClick={() => setPaymentResultMsg(null)} 
                style={{ flex: 1, background: '#edf2f7', border: '1px solid #cbd5e0', color: '#4a5568', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer' }}
                onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.target.style.background = '#edf2f7'}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── 모바일 프로필 + 탭 네비게이션 ── */}
        <div className="mypage-profile-card glass-card" style={{ marginBottom: '15px', padding: '20px', textAlign: 'center' }}>
          {profile?.profile_image
            ? <img src={profile.profile_image} alt="프사" style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            : <div style={{ width: '55px', height: '55px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>🐶</div>
          }
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem' }}>{profile?.nickname}</div>
            <div style={{ color: '#999', fontSize: '0.75rem' }}>{session?.user?.email}</div>
            {isSeller && <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>⭐ 인증 사업자</span>}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #eee', backgroundColor: 'transparent', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>⚙️</button>
            <button onClick={async () => { await api.auth.logout(); navigate('/'); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #eee', backgroundColor: 'transparent', fontSize: '0.8rem', fontWeight: '700', color: '#ff4757', cursor: 'pointer' }}>로그아웃</button>
          </div>
        </div>

        {/* 모바일 가로 스크롤 탭 */}
        <div className="mypage-mobile-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`mypage-nav-chip${activeTab === item.id ? ' active' : ''}`}
              onClick={() => {
                if (item.action) item.action();
                else setActiveTab(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mypage-layout">
          
          {/* ── 데스크탑 사이드바 ── */}
          <aside className="mypage-desktop-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                    <button onClick={() => setActiveTab('ads')} style={navBtnStyle('ads')}>📢 비즈니스 서비스 관리</button>
                    <button onClick={() => setActiveTab('payments')} style={navBtnStyle('payments')}>💳 결제 내역 관리</button>
                    <button onClick={() => navigate('/ad-store')} style={navBtnStyle('adStore')}>🛒 단건구매 스토어</button>
                    <button onClick={() => navigate('/subscription')} style={{...navBtnStyle('subscription'), color: '#9b59b6', fontWeight: '900'}}>💎 정기구매 스토어</button>
                    <button onClick={() => setActiveTab('stats')} style={navBtnStyle('stats')}>📊 통계확인</button>
                  </>
                )}
                <button onClick={() => setActiveTab('chats')} style={navBtnStyle('chats')}>💬 다잇톡</button>
                <button onClick={() => setActiveTab('bookmarks')} style={navBtnStyle('bookmarks')}>💝 관심아이</button>
                <button onClick={() => setActiveTab('notifications')} style={navBtnStyle('notifications')}>🔔 알림내역</button>
              </div>

              {/* 설정, 로그아웃 */}
              <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={{ ...actionBtnStyle, fontSize: '0.85rem', marginBottom: '10px' }}>⚙️ 프로필 설정</button>
                <button onClick={async () => { await api.auth.logout(); navigate('/'); }} style={{ ...actionBtnStyle, color: '#ff4757', border: 'none' }}>로그아웃</button>

                {!isSeller && (
                  <>
                    {(!businessApp || businessApp.status === 'rejected') ? (
                      <button onClick={() => setIsApplyModalOpen(true)} style={{ ...actionBtnStyle, border: 'none', background: 'none', color: '#888', fontSize: '0.75rem', textDecoration: 'underline' }}>
                        사업자로 등록하기
                      </button>
                    ) : (
                      businessApp.status === 'pending' ? <div style={{ fontSize:'0.75rem', color:'var(--primary)', textAlign:'center' }}>사업자 등록 검토 중</div> : null
                    )}
                    {businessApp && businessApp.status === 'rejected' && (
                      <div style={{ fontSize:'0.75rem', color:'#ff4757', textAlign:'center', marginTop: '5px' }}>
                        이전 신청이 반려되었습니다.<br/>(사유: {businessApp.rejected_reason || '사유 미기재'})
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* ── 메인 콘텐츠 영역 ── */}
          <main>
            <div className="glass-card mypage-main-card" style={{ padding: activeTab === 'chats' ? '0' : '40px', minHeight: '700px', overflow: activeTab === 'chats' ? 'hidden' : 'visible' }}>
              
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

                  <div className="form-grid-2">
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

                  {/* 파트너 사업자 심사 상태 카드 */}
                  {!isSeller && businessApp && businessApp.status === 'pending' && (
                    <div style={{
                      padding: '24px',
                      backgroundColor: '#f0f9ff',
                      border: '1.5px solid #bae6fd',
                      borderRadius: '16px',
                      marginBottom: '25px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px'
                    }}>
                      <span style={{ fontSize: '2.5rem' }}>⏳</span>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0369a1' }}>🔒 입점 심사가 진행 중입니다 (최대 24시간 소요)</h4>
                        <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#0a5c85', lineHeight: '1.4' }}>
                          제출하신 서류 및 매장 정보를 성실히 검토 중입니다. 심사가 완료되면 푸시 알림 및 문자로 즉시 안내해 드립니다. 조금만 기다려주세요!
                        </p>
                      </div>
                    </div>
                  )}

                  {!isSeller && businessApp && businessApp.status === 'rejected' && (
                    <div style={{
                      padding: '24px',
                      backgroundColor: '#fff5f5',
                      border: '1.5px solid #feb2b2',
                      borderRadius: '16px',
                      marginBottom: '25px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px'
                    }}>
                      <span style={{ fontSize: '2.5rem' }}>⚠️</span>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#9b1c1c' }}>입점 심사가 반려되었습니다</h4>
                        <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#c92a2a', fontWeight: 'bold' }}>
                          반려 사유: {businessApp.rejected_reason || '사유 미기재'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#868e96', lineHeight: '1.4' }}>
                          정보를 수정하여 다시 신청하시면 신속히 재심사를 진행하겠습니다.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsApplyModalOpen(true)}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#e53e3e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(229, 62, 62, 0.2)',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#c53030'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#e53e3e'}
                      >
                        정보 수정 후 재신청
                      </button>
                    </div>
                  )}



                  {/* 스토어 정보 미완성 CTA 배너 */}
                  {isSeller && (!storeDescription || !storeAddress || !storeContact) && (
                    <div style={{
                      padding: '24px',
                      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                      border: '1.5px solid #fde68a',
                      borderRadius: '16px',
                      marginBottom: '25px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <span style={{ fontSize: '2.5rem' }}>🏪</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '900', fontSize: '1.1rem', color: '#92400e' }}>입점 효과 극대화하기: 스토어 정보 등록</span>
                          <span style={{ fontSize: '0.7rem', padding: '3px 8px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}>권장 사항</span>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#b45309', lineHeight: '1.5' }}>
                          스토어 소개글, 실 주소, 문의 연락처를 채워 구매자들에게 신뢰감을 전하세요. 정보를 모두 채우면 매장 지도가 활성화되고 다잇톡 상담률이 평균 40% 이상 상승합니다!
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('store')}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#d97706',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#b45309'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#d97706'}
                      >
                        지금 정보 등록하기 →
                      </button>
                    </div>
                  )}

                  <div className={`dashboard-stats-grid ${isSeller ? '' : 'buyer'}`}>
                    {isSeller ? (
                      <>
                        <StatBox title="총 방문자 분석" value={totalViews} suffix="명" color="#F5A623" icon="👀" onClick={() => setActiveTab('stats')} />
                        <StatBox title="전체 게시물" value={myDogs.length} suffix="건" color="var(--primary)" icon="🐶" onClick={() => setActiveTab('posts')} />
                        <StatBox title="진행중인 다잇톡" value={chatRooms.length} suffix="건" color="#4A90E2" icon="💬" onClick={() => setActiveTab('chats')} />
                      </>
                    ) : (
                      <>
                        <StatBox title="관심아이" value={bookmarks.length} suffix="마리" color="var(--primary)" icon="💝" onClick={() => setActiveTab('bookmarks')} />
                        <StatBox title="진행중인 다잇톡" value={chatRooms.length} suffix="건" color="#F5A623" icon="💬" onClick={() => setActiveTab('chats')} />
                      </>
                    )}
                  </div>
                  
                  {/* 최신 알림 및 요약 */}
                  <div style={{ padding: '20px', backgroundColor: '#fcfcfc', borderRadius: '15px', border: '1px solid #eee' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>최근 대화 (다잇톡)</h3>
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

                  {/* 데스크탑 테이블 */}
                  <div className="post-table-wrap" style={{ overflowX: 'auto' }}>
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

                  {/* 모바일 카드 리스트 */}
                  <div className="post-card-list">
                    {myDogs.length === 0 && <div style={emptyStyle}>등록된 분양글이 없습니다.</div>}
                    {myDogs.map(dog => (
                      <div key={dog.id} className="post-mobile-card">
                        <img src={dog.image_url} alt="dog" style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '800', fontSize: '1rem' }}>{dog.breed}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>{dog.nickname} ({dog.gender}) · {dog.region} · <b style={{ color: 'var(--primary-dark)' }}>{dog.price === 0 ? '무료' : dog.price + '만원'}</b></div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>👀 {dogStats[dog.id]?.views || 0}  💝 {dogStats[dog.id]?.likes || 0}</div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => handleCompleteAdoption(dog.id)} style={{ padding: '7px 12px', borderRadius: '8px', backgroundColor: '#7ed321', color: 'white', fontWeight: 'bold', border: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>💖 분양완료</button>
                            <button onClick={() => handleEditPost(dog)} style={{ padding: '7px 12px', borderRadius: '8px', backgroundColor: '#eee', color: '#333', border: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>✏️ 수정</button>
                            <button onClick={() => handleDeletePost(dog.id)} style={{ padding: '7px 12px', borderRadius: '8px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>🗑️ 삭제</button>
                          </div>
                        </div>
                      </div>
                    ))}
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

                    <div className="form-grid-2" style={{ marginBottom: '20px' }}>
                      <div>
                        <label style={labelStyle}>상호명 (자동 연동)</label>
                        <input value={businessApp?.business_name || '등록된 상호명 없음'} disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5', color: '#888' }} />
                      </div>
                      <div>
                         <label style={labelStyle}>사업자등록번호 (자동 연동)</label>
                         <input value={businessApp?.biz_no || bizNo || '등록된 번호 없음'} disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5', color: '#888' }} />
                      </div>
                      <div>
                         <label style={labelStyle}>동물판매등록번호 (자동 연동)</label>
                         <input value={businessApp?.animal_sale_no || animalSaleNo || '등록된 번호 없음'} disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5', color: '#888' }} />
                      </div>
                      <div>
                         <label style={labelStyle}>스토어 문의 연락처</label>
                         <input value={storeContact} onChange={e => setStoreContact(e.target.value)} placeholder="010-0000-0000" style={inputStyle} />
                      </div>
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
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>비즈니스 서비스 관리</h2>
                    <button 
                      onClick={() => navigate('/ad-store')}
                      style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(255, 171, 0, 0.2)' }}
                      onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--primary-dark)'; e.target.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.target.style.backgroundColor = 'var(--primary)'; e.target.style.transform = 'translateY(0)'; }}
                    >
                      🛒 단건구매 스토어 가기
                    </button>
                  </div>

                  {/* 데스크탑 테이블 */}
                  <div className="post-table-wrap" style={{ overflowX: 'auto', marginBottom: '40px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                          <th style={thStyle}>사진</th>
                          <th style={thStyle}>견종/이름</th>
                          <th style={thStyle}>상태</th>
                          <th style={thStyle}>이용 중인 서비스</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>서비스 설정</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myDogs.map(dog => {
                          const adInfo = getAdInfo(dog.id);
                          return (
                            <tr key={dog.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tdStyle}><img src={dog.image_url} alt="dog" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}/></td>
                            <td style={tdStyle}>
                              <strong>{dog.breed}</strong><br/>
                              <span style={{ fontSize: '0.85rem', color: '#666' }}>{dog.nickname} ({dog.gender})</span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ padding: '4px 8px', backgroundColor: '#eefbe7', color: '#7ed321', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>분양중</span>
                            </td>
                            <td style={tdStyle}>
                              {adInfo ? (
                                <div>
                                  <div style={{ fontWeight: 'bold', color: 'var(--primary-dark)', fontSize: '0.85rem' }}>{adInfo.type}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#ff4757', marginTop: '3px' }}>{adInfo.remainDays}일 남음</div>
                                </div>
                              ) : (
                                <span style={{ color: '#aaa', fontSize: '0.8rem' }}>이용 중인 서비스 없음</span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button onClick={() => navigate(`/ad-setup/${dog.id}`)} style={{ ...tableBtnStyle, backgroundColor: 'var(--primary-dark)', color: 'white', border: 'none', fontWeight: 'bold', padding: '10px 15px' }}>📢 서비스 설정하기</button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {myDogs.length === 0 && <div style={emptyStyle}>등록된 분양글이 없습니다.</div>}
                  </div>

                  {/* 모바일 카드 리스트 (광고) */}
                  <div className="post-card-list" style={{ marginBottom: '30px' }}>
                    {myDogs.length === 0 && <div style={emptyStyle}>등록된 분양글이 없습니다.</div>}
                    {myDogs.map(dog => {
                      const adInfo = getAdInfo(dog.id);
                      return (
                        <div key={dog.id} className="post-mobile-card">
                          <img src={dog.image_url} alt="dog" style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '800', fontSize: '1rem' }}>{dog.breed}</div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>{dog.nickname} · {dog.region}</div>
                            
                            {adInfo && (
                              <div style={{ backgroundColor: '#fffbf0', padding: '8px 12px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>{adInfo.type} 이용 중</span>
                                <span style={{ fontSize: '0.75rem', color: '#ff4757', fontWeight: 'bold' }}>{adInfo.remainDays}일 남음</span>
                              </div>
                            )}

                            <button onClick={() => navigate(`/ad-setup/${dog.id}`)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--primary-dark)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>📢 서비스 설정하기</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>보유 멤버십 이용권 현황</h3>
                    <button 
                      onClick={() => navigate('/ad-store')}
                      style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#fff', color: 'var(--primary-dark)', border: '2px solid var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--primary)'; e.target.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.target.style.backgroundColor = '#fff'; e.target.style.color = 'var(--primary-dark)'; }}
                    >
                      💳 멤버십 이용권 구매
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                    {userCoupons.length > 0 ? userCoupons.map(coupon => (
                      <div key={coupon.user_coupon_id} style={{ padding: '20px', border: '1px solid #eee', borderRadius: '15px', backgroundColor: '#fffbf0', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '50px', height: '50px', backgroundColor: '#ffd700', borderRadius: '50%', opacity: 0.2 }}></div>
                        <h4 style={{ margin: '0 0 10px 0', color: '#e6a800' }}>🎁 {renderAdName(coupon.name)}</h4>
                        <div style={{ fontSize: '0.8rem', color: '#e67e22', marginBottom: '8px', fontWeight: 'bold' }}>
                          사용 가능 기한: {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() + ' 까지' : '제한 없음 (무제한)'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>
                          {coupon.ad_type !== 'all' && coupon.ad_type ? `프리미엄 서비스 적용 시 ${coupon.discount_rate}일간 진행됩니다.` : coupon.description}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: coupon.is_used ? '#aaa' : 'var(--primary)', fontWeight: 'bold' }}>{coupon.is_used ? '사용 완료' : '사용 가능'}</div>
                      </div>
                    )) : (
                      <div style={{ color: '#aaa', fontSize: '0.9rem', padding: '20px', border: '1px dashed #ddd', borderRadius: '10px', textAlign: 'center' }}>보유한 이용권이 없습니다.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && isSeller && (
                <div className="fade-in">
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '30px' }}>통계 확인</h2>
                  <div className="stats-grid">
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

              {activeTab === 'payments' && isSeller && (
                <div className="fade-in">
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '10px' }}>결제 내역 관리</h2>
                  <p style={{ color: '#666', marginBottom: '10px', fontSize: '0.95rem' }}>
                    신청하신 멤버십 서비스 및 이용권의 결제 내역을 확인하고 취소를 요청하실 수 있습니다.
                  </p>
                  <p style={{ color: '#E056FD', marginBottom: '30px', fontSize: '0.85rem', fontWeight: '600' }}>
                    * 무통장입금은 송금 완료 후 결제 상태가 '결제완료'로 변경되기까지 약 10분 정도 이상 소요될 수 있습니다.
                  </p>
                  
                  <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                            <th style={{ padding: '15px 20px', color: '#555', fontSize: '0.9rem', width: '20%' }}>결제일시</th>
                            <th style={{ padding: '15px 20px', color: '#555', fontSize: '0.9rem', width: '35%' }}>상품명/주문번호</th>
                            <th style={{ padding: '15px 20px', color: '#555', fontSize: '0.9rem', width: '15%' }}>금액</th>
                            <th style={{ padding: '15px 20px', color: '#555', fontSize: '0.9rem', width: '15%' }}>상태</th>
                            <th style={{ padding: '15px 20px', color: '#555', fontSize: '0.9rem', width: '15%' }}>관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                결제 내역이 없습니다.
                              </td>
                            </tr>
                          ) : paymentHistory.map(payment => (
                            <tr key={payment.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '15px 20px', color: '#777', fontSize: '0.85rem' }}>
                                <div>{new Date(payment.created_at).toLocaleString('ko-KR', {
                                  year: 'numeric', month: '2-digit', day: '2-digit',
                                  hour: '2-digit', minute: '2-digit'
                                })}</div>
                                <div style={{ marginTop: '8px' }}>
                                  <span style={{ display: 'inline-block', padding: '2px 6px', backgroundColor: '#edf2f7', color: '#4a5568', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {payment.pay_method === 'vbank' ? '무통장입금' : 
                                     payment.pay_method === 'kakaopay' ? '카카오페이' : 
                                     payment.pay_method === 'naverpay' ? '네이버페이' : 
                                     payment.pay_method === 'tosspay' ? '토스페이' : 
                                     payment.pay_method === 'payco' ? '페이코' : 
                                     payment.pay_method === 'card' ? '신용카드' : 
                                     payment.pay_method === 'trans' ? '계좌이체' : (payment.pay_method || '신용카드')}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '15px 20px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#333', marginBottom: '4px' }}>
                                  {payment.item_name || '결제 상품'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#aaa', wordBreak: 'break-all' }}>
                                  {payment.merchant_uid}
                                </div>
                                {payment.status === 'ready' && payment.vbank_num && (
                                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '0.85rem' }}>
                                    <div style={{ color: '#e67e22', fontWeight: 'bold', marginBottom: '4px' }}>가상계좌 입금 안내</div>
                                    <div><strong>{payment.vbank_name}</strong> {payment.vbank_num}</div>
                                    <div style={{ color: '#666', marginTop: '2px' }}>예금주: {payment.vbank_holder}</div>
                                    <div style={{ color: '#e53e3e', marginTop: '2px' }}>기한: {payment.vbank_date ? new Date(payment.vbank_date).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}까지</div>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#e67e22' }}>
                                {payment.amount.toLocaleString()}원
                              </td>
                              <td style={{ padding: '15px 20px' }}>
                                {payment.status === 'paid' && <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#e6fffa', color: '#319795', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>결제완료</span>}
                                {payment.status === 'ready' && <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#fffaf0', color: '#dd6b20', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>입금대기</span>}
                                {payment.status === 'cancel_requested' && <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#edf2f7', color: '#4a5568', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>취소 대기중</span>}
                                {payment.status === 'cancelled' && <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#fff5f5', color: '#e53e3e', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>취소됨</span>}
                                {payment.status === 'failed' && <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#fff5f5', color: '#c53030', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>결제실패</span>}
                              </td>
                              <td style={{ padding: '15px 20px' }}>
                                {payment.status === 'paid' ? (
                                  <button
                                    onClick={() => handleCancelPayment(payment.id)}
                                    style={{
                                      padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0',
                                      backgroundColor: 'white', color: '#e53e3e', fontSize: '0.8rem',
                                      fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#fff5f5'; e.target.style.borderColor = '#feb2b2'; }}
                                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.borderColor = '#e2e8f0'; }}
                                  >
                                    취소 요청
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'chats' && (
                <div className={`fade-in chat-layout${selectedRoom ? ' room-open' : ''}`}>
                  {/* 좌측: 대화 목록 */}
                  <div className="chat-room-panel">
                    <div style={{ padding: '20px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>다잇톡 대화목록</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {chatRooms.length === 0 ? (
                        <div style={{ ...emptyStyle, paddingTop: '50px' }}>진행 중인 대화가 없습니다.</div>
                      ) : (
                        chatRooms.map(room => {
                          // 내가 읽지 않은 메시지가 있는지 확인
                          const hasUnread = session.user.id === room.buyer_id
                            ? !!room.buyer_has_unread
                            : !!room.seller_has_unread;
                          // 상대방 표시명
                          const opponentName = session.user.id === room.buyer_id
                            ? (room.seller_nickname || '판매자')
                            : (room.buyer_nickname || '구매자');
                          return (
                            <div
                              key={room.id}
                              onClick={() => {
                                setSelectedRoom(room);
                                // 읽음 처리: 내 unread 플래그를 0으로
                                if (hasUnread) {
                                  api.chat.markRead(room.id).then(() => {
                                    // 로컬 상태도 즉시 업데이트
                                    setChatRooms(prev => prev.map(r =>
                                      r.id === room.id
                                        ? {
                                            ...r,
                                            buyer_has_unread: session.user.id === r.buyer_id ? 0 : r.buyer_has_unread,
                                            seller_has_unread: session.user.id === r.seller_id ? 0 : r.seller_has_unread,
                                          }
                                        : r
                                    ));
                                  });
                                }
                              }}
                              style={{
                                ...chatRoomItemStyle,
                                borderRadius: '0',
                                border: 'none',
                                borderBottom: '1px solid #f5f5f5',
                                backgroundColor: selectedRoom?.id === room.id ? '#fff0f0' : (hasUnread ? '#fffaf0' : 'white'),
                                transition: 'all 0.2s',
                                position: 'relative',
                              }}
                            >
                              {/* 강아지 이미지 */}
                              {room.dog_image_url
                                ? <img src={room.dog_image_url} alt="dog" style={{ width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                                : <div style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🐶</div>
                              }
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ color: 'var(--primary-dark)' }}>{opponentName}</span>
                                    <span style={{ fontWeight: '400', color: '#888', fontSize: '0.85rem' }}> · {room.dog_nickname || '강아지'}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    {/* NEW 배지 */}
                                    {hasUnread && (
                                      <span style={{
                                        padding: '2px 7px',
                                        backgroundColor: '#e63946',
                                        color: 'white',
                                        borderRadius: '10px',
                                        fontSize: '0.68rem',
                                        fontWeight: '900',
                                        letterSpacing: '0.05em',
                                        animation: 'pulse 1.5s infinite',
                                      }}>NEW</span>
                                    )}
                                    {/* 게시물 바로가기 */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.open(`/detail?id=${room.dog_id}`, '_blank');
                                      }}
                                      style={{
                                        padding: '3px 8px',
                                        fontSize: '0.72rem',
                                        backgroundColor: 'var(--primary-dark)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      게시물 🔗
                                    </button>
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {room.last_message || '대화를 시작해주세요.'}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* 우측: 대화 세부 창 */}
                  <div className="chat-detail-panel">
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
                        <div key={n.id} onClick={() => handleMarkAsRead(n.id, n.is_read)} style={{ ...chatRoomItemStyle, cursor: n.is_read ? 'default' : 'pointer', backgroundColor: n.is_read ? '#fafafa' : '#fff', borderLeft: n.is_read ? '1px solid #eee' : '5px solid var(--primary-dark)', paddingLeft: '25px', opacity: n.is_read ? 0.7 : 1 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', fontWeight: 'bold', marginBottom: '5px' }}>
                              {n.type === 'chat' && '💬 댕댕톡 메시지'}
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
        </div> {/* mypage-layout */}
      </div>

      {isApplyModalOpen && <BusinessApplyModal onClose={() => setIsApplyModalOpen(false)} onSuccess={setBusinessApp} />}
    </div>
  );
};

// --- 자식 컴포넌트: 통계 박스 ---
const StatBox = ({ title, value, suffix, color, icon, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      padding: '18px 15px', 
      borderRadius: '16px', 
      border: '1px solid #eee', 
      backgroundColor: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      boxShadow: '0 5px 15px rgba(0,0,0,0.02)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      width: '100%',
      minWidth: '0'
    }}
    onMouseEnter={(e) => { if(onClick) e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'; }}
    onMouseLeave={(e) => { if(onClick) e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.02)'; }}
  >
    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{icon}</div>
    <div style={{ minWidth: '0', flex: 1 }}>
      <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {(value || 0).toLocaleString()}
        <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#666', marginLeft: '3px' }}>{suffix}</span>
      </div>
    </div>
  </div>
);

// --- 이미지 리사이징 & 압축 헬퍼 함수 ---
const resizeImageToBase64 = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- 나머지 기존 컴포넌트들 (BusinessApplyModal, ChatWindow) ---
const BusinessApplyModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ bizName: '', repName: '', phone: '', address: '', bizNo: '', animalNo: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.bizName.trim() || !form.address.trim() || !form.bizNo.trim() || !form.animalNo.trim()) {
      alert('모든 신청 항목을 입력해 주세요.');
      return;
    }

    if (!file) {
      alert('사업자등록증 등의 증빙 서류 파일을 반드시 첨부해 주세요.');
      return;
    }

    setUploading(true);

    try {
      // 이미지 파일인 경우 리사이징 및 압축 최적화 적용
      let fileBase64 = null;
      let fileName = file.name;

      if (file.type.startsWith('image/')) {
        try {
          fileBase64 = await resizeImageToBase64(file, 1200, 1200, 0.75);
          if (!fileName.toLowerCase().endsWith('.jpg') && !fileName.toLowerCase().endsWith('.jpeg')) {
            fileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.jpg';
          }
        } catch (e) {
          console.error('이미지 압축 실패, 원본 파일로 진행합니다:', e);
          fileBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });
        }
      } else {
        // 이미지가 아닌 경우(PDF 등) 원본 base64 변환
        fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }

      const { error } = await api.business.apply({
        business_name: form.bizName,
        representative_name: form.repName,
        phone: form.phone,
        address: form.address,
        biz_no: form.bizNo,
        animal_sale_no: form.animalNo,
        file_base64: fileBase64,
        file_name: fileName,
      });

      if (error) throw new Error(error);

      alert('사업자 등록 신청 완료!');
      onClose();
      const { data } = await api.business.getLastApplication();
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
          
          {/* 본인인증 영역 삭제됨 */}

          <div><label style={labelStyle}>주소</label><input required style={inputStyle} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div><label style={labelStyle}>사업자등록번호</label><input required style={inputStyle} value={form.bizNo} onChange={e => setForm({...form, bizNo: e.target.value})} /></div>
          <div><label style={labelStyle}>동물판매업번호</label><input required style={inputStyle} value={form.animalNo} onChange={e => setForm({...form, animalNo: e.target.value})} /></div>
          <div><label style={labelStyle}>사업자등록증 첨부 (필수)</label><input type="file" required onChange={e => setFile(e.target.files[0])} /></div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" disabled={uploading} style={{ ...miniBtnStyle, flex: 1, padding: '15px' }}>{uploading ? '신청 중...' : '확인'}</button>
            <button type="button" onClick={onClose} style={{ ...miniBtnStyle, backgroundColor: '#eee', color: '#666', flex: 1 }}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChatWindow = ({ room, userId, onClose }) => {
  const { isMobile } = useMobile();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef();

  const fetchMessages = async () => {
    const { data } = await api.chat.getMessages(room.id);
    if (data) {
      // API 응답 필드 매핑: message -> content
      const normalized = data.map(m => ({
        ...m,
        content: m.content || m.message || '',
      }));
      setMessages(normalized);

      // 상대방이 보낸 메시지 중 내가 아직 읽지 않은 것이 있는지 체크
      const hasUnreadFromOpponent = normalized.some(m => m.sender_id !== userId && Number(m.is_read) === 0);
      if (hasUnreadFromOpponent) {
        await api.chat.markRead(room.id);
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
    // 실시간 감지를 극대화하기 위해 1초(1000ms) 폴링 방식으로 신규 메시지 감지
    const intervalId = setInterval(fetchMessages, 1000);
    return () => clearInterval(intervalId);
  }, [room.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 낙관적 UI 업데이트
    const tempMessage = {
      id: `temp_${Date.now()}`,
      room_id: room.id,
      sender_id: userId,
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);
    const currentInput = input;
    setInput('');

    const { error } = await api.chat.sendMessage(room.id, currentInput);
    if (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
      // 실패 시 낙관적 업데이트 롤백
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setInput(currentInput);
    }
  };

  const getAvatar = (msg) => {
    if (msg.sender_id === room.buyer_id) return room.buyer_profile_image || room.buyer?.profile_image;
    if (msg.sender_id === room.seller_id) return room.seller_profile_image || room.seller?.profile_image;
    return null;
  };

  // 채팅방 헤더 표시명 결정
  const chatTitle = room.dog_nickname || room.dogs?.nickname || '상담';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ ...chatHeaderStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '10px 15px' : '20px' }}>
        {isMobile ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            style={{
              background: 'none', border: 'none', color: 'white', fontSize: '0.95rem', cursor: 'pointer',
              padding: '8px 12px 8px 0', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold'
            }}
          >
            ← 목록
          </button>
        ) : (
          <div style={{ width: '40px' }}></div>
        )}
        <div style={{ fontWeight: '800', fontSize: isMobile ? '1rem' : '1.1rem', textAlign: 'center', flex: 1 }}>
          {chatTitle} 상담
        </div>
        {!isMobile ? (
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
        ) : (
          <div style={{ width: '40px' }}></div>
        )}
      </div>
      <div ref={scrollRef} style={messageAreaStyle}>
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === userId;
          const avatarUrl = getAvatar(msg);
          const showReadStatus = isMe && (String(msg.id).startsWith('temp_') || Number(msg.is_read) === 0);

          return (
            <div key={msg.id || i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', marginBottom: '15px' }}>
              <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#eee', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="프사" /> : <span style={{ fontSize: '1.2rem' }}>🐶</span>}
              </div>
              
              <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', maxWidth: '70%' }}>
                <div style={{ padding: '10px 15px', borderRadius: '15px', backgroundColor: isMe ? 'var(--primary)' : '#f0f0f0', color: isMe ? 'white' : '#333', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', fontSize: '0.75rem', color: '#999', minWidth: 'fit-content' }}>
                  {showReadStatus && (
                    <span style={{ color: '#ffd200', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '2px' }}>1</span>
                  )}
                  <span style={{ fontSize: '0.68rem', color: '#bbb' }}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={sendMessage} style={chatInputAreaStyle}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
          placeholder="메시지를 입력하세요... (Shift+Enter: 줄바꿈)"
          rows={1}
          style={chatInputStyle}
        />
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
const messageAreaStyle = { flex: 1, minHeight: 0, padding: '20px', overflowY: 'auto', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column' };
const chatInputAreaStyle = { padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: 'white', flexShrink: 0 };
const chatInputStyle = { flex: 1, padding: '10px 15px', borderRadius: '12px', border: '1px solid #eee', outline: 'none', resize: 'none', minHeight: '42px', maxHeight: '120px', lineHeight: '1.5', fontFamily: 'inherit', fontSize: '0.95rem', overflowY: 'auto' };
const sendBtnStyle = { padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '800', cursor: 'pointer', alignSelf: 'flex-end', flexShrink: 0 };
const thStyle = { padding: '12px', fontSize: '0.85rem', color: '#666' };
const tdStyle = { padding: '12px', fontSize: '0.9rem', color: '#444' };
const tableBtnStyle = { padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.8rem' };

export default MyPage;
