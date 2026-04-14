import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const DetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dog, setDog] = useState(location.state?.dog || null); // Card에서 넘겨받은 강아지 정보 (없을 경우 fetch)
  
  const [currentUser, setCurrentUser] = useState(null);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [activeDogCount, setActiveDogCount] = useState(0);
  const [loading, setLoading] = useState(!dog);

  // DB 리뷰 상태 관리
  const [storeReviews, setStoreReviews] = useState([]);
  const [hasReviewedThisDog, setHasReviewedThisDog] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [engagement, setEngagement] = useState({ likes: 0, views: 0 });

  // 신고 상태 관리
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    reason: '',
    details: ''
  });
  const reportReasons = ['허위매물', '내용이 다름', '추가요금', '분양완료', '기타입력'];

  // 리뷰 폼 state 추가
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    content: '',
    tags: []
  });
  const reviewTagsList = ['허위등록 없음', '친절해요.', '설명문 그대로예요.', '방문했는데 깔끔해요.'];

  // 다중 이미지 배열화
  const allImages = dog ? [dog.image_url || dog.image, ...(dog.additional_images || [])].filter(Boolean) : [];
  const [selectedImage, setSelectedImage] = useState(allImages.length > 0 ? allImages[0] : 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800');

  useEffect(() => {
    const initPage = async () => {
      // 1. URL 체크 및 강아지 정보 로드
      const searchParams = new URLSearchParams(location.search);
      const dogId = searchParams.get('id');
      let currentDogId = dog?.id || dogId;

      if (!dog && dogId) {
        setLoading(true);
        const { data, error } = await supabase.from('dogs').select('*').eq('id', dogId).single();
        if (!error && data) {
          setDog(data);
          currentDogId = data.id;
          checkLikeStatus(data.id);
        } else {
          alert('존재하지 않거나 삭제된 게시물입니다.');
          navigate('/');
          return;
        }
        setLoading(false);
      } else if (dog) {
        setLoading(false);
        checkLikeStatus(dog.id);
      }

      // 2. 조회수 기록 (Insert) - 완료 후 로컬 숫자 즉시 반영
      if (currentDogId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          setCurrentUser(user);
          
          const { error: insError } = await supabase.from('analytics_logs').insert([{
            user_id: user?.id || null,
            event_type: 'page_view',
            page_path: `/detail?id=${currentDogId}`
          }]);
          
          if (!insError) {
            // 낙관적 업데이트: DB 반영을 기다리기 전 화면 숫자를 먼저 1 올림
            setEngagement(prev => ({ ...prev, views: prev.views + 1 }));
          }
        } catch (e) { console.error(e); }

        // 3. 통계 데이터 호출 (전체 인원 집계 업데이트)
        fetchEngagementStats(currentDogId);
      }
    };

    initPage();
    window.scrollTo(0, 0);
  }, [location.search]);

  useEffect(() => {
    if (dog) {
      if (dog.seller_id) fetchSellerInfo(dog.seller_id);
    }
  }, [dog]);

  // Hook 선언을 모두 마친 후 조건부 렌더링을 수행해야 합니다. (React Hook 규칙)


  const fetchEngagementStats = async (dogId) => {
    try {
      // 1. 관심(찜) 수 조회
      const { count: likeCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('dog_id', dogId);

      // 2. 조회수 조회 (상세페이지 로그 카운트)
      const { count: viewCount } = await supabase
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
        .ilike('page_path', `%id=${dogId}%`);

      setEngagement(prev => ({
        ...prev,
        likes: likeCount || 0,
        views: Math.max(prev.views, viewCount || 0) // 로컬에서 이미 올린 수치와 DB 수치 중 큰 것 선택
      }));
    } catch (err) {
      console.error('Failed to fetch engagement stats:', err);
    }
  };

  const fetchSellerInfo = async (sellerId) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', sellerId).maybeSingle();
    const { data: biz } = await supabase.from('business_applications').select('business_name, biz_no, animal_sale_no').eq('user_id', sellerId).eq('status', 'approved').maybeSingle();
    const { count } = await supabase.from('dogs').select('*', { count: 'exact', head: true }).eq('seller_id', sellerId);
    
    // 이 스토어의 모든 리뷰 조회
    const { data: reviews } = await supabase.from('store_reviews').select('*').eq('seller_id', sellerId);
    
    if (profile) {
      setSellerInfo({
        ...profile,
        business_name: biz?.business_name || null,
        biz_no: biz?.biz_no || null,
        animal_sale_no: biz?.animal_sale_no || null
      });
    }
    setActiveDogCount(count || 0);
    
    if (reviews && reviews.length > 0) {
      const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id))];
      const { data: reviewersProfiles } = await supabase.from('profiles').select('id, nickname, profile_image').in('id', reviewerIds);
      
      const enrichedReviews = reviews.map(r => {
        const reviewer = reviewersProfiles?.find(p => p.id === r.reviewer_id);
        return {
          ...r,
          reviewer_nickname: reviewer?.nickname || '사용자',
          reviewer_image: reviewer?.profile_image || 'https://plus.unsplash.com/premium_photo-1678197937465-bdbc4ed95815?auto=format&fit=crop&q=80&w=40&h=40'
        };
      });
      setStoreReviews(enrichedReviews);
    } else {
      setStoreReviews([]);
    }
  };

  const checkLikeStatus = async (dogId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('dog_id', dogId)
        .maybeSingle();
      if (bookmark) setIsLiked(true);
    }
  };

  const toggleLike = async () => {
    if (!currentUser) {
      alert('관심아이 등록을 위해 먼저 로그인해 주세요!');
      navigate('/login');
      return;
    }

    if (isLiked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('dog_id', dog.id);
      if (!error) setIsLiked(false);
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert([{ user_id: currentUser.id, dog_id: dog.id }]);
      if (!error) setIsLiked(true);
    }
  };

  const handleStartChat = async () => {
    if (!currentUser) {
      alert('상담을 위해 먼저 로그인해 주세요!');
      navigate('/login');
      return;
    }

    if (currentUser.id === dog?.seller_id) {
      alert('본인의 분양글에는 상담할 수 없습니다.');
      return;
    }

    // 1. 기존 채팅방이 있는지 확인
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('buyer_id', currentUser.id)
      .eq('dog_id', dog.id)
      .maybeSingle();

    if (existingRoom) {
      navigate('/mypage', { state: { activeTab: 'chats', openRoomId: existingRoom.id } });
    } else {
      // 2. 새 채팅방 생성 (seller_id가 없으면 테스트용으로 임의 설정 혹은 에러)
      const targetSellerId = dog?.seller_id || '00000000-0000-0000-0000-000000000000'; 
      
      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert([{
          buyer_id: currentUser.id,
          seller_id: targetSellerId,
          dog_id: dog.id,
          last_message: '상담이 시작되었습니다.'
        }])
        .select()
        .single();

      if (error) {
        alert('채팅방 생성에 실패했습니다: ' + error.message);
      } else {
        navigate('/mypage', { state: { activeTab: 'chats', openRoomId: newRoom.id } });
      }
    }
  };

  const getRegionName = (address) => {
    if (!address) return '미등록';
    const regions = [
      "서울시", "인천시", "경기도", "부산시", "대구시", "대전시", "광주시", "울산시", 
      "강원도", "충청남도", "충청북도", "경상남도", "경상북도", "전라남도", "전라북도", "제주도", "세종시"
    ]; // 사용자 허용 지역 목록
    
    // address의 앞부분만 잘라서 비교 (예: '서울특별시 강남구' -> '서울시')
    const addStr = address.replace('특별시', '시').replace('광역시', '시');
    for (let r of regions) {
      if (addStr.includes(r.replace('특별시', '').replace('광역시', ''))) return r;
    }
    // 매칭 안될 시 띄어쓰기 기준 첫 단어
    return address.split(' ')[0];
  };

  const handleReviewTagToggle = (tag) => {
    setReviewData(prev => {
      const newTags = prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  useEffect(() => {
    if (currentUser && storeReviews.length > 0 && dog) {
      const alreadyReviewed = storeReviews.some(r => r.dog_id === dog.id && r.reviewer_id === currentUser.id);
      setHasReviewedThisDog(alreadyReviewed);
    }
  }, [currentUser, storeReviews, dog?.id]);

  // 강아지 정보가 로드되면 선택된 이미지 초기화
  useEffect(() => {
    if (dog) {
      const firstImg = [dog.image_url || dog.image, ...(dog.additional_images || [])].filter(Boolean)[0];
      if (firstImg) setSelectedImage(firstImg);
    }
  }, [dog]);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>상세 정보를 불러오는 중입니다...</div>;
  if (!dog) return <div style={{ padding: '100px', textAlign: 'center' }}>게시물을 찾을 수 없습니다.</div>;

  const handleSubmitReview = async () => {
    if (!currentUser) {
      alert('리뷰 작성을 위해 먼저 로그인해 주세요!');
      navigate('/login');
      return;
    }
    
    if (hasReviewedThisDog) {
      alert('이미 이 게시물에 평가를 남기셨습니다.');
      return;
    }
    
    if (reviewData.content.length > 200) {
      return alert('리뷰 내용은 최대 200자까지만 작성 가능합니다.');
    }

    const newReview = {
      dog_id: dog.id,
      seller_id: dog.seller_id,
      reviewer_id: currentUser.id,
      rating: reviewData.rating,
      content: reviewData.content,
      tags: reviewData.tags
    };

    const { error } = await supabase.from('store_reviews').insert([newReview]);

    if (error) {
      if (error.code === '23505') {
        alert('이미 이 게시물에 평가를 남기셨습니다.');
        setHasReviewedThisDog(true);
        setShowReviewForm(false);
      } else {
        alert('리뷰 등록 중 오류가 발생했습니다: ' + error.message);
      }
    } else {
      const { data: myProfile } = await supabase.from('profiles').select('nickname, profile_image').eq('id', currentUser.id).single();
      alert('소중한 리뷰가 등록되었습니다!');
      setShowReviewForm(false);
      setReviewData({ rating: 5, content: '', tags: [] });
      setHasReviewedThisDog(true);
      
      const newReviewEnriched = {
        ...newReview, 
        id: Date.now(), 
        created_at: new Date().toISOString(),
        reviewer_nickname: myProfile?.nickname || '사용자',
        reviewer_image: myProfile?.profile_image || 'https://plus.unsplash.com/premium_photo-1678197937465-bdbc4ed95815?auto=format&fit=crop&q=80&w=40&h=40'
      };
      setStoreReviews(prev => [...prev, newReviewEnriched]);
    }
  };

  if (!dog) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h3>올바르지 않은 접근입니다.</h3>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px' }}>홈으로 가기</button>
      </div>
    );
  }

  // 통계 계산
  const reviewStats = [
    { label: '허위등록 없음', color: 'var(--p4)', count: storeReviews.filter(r => r.tags.includes('허위등록 없음')).length },
    { label: '친절해요.', color: 'var(--p2)', count: storeReviews.filter(r => r.tags.includes('친절해요.')).length },
    { label: '설명문 그대로예요.', color: 'var(--primary)', count: storeReviews.filter(r => r.tags.includes('설명문 그대로예요.')).length },
    { label: '방문했는데 깔끔해요.', color: 'var(--p5)', count: storeReviews.filter(r => r.tags.includes('방문했는데 깔끔해요.')).length },
  ];
  const handleSubmitReport = async () => {
    if (!currentUser) {
      alert('신고를 위해 먼저 로그인해 주세요.');
      navigate('/login');
      return;
    }
    if (!reportData.reason) {
      return alert('신고 사유를 선택해주세요.');
    }
    if (reportData.reason === '기타입력' && !reportData.details.trim()) {
      return alert('기타입력의 경우 상세 내용을 기재해주세요.');
    }

    // 1. 신고 내역 접수
    const { error: reportError } = await supabase.from('reports').insert([{
      dog_id: dog.id,
      reporter_id: currentUser.id,
      seller_id: dog.seller_id,
      reason_type: reportData.reason,
      details: reportData.details,
      status: 'pending'
    }]);

    if (reportError) {
      alert('신고 접수 중 오류가 발생했습니다: ' + reportError.message);
      return;
    }

    // 2. 판매자에게 알림 전송 (notifications 테이블 활용)
    const { error: notiError } = await supabase.from('notifications').insert([{
      user_id: dog.seller_id,
      type: 'report',
      message: `🚨 [신고 접수] 고객님의 게시물(${dog.nickname})에 신고('${reportData.reason}')가 접수되었습니다. 사실 여부를 확인해주세요.`,
      link_url: '/mypage'
    }]);

    if (notiError) {
      console.error('알림 전송 실패:', notiError.message);
    }

    alert('신고가 정상적으로 접수되었으며, 사실 확인 후 조치하겠습니다.');
    setShowReportModal(false);
    setReportData({ reason: '', details: '' });
  };

  const maxCount = Math.max(...reviewStats.map(s => s.count), 1);
  const totalReviews = storeReviews.length;
  const avgRating = totalReviews > 0 ? (storeReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '5.0';

  const isOwnPost = currentUser && dog.seller_id === currentUser.id;

  return (
    <div className="fade-in" style={{ paddingBottom: '100px' }}>
      <div className="container">
        <div style={{ padding: '20px 0', fontSize: '0.9rem', color: 'var(--muted-text)' }}>
           홈 &gt; 강아지 분양 &gt; <b>{dog.breed}</b>
        </div>

        <div className="detail-main-grid" style={{ width: '100%' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ borderRadius: 'var(--border-radius)', overflow: 'hidden', marginBottom: '15px', boxShadow: 'var(--shadow)' }}>
              <img src={selectedImage} alt="Dog" style={{ width: '100%', height: 'auto', maxHeight: '500px', aspectRatio: '4/3', objectFit: 'cover' }} />
            </div>

            {/* 안내 문구 추가 */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#f1f3f5', 
              borderRadius: '12px', 
              fontSize: '0.95rem', 
              color: '#495057', 
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              문의하실 때는 <b style={{ color: 'var(--primary)' }}>'팔도댕댕에서 보고 전화드렸습니다.'</b>라고 말씀하시면 문의가 쉬워집니다.
            </div>
            
            {/* 썸네일 갤러리 */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
                {allImages.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt={`썸네일 ${idx + 1}`} 
                    onClick={() => setSelectedImage(img)}
                    style={{ 
                      width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer', flexShrink: 0,
                      border: selectedImage === img ? '3px solid var(--primary)' : '1px solid #ddd',
                      opacity: selectedImage === img ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }} 
                  />
                ))}
              </div>
            )}
            
            <div className="glass-card" style={{ padding: '30px', marginBottom: '40px' }}>
              <h2 style={{ marginBottom: '20px' }}>상세 설명</h2>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--muted-text)', lineHeight: '1.6', marginBottom: dog.video_url ? '30px' : '0' }}>
                {dog.desc || `안녕하세요! 팔도댕댕 인증 매장입니다.\n사랑스런 ${dog.breed} 아이를 분양합니다.\n성격이 매우 온순하고 사회성이 좋습니다.\n궁금하신 점은 언제든 상담 신청해주세요.`}
              </p>
              
              {/* 동영상/인스타 링크 표출 영역 */}
              {dog.video_url && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--primary-dark)' }}>🎥 생생한 영상 확인</h3>
                  {(() => {
                    const url = dog.video_url;
                    // 유튜브 링크일 경우 임베드 플레이어 표시
                    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
                      let videoId = '';
                      if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
                      else videoId = new URLSearchParams(url.split('?')[1]).get('v');
                      
                      return (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px' }}>
                          <iframe 
                            src={`https://www.youtube.com/embed/${videoId}`} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            title="YouTube video"
                          />
                        </div>
                      );
                    }
                    // 유튜브가 아닐 경우 외부 링크 버튼으로 표시 (인스타 등)
                    return (
                      <a 
                        href={url.startsWith('http') ? url : `https://${url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-block', padding: '12px 25px', backgroundColor: '#e1306c', color: 'white', fontWeight: 'bold', borderRadius: '8px', textDecoration: 'none' }}
                      >
                        인스타그램 / 영상 보러가기 👉
                      </a>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 판매자 신뢰 평가 */}
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '25px' }}>판매자 신뢰 평가</h2>
              <div className="info-grid-2">
                <div>
                  {reviewStats.map((stat, i) => (
                    <div key={i} style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                        <span>{stat.label}</span>
                        <span style={{ fontWeight: '700' }}>{stat.count}</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(stat.count / maxCount) * 100}%`, height: '100%', backgroundColor: stat.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="info-grid-child-border">
                  <h4 style={{ marginBottom: '15px' }}>최근 리뷰</h4>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>최근 등록된 리뷰가 {totalReviews}건 있습니다.</div>
                  {/* 최근 3개 후기 노출 */}
                  <div style={{ marginTop: '15px' }}>
                    {storeReviews.slice(-3).reverse().map((r, idx) => (
                      <div key={idx} style={{ marginBottom: '15px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <img src={r.reviewer_image} alt="프로필" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                          <span style={{ fontWeight: 'bold', color: '#333' }}>{r.reviewer_nickname}</span>
                          <span style={{ color: '#FFD54F', marginLeft: 'auto' }}>{'★'.repeat(r.rating)}</span>
                        </div>
                        <div style={{ color: '#444', lineHeight: '1.4' }}>{r.content || '텍스트 리뷰가 없습니다.'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-sidebar" style={{ position: 'sticky', top: '100px', alignSelf: 'start' }}>
            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '5px', flex: 1 }}>{dog.nickname} ({dog.breed})</h1>
                <button 
                  onClick={toggleLike}
                  style={{ 
                    background: isLiked ? '#fff1f2' : '#f8f9fa', 
                    border: isLiked ? '1px solid #ff4757' : '1px solid #ddd', 
                    fontSize: '0.95rem', 
                    cursor: 'pointer',
                    padding: '8px 15px', 
                    borderRadius: '25px',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: isLiked ? '#ff4757' : '#666',
                    fontWeight: '700',
                    transition: 'all 0.3s'
                  }}
                >
                  {isLiked ? '❤️ 관심중' : '🤍 관심등록'}
                </button>
              </div>
              
              {/* 관심 및 조회수 표시 영역 추가 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', fontSize: '0.85rem', color: '#888', gap: '5px' }}>
                <span>관심 {engagement.likes}명</span>
                <span>/</span>
                <span>조회 {engagement.views}회</span>
              </div>

              <div style={{ fontSize: '1rem', color: '#666', marginBottom: '10px' }}>
                판매자: <b>{sellerInfo?.business_name || sellerInfo?.nickname || '불러오는 중...'}</b>
              </div>
              <div style={{ fontSize: '0.85rem', marginBottom: '15px' }}>
                <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold' }}>
                  현재 분양중 {activeDogCount} / 누적 분양완료 {sellerInfo?.completed_adoption_count || 0}
                </span>
              </div>
              <div style={{ fontSize: '1.5rem', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '20px' }}>
                {(() => {
                  const mainPrice = dog.price;
                  const origPrice = dog.original_price;
                  
                  // 가격 텍스트 생성 유틸
                  const formatP = (p) => {
                    if (p === 0 || p === '0' || p === '무료분양' || p === '0만원') return '무료분양';
                    if (typeof p === 'number') return `${p}만원`;
                    if (typeof p === 'string' && !p.includes('만원') && p !== '무료분양') return `${p}만원`;
                    return p;
                  };

                  const formattedMain = formatP(mainPrice);

                  // 할인가격과 최초가격이 모두 있는 경우
                  if (origPrice && mainPrice && origPrice > mainPrice && mainPrice !== 0 && mainPrice !== '무료분양') {
                    const discountRate = Math.round(((origPrice - mainPrice) / origPrice) * 100);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1rem', color: '#aaa', textDecoration: 'line-through', fontWeight: '500' }}>{formatP(origPrice)}</span>
                            <span style={{ fontSize: '1.1rem', color: '#FF4757', fontWeight: '800' }}>{discountRate}% 할인</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '2rem' }}>{formattedMain}</span>
                            {dog.is_negotiable && <span style={{ fontSize: '0.9rem', backgroundColor: '#eefbe7', color: '#7ed321', padding: '3px 10px', borderRadius: '15px', fontWeight: 'bold' }}>협의가능</span>}
                         </div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {formattedMain}
                      {dog.is_negotiable && mainPrice !== 0 && mainPrice !== '무료분양' && (
                        <span style={{ fontSize: '0.9rem', backgroundColor: '#eefbe7', color: '#7ed321', padding: '3px 10px', borderRadius: '15px', marginLeft: '10px', verticalAlign: 'middle', fontWeight: 'bold' }}>협의가능</span>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', display: 'grid', gap: '12px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted-text)' }}>최초 등록일</span>
                  <span style={{ fontWeight: '500' }}>{new Date(dog.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted-text)' }}>분양지역</span>
                  <span>{dog.region}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted-text)' }}>생일 / 개월</span>
                  <span>{dog.birthday ? new Date(dog.birthday).toLocaleDateString() : '미등록'} / {dog.age}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted-text)' }}>성별 / 접종</span>
                  <span>{dog.gender} / {dog.vaccination || '미등록'}</span>
                </div>
                {sellerInfo && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted-text)' }}>스토어 연락처</span>
                      <span style={{ fontWeight: '500' }}>{sellerInfo.store_contact || '미등록'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted-text)' }}>매장 위치</span>
                      <span style={{ fontWeight: '500' }}>{getRegionName(sellerInfo.store_address)}</span>
                    </div>
                    {sellerInfo.biz_no && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted-text)' }}>사업자번호</span>
                        <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{sellerInfo.biz_no}</span>
                      </div>
                    )}
                    {sellerInfo.animal_sale_no && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted-text)' }}>동물판매번호</span>
                        <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{sellerInfo.animal_sale_no}</span>
                      </div>
                    )}
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted-text)' }}>고객평점</span>
                  <span style={{ color: '#FFD54F' }}>{'★'.repeat(Math.round(parseFloat(avgRating)))} ({avgRating})</span>
                </div>
              </div>

                <div className="desktop-only" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={handleStartChat} style={chatBtnStyle}>
                     💬 팔톡으로 상담하기
                  </button>
                  {sellerInfo?.kakao_channel && (
                    <button onClick={() => window.open(sellerInfo.kakao_channel, '_blank')} style={kakaoBtnStyle}>
                      💬 카카오톡으로 상담하기
                    </button>
                  )}
                  {sellerInfo && (
                    <button onClick={() => navigate(`/store/${dog.seller_id}`)} style={{ ...chatBtnStyle, backgroundColor: '#f0f0f0', color: '#555' }}>
                      🏪 이 스토어의 모든 게시물 보기
                    </button>
                  )}
                  {currentUser?.id !== dog?.seller_id && (
                    <>
                      <button onClick={() => {
                        if (hasReviewedThisDog) {
                          alert('이미 이 게시물에 평가를 남기셨습니다.');
                        } else {
                          setShowReviewForm(!showReviewForm);
                        }
                      }} style={{ ...chatBtnStyle, backgroundColor: showReviewForm ? '#ccc' : '#fef2f2', color: showReviewForm ? 'white' : '#e63946', opacity: hasReviewedThisDog ? 0.6 : 1, cursor: hasReviewedThisDog ? 'not-allowed' : 'pointer' }}>
                        {hasReviewedThisDog ? '⭐ 평가 완료' : (showReviewForm ? '접기' : '⭐ 리뷰 및 평점 남기기')}
                      </button>
                      <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <span 
                          onClick={() => setShowReportModal(true)} 
                          style={{ fontSize: '0.85rem', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          🚨 이 게시물 신고하기
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div> {/* detail-sidebar & glass-card 닫기 */}
          </div> {/* detail-main-grid 닫기 */}

          {/* 모바일 하단 고정 바 */}
          <div className="mobile-bottom-bar">
               <button 
                 onClick={() => {
                    const phone = sellerInfo?.store_contact || sellerInfo?.phone;
                    if(phone) window.location.href = `tel:${phone}`;
                    else alert('등록된 연락처가 없습니다.');
                 }} 
                 style={{ ...chatBtnStyle, backgroundColor: 'var(--white)', color: 'var(--primary-dark)', border: '1px solid var(--primary)' }}
               >
                 📞 전화 문의
               </button>
               <button onClick={handleStartChat} style={chatBtnStyle}>
                 💬 팔톡 상담
               </button>
            </div>

            {/* 신고 모달창 */}
            {showReportModal && currentUser?.id !== dog?.seller_id && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                  <h3 style={{ marginBottom: '20px', color: '#e63946' }}>🚨 허위매물/문제 게시물 신고</h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>신고 사유를 선택하시고 제출해주세요. <br/>허위 신고 시 이용에 제한이 있을 수 있습니다.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {reportReasons.map(r => (
                      <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="report_reason" 
                          value={r} 
                          checked={reportData.reason === r} 
                          onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                        />
                        {r}
                      </label>
                    ))}
                  </div>

                  {reportData.reason === '기타입력' && (
                    <textarea 
                      placeholder="기타 신고 사유를 상세히 적어주세요." 
                      value={reportData.details}
                      onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
                      style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', resize: 'none', marginBottom: '20px', fontSize: '0.9rem', outline: 'none' }}
                    />
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setShowReportModal(false); setReportData({reason:'', details:''}); }} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#eee', color: '#333', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>취소</button>
                    <button onClick={handleSubmitReport} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#e63946', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>신고 접수</button>
                  </div>
                </div>
              </div>
            )}

            {showReviewForm && !hasReviewedThisDog && currentUser?.id !== dog?.seller_id && (
              <div className="fade-in" style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fdfdfd', border: '1px solid #eee', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '15px', color: 'var(--primary-dark)', fontSize: '1.1rem' }}>리뷰 작성하기</h4>
                
                {/* 별점 */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>평점 선택</div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        onClick={() => setReviewData({...reviewData, rating: star})}
                        style={{ fontSize: '1.5rem', cursor: 'pointer', color: star <= reviewData.rating ? '#FFD54F' : '#e0e0e0', transition: 'color 0.2s' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {/* 추천 태그 */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>이 매장의 좋았던 점 (다중선택 가능)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {reviewTagsList.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleReviewTagToggle(tag)}
                        style={{
                          padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', border: '1px solid', transition: 'all 0.2s',
                          backgroundColor: reviewData.tags.includes(tag) ? 'var(--primary)' : 'white',
                          color: reviewData.tags.includes(tag) ? 'white' : '#666',
                          borderColor: reviewData.tags.includes(tag) ? 'var(--primary)' : '#ddd',
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 텍스트 리뷰 */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
                     상세 후기 <span style={{ fontSize: '0.8rem', float: 'right' }}>{reviewData.content.length} / 200자</span>
                  </div>
                  <textarea 
                    placeholder="매장 방문이나 상담 후기를 자유롭게 적어주세요!" 
                    maxLength={200}
                    value={reviewData.content}
                    onChange={(e) => setReviewData({...reviewData, content: e.target.value})}
                    style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', resize: 'none', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <button 
                  onClick={handleSubmitReview}
                  disabled={reviewData.content.length === 0 && reviewData.tags.length === 0}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: (reviewData.content.length === 0 && reviewData.tags.length === 0) ? '#ddd' : 'var(--primary-dark)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  리뷰 등록 완료
                </button>
              </div>
            )}
          </div> {/* container 닫기 */}
        </div> {/* fade-in 닫기 */}
  );
};

const chatBtnStyle = { padding: '15px', borderRadius: '12px', backgroundColor: 'var(--primary-dark)', color: 'white', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: 'pointer' };
const kakaoBtnStyle = { padding: '14px', borderRadius: '12px', backgroundColor: '#FEE500', color: '#3E2723', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: 'pointer' };

export default DetailPage;
