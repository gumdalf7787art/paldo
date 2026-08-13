import React, { useState, useEffect } from 'react';
import Card from './Card'; // 誘몃━蹂닿린??而댄룷?뚰듃 ?꾪룷??import { api } from '../lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { calculateAge } from '../utils/age';

const breedOptions = [
  "怨⑤뱺?먮뱾", "怨⑤뱺由ы듃由щ쾭", "洹몃젅?댄듃??, "洹몃젅?댄듃?쇰젅?덉쫰", "洹몃젅?댄븯?대뱶", "瑗щ삦?쒗댋?덉븘",
  "?댄??ㅻ옖??, "?μ뒪?덊듃", "?щ쭏?쒖븞", "?꾧퀬?꾨Ⅴ?좏떚??, "?꾨쿋瑜대쭔", "?쇰툕?쇰룄 由ы듃由щ쾭",
  "?쇱궗?뺤냼", "?쇱씠移?, "濡쒗듃??쇰윭", "留덈━?몄씠利?, "留덉뒪?고봽", "留먰떚利?, "留먰떚??, "紐고궎",
  "誘몃땲?", "諛붿꽱吏", "諛붿뀑?섏슫??, "諛붿씠留덈━??, "踰꾨땲利덈쭏?댄떞??, "踰좊뱾留곹꽩 ?뚮━??, "蹂대뜑肄쒕━",
  "蹂댁뒪?ㅽ뀒由ъ뼱", "蹂듭꽌", "蹂쇱“??, "遺덇컻", "遺덈룆", "遺덊뀒由ъ뼱", "釉뚮윭?섍렇由ы룿", "釉뚮━???,
  "鍮꾧?", "鍮꾩닊?꾨━??, "鍮꾩뼱?붾뱶肄쒕━", "鍮꾩쫹??, "鍮좎굪??, "?щえ?덈뱶", "?쎌궡??, "?ㅽ럹??,
  "?몄씤?몃쾭?섎뱶", "?명띁??, "?고??쒕뱶?쎈룆", "?덈굹?곗?", "?ㅽ깲?ㅻ뱶 ?몃뱾", "?쒕컮寃?, "?쒕쿋由ъ븞?덉뒪??,
  "?쒖툌", "?꾨찓由ъ뭅肄붿빱?ㅽ뙆?덉뿕", "?꾩씠由ъ돩?명?", "?꾪궎?", "?꾪봽媛꾪븯?대뱶", "?뚮옒?ㅼ뭅 留먮씪裕ㅽ듃",
  "?뚮옒?ㅼ뭏 ?대━移댁씠", "?먯뼱?곗씪 ?뚮━??, "?ㅻ툕李⑥뭅", "?щ뱶 ?됯?由ъ돩 ?쎈룆", "??댁뼱 ??뒪?뚮━??,
  "?뷀겕?뷀뀒由ъ뼱", "?곗돩肄붽린 移대뵒嫄?, "?댄깉由ъ븞 洹몃젅?댄븯?대뱶", "?됯?由ъ돩肄붿뭅?ㅽ뙆?덉뿕",
  "???ъ? ?뚮━??, "??⑤땲利덉뒪?쇱툩", "吏꾨룛媛?, "李⑥슦李⑥슦", "移섏??", "移?chin)", "耳?몄퐫瑜댁냼",
  "肄쒕━", "?뱀같?ㅼ뒪?뚮땲??, "?좎씠?몃뱾", "?쇨렇", "?섑궎?덉쫰", "?⑤툕濡??곗떆 肄붽린", "?щ찓?쇰땲??,
  "?ъ씤??, "?쇱뒪??, "?쇳뵾痢?, "?몃뱾", "?띿궛媛?, "?꾨옖移섎텋??, "?뤿텋?뚮━??, "?붿씠?명뀒由ъ뼱"
];

const regionOptions = [
  "?꾧뎅", "?쒖슱??, "?몄쿇??, "寃쎄린??, "遺?곗떆", "?援ъ떆", "??꾩떆", "愿묒＜??, "?몄궛??,
  "媛뺤썝??, "異⑹껌?⑤룄", "異⑹껌遺곷룄", "寃쎌긽?⑤룄", "寃쎌긽遺곷룄", "?꾨씪?⑤룄", "?꾨씪遺곷룄", "?쒖＜??, "?몄쥌??
];

