import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Card from '../components/Card';

const StorePage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState(null);
  const [storeDogs, setStoreDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeReviews, setStoreReviews] = useState([]);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  const fetchStoreData = async () => {
    setLoading(true);
    
    // 1. 판매자 프로필 정보 (스토어 정보 포함)
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', sellerId).maybeSingle();
    
    if (!profile || profile.role === 'user') {
      alert('존재하지 않거나 유효하지 않은 스토어입니다.');
      navigate('/');
      return;
    }

    // 2. 사업자 등록된 상호명
    const { data: biz } = await supabase.from('business_applications').select('business_name, biz_no, animal_sale_no').eq('user_id', sellerId).eq('status', 'approved').maybeSingle();
    
    setStoreInfo({
      ...profile,
      business_name: biz?.business_name || profile.nickname,
      biz_no: profile.biz_no || biz?.biz_no,
      animal_sale_no: profile.animal_sale_no || biz?.animal_sale_no
    });

    // 3. 해당 스토어의 게시물
    const { data: dogs } = await supabase
      .from('dogs')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
      
    if (dogs) setStoreDogs(dogs);

    // 4. 스토어 리뷰 정보
    const { data: reviews } = await supabase.from('store_reviews').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
    
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
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStoreData();
    window.scrollTo(0, 0);
  }, [sellerId]);

  const handleKakaoClick = () => {
    if (storeInfo?.kakao_channel) {
      window.open(storeInfo.kakao_channel, '_blank');
    }
  };

  if (loading) {
    return <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>스토어 정보를 불러오는 중입니다...</div>;
  }

  // 상단 스토어 배너 이미지 (없으면 기본 그라데이션)
  const defaultHeader = "linear-gradient(135deg, var(--primary-light), var(--primary))";
  const headerStyle = storeInfo?.store_header_image
    ? { backgroundImage: `url(${storeInfo.store_header_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: defaultHeader };

  return (
    <div style={{ backgroundColor: '#fcfcfc', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* 1. 상단 가로 배너 (16:9 느낌 강제 크롭, 높이는 300px~400px 고정) */}
      <div style={{ width: '100%', height: '350px', ...headerStyle }}></div>

      <div className="container" style={{ marginTop: '-80px', position: 'relative', zIndex: 10 }}>
        {/* 2. 스토어 기본 정보 (프로필 카드) */}
        <div className="glass-card fade-in" style={{ padding: '40px', display: 'flex', gap: '30px', alignItems: 'center' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'white', flexShrink: 0, border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {storeInfo.profile_image ? (
              <img src={storeInfo.profile_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="스토어 프로필" />
            ) : (
              <span>🏪</span>
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '10px' }}>{storeInfo.business_name}</h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
              <div>📞 연락처: <b>{storeInfo.store_contact || '미등록'}</b></div>
              <div>📍 주소: <b>{storeInfo.store_address || '미등록'}</b></div>
              {storeInfo.biz_no && <div>🏢 사업자번호: <b>{storeInfo.biz_no}</b></div>}
              {storeInfo.animal_sale_no && <div>🐾 동물판매번호: <b>{storeInfo.animal_sale_no}</b></div>}
            </div>

            <p style={{ color: '#444', lineHeight: '1.6', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
              {storeInfo.store_description || '등록된 스토어 소개가 없습니다.'}
            </p>
          </div>

          {storeInfo.kakao_channel && (
            <div style={{ flexShrink: 0 }}>
              <button onClick={handleKakaoClick} style={{ padding: '15px 30px', borderRadius: '30px', backgroundColor: '#FEE500', color: '#3E2723', fontWeight: '800', fontSize: '1.1rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(254, 229, 0, 0.4)' }}>
                💬 카카오톡 스토어 상담
              </button>
            </div>
          )}
        </div>

        {/* 3. 스토어 사진첩 (갤러리) */}
        {storeInfo.store_additional_images && storeInfo.store_additional_images.length > 0 && (
          <div className="fade-in" style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '20px' }}>📸 스토어 사진첩</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {storeInfo.store_additional_images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: '100%', paddingTop: '75%', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                   <img 
                    src={img} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} 
                    alt={`스토어 이미지 ${idx + 1}`} 
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'} 
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'} 
                    onClick={() => {
                      setSelectedGalleryImg(img);
                      setIsGalleryModalOpen(true);
                    }} 
                   />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 갤러리 모달 팝업 */}
        {isGalleryModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsGalleryModalOpen(false)}>
            <div style={{ position: 'relative', width: '90%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }} onClick={(e) => e.stopPropagation()}>
              
              <button onClick={() => setIsGalleryModalOpen(false)} style={{ position: 'absolute', top: '-50px', right: '0', background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
              
              {/* 메인 큰 이미지 */}
              <div style={{ width: '100%', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', borderRadius: '20px', overflow: 'hidden' }}>
                <img src={selectedGalleryImg} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="확대된 이미지" />
              </div>

              {/* 하단 썸네일 리스트 */}
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px', width: '100%', justifyContent: 'center' }}>
                {storeInfo.store_additional_images.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedGalleryImg(img)}
                    style={{ 
                      width: '80px', height: '60px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                      border: selectedGalleryImg === img ? '3px solid var(--primary)' : '1px solid #555',
                      opacity: selectedGalleryImg === img ? 1 : 0.5,
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="썸네일" />
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* 4. 스토어 전체 분양 게시물 */}
        <div className="fade-in" style={{ marginTop: '50px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>분양중인 아이들</span>
            <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>분양중 {storeDogs.length} / 누적 분양완료 {storeInfo.completed_adoption_count || 0}</span>
          </h2>

          {storeDogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#aaa', fontSize: '1.1rem' }}>이 스토어에 등록된 강아지가 없습니다.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px' }}>
               {storeDogs.map(dog => (
                 <Card 
                   key={dog.id} 
                   data={{ ...dog, image: dog.image_url, date: new Date(dog.created_at).toLocaleDateString() }} 
                 />
               ))}
            </div>
          )}
        </div>

        {/* 5. 판매자 신뢰 평가 및 리뷰 */}
        <div className="fade-in" style={{ marginTop: '50px' }}>
           <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '30px' }}>🏆 판매자 신뢰 평가</h2>
           <div className="glass-card" style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '50px' }}>
              {/* 왼쪽: 통계 바 */}
              <div>
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {storeReviews.length > 0 ? (storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length).toFixed(1) : '5.0'}
                    <span style={{ fontSize: '1.2rem', color: '#FFD54F' }}>{'★'.repeat(5)}</span>
                  </div>
                  <div style={{ color: '#888', marginTop: '5px' }}>총 {storeReviews.length}개의 실제 고객 후기가 있습니다.</div>
                </div>

                {['허위등록 없음', '친절해요.', '설명문 그대로예요.', '방문했는데 깔끔해요.'].map((tag, i) => {
                  const count = storeReviews.filter(r => r.tags?.includes(tag)).length;
                  const percentage = storeReviews.length > 0 ? (count / storeReviews.length) * 100 : 0;
                  const colors = ['var(--p4)', 'var(--p2)', 'var(--primary)', 'var(--p5)'];
                  
                  return (
                    <div key={i} style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '5px' }}>
                        <span>{tag}</span>
                        <span style={{ fontWeight: 'bold' }}>{count}</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: colors[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 오른쪽: 최근 리뷰 목록 */}
              <div style={{ borderLeft: '1px solid #eee', paddingLeft: '50px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>최근 고객 후기</h3>
                {storeReviews.length === 0 ? (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: '50px 0' }}>아직 등록된 리뷰가 없습니다.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {storeReviews.slice(0, 3).map((review, i) => (
                      <div key={i} style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={review.reviewer_image} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{review.reviewer_nickname}</span>
                           </div>
                           <span style={{ color: '#FFD54F' }}>{'★'.repeat(review.rating)}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.5' }}>{review.content || '텍스트 리뷰가 없습니다.'}</p>
                        <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '10px' }}>{new Date(review.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StorePage;
