import React, { useState, useEffect } from 'react';
import Card from './Card'; // 미리보기용 컴포넌트 임포트
import { api } from '../lib/api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { calculateAge } from '../utils/age';

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

const parseRegionFromAddress = (address) => {
  if (!address) return '전국';
  const cleanAddr = address.trim();
  
  if (cleanAddr.includes('서울')) return '서울시';
  if (cleanAddr.includes('인천')) return '인천시';
  if (cleanAddr.includes('경기')) return '경기도';
  if (cleanAddr.includes('부산')) return '부산시';
  if (cleanAddr.includes('대구')) return '대구시';
  if (cleanAddr.includes('대전')) return '대전시';
  if (cleanAddr.includes('광주')) return '광주시';
  if (cleanAddr.includes('울산')) return '울산시';
  if (cleanAddr.includes('세종')) return '세종시';
  if (cleanAddr.includes('제주')) return '제주도';
  
  if (cleanAddr.includes('경상북도') || cleanAddr.includes('경북')) return '경상북도';
  if (cleanAddr.includes('경상남도') || cleanAddr.includes('경남')) return '경상남도';
  if (cleanAddr.includes('전라북도') || cleanAddr.includes('전북')) return '전라북도';
  if (cleanAddr.includes('전라남도') || cleanAddr.includes('전남')) return '전라남도';
  if (cleanAddr.includes('충청북도') || cleanAddr.includes('충북')) return '충청북도';
  if (cleanAddr.includes('충청남도') || cleanAddr.includes('충남')) return '충청남도';
  if (cleanAddr.includes('강원')) return '강원도';

  return '전국';
};