const parseRegionFromAddress = (address) => {
  if (!address) return '?꾧뎅';
  const cleanAddr = address.trim();
  
  if (cleanAddr.includes('?쒖슱')) return '?쒖슱??;
  if (cleanAddr.includes('?몄쿇')) return '?몄쿇??;
  if (cleanAddr.includes('寃쎄린')) return '寃쎄린??;
  if (cleanAddr.includes('遺??)) return '遺?곗떆';
  if (cleanAddr.includes('?援?)) return '?援ъ떆';
  if (cleanAddr.includes('???)) return '??꾩떆';
  if (cleanAddr.includes('愿묒＜')) return '愿묒＜??;
  if (cleanAddr.includes('?몄궛')) return '?몄궛??;
  if (cleanAddr.includes('?몄쥌')) return '?몄쥌??;
  if (cleanAddr.includes('?쒖＜')) return '?쒖＜??;
  
  if (cleanAddr.includes('寃쎌긽遺곷룄') || cleanAddr.includes('寃쎈턿')) return '寃쎌긽遺곷룄';
  if (cleanAddr.includes('寃쎌긽?⑤룄') || cleanAddr.includes('寃쎈궓')) return '寃쎌긽?⑤룄';
  if (cleanAddr.includes('?꾨씪遺곷룄') || cleanAddr.includes('?꾨턿')) return '?꾨씪遺곷룄';
  if (cleanAddr.includes('?꾨씪?⑤룄') || cleanAddr.includes('?꾨궓')) return '?꾨씪?⑤룄';
  if (cleanAddr.includes('異⑹껌遺곷룄') || cleanAddr.includes('異⑸턿')) return '異⑹껌遺곷룄';
  if (cleanAddr.includes('異⑹껌?⑤룄') || cleanAddr.includes('異⑸궓')) return '異⑹껌?⑤룄';
  if (cleanAddr.includes('媛뺤썝')) return '媛뺤썝??;

  return '?꾧뎅';
};

const UploadForm = () => {
  const [formData, setFormData] = useState({
    name: '', breed: '留먰떚??, price: '', originalPrice: '', region: '?꾧뎅', 
    age: '', gender: '?⑥븘', birthday: '', vaccination: '', description: '',
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
      { id: 'main', label: '?덉뼱濡??뱀뀡', img: '/images/ad_recommend.jpg' },
      { id: 'recommend', label: '異붿쿇 ?뱀뀡', img: '/images/ad_hero.jpg' },
      { id: 'popular', label: '?멸린 ?뱀뀡', img: '/images/ad_popular.jpg' },
      { id: 'special', label: '?ㅽ럹???뱀뀡', img: '/images/ad_special.jpg' }
    ],
    breed: [
      { id: 'breed_main', label: '?덉뼱濡??뱀뀡', img: '/images/ad_breed_hero.jpg' },
      { id: 'breed_recommend', label: '異붿쿇 ?뱀뀡', img: '/images/ad_breed_recommend.jpg' },
      { id: 'breed_popular', label: '?멸린 ?뱀뀡', img: '/images/ad_breed_popular.jpg' },
      { id: 'breed_special', label: '?ㅽ럹???뱀뀡', img: '/images/ad_breed_special.jpg' }
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
        calculatedAgeNum = calculated.includes('媛쒖썡') ? calculated.replace('媛쒖썡', '') : (calculated.includes('??) ? '0' : calculated);
      } else {
        calculatedAgeNum = editDog.age ? editDog.age.replace('媛쒖썡', '').replace('媛쒖썡??, '') : '';
      }

      setFormData({
        name: editDog.nickname || '',
        breed: editDog.breed || '留먰떚??,
        price: editDog.price === 0 ? '' : editDog.price,
        originalPrice: editDog.original_price || '',
        region: editDog.region || '?꾧뎅',
        age: calculatedAgeNum,
        gender: editDog.gender || '?⑥븘',
        birthday: editDog.birthday || '',
        vaccination: editDog.vaccine || '', // 湲곗〈??vaccine 而щ읆 留듯븨
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

      // 二쇱냼 湲곕컲 ?먮룞 吏???ㅼ젙 (?좉퇋 ?깅줉??寃쎌슦?먮쭔 ?곸슜)
      if (!editDog) {
        let storeAddr = '';
        try {
          // 1. ?ㅽ넗???뺣낫媛 ?덈뒗吏 議고쉶
          const { data: storeProfile } = await api.store.getProfile(session.user.id);
          if (storeProfile && storeProfile.address) {
            storeAddr = storeProfile.address;
          } else {
            // 2. ?ㅽ넗???뺣낫媛 ?녿떎硫?留덉?留??ъ뾽???좎껌 二쇱냼 議고쉶
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

      // ??遺꾩뼇湲 紐⑸줉??媛?몄? ?대쾲 ??湲 ?깅줉 ??怨꾩궛
      const { data: listData, error: listError } = await api.dogs.getList({ seller_id: session.user.id });
      if (listError || !listData) {
        throw new Error(listError || '遺꾩뼇湲 紐⑸줉??議고쉶?섏? 紐삵뻽?듬땲??');
      }

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // ?대쾲 ???깅줉??湲 ???꾪꽣留?      const count = listData.filter(dog => {
        const createdAt = new Date(dog.created_at);
        return createdAt >= firstDay;
      }).length;
      // ??蹂댁쑀 荑좏룿 議고쉶 諛??쒕룄 ?뺤옣 ?꾩씠??援щ룆) ?곸슜
      let additionalLimit = 0;
      const { data: couponsData } = await api.coupons.getMyCoupons();
      if (couponsData && !couponsData.error) {
        setUserCoupons(couponsData);
        // post_limit ??낆씠怨?留뚮즺?섏? ?딆? ?꾩씠?쒕뱾 ?⑹궛
        const activePostLimitCoupons = couponsData.filter(c => {
          if (!c.ad_type || !c.ad_type.startsWith('post_limit_')) return false;
          if (!c.expires_at) return true; // ?좏슚湲곌컙 臾댁젣?쒖씤 寃쎌슦
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
      return alert('媛뺤븘吏 ?대쫫, 寃ъ쥌, ?앹씪? ?꾩닔 ?낅젰 ?ы빆?낅땲??');
    }
    if (!formData.isFree && !formData.price) {
      return alert('理쒖쥌 ?좎씤媛寃⑹? ?꾩닔 ?낅젰 ?ы빆?낅땲?? (?좎씤???녿뒗 寃쎌슦 理쒖큹媛寃⑷낵 ?숈씪?섍쾶 ?낅젰?댁＜?몄슂)');
    }
    // ?좏슚??泥댄겕: ?뚯닔 泥댄겕 諛??좎씤媛寃⑹씠 理쒖큹媛寃⑸낫???곗? 泥댄겕
    if (!formData.isFree) {
      const p = parseInt(formData.price);
      const op = parseInt(formData.originalPrice);
      if (p < 0 || (op && op < 0)) {
        return alert('媛寃⑹? 0???댁긽 ?낅젰?댁빞 ?⑸땲??');
      }
      if (op && p > op) {
        return alert('理쒖쥌 ?좎씤媛寃⑹? 理쒖큹媛寃⑸낫???믪쓣 ???놁뒿?덈떎.');
      }
    }
    // ?앹씪 ?좏슚??泥댄겕: 誘몃옒???좎쭨 ?낅젰 諛⑹?
    if (new Date(formData.birthday) > new Date()) {
      return alert('?앹씪? ?ㅻ뒛 ?댁쟾 ?좎쭨?ъ빞 ?⑸땲??');
    }
    setLoading(true);

    try {
      const { data: sessionData } = await api.auth.getSession();
      const session = sessionData?.session;
      if (!session) {
        alert('濡쒓렇?몄씠 ?꾩슂?⑸땲??');
        return;
      }

      let uploadedUrls = [];
      
      // ?대?吏?ㅼ쓣 ?쒖감?곸쑝濡?R2 ?낅줈??API濡??낅줈??泥섎━
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imgData = images[i];
          if (imgData.startsWith('data:')) {
            const res = await fetch(imgData);
            const blob = await res.blob();
            const file = new File([blob], `dog_${session.user.id}_${Date.now()}_${i}.jpg`, { type: 'image/jpeg' });
            
            const { data: uploadData, error: uploadError } = await api.uploadFile(file);
            if (uploadError || !uploadData) {
              throw new Error(uploadError || '?대?吏 ?낅줈?쒖뿉 ?ㅽ뙣?덉뒿?덈떎.');
            }
            uploadedUrls.push(uploadData.url);
          } else {
            uploadedUrls.push(imgData); // 湲곗〈???낅줈?쒕릺???덈뜕 URL
          }
        }
      }

      // ????대?吏媛 ??긽 0踰??몃뜳?ㅼ뿉 ?꾩튂?섎룄濡??대?吏 諛곗뿴 媛怨?      let finalImages = [...uploadedUrls];
      if (finalImages.length > 0) {
        const primaryImg = finalImages.splice(primaryImageIdx, 1)[0] || finalImages[0];
        finalImages.unshift(primaryImg);
      }

      const postData = {
        nickname: formData.name,
        breed: formData.breed,
        age: (formData.age !== undefined && formData.age !== '') ? `${formData.age}媛쒖썡` : '',
        gender: formData.gender,
        region: formData.region,
        price: formData.isFree ? 0 : (parseInt(formData.price) || 0),
        original_price: formData.isFree ? 0 : (parseInt(formData.originalPrice) || null),
        birthday: formData.birthday || null,
        vaccine: formData.vaccination || '', // D1 dogs ?뚯씠釉붿쓽 諛깆뿏???꾨뱶紐?vaccine??留욎텛???꾩넚
        is_negotiable: formData.isNegotiable ? 1 : 0,
        description: formData.description,
        video_url: formData.videoLink,
        images: finalImages,
        used_coupon_id: selectedCouponId || null
      };

      if (editDog) {
        const { error } = await api.dogs.update(editDog.id, postData);
        if (error) throw new Error(error);
        alert('遺꾩뼇 寃뚯떆臾쇱씠 ?뺤긽?곸쑝濡??섏젙?섏뿀?듬땲??');
        navigate(-1);
      } else {
        // ?좉퇋 ?깅줉 ??理쒖쥌 ?쒕룄 泥댄겕
        if (!postingStats.loading && postingStats.used >= postingStats.limit) {
          throw new Error(`?붽컙 ?깅줉 ?쒕룄(${postingStats.limit}媛?瑜?珥덇낵?덉뒿?덈떎. ?ㅼ쓬 ?ъ뿉 ?깅줉?댁＜?몄슂.`);
        }
        const { error } = await api.dogs.create(postData);
        if (error) throw new Error(error);
        alert('遺꾩뼇 寃뚯떆臾쇱씠 ?뺤긽?곸쑝濡??깅줉?섏뿀?듬땲??');
        navigate('/');
      }
    } catch (err) {
      alert('寃뚯떆臾?泥섎━ ?ㅽ뙣: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageResizeAndUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 10) {
      return alert('?ъ쭊? 理쒕? 10?κ퉴吏 媛?ν빀?덈떎.');
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
    if (formData.isFree) return '臾대즺遺꾩뼇';
    const mainPrice = formData.price;
    const origPrice = formData.originalPrice;
    
    if (!mainPrice && !origPrice) return '0??;
    
    // 留뚯빟 ?좎씤媛寃⑸쭔 ?덉쑝硫??좎씤媛寃?由ы꽩
    if (!origPrice) return parseInt(mainPrice).toLocaleString() + '留뚯썝';
    // 留뚯빟 理쒖큹媛寃⑸쭔 ?덉쑝硫?理쒖큹媛寃?由ы꽩
    if (!mainPrice) return parseInt(origPrice).toLocaleString() + '留뚯썝';
    
    // ?????덉쓣 ?? ?좎씤媛寃?由ы꽩
    return parseInt(mainPrice).toLocaleString() + '留뚯썝';
  };

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <div className="glass-card" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>媛뺤븘吏 遺꾩뼇 ?깅줉</h2>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={labelStyle}>?ъ쭊 ?깅줉 (?ъ쭊? 理쒕? 10??媛??</label>
            <input type="file" multiple onChange={handleImageResizeAndUpload} style={{ display: 'block', marginTop: '10px' }} />
            <p style={helperTextStyle}>?벝 ????ъ쭊 1?μ쓣 ?ы븿?섏뿬, ?꾩씠??嫄닿컯?섍퀬 ?щ옉?ㅻ윭??紐⑥뒿????蹂댁뿬二쇰뒗 ?ㅼ젣 ?ъ쭊???깅줉??二쇱꽭?? ?깅줉 ??'????ㅼ젙' 踰꾪듉???꾨Ⅴ硫?紐⑸줉??蹂댁뿬吏?????대?吏瑜?蹂寃쏀븷 ???덉뒿?덈떎.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative', width: '100px', height: '100px' }}>
                  <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: primaryImageIdx === i ? '3px solid var(--primary)' : '1px solid #ddd' }} />
                  {primaryImageIdx === i && (
                    <div style={{ position: 'absolute', top: '-8px', left: '-8px', background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>???/div>
                  )}
                  <button onClick={() => handleDeleteImage(i)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>X</button>
                  {primaryImageIdx !== i && (
                    <button onClick={() => setPrimaryImageIdx(i)} style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem', padding: '3px 6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>????ㅼ젙</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>媛뺤븘吏 ?대쫫</label>
              <input type="text" placeholder="?? ?몄젅誘? style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <p style={helperTextStyle}>?맯 ?꾩씠???좎묶?대굹 留ㅼ옣?먯꽌 遺瑜대뒗 移쒓렐???됰꽕?꾩쓣 ?낅젰?댁＜?몄슂.</p>
            </div>
            <div>
              <label style={labelStyle}>遺꾩뼇 寃ъ쥌</label>
              <select style={inputStyle} value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})}>
                {breedOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <p style={helperTextStyle}>?뵇 ?뺥솗??寃ъ쥌???좏깮?댁빞 援щℓ?먮뱾?????쎄쾶 ?꾩씠?ㅼ쓣 寃?됲븷 ???덉뒿?덈떎.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>?섏씠 (媛쒖썡 - ?앹씪 ?좏깮 ???먮룞 怨꾩궛)</label>
              <input 
                type="text" 
                placeholder="?앹씪???좏깮?섎㈃ ?먮룞 怨꾩궛?⑸땲?? 
                style={{ ...inputStyle, backgroundColor: '#f5f5f5' }} 
                value={formData.age ? `${formData.age}媛쒖썡?? : ''} 
                readOnly 
              />
              <p style={helperTextStyle}>???앸뀈?붿씪???곕씪 ?먮룞?쇰줈 媛쒖썡?뱀씠 怨꾩궛?⑸땲??</p>
            </div>
            <div>
              <label style={labelStyle}>?깅퀎</label>
              <select style={inputStyle} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="?⑥븘">?⑥븘 (?뺤옄??</option>
                <option value="?ъ븘">?ъ븘 (怨듭＜??</option>
              </select>
              <p style={helperTextStyle}>???꾩씠???깅퀎 ?뺣낫瑜?諛붾Ⅴ寃?湲곗옱??二쇱꽭??</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>遺꾩뼇 吏??/label>
              <select style={inputStyle} value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})}>
                {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <p style={helperTextStyle}>?뱧 留ㅼ옣 二쇱냼吏瑜??뚯븙???대떦 吏??씠 ?먮룞?쇰줈 諛붿씤?⑸릺?덉뒿?덈떎. ?꾩슂??寃쎌슦 紐⑸줉?먯꽌 蹂寃쏀븯?????덉뒿?덈떎.</p>
            </div>
            <div>
              <label style={labelStyle}>?앹씪 (?꾩닔)</label>
              <input 
                type="date" 
                style={inputStyle} 
                value={formData.birthday} 
                onChange={e => {
                  const bday = e.target.value;
                  const calculated = calculateAge(bday, '');
                  const monthNum = calculated.includes('媛쒖썡') ? calculated.replace('媛쒖썡', '') : (calculated.includes('??) ? '0' : calculated);
                  setFormData({
                    ...formData,
                    birthday: bday,
                    age: monthNum
                  });
                }} 
              />
              <p style={helperTextStyle}>?뱟 ?숇Ъ蹂댄샇踰뺤긽 2媛쒖썡??60?쇰졊) ?댁긽???꾩씠留??깅줉 諛?遺꾩뼇??媛?ν빀?덈떎.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>?묒쥌 ?댁뿭</label>
              <input type="text" placeholder="?? 2李??묒쥌 ?꾨즺" style={inputStyle} value={formData.vaccination} onChange={e => setFormData({...formData, vaccination: e.target.value})} />
              <p style={helperTextStyle}>?뭺 醫낇빀 諛깆떊, 肄붾줈?? 耳꾨꽟肄뷀봽 ???꾩옱源뚯? ?꾨즺???덈갑?묒쥌 李⑥닔瑜??먯꽭???곸뼱二쇱꽭??</p>
            </div>
            <div>
               <label style={labelStyle}>遺꾩뼇 ?ㅼ젙</label>
               <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.checked, price: e.target.checked ? '0' : '', originalPrice: e.target.checked ? '0' : ''})} /> 臾대즺遺꾩뼇
                </label>
                {!formData.isFree && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={formData.isNegotiable} onChange={e => setFormData({...formData, isNegotiable: e.target.checked})} /> ?묒쓽媛??                  </label>
                )}
              </div>
              <p style={helperTextStyle}>?뮥 '臾대즺遺꾩뼇' 泥댄겕 ??梨낆엫鍮꾨뒗 0?먯쑝濡??깅줉?섎ŉ, '?묒쓽媛?? 泥댄겕 ??媛寃??덉땐??媛?ν븿???쒖떆?⑸땲??</p>
            </div>
          </div>

          {!formData.isFree && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>理쒖큹媛寃?(留뚯썝)</label>
                <input 
                  type="text" 
                  placeholder="?? 100" 
                  style={inputStyle} 
                  value={formData.originalPrice} 
                  onChange={e => setFormData({...formData, originalPrice: e.target.value.replace(/[^0-9]/g, '')})} 
                />
                <p style={helperTextStyle}>?뮫 ?좎씤 ???뺤긽 遺꾩뼇 湲덉븸??留뚯썝 ?⑥쐞???レ옄濡쒕쭔 ?낅젰??二쇱꽭?? (?? 120留뚯썝 ??120)</p>
              </div>
              <div>
                <label style={labelStyle}>理쒖쥌 ?좎씤媛寃?留뚯썝) _ ?꾩닔?낅젰</label>
                <input 
                  type="text" 
                  placeholder="?? 80" 
                  style={inputStyle} 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value.replace(/[^0-9]/g, '')})} 
                />
                <p style={helperTextStyle}>?럞 援щℓ?먯뿉寃??몄텧???ㅼ젣 遺꾩뼇 湲덉븸?낅땲?? ?좎씤???곸슜?섏? ?딆? 寃쎌슦 理쒖큹媛寃⑷낵 ?숈씪?섍쾶 ?낅젰??二쇱꽭??</p>
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>
              ?좏뒠釉??곸긽 留곹겕 (?좏깮)
            </label>
            <input type="text" placeholder="?좏뒠釉?URL???낅젰?댁＜?몄슂" style={inputStyle} value={formData.videoLink} onChange={e => setFormData({...formData, videoLink: e.target.value})} />
            <p style={helperTextStyle}>?렏 ?좏뒠釉?'怨듭쑀' 踰꾪듉???뚮윭 ?섏삤??二쇱냼(Shorts ?곸긽 二쇱냼??媛??瑜?遺숈뿬?ｌ뼱 二쇱꽭?? ?吏곸씠???곸긽???낅줈?쒗븯硫?留ㅼ묶 ?깆궗?⑥씠 ???利앷??⑸땲??</p>
          </div>

          <div>
            <label style={labelStyle}>遺꾩뼇 ?ㅻ챸湲</label>
            <textarea placeholder="?꾩씠???깃꺽, ?묒쥌 ?곹깭, ?뱀쭠 ?깆쓣 ?먯쑀濡?쾶 ?곸뼱二쇱꽭??" style={{...inputStyle, height: '150px', resize: 'vertical'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <p style={helperTextStyle}>?뱷 ?щ즺 癒밸뒗 踰? ?깃꺽 諛??뱀쭠, 諛곕? ?덈젴 ?좊Т, 遺寃?紐④껄 ?뺣낫 ?깆쓣 ?먯꽭???묒꽦?좎닔濡??덈퉬 寃ъ＜??寃곗젙???뺣뒗 ???④낵?곸엯?덈떎.</p>
          </div>

          {/* 愿묎퀬 ?ㅼ젙 (?좏깮) */}
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#fffbf0', border: '1px solid #ffeeba', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', color: '#d97706', marginBottom: '5px' }}>
              ?뱼 愿묎퀬 ?ㅼ젙 (?좏깮)
            </label>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                {selectedCouponId ? (
                  <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fcd34d', fontWeight: '600', color: '#b45309' }}>
                    ???곸슜 ?덉젙: {userCoupons.find(c => c.user_coupon_id === selectedCouponId)?.name || '愿묎퀬 ?곸슜??}
                  </div>
                ) : (
                  <div style={{ color: '#92400e', fontSize: '0.95rem' }}>
                    遺꾩뼇湲?????덉뿉 ?꾧쾶 ?띾낫?섍퀬 ?띠쑝?좉???
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
                {selectedCouponId ? '蹂寃쏀븯湲? : '愿묎퀬 ?ㅼ젙?섍린'}
              </button>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#b45309', margin: 0 }}>
              * 愿묎퀬瑜??ㅼ젙?섎㈃ 寃뚯떆臾??깅줉怨??숈떆???대떦 援ъ뿭??理쒖슦???몄텧?⑸땲??
            </p>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input type="checkbox" checked={formData.agreePromotion} onChange={e => setFormData({...formData, agreePromotion: e.target.checked})} />
                ?깅줉?섏떆???대?吏???붾룄?뺣뙐 ?띾낫?⑹쑝濡??ъ슜?섎뒗寃껋뿉 ?숈쓽?⑸땲??
              </label>
            </div>
            
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <p style={{ fontSize: '0.95rem', marginBottom: '10px', fontWeight: '600' }}>??寃뚯떆臾쇱뿉 ???꾩씠留??깅줉 媛?ν빀?덈떎. (以?섑븯?쒕굹??)</p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input type="radio" name="oneDog" value="yes" checked={formData.oneDogPerPost === true} onChange={() => setFormData({...formData, oneDogPerPost: true})} /> ??                </label>
                <label style={{ cursor: 'pointer' }}>
                  <input type="radio" name="oneDog" value="no" checked={formData.oneDogPerPost === false} onChange={() => setFormData({...formData, oneDogPerPost: false})} /> ?꾨땲??                </label>
              </div>
            </div>
          </div>

          {/* ?깅줉 ?댁슜 誘몃━蹂닿린 */}
          <div style={{ marginTop: '20px', padding: '25px', borderRadius: '12px', border: '1px dashed #ccc', backgroundColor: '#fafbfc' }}>
            <h3 style={{ marginBottom: '15px', color: '#555', fontSize: '1.1rem', textAlign: 'center' }}>?? 媛뺤븘吏 移대뱶 誘몃━蹂닿린</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '280px', transform: 'scale(1)', transformOrigin: 'top center' }}>
                <Card data={{
                  nickname: formData.name || '?대쫫 ?낅젰以?..',
                  breed: formData.breed || '寃ъ쥌 誘몄엯??,
                  age: formData.age ? `${formData.age}媛쒖썡` : 'N媛쒖썡',
                  gender: formData.gender,
                  region: formData.region,
                  price: formData.isFree ? 0 : (parseInt(formData.price) || parseInt(formData.originalPrice) || 0),
                  original_price: formData.isFree ? null : parseInt(formData.originalPrice) || null,
                  is_negotiable: formData.isNegotiable,
                  image: images[primaryImageIdx] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop', // ?꾩떆 ?뚮젅?댁뒪????대?吏
                  isNew: true,
                  seller_business_name: currentUser?.business_name || null,
                  seller_nickname: currentUser?.nickname || null
                }} />
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888', marginTop: '15px' }}>
              怨좉컼?ㅼ뿉寃??몄텧?섎뒗 ?ㅼ젣 由ъ뒪?명삎??誘몃━蹂닿린?낅땲??
            </p>
          </div>

          {/* 寃뚯떆臾??쒕룄 ?덈궡 異붽? */}
          {!postingStats.loading && (
            <div style={{ 
              padding: '15px', 
              borderRadius: '12px', 
              backgroundColor: postingStats.used >= postingStats.limit ? '#fff5f5' : '#f0f9ff',
              border: `1px solid ${postingStats.used >= postingStats.limit ? '#feb2b2' : '#bae6fd'}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: postingStats.used >= postingStats.limit ? '#e53e3e' : '#0369a1' }}>
                ?대쾲 ??寃뚯떆臾?{postingStats.used}媛?/ ?붿뿬 寃뚯떆臾?{Math.max(0, postingStats.limit - postingStats.used)}媛?              </div>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px', marginBottom: 0 }}>
                {postingStats.used >= postingStats.limit 
                  ? '?좑툘 ?붽컙 ?깅줉 ?쒕룄瑜?紐⑤몢 ?뚯쭊?섏??듬땲?? ?ㅼ쓬 ??1?쇰????ㅼ떆 ?깅줉??媛?ν빀?덈떎.' 
                  : `留ㅻ떖 湲곕낯 20媛쒖쓽 寃뚯떆臾쇱쓣 ?깅줉?????덉뒿?덈떎. (?꾩옱 珥??쒕룄: ${postingStats.limit}媛?`}
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
            {loading ? '泥섎━ 以?..' : (editDog ? '遺꾩뼇 寃뚯떆臾??섏젙?섍린' : '遺꾩뼇 寃뚯떆臾??깅줉?섍린')}
          </button>
        </div>
      </div>
      {/* 愿묎퀬 ?ㅼ젙 紐⑤떖 */}
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
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>?뱼 愿묎퀬 ?ㅼ젙?섍린</h3>
              <button onClick={(e) => { e.preventDefault(); setIsAdModalOpen(false); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>&times;</button>
            </div>
            
            <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                {/* ?쇱そ: ?대?吏 誘몃━蹂닿린 */}
                <div style={{ flex: '1 1 300px', backgroundColor: '#f8fafc', borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', minHeight: '300px' }}>
                  <div style={{ fontSize: '1rem', color: '#475569', fontWeight: 'bold', marginBottom: '15px' }}>?좏깮???곸뿭 誘몃━蹂닿린</div>
                  {modalAdType ? (
                    <>
                      <img src={getAdInfo(modalAdType)?.img} alt="誘몃━蹂닿린" style={{ width: '100%', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '15px' }} />
                      <div style={{ padding: '10px 15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', textAlign: 'center', fontWeight: 'bold', color: '#0f172a' }}>
                        ??愿묎퀬 ?몄텧 湲곌컙: <span style={{ color: '#E65100' }}>7??/span>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '40px', color: '#94a3b8' }}>愿묎퀬 ?곸뿭???좏깮?댁＜?몄슂.</div>
                  )}
                </div>

                {/* ?ㅻⅨ履? ?쇰뵒???듭뀡 */}
                <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: '700', color: '#333' }}>?쒕퉬???몄텧 ?곸뿭 ?좏깮</label>
                  
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#E65100' }}>[硫붿씤?섏씠吏]</div>
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
                              蹂댁쑀 荑좏룿: {availableCount}??                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#00796B', marginTop: '10px' }}>[寃ъ쥌蹂??섏씠吏]</div>
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
                              蹂댁쑀 荑좏룿: {availableCount}??                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* ?섎떒 踰꾪듉 */}
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
                ?곸슜 ?덊븿
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
                ?ㅼ젙 ?꾨즺
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
