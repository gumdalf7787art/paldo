import React, { useState, useEffect } from 'react';
import Card from './Card'; // 미리보기용 컴포넌트 임포트
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

const breedOptions = [
  "골든두들", "골든리트리버", "그레이트덴", "그레이트피레니즈", "그레이하운드", "꼬똥드툴레아",
  "뉴펀들랜드", "닥스훈트", "달마시안", "도고아르젠티노", "도베르만", "라브라도 리트리버",
  "라사압소", "라이카", "로트와일러", "마리노이즈", "마스티프", "말티즈", "말티푸", "몰키",
  "미니핀", "바센지", "바셋하운드", "바이마리너", "버니즈마운틴독", "베들링턴 테리어", "보더콜리",
  "보스톤테리어", "복서", "볼조이", "불개", "불독", "불테리어", "브러쉘그리폰", "브리타니",
  "비글", "비숑프리제", "비어디드콜리", "비즐라", "빠삐용", "사모예드", "삽살이", "샤페이",
  "세인트버나드", "세퍼트", "셰틀랜드쉽독", "슈나우저", "스탠다드 푸들", "시바견", "시베리안허스키",
  "시츄", "아메리카코커스파니엘", "아이리쉬세타", "아키타", "아프간하운드", "알래스카 말라뮤트",
  "알래스칸 클리카이", "에어데일 테리어", "오브차카", "올드 잉글리쉬 쉽독", "와이어 폭스테리어",
  "요크셔테리어", "웰쉬코기 카디건", "이탈리안 그레이하운드", "잉글리쉬코카스파니엘",
  "잭 러셀 테리어", "저패니즈스피츠", "진돗개", "차우차우", "치와와", "친(chin)", "케인코르소",
  "콜리", "킹찰스스파니엘", "토이푸들", "퍼그", "페키니즈", "펨브록 웰시 코기", "포메라니안",
  "포인터", "폼스키", "폼피츠", "푸들", "풍산개", "프랜치불독", "핏불테리어", "화이트테리어"
];

const regionOptions = [
  "전국", "서울시", "인천시", "경기도", "부산시", "대구시", "대전시", "광주시", "울산시",
  "강원도", "충청남도", "충청북도", "경상남도", "경상북도", "전라남도", "전라북도", "제주도", "세종시"
];