const UploadForm = () => {
  const [formData, setFormData] = useState({
    name: '', breed: '말티푸', price: '', originalPrice: '', region: '전국', 
    age: '', gender: '남아', birthday: '', vaccination: '', description: '',
    isFree: false, isNegotiable: false,
    agreePromotion: false, oneDogPerPost: null,
    videoLink: ''
  });
  const [images, setImages] = useState([]);
  const [primaryImageIdx, setPrimaryImageIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [postingStats, setPostingStats] = useState({ used: 0, limit: 20, loading: true });
  const [userCoupons, setUserCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [modalAdType, setModalAdType] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const editDog = location.state?.editDog;

  const adTypes = {
    main: [
      { id: 'main', label: '히어로 섹션', img: '/images/ad_recommend.jpg' },
      { id: 'recommend', label: '추천 섹션', img: '/images/ad_hero.jpg' },
      { id: 'popular', label: '인기 섹션', img: '/images/ad_popular.jpg' },
      { id: 'special', label: '스페셜 섹션', img: '/images/ad_special.jpg' }
    ],
    breed: [
      { id: 'breed_main', label: '히어로 섹션', img: '/images/ad_breed_hero.jpg' },
      { id: 'breed_recommend', label: '추천 섹션', img: '/images/ad_breed_recommend.jpg' },
      { id: 'breed_popular', label: '인기 섹션', img: '/images/ad_breed_popular.jpg' },
      { id: 'breed_special', label: '스페셜 섹션', img: '/images/ad_breed_special.jpg' }
    ]
  };

  const getAdInfo = (type) => {
    return [...adTypes.main, ...adTypes.breed].find(a => a.id === type);
  };

  useEffect(() => {
    if (editDog) {
      const bday = editDog.birthday || '';
      let calculatedAgeNum = '';
      if (bday) {
        const calculated = calculateAge(bday, '');
        calculatedAgeNum = calculated.includes('개월') ? calculated.replace('개월', '') : (calculated.includes('일') ? '0' : calculated);
      } else {
        calculatedAgeNum = editDog.age ? editDog.age.replace('개월', '').replace('개월령', '') : '';
      }

      setFormData({
        name: editDog.nickname || '',
        breed: editDog.breed || '말티푸',
        price: editDog.price === 0 ? '' : editDog.price,
        originalPrice: editDog.original_price || '',
        region: editDog.region || '전국',
        age: calculatedAgeNum,
        gender: editDog.gender || '남아',
        birthday: editDog.birthday || '',
        vaccination: editDog.vaccine || '', // 기존의 vaccine 컬럼 맵핑
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

  const fetchPostingStats = async () => {
    try {
      const { data: sessionData } = await api.auth.getSession();
      const session = sessionData?.session;
      if (!session) {
        setPostingStats(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data: userProfile } = await api.auth.getUser();
      setCurrentUser(userProfile);

      // 주소 기반 자동 지역 설정 (신규 등록인 경우에만 적용)
      if (!editDog) {
        let storeAddr = '';
        try {
          // 1. 스토어 정보가 있는지 조회
          const { data: storeProfile } = await api.store.getProfile(session.user.id);
          if (storeProfile && storeProfile.address) {
            storeAddr = storeProfile.address;
          } else {
            // 2. 스토어 정보가 없다면 마지막 사업자 신청 주소 조회
            const { data: lastApp } = await api.business.getLastApplication();
            if (lastApp && lastApp.address) {
              storeAddr = lastApp.address;
            }
          }
        } catch (e) {
          console.error('Failed to get store address for auto region binding:', e);
        }
        
        if (storeAddr) {
          const autoRegion = parseRegionFromAddress(storeAddr);
          setFormData(prev => ({
            ...prev,
            region: autoRegion
          }));
        }
      }

      // 내 분양글 목록을 가져와 이번 달 글 등록 수 계산
      const { data: listData, error: listError } = await api.dogs.getList({ seller_id: session.user.id });
      if (listError || !listData) {
        throw new Error(listError || '분양글 목록을 조회하지 못했습니다.');
      }

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // 이번 달 등록된 글 수 필터링
      const count = listData.filter(dog => {
        const createdAt = new Date(dog.created_at);
        return createdAt >= firstDay;
      }).length;
      // 내 보유 쿠폰 조회 및 한도 확장 아이템(구독) 적용
      let additionalLimit = 0;
      const { data: couponsData } = await api.coupons.getMyCoupons();
      if (couponsData && !couponsData.error) {
        setUserCoupons(couponsData);
        // post_limit 타입이고 만료되지 않은 아이템들 합산
        const activePostLimitCoupons = couponsData.filter(c => {
          if (!c.ad_type || !c.ad_type.startsWith('post_limit_')) return false;
          if (!c.expires_at) return true; // 유효기간 무제한인 경우
          return new Date(c.expires_at) > new Date();
        });
        
        additionalLimit = activePostLimitCoupons.reduce((sum, c) => sum + (c.discount_rate || 0), 0);
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

  useEffect(() => {
    fetchPostingStats();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name || !formData.breed || !formData.birthday) {
      return alert('강아지 이름, 견종, 생일은 필수 입력 사항입니다.');
    }
    if (!formData.isFree && !formData.price) {
      return alert('최종 할인가격은 필수 입력 사항입니다. (할인이 없는 경우 최초가격과 동일하게 입력해주세요)');
    }
    // 유효성 체크: 음수 체크 및 할인가격이 최초가격보다 큰지 체크
    if (!formData.isFree) {
      const p = parseInt(formData.price);
      const op = parseInt(formData.originalPrice);
      if (p < 0 || (op && op < 0)) {
        return alert('가격은 0원 이상 입력해야 합니다.');
      }
      if (op && p > op) {
        return alert('최종 할인가격은 최초가격보다 높을 수 없습니다.');
      }
    }
    // 생일 유효성 체크: 미래의 날짜 입력 방지
    if (new Date(formData.birthday) > new Date()) {
      return alert('생일은 오늘 이전 날짜여야 합니다.');
    }
    setLoading(true);

    try {
      const { data: sessionData } = await api.auth.getSession();
      const session = sessionData?.session;
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      let uploadedUrls = [];
      
      // 이미지들을 순차적으로 R2 업로드 API로 업로드 처리
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imgData = images[i];
          if (imgData.startsWith('data:')) {
            const res = await fetch(imgData);
            const blob = await res.blob();
            const file = new File([blob], `dog_${session.user.id}_${Date.now()}_${i}.jpg`, { type: 'image/jpeg' });
            
            const { data: uploadData, error: uploadError } = await api.uploadFile(file);
            if (uploadError || !uploadData) {
              throw new Error(uploadError || '이미지 업로드에 실패했습니다.');
            }
            uploadedUrls.push(uploadData.url);
          } else {
            uploadedUrls.push(imgData); // 기존에 업로드되어 있던 URL
          }
        }
      }

      // 대표 이미지가 항상 0번 인덱스에 위치하도록 이미지 배열 가공
      let finalImages = [...uploadedUrls];
      if (finalImages.length > 0) {
        const primaryImg = finalImages.splice(primaryImageIdx, 1)[0] || finalImages[0];
        finalImages.unshift(primaryImg);
      }

      const postData = {
        nickname: formData.name,
        breed: formData.breed,
        age: (formData.age !== undefined && formData.age !== '') ? `${formData.age}개월` : '',
        gender: formData.gender,
        region: formData.region,
        price: formData.isFree ? 0 : (parseInt(formData.price) || 0),
        original_price: formData.isFree ? 0 : (parseInt(formData.originalPrice) || null),
        birthday: formData.birthday || null,
        vaccine: formData.vaccination || '', // D1 dogs 테이블의 백엔드 필드명 vaccine에 맞추어 전송
        is_negotiable: formData.isNegotiable ? 1 : 0,
        description: formData.description,
        video_url: formData.videoLink,
        images: finalImages,
        used_coupon_id: selectedCouponId || null
      };

      if (editDog) {
        const { error } = await api.dogs.update(editDog.id, postData);
        if (error) throw new Error(error);
        alert('분양 게시물이 정상적으로 수정되었습니다!');
        navigate(-1);
      } else {
        // 신규 등록 시 최종 한도 체크
        if (!postingStats.loading && postingStats.used >= postingStats.limit) {
          throw new Error(`월간 등록 한도(${postingStats.limit}개)를 초과했습니다. 다음 달에 등록해주세요.`);
        }
        const { error } = await api.dogs.create(postData);
        if (error) throw new Error(error);
        alert('분양 게시물이 정상적으로 등록되었습니다!');
        navigate('/');
      }
    } catch (err) {
      alert('게시물 처리 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageResizeAndUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 10) {
      return alert('사진은 최대 10장까지 가능합니다.');
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

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <div className="glass-card" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>강아지 분양 등록</h2>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={labelStyle}>사진 등록 (사진은 최대 10장 가능)</label>
            <input type="file" multiple onChange={handleImageResizeAndUpload} style={{ display: 'block', marginTop: '10px' }} />
            <p style={helperTextStyle}>📸 대표 사진 1장을 포함하여, 아이의 건강하고 사랑스러운 모습을 잘 보여주는 실제 사진을 등록해 주세요. 등록 후 '대표 설정' 버튼을 누르면 목록에 보여질 대표 이미지를 변경할 수 있습니다.</p>
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
              <p style={helperTextStyle}>🐶 아이의 애칭이나 매장에서 부르는 친근한 닉네임을 입력해주세요.</p>
            </div>
            <div>
              <label style={labelStyle}>분양 견종</label>
              <select style={inputStyle} value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})}>
                {breedOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <p style={helperTextStyle}>🔍 정확한 견종을 선택해야 구매자들이 더 쉽게 아이들을 검색할 수 있습니다.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>나이 (개월 - 생일 선택 시 자동 계산)</label>
              <input 
                type="text" 
                placeholder="생일을 선택하면 자동 계산됩니다" 
                style={{ ...inputStyle, backgroundColor: '#f5f5f5' }} 
                value={formData.age ? `${formData.age}개월령` : ''} 
                readOnly 
              />
              <p style={helperTextStyle}>⏳ 생년월일에 따라 자동으로 개월령이 계산됩니다.</p>
            </div>
            <div>
              <label style={labelStyle}>성별</label>
              <select style={inputStyle} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="남아">남아 (왕자님)</option>
                <option value="여아">여아 (공주님)</option>
              </select>
              <p style={helperTextStyle}>✨ 아이의 성별 정보를 바르게 기재해 주세요.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>분양 지역</label>
              <select style={inputStyle} value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})}>
                {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <p style={helperTextStyle}>📍 매장 주소지를 파악해 해당 지역이 자동으로 바인딩되었습니다. 필요한 경우 목록에서 변경하실 수 있습니다.</p>
            </div>
            <div>
              <label style={labelStyle}>생일 (필수)</label>
              <input 
                type="date" 
                style={inputStyle} 
                value={formData.birthday} 
                onChange={e => {
                  const bday = e.target.value;
                  const calculated = calculateAge(bday, '');
                  const monthNum = calculated.includes('개월') ? calculated.replace('개월', '') : (calculated.includes('일') ? '0' : calculated);
                  setFormData({
                    ...formData,
                    birthday: bday,
                    age: monthNum
                  });
                }} 
              />
              <p style={helperTextStyle}>📅 동물보호법상 2개월령(60일령) 이상의 아이만 등록 및 분양이 가능합니다.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>접종 내역</label>
              <input type="text" placeholder="예: 2차 접종 완료" style={inputStyle} value={formData.vaccination} onChange={e => setFormData({...formData, vaccination: e.target.value})} />
              <p style={helperTextStyle}>💉 종합 백신, 코로나, 켄넬코프 등 현재까지 완료된 예방접종 차수를 자세히 적어주세요.</p>
            </div>
            <div>
               <label style={labelStyle}>분양 설정</label>
               <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.checked, price: e.target.checked ? '0' : '', originalPrice: e.target.checked ? '0' : ''})} /> 무료분양
                </label>
                {!formData.isFree && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={formData.isNegotiable} onChange={e => setFormData({...formData, isNegotiable: e.target.checked})} /> 협의가능
                  </label>
                )}
              </div>
              <p style={helperTextStyle}>💰 '무료분양' 체크 시 책임비는 0원으로 등록되며, '협의가능' 체크 시 가격 절충이 가능함을 표시합니다.</p>
            </div>
          </div>

          {!formData.isFree && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>최초가격 (만원)</label>
                <input 
                  type="text" 
                  placeholder="예: 100" 
                  style={inputStyle} 
                  value={formData.originalPrice} 
                  onChange={e => setFormData({...formData, originalPrice: e.target.value.replace(/[^0-9]/g, '')})} 
                />
                <p style={helperTextStyle}>💵 할인 전 정상 분양 금액을 만원 단위의 숫자로만 입력해 주세요. (예: 120만원 → 120)</p>
              </div>
              <div>
                <label style={labelStyle}>최종 할인가격(만원) _ 필수입력</label>
                <input 
                  type="text" 
                  placeholder="예: 80" 
                  style={inputStyle} 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value.replace(/[^0-9]/g, '')})} 
                />
                <p style={helperTextStyle}>🎁 구매자에게 노출될 실제 분양 금액입니다. 할인이 적용되지 않은 경우 최초가격과 동일하게 입력해 주세요.</p>
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>
              유튜브 영상 링크 (선택)
            </label>
            <input type="text" placeholder="유튜브 URL을 입력해주세요" style={inputStyle} value={formData.videoLink} onChange={e => setFormData({...formData, videoLink: e.target.value})} />
            <p style={helperTextStyle}>🎥 유튜브 '공유' 버튼을 눌러 나오는 주소(Shorts 영상 주소도 가능)를 붙여넣어 주세요. 움직이는 영상을 업로드하면 매칭 성사율이 대폭 증가합니다.</p>
          </div>

          <div>
            <label style={labelStyle}>분양 설명글 (상세)</label>
            <div style={{ backgroundColor: 'white' }}>
              <ReactQuill 
                theme="snow"
                value={formData.description} 
                onChange={(val) => setFormData({...formData, description: val})}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['clean']
                  ]
                }}
                style={{ height: '250px', marginBottom: '50px' }}
                placeholder="아이의 성격, 접종 상태, 특징 등을 자유롭게 적어주세요!"
              />
            </div>
            <p style={helperTextStyle}>📝 사료 먹는 법, 성격 및 특징, 배변 훈련 유무, 부견/모견 정보 등을 자세히 작성할수록 예비 견주의 결정을 돕는 데 효과적입니다.</p>
          </div>

          {/* 광고 설정 (선택) */}
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#fffbf0', border: '1px solid #ffeeba', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', color: '#d97706', marginBottom: '5px' }}>
              📢 광고 설정 (선택)
            </label>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                {selectedCouponId ? (
                  <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fcd34d', fontWeight: '600', color: '#b45309' }}>
                    ✅ 적용 예정: {
                      (() => {
                        const c = userCoupons.find(c => c.user_coupon_id === selectedCouponId);
                        if (!c) return '광고 적용됨';
                        const isMain = adTypes.main.some(a => a.id === c.ad_type);
                        const isBreed = adTypes.breed.some(a => a.id === c.ad_type);
                        const prefix = isMain ? '[메인페이지] ' : (isBreed ? '[견종별 페이지] ' : '');
                        return `${prefix}${c.name}`;
                      })()
                    }
                  </div>
                ) : (
                  <div style={{ color: '#92400e', fontSize: '0.95rem' }}>
                    분양글을 더 눈에 띄게 홍보하고 싶으신가요?
                  </div>
                )}
              </div>
              
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  const currentCoupon = userCoupons.find(c => c.user_coupon_id === selectedCouponId);
                  setModalAdType(currentCoupon ? currentCoupon.ad_type : '');
                  setIsAdModalOpen(true); 
                }}
                style={{
                  marginLeft: '15px',
                  padding: '10px 20px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 5px rgba(245, 158, 11, 0.3)'
                }}
              >
                {selectedCouponId ? '변경하기' : '광고 설정하기'}
              </button>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#b45309', margin: 0 }}>
              * 광고를 설정하면 게시물 등록과 동시에 해당 구역에 최우선 노출됩니다.
            </p>
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
                  <input type="radio" name="oneDog" value="yes" checked={formData.oneDogPerPost === true} onChange={() => setFormData({...formData, oneDogPerPost: true})} /> 예
                </label>
                <label style={{ cursor: 'pointer' }}>
                  <input type="radio" name="oneDog" value="no" checked={formData.oneDogPerPost === false} onChange={() => setFormData({...formData, oneDogPerPost: false})} /> 아니요
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
                  price: formData.isFree ? 0 : (parseInt(formData.price) || parseInt(formData.originalPrice) || 0),
                  original_price: formData.isFree ? null : parseInt(formData.originalPrice) || null,
                  is_negotiable: formData.isNegotiable,
                  image: images[primaryImageIdx] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop', // 임시 플레이스홀더 이미지
                  isNew: true,
                  seller_business_name: currentUser?.business_name || null,
                  seller_nickname: currentUser?.nickname || null
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
      {/* 광고 설정 모달 */}
      {isAdModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '15px', width: '100%', maxWidth: '900px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>📢 광고 설정하기</h3>
              <button onClick={(e) => { e.preventDefault(); setIsAdModalOpen(false); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>&times;</button>
            </div>
            
            <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                {/* 왼쪽: 이미지 미리보기 */}
                <div style={{ flex: '1 1 300px', backgroundColor: '#f8fafc', borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', minHeight: '300px' }}>
                  <div style={{ fontSize: '1rem', color: '#475569', fontWeight: 'bold', marginBottom: '15px' }}>선택된 영역 미리보기</div>
                  {modalAdType ? (
                    <>
                      <img src={getAdInfo(modalAdType)?.img} alt="미리보기" style={{ width: '100%', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '15px' }} />
                      <div style={{ padding: '10px 15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', textAlign: 'center', fontWeight: 'bold', color: '#0f172a' }}>
                        ⏳ 광고 노출 기간: <span style={{ color: '#E65100' }}>7일</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '40px', color: '#94a3b8' }}>광고 영역을 선택해주세요.</div>
                  )}
                </div>

                {/* 오른쪽: 라디오 옵션 */}
                <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: '700', color: '#333' }}>서비스 노출 영역 선택</label>
                  
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#E65100' }}>[메인페이지]</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {adTypes.main.map((opt) => {
                      const availableCount = userCoupons.filter(c => c.ad_type === opt.id || c.ad_type === 'all').length;
                      const isDisabled = availableCount === 0;

                      return (
                        <label key={opt.id} style={{ 
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: '2px solid #eee', borderRadius: '12px',
                          borderColor: modalAdType === opt.id ? 'var(--primary)' : '#eee', 
                          backgroundColor: modalAdType === opt.id ? 'var(--primary-light)' : (isDisabled ? '#f8fafc' : 'white'),
                          opacity: isDisabled ? 0.5 : 1,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s'
                        }}>
                          <input 
                            type="radio" 
                            value={opt.id} 
                            checked={modalAdType === opt.id} 
                            onChange={() => !isDisabled && setModalAdType(opt.id)} 
                            disabled={isDisabled}
                            style={{ display: 'none' }} 
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ fontWeight: modalAdType === opt.id ? '800' : '600', color: modalAdType === opt.id ? 'var(--primary-dark)' : '#334155' }}>
                              {opt.label}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: availableCount > 0 ? 'var(--primary)' : '#94a3b8' }}>
                              보유 쿠폰: {availableCount}장
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#00796B', marginTop: '10px' }}>[견종별 페이지]</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {adTypes.breed.map((opt) => {
                      const availableCount = userCoupons.filter(c => c.ad_type === opt.id || c.ad_type === 'all').length;
                      const isDisabled = availableCount === 0;

                      return (
                        <label key={opt.id} style={{ 
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: '2px solid #eee', borderRadius: '12px',
                          borderColor: modalAdType === opt.id ? '#00796B' : '#eee', 
                          backgroundColor: modalAdType === opt.id ? '#E0F2F1' : (isDisabled ? '#f8fafc' : 'white'),
                          opacity: isDisabled ? 0.5 : 1,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s'
                        }}>
                          <input 
                            type="radio" 
                            value={opt.id} 
                            checked={modalAdType === opt.id} 
                            onChange={() => !isDisabled && setModalAdType(opt.id)} 
                            disabled={isDisabled}
                            style={{ display: 'none' }} 
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ fontWeight: modalAdType === opt.id ? '800' : '600', color: modalAdType === opt.id ? '#004D40' : '#334155' }}>
                              {opt.label}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: availableCount > 0 ? '#00796B' : '#94a3b8' }}>
                              보유 쿠폰: {availableCount}장
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 하단 버튼 */}
            <div style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center', gap: '15px', backgroundColor: '#fafafa', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setModalAdType(''); 
                  setSelectedCouponId(''); 
                  setIsAdModalOpen(false); 
                }}
                style={{
                  padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#475569',
                  border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                  fontSize: '1rem', flex: 1, maxWidth: '200px'
                }}
              >
                적용 안함
              </button>
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (modalAdType) {
                    const c = userCoupons.find(coupon => coupon.ad_type === modalAdType || coupon.ad_type === 'all');
                    if (c) {
                      setSelectedCouponId(c.user_coupon_id);
                    }
                  }
                  setIsAdModalOpen(false); 
                }}
                disabled={!modalAdType}
                style={{
                  padding: '12px 24px', backgroundColor: modalAdType ? 'var(--primary)' : '#ccc', color: '#fff',
                  border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: modalAdType ? 'pointer' : 'not-allowed',
                  fontSize: '1rem', flex: 1, maxWidth: '200px'
                }}
              >
                설정 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--muted-text)', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', outline: 'none' };
const helperTextStyle = { fontSize: '0.78rem', color: '#718096', marginTop: '6px', lineHeight: '1.4' };

export default UploadForm;
