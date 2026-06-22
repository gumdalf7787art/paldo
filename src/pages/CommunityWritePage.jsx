import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const CommunityWritePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editPostData = location.state?.post || null; // 수정 모드 여부

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imagesBase64, setImagesBase64] = useState([]); // Base64 스트링 배열
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await api.auth.getUser();
      if (!data) {
        alert('로그인이 필요한 페이지입니다.');
        navigate('/login');
        return;
      }
      setCurrentUser(data);

      // 수정 모드일 때 폼 초기화
      if (editPostData) {
        setTitle(editPostData.title);
        setContent(editPostData.content);
        setCategory(editPostData.category);
        if (editPostData.images) {
          try {
            setImagesBase64(JSON.parse(editPostData.images));
          } catch (e) {
            setImagesBase64([]);
          }
        }
      } else {
        // 새 글 작성 시 역할에 따라 첫 번째로 쓸 수 있는 카테고리 디폴트 설정
        if (data.role === 'admin') {
          setCategory('notice');
        } else if (data.role === 'seller') {
          setCategory('store_story');
        } else {
          setCategory('daily');
        }
      }
    };
    checkAuth();
  }, [editPostData, navigate]);

  // 이미지 파일 읽기 및 Base64 변환
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imagesBase64.length + files.length > 5) {
      alert('이미지는 최대 5장까지만 등록 가능합니다.');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagesBase64((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 이미지 삭제
  const handleRemoveImage = (index) => {
    setImagesBase64((prev) => prev.filter((_, i) => i !== index));
  };

  // 등록/수정 전송
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      alert('카테고리를 선택해 주세요.');
      return;
    }
    if (!title.trim()) {
      alert('제목을 입력해 주세요.');
      return;
    }
    if (!content.trim()) {
      alert('내용을 입력해 주세요.');
      return;
    }

    setLoading(true);

    const payload = {
      category,
      title: title.trim(),
      content: content.trim(),
      images_base64: imagesBase64,
    };

    if (editPostData) {
      // 수정 모드
      const { error } = await api.board.update({ id: editPostData.id, ...payload });
      setLoading(false);
      if (error) {
        alert(error);
      } else {
        alert('게시글이 성공적으로 수정되었습니다.');
        navigate(`/community/${editPostData.id}`);
      }
    } else {
      // 신규 등록 모드
      const { data, error } = await api.board.create(payload);
      setLoading(false);
      if (error) {
        alert(error);
      } else {
        alert('게시글이 성공적으로 등록되었습니다.');
        if (data && data.id) {
          navigate(`/community/${data.id}`);
        } else {
          navigate('/community');
        }
      }
    }
  };

  if (!currentUser) {
    return <div className="container" style={{ textAlign: 'center', padding: '60px' }}>인증 정보를 확인 중입니다...</div>;
  }

  // 사용자 권한별 카테고리 필터링
  const getAvailableCategories = () => {
    const list = [];
    if (currentUser.role === 'admin') {
      list.push({ key: 'notice', label: '공지사항 📢' });
    }
    if (currentUser.role === 'admin' || currentUser.role === 'seller') {
      list.push({ key: 'store_story', label: '매장 스토리 🏠' });
    }
    list.push(
      { key: 'daily', label: '댕댕이 일상 🐾' },
      { key: 'review', label: '입양 후기 💝' },
      { key: 'knowledge', label: '양육 정보/Q&A 💡' }
    );
    return list;
  };

  const categories = getAvailableCategories();

  return (
    <div className="container fade-in" style={{ padding: '40px 20px', maxWidth: '700px' }}>
      
      {/* 뒤로가기 */}
      <button onClick={() => navigate(-1)} style={backButtonStyle}>
        ← 취소하고 돌아가기
      </button>

      <div style={formCardStyle}>
        <h1 style={formTitleStyle}>
          {editPostData ? '✏️ 게시글 수정하기' : '✍️ 새로운 글 작성하기'}
        </h1>

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* 카테고리 선택 */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={selectStyle}
            >
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 제목 */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>제목</label>
            <input
              type="text"
              placeholder="제목을 입력해 주세요."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 이미지 첨부 */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>
              이미지 첨부 (최대 5장)
              <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal', marginLeft: '6px' }}>
                ({imagesBase64.length}/5)
              </span>
            </label>
            
            <div style={imageUploadRowStyle}>
              {imagesBase64.length < 5 && (
                <label style={uploadTriggerStyle}>
                  📷 이미지 추가
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}

              {imagesBase64.map((imgSrc, idx) => (
                <div key={idx} style={thumbnailWrapperStyle}>
                  <img src={imgSrc} alt="" style={thumbnailStyle} />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={removeImageButtonStyle}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 본문 내용 */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>내용</label>
            <textarea
              placeholder="반려동물과 관련된 따뜻하고 유익한 이야기를 적어주세요. 욕설이나 비방글은 예고 없이 삭제될 수 있습니다."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={textareaStyle}
              rows="12"
            />
          </div>

          {/* 전송 버튼 */}
          <button type="submit" disabled={loading} style={submitButtonStyle}>
            {loading ? '처리 중...' : editPostData ? '수정 완료' : '게시글 등록'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Styles ---
const backButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#718096',
  fontSize: '0.95rem',
  fontWeight: '700',
  cursor: 'pointer',
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
  padding: 0,
};

const formCardStyle = {
  backgroundColor: 'white',
  borderRadius: '20px',
  border: '1px solid #edf2f7',
  padding: '35px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
};

const formTitleStyle = {
  fontSize: '1.6rem',
  fontWeight: '900',
  color: 'var(--body-text)',
  marginBottom: '30px',
  borderBottom: '1px solid #edf2f7',
  paddingBottom: '15px',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle = {
  fontSize: '0.95rem',
  fontWeight: '800',
  color: '#2d3748',
};

const selectStyle = {
  padding: '12px 15px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  outline: 'none',
  fontSize: '0.95rem',
  backgroundColor: 'white',
};

const inputStyle = {
  padding: '12px 15px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  outline: 'none',
  fontSize: '0.95rem',
};

const textareaStyle = {
  padding: '15px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  outline: 'none',
  fontSize: '0.95rem',
  lineHeight: '1.6',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const imageUploadRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  alignItems: 'center',
  marginTop: '5px',
};

const uploadTriggerStyle = {
  width: '100px',
  height: '100px',
  border: '2px dashed #cbd5e1',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  color: '#718096',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: '#f8fafc',
};

const thumbnailWrapperStyle = {
  position: 'relative',
  width: '100px',
  height: '100px',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #cbd5e1',
};

const thumbnailStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const removeImageButtonStyle = {
  position: 'absolute',
  top: '4px',
  right: '4px',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  lineHeight: 1,
};

const submitButtonStyle = {
  padding: '14px',
  backgroundColor: 'var(--primary)',
  color: 'white',
  border: 'none',
  borderRadius: '30px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(38, 166, 154, 0.3)',
  transition: 'transform 0.2s',
  marginTop: '10px',
};

export default CommunityWritePage;
