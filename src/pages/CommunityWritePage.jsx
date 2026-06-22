import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const CommunityWritePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editPostData = location.state?.post || null; // 수정 모드 여부

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const editorRef = useRef(null);

  // 화면 크기 리사이즈 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        setCategory(editPostData.category);
        // 에디터 내용 로드
        if (editorRef.current) {
          editorRef.current.innerHTML = editPostData.content;
        }
      } else {
        // 새 글 작성 시 역할에 따라 카테고리 디폴트 설정
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

  // 에디터에 로드하는 마운트 시점 재점검 및 초기 포커스 설정
  useEffect(() => {
    if (editorRef.current && currentUser) {
      if (editPostData) {
        editorRef.current.innerHTML = editPostData.content;
      }
      const timer = setTimeout(() => {
        focusEditorAtEnd();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editPostData, currentUser]);

  // 에디터 서식 적용 함수
  const executeCommand = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  // 폰트 크기 변경 대안 (execCommand의 fontSize는 1~7 크기 제한이 있으므로 블록 레벨 포맷 적용)
  const handleBlockFormat = (format) => {
    executeCommand('formatBlock', format);
  };

  // 폰트 색상 변경
  const handleColorChange = (e) => {
    executeCommand('foreColor', e.target.value);
  };

  const lastRangeRef = useRef(null);

  // 커서 위치(Selection Range)를 실시간 저장하는 헬퍼
  const saveSelectionRange = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        lastRangeRef.current = range.cloneRange();
      }
    }
  };

  // 에디터의 맨 끝으로 포커스 및 커서 이동 헬퍼
  const focusEditorAtEnd = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false); // 끝으로 축소
    selection.removeAllRanges();
    selection.addRange(range);
    lastRangeRef.current = range.cloneRange();
  };

  // 커서 위치에 엘리먼트 삽입 헬퍼
  const insertElementAtCursor = (element) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    const selection = window.getSelection();
    let range = null;

    // 1. 저장된 Range가 있고 에디터 내부인 경우 우선 사용
    if (lastRangeRef.current && editorRef.current.contains(lastRangeRef.current.commonAncestorContainer)) {
      range = lastRangeRef.current;
    }
    // 2. 현재 선택 영역이 에디터 내부인 경우 사용
    else if (selection.rangeCount > 0) {
      const curRange = selection.getRangeAt(0);
      if (editorRef.current.contains(curRange.commonAncestorContainer)) {
        range = curRange;
      }
    }

    if (range) {
      range.deleteContents();
      range.insertNode(element);
      
      // 빈 문단 추가하여 이어서 타이핑할 수 있게 처리
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      element.after(p);

      // 커서를 빈 문단 내부로 이동
      const newRange = document.createRange();
      newRange.setStart(p, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      // 저장된 Range 정보도 새로운 커서 위치로 갱신
      lastRangeRef.current = newRange.cloneRange();
      return;
    }

    // 3. 포커스나 선택 위치가 아예 유실된 경우 맨 뒤에 추가
    editorRef.current.appendChild(element);
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    editorRef.current.appendChild(p);

    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    lastRangeRef.current = newRange.cloneRange();
  };

  // 이미지 인라인 업로드 및 본문 삽입
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingMedia(true);

    for (const file of files) {
      const { data, error } = await api.uploadFile(file, file.name);
      if (error || !data) {
        alert(`이미지 업로드 실패: ${error || '알 수 없는 오류'}`);
        continue;
      }

      // 이미지 태그 생성하여 본문 삽입
      const img = document.createElement('img');
      img.src = data.url;
      img.alt = '커뮤니티 첨부 이미지';
      img.style.maxWidth = '100%';
      img.style.borderRadius = '12px';
      img.style.margin = '15px 0';
      img.style.display = 'block';
      img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';

      insertElementAtCursor(img);
    }

    setUploadingMedia(false);
    e.target.value = ''; // input 리셋
  };

  // 동영상 인라인 업로드 및 본문 삽입
  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const file = files[0];
    if (file.size > 50 * 1024 * 1024) {
      alert('동영상은 최대 50MB까지만 업로드 가능합니다.');
      return;
    }

    setUploadingMedia(true);

    const { data, error } = await api.uploadFile(file, file.name);
    if (error || !data) {
      alert(`동영상 업로드 실패: ${error || '알 수 없는 오류'}`);
    } else {
      // 비디오 태그 생성하여 본문 삽입
      const video = document.createElement('video');
      video.src = data.url;
      video.controls = true;
      video.style.maxWidth = '100%';
      video.style.borderRadius = '12px';
      video.style.margin = '15px 0';
      video.style.display = 'block';
      video.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';

      insertElementAtCursor(video);
    }

    setUploadingMedia(false);
    e.target.value = ''; // input 리셋
  };

  // 유튜브 비디오 ID 추출 헬퍼
  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 유튜브 동영상 인라인 본문 삽입
  const handleYoutubeInsert = () => {
    const url = prompt('유튜브 동영상 주소(URL)를 입력해 주세요.\n예시: https://www.youtube.com/watch?v=... 또는 https://youtu.be/...');
    if (!url) return;

    const videoId = getYoutubeId(url.trim());
    if (!videoId) {
      alert('유효한 유튜브 동영상 주소가 아닙니다. 주소를 확인해 주세요.');
      return;
    }

    // 반응형 16:9 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'youtube-embed-container';
    container.style.position = 'relative';
    container.style.paddingBottom = '56.25%'; // 16:9 비율
    container.style.height = '0';
    container.style.overflow = 'hidden';
    container.style.maxWidth = '100%';
    container.style.borderRadius = '12px';
    container.style.margin = '15px 0';
    container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';

    // iframe 생성
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;

    container.appendChild(iframe);
    insertElementAtCursor(container);
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

    const contentHtml = editorRef.current ? editorRef.current.innerHTML.trim() : '';
    // 단순 빈 태그 구성 시 본문 없음 예외처리
    const plainText = editorRef.current ? editorRef.current.innerText.trim() : '';
    if (!contentHtml || contentHtml === '<p><br></p>' || (!plainText && !contentHtml.includes('img') && !contentHtml.includes('video'))) {
      alert('내용을 입력해 주세요.');
      return;
    }

    setLoading(true);

    // 본문에서 이미지 src들을 파싱하여 썸네일용/갤러리용으로 추출(호환성 유지)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    const imgTags = Array.from(tempDiv.querySelectorAll('img'));
    const imgUrls = imgTags.map(img => img.src);

    const payload = {
      category,
      title: title.trim(),
      content: contentHtml, // HTML 포맷으로 전송
      images_base64: imgUrls, // 백엔드 스키마 호환을 위해 본문 이미지 URL 배열 전달
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
    <div className="container fade-in" style={{ padding: isMobile ? '20px 10px' : '40px 20px', maxWidth: '850px' }}>
      
      {/* 뒤로가기 */}
      <button onClick={() => navigate(-1)} style={backButtonStyle}>
        ← 취소하고 돌아가기
      </button>

      <div style={{ ...formCardStyle, ...(isMobile && { padding: '20px 15px' }) }}>
        <h1 style={{ ...formTitleStyle, ...(isMobile && { fontSize: '1.35rem', marginBottom: '20px', paddingBottom: '10px' }) }}>
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

          {/* 리치 에디터 및 툴바 */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>
              본문 내용
              {uploadingMedia && (
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', marginLeft: '10px', fontWeight: 'bold' }}>
                  ⏳ 미디어 업로드 중...
                </span>
              )}
            </label>

            {/* 에디터 툴바 */}
            <div style={{
              ...toolbarStyle,
              ...(isMobile && {
                display: 'flex',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                gap: '8px',
                padding: '10px'
              })
            }}>
              {/* 글자 크기 */}
              <select onChange={(e) => handleBlockFormat(e.target.value)} defaultValue="p" style={toolSelectStyle} title="글자 크기 및 서식">
                <option value="p">기본 본문</option>
                <option value="h2">큰 제목 (H2)</option>
                <option value="h3">중간 제목 (H3)</option>
                <option value="h4">소제목 (H4)</option>
              </select>

              <div style={dividerStyle} />

              {/* 글자 스타일 */}
              <button type="button" onClick={() => executeCommand('bold')} style={{ ...toolBtnStyle, flexShrink: 0 }} title="굵게"><b>B</b></button>
              <button type="button" onClick={() => executeCommand('italic')} style={{ ...toolBtnStyle, flexShrink: 0 }} title="기울임"><i>I</i></button>
              <button type="button" onClick={() => executeCommand('underline')} style={{ ...toolBtnStyle, flexShrink: 0 }} title="밑줄"><u>U</u></button>
              <button type="button" onClick={() => executeCommand('strikeThrough')} style={{ ...toolBtnStyle, flexShrink: 0 }} title="취소선"><s>S</s></button>

              <div style={dividerStyle} />

              {/* 정렬 */}
              <button type="button" onClick={() => executeCommand('justifyLeft')} style={{ ...toolBtnStyle, flexShrink: 0 }} title="왼쪽 정렬">Align L</button>
              <button type="button" onClick={() => executeCommand('justifyCenter')} style={{ ...toolBtnStyle, flexShrink: 0 }} title="가운데 정렬">Align C</button>
              <button type="button" onClick={() => executeCommand('justifyRight')} style={{ ...toolBtnStyle, flexShrink: 0 }} title="오른쪽 정렬">Align R</button>

              <div style={dividerStyle} />

              {/* 글자 색상 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 'bold' }}>Color:</span>
                <input type="color" onChange={handleColorChange} defaultValue="#2d3748" style={toolColorStyle} title="글자 색상" />
              </div>

              <div style={dividerStyle} />

              {/* 미디어 업로드 */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <label style={mediaBtnStyle} title="사진 삽입">
                  📷 사진 추가
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingMedia}
                  />
                </label>

                <label style={{ ...mediaBtnStyle, backgroundColor: '#ebf8ff', color: '#2b6cb0' }} title="동영상 삽입">
                  🎥 동영상 추가
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingMedia}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleYoutubeInsert}
                  style={{ ...mediaBtnStyle, backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7' }}
                  title="유튜브 동영상 삽입"
                >
                  ❤️ YouTube 추가
                </button>
              </div>
            </div>

            {/* WYSIWYG 에디터 내용 영역 */}
            <div
              ref={editorRef}
              contentEditable="true"
              onKeyUp={saveSelectionRange}
              onMouseUp={saveSelectionRange}
              onInput={saveSelectionRange}
              onBlur={saveSelectionRange}
              placeholder="여기에 반려동물과 관련된 유익하고 따뜻한 스토리를 작성해 주세요. 툴바를 이용해 텍스트 크기와 굵기를 변경하고, 사진과 영상을 본문 중간 원하는 위치에 마음껏 추가할 수 있습니다."
              style={{ ...editorAreaStyle, ...(isMobile && { minHeight: '280px', padding: '12px' }) }}
            />
          </div>

          {/* 전송 버튼 */}
          <button type="submit" disabled={loading || uploadingMedia} style={{ ...submitButtonStyle, ...(isMobile && { padding: '12px 14px', fontSize: '0.95rem' }) }}>
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

// --- 에디터 툴바 스타일 ---
const toolbarStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  alignItems: 'center',
  padding: '10px 15px',
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderBottom: 'none',
  borderTopLeftRadius: '10px',
  borderTopRightRadius: '10px',
};

const toolSelectStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  backgroundColor: 'white',
  cursor: 'pointer',
  outline: 'none',
};

const toolBtnStyle = {
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: 'white',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const toolColorStyle = {
  border: 'none',
  width: '32px',
  height: '28px',
  cursor: 'pointer',
  backgroundColor: 'transparent',
};

const dividerStyle = {
  width: '1px',
  height: '20px',
  backgroundColor: '#cbd5e1',
  margin: '0 4px',
};

const mediaBtnStyle = {
  padding: '6px 12px',
  borderRadius: '6px',
  backgroundColor: '#e6fffa',
  color: '#00a389',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  border: '1px solid #b2f5ea',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
};

const editorAreaStyle = {
  padding: '20px',
  border: '1px solid #cbd5e1',
  borderBottomLeftRadius: '10px',
  borderBottomRightRadius: '10px',
  minHeight: '400px',
  fontSize: '1rem',
  lineHeight: '1.7',
  outline: 'none',
  backgroundColor: 'white',
  overflowY: 'auto',
  fontFamily: 'inherit',
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