const UploadForm = () => {
  const [formData, setFormData] = useState({
    name: '', breed: '말티푸', price: '', originalPrice: '', region: '전국', 
    age: '', gender: '수컷', birthday: '', vaccination: '', description: '',
    isFree: false, isNegotiable: false,
    agreePromotion: false, oneDogPerPost: null,
    videoLink: ''
  });
  const [images, setImages] = useState([]);
  const [primaryImageIdx, setPrimaryImageIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [postingStats, setPostingStats] = useState({ used: 0, limit: 20, loading: true });
  const navigate = useNavigate();
  const location = useLocation();
  const editDog = location.state?.editDog;

  useEffect(() => {
    if (editDog) {
      setFormData({
        name: editDog.nickname || '',
        breed: editDog.breed || '말티푸',
        price: editDog.price === 0 ? '' : editDog.price,
        originalPrice: editDog.original_price || '',
        region: editDog.region || '전국',
        age: editDog.age ? editDog.age.replace('개월', '') : '',
        gender: editDog.gender || '수컷',
        birthday: editDog.birthday || '',
        vaccination: editDog.vaccination || '',
        description: editDog.description || '',
        isFree: editDog.price === 0 && !editDog.is_negotiable,
        isNegotiable: editDog.is_negotiable,
        agreePromotion: true,
        oneDogPerPost: true,
        videoLink: editDog.video_url || ''
      });
      
      const loadedImages = [];
      if (editDog.image_url) loadedImages.push(editDog.image_url);
      if (editDog.additional_images && Array.isArray(editDog.additional_images)) {
        loadedImages.push(...editDog.additional_images);
      }
      setImages(loadedImages);
    }
  }, [editDog]);

  useEffect(() => {
    fetchPostingStats();
  }, []);

  const fetchPostingStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPostingStats(prev => ({ ...prev, loading: false }));
        return;
      }

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { count } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', session.user.id)
        .gte('created_at', firstDay);

      const { data: ucData } = await supabase
        .from('user_coupons')
        .select(`
          expires_at,
          coupons (
            benefit_type,
            discount_amount
          )
        `)
        .eq('user_id', session.user.id)
        .gt('expires_at', now.toISOString());

      let additionalLimit = 0;
      if (ucData) {
        ucData.forEach(item => {
          if (item.coupons?.benefit_type?.startsWith('post_reg')) {
            additionalLimit += (Number(item.coupons.discount_amount) || 20);
          }
        });
      }

      setPostingStats({
        used: count || 0,
        limit: 20 + additionalLimit,
        loading: false
      });
    } catch (err) {
      console.error('Failed to fetch posting stats:', err);
      setPostingStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.breed || !formData.age) {
      return alert('강아지 이름, 견종, 나이는 필수 입력 사항입니다.');
    }
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      let uploadedUrls = [];
      
      // 모든 이미지 스토리지 업로드 로직
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imgData = images[i];
          if (imgData.startsWith('data:')) {
            const res = await fetch(imgData);
            const blob = await res.blob();
            const fileName = `dog_${session.user.id}_${Date.now()}_${i}.jpg`;
            const { error: uploadError } = await supabase.storage.from('business-docs').upload('dogs/' + fileName, blob);
            
            if (!uploadError) {
              const { data } = supabase.storage.from('business-docs').getPublicUrl('dogs/' + fileName);
              uploadedUrls.push(data.publicUrl);
            }
          } else {
            uploadedUrls.push(imgData); // 기존에 업로드되어 있던 URL
          }
        }
      }

      const postData = {
        seller_id: session.user.id,
        nickname: formData.name,
        breed: formData.breed,
        age: formData.age ? `${formData.age}개월` : '',
        gender: formData.gender,
        region: formData.region,
        price: formData.isFree ? 0 : (parseInt(formData.price) || 0),
        original_price: formData.isFree ? 0 : (parseInt(formData.originalPrice) || null),
        birthday: formData.birthday || null,
        vaccination: formData.vaccination || '',
        is_negotiable: formData.isNegotiable,
        description: formData.description,
        video_url: formData.videoLink,
        status: 'available'
      };

      if (uploadedUrls.length > 0) {
        // 대표 사진과 나머지 사진 분리
        const primaryUrl = uploadedUrls.splice(primaryImageIdx, 1)[0] || uploadedUrls[0];
        postData.image_url = primaryUrl;
        postData.additional_images = uploadedUrls; // 남은 url 모두 배열로 저장
      } else {
        postData.additional_images = [];
      }

      if (editDog) {
        const { error } = await supabase.from('dogs').update(postData).eq('id', editDog.id);
        if (error) throw error;
        alert('분양 게시물이 정상적으로 수정되었습니다!');
        navigate(-1);
      } else {
        // 신규 등록 시 최종 한도 체크 (데이터 정합성 보장)
        if (!postingStats.loading && postingStats.used >= postingStats.limit) {
          throw new Error(`월간 등록 한도(${postingStats.limit}개)를 초과했습니다. 쿠폰을 이용하거나 다음 달에 등록해주세요.`);
        }
        const { error } = await supabase.from('dogs').insert([postData]);
        if (error) throw error;
        alert('분양 게시물이 정상적으로 등록되었습니다!');
        navigate('/');
      }
    } catch (err) {
      alert('게시물 등록 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageResizeAndUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 6) {
      return alert('사진은 최대 6장까지만 등록 가능합니다.');
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setImages(prev => [...prev, dataUrl]);
        };
      };
    });
  };

  const handleDeleteImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (primaryImageIdx === index) {
      setPrimaryImageIdx(0);
    } else if (primaryImageIdx > index) {
      setPrimaryImageIdx(prev => prev - 1);
    }
  };

  const getPreviewPrice = () => {
    if (formData.isFree) return '무료분양';
    const mainPrice = formData.price;
    const origPrice = formData.originalPrice;
    
    if (!mainPrice && !origPrice) return '0원';
    
    // 만약 할인가격만 있으면 할인가격 리턴
    if (!origPrice) return parseInt(mainPrice).toLocaleString() + '만원';
    // 만약 최초가격만 있으면 최초가격 리턴
    if (!mainPrice) return parseInt(origPrice).toLocaleString() + '만원';
    
    // 둘 다 있을 때: 할인가격 리턴 (Card 컴포넌트 내부에서 original_price가 있을 시 할인 로직 수행하도록 data 넘김)
    return parseInt(mainPrice).toLocaleString() + '만원';
  };

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <div className="glass-card" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>강아지 분양 등록</h2>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={labelStyle}>사진 등록 (사진은 최대 6장 가능)</label>
            <input type="file" multiple onChange={handleImageResizeAndUpload} style={{ display: 'block', marginTop: '10px' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative', width: '100px', height: '100px' }}>
                  <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: primaryImageIdx === i ? '3px solid var(--primary)' : '1px solid #ddd' }} />
                  {primaryImageIdx === i && (
                    <div style={{ position: 'absolute', top: '-8px', left: '-8px', background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>대표</div>
                  )}
                  <button onClick={() => handleDeleteImage(i)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>X</button>
                  {primaryImageIdx !== i && (
                    <button onClick={() => setPrimaryImageIdx(i)} style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem', padding: '3px 6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>대표 설정</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>강아지 이름</label>
              <input type="text" placeholder="예: 인절미" style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>분양 견종</label>
              <select style={inputStyle} value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})}>
                {breedOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>나이 (개월)</label>
              <input type="number" placeholder="예: 2" style={inputStyle} value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>성별</label>
              <select style={inputStyle} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="수컷">수컷 (왕자님)</option>
                <option value="암컷">암컷 (공주님)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>분양 지역</label>
              <select style={inputStyle} value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})}>
                {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>생일 (선택)</label>
              <input type="date" style={inputStyle} value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>접종 내역</label>
              <input type="text" placeholder="예: 2차 접종 완료" style={inputStyle} value={formData.vaccination} onChange={e => setFormData({...formData, vaccination: e.target.value})} />
            </div>
            <div>
               <label style={labelStyle}>분양 설정</label>
               <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.checked, price: e.target.checked ? '0' : '', originalPrice: e.target.checked ? '0' : ''})} /> 무료분양
                </label>
                {!formData.isFree && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={formData.isNegotiable} onChange={e => setFormData({...formData, isNegotiable: e.target.checked})} /> 협의가능
                  </label>
                )}
              </div>
            </div>
          </div>

          {!formData.isFree && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>최초가격 (만원)</label>
                <input type="number" placeholder="예: 100" style={inputStyle} value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>할인가격 (만원)</label>
                <input type="number" placeholder="예: 80" style={inputStyle} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>
              유튜브/인스타 영상 링크 (선택)
              <span style={{ fontSize: '0.8rem', fontWeight: 'normal', marginLeft: '8px', color: '#888' }}>
                영상에서 공유 클릭하시고 링크 복사해서 넣으시면 됩니다. (유튜브 바로 실행, 쇼츠-릴스는 링크)
              </span>
            </label>
            <input type="text" placeholder="URL을 입력해주세요" style={inputStyle} value={formData.videoLink} onChange={e => setFormData({...formData, videoLink: e.target.value})} />
          </div>

          <div>
            <label style={labelStyle}>분양 설명글</label>
            <textarea placeholder="아이의 성격, 접종 상태, 특징 등을 자유롭게 적어주세요!" style={{...inputStyle, height: '150px', resize: 'vertical'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input type="checkbox" checked={formData.agreePromotion} onChange={e => setFormData({...formData, agreePromotion: e.target.checked})} />
                등록하시는 이미지는 팔도댕댕 홍보용으로 사용하는것에 동의합니다.
              </label>
            </div>
            
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <p style={{ fontSize: '0.95rem', marginBottom: '10px', fontWeight: '600' }}>한 게시물에 한 아이만 등록 가능합니다. (준수하시나요?)</p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input type="radio" name="oneDog" value="yes" onChange={() => setFormData({...formData, oneDogPerPost: true})} /> 예
                </label>
                <label style={{ cursor: 'pointer' }}>
                  <input type="radio" name="oneDog" value="no" onChange={() => setFormData({...formData, oneDogPerPost: false})} /> 아니요
                </label>
              </div>
            </div>
          </div>

          {/* 등록 내용 미리보기 */}
          <div style={{ marginTop: '20px', padding: '25px', borderRadius: '12px', border: '1px dashed #ccc', backgroundColor: '#fafbfc' }}>
            <h3 style={{ marginBottom: '15px', color: '#555', fontSize: '1.1rem', textAlign: 'center' }}>👀 강아지 카드 미리보기</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '280px', transform: 'scale(1)', transformOrigin: 'top center' }}>
                <Card data={{
                  nickname: formData.name || '이름 입력중...',
                  breed: formData.breed || '견종 미입력',
                  age: formData.age ? `${formData.age}개월` : 'N개월',
                  gender: formData.gender,
                  region: formData.region,
                  price: getPreviewPrice(),
                  original_price: formData.originalPrice,
                  is_negotiable: formData.isNegotiable,
                  image: images[primaryImageIdx] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop', // 임시 플레이스홀더 이미지
                  isNew: true
                }} />
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888', marginTop: '15px' }}>
              고객들에게 노출되는 실제 리스트형태 미리보기입니다.
            </p>
          </div>

          {/* 게시물 한도 안내 추가 */}
          {!postingStats.loading && (
            <div style={{ 
              padding: '15px', 
              borderRadius: '12px', 
              backgroundColor: postingStats.used >= postingStats.limit ? '#fff5f5' : '#f0f9ff',
              border: `1px solid ${postingStats.used >= postingStats.limit ? '#feb2b2' : '#bae6fd'}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: postingStats.used >= postingStats.limit ? '#e53e3e' : '#0369a1' }}>
                이번 달 게시물 {postingStats.used}개 / 잔여 게시물 {Math.max(0, postingStats.limit - postingStats.used)}개
              </div>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px', marginBottom: 0 }}>
                {postingStats.used >= postingStats.limit 
                  ? '⚠️ 월간 등록 한도를 모두 소진하였습니다. 다음 달 1일부터 다시 등록이 가능합니다.' 
                  : `매달 기본 20개의 게시물을 등록할 수 있습니다. (현재 총 한도: ${postingStats.limit}개)`}
              </p>
            </div>
          )}

          <button 
            onClick={handleSubmit}
            style={{
              marginTop: '10px', padding: '15px', borderRadius: '12px',
              backgroundColor: (formData.oneDogPerPost && formData.agreePromotion && !loading && (editDog || postingStats.used < postingStats.limit)) ? 'var(--primary-dark)' : '#ccc',
              color: 'white', fontWeight: '700', fontSize: '1.1rem',
              cursor: (formData.oneDogPerPost && formData.agreePromotion && !loading && (editDog || postingStats.used < postingStats.limit)) ? 'pointer' : 'not-allowed'
            }} 
            disabled={!formData.oneDogPerPost || !formData.agreePromotion || loading || (!editDog && postingStats.used >= postingStats.limit)}
          >
            {loading ? '처리 중...' : (editDog ? '분양 게시물 수정하기' : '분양 게시물 등록하기')}
          </button>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--muted-text)', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', outline: 'none' };

export default UploadForm;
