import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await api.auth.getUser();
      setCurrentUser(data);
    };
    fetchUser();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await api.board.getList(category, page, limit, search);
    if (!error && data) {
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [category, page, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  const handleWriteClick = () => {
    if (!currentUser) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }
    navigate('/community/write');
  };

  const categories = [
    { key: 'all', label: '전체 📂' },
    { key: 'notice', label: '공지사항 📢' },
    { key: 'daily', label: '댕댕이 일상 🐾' },
    { key: 'review', label: '입양 후기 💝' },
    { key: 'knowledge', label: '양육 Q&A 💡' },
    { key: 'store_story', label: '매장 스토리 🏠' },
  ];

  // 총 페이지 수 계산
  const totalPages = Math.ceil(total / limit) || 1;

  // 날짜 포맷팅 함수
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const yyyymmdd = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return `${yyyymmdd} ${hhmm}`;
  };

  return (
    <div className="container fade-in" style={{ padding: '40px 20px', minHeight: '80vh' }}>
      
      {/* 히어로 헤더 섹션 */}
      <div style={heroHeaderStyle}>
        <h1 style={titleStyle}>🐾 다잇독 커뮤니티</h1>
        <p style={subtitleStyle}>
          전국의 반려인들과 따뜻한 일상을 나누고 다양한 지식과 생생한 소식을 공유해보세요.
        </p>
      </div>

      {/* 카테고리 필터 영역 */}
      <div style={categoryContainerStyle}>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleCategoryChange(cat.key)}
            style={{
              ...categoryButtonStyle,
              backgroundColor: category === cat.key ? 'var(--primary)' : 'white',
              color: category === cat.key ? 'white' : '#4a5568',
              border: category === cat.key ? '1px solid var(--primary)' : '1px solid #e2e8f0',
              boxShadow: category === cat.key ? '0 4px 12px rgba(38, 166, 154, 0.2)' : 'none',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>


      {/* 목록 리스트 */}
      {loading ? (
        <div style={infoBoxStyle}>데이터를 불러오는 중입니다...</div>
      ) : posts.length === 0 ? (
        <div style={infoBoxStyle}>등록된 게시글이 없습니다. 첫 글의 주인공이 되어보세요!</div>
      ) : (
        <div style={listContainerStyle}>
          {posts.map((post) => {
            const hasImages = post.images && JSON.parse(post.images).length > 0;
            const images = hasImages ? JSON.parse(post.images) : [];
            const isNotice = post.category === 'notice';

            return (
              <div
                key={post.id}
                onClick={() => navigate(`/community/${post.id}`)}
                onMouseEnter={() => setHoveredId(post.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  ...postCardStyle,
                  backgroundColor: isNotice 
                    ? '#f8fafc' 
                    : (hoveredId === post.id ? '#f1f5f9' : 'white'),
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                {/* 왼쪽 본문 정보 */}
                <div style={cardLeftStyle}>
                  <div style={badgeRowStyle}>
                    {isNotice && <span style={noticeBadgeStyle}>공지</span>}
                    <span style={categoryLabelStyle(post.category)}>
                      {categories.find(c => c.key === post.category)?.label.split(' ')[0]}
                    </span>
                    <span style={dateStyle}>{formatDate(post.created_at)}</span>
                  </div>
                  <h3 style={{
                    ...postTitleStyle,
                    fontWeight: isNotice ? '800' : '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span>{post.title}</span>
                    {post.comment_count > 0 && (
                      <span style={{ color: '#e53e3e', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        [{post.comment_count}]
                      </span>
                    )}
                  </h3>
                  <div style={authorRowStyle}>
                    {post.profile_image ? (
                      <img src={post.profile_image} alt="" style={avatarStyle} />
                    ) : (
                      <span style={avatarFallbackStyle}>👤</span>
                    )}
                    <span style={authorNameStyle}>
                      {post.nickname || '사용자'} 
                      {post.role === 'admin' && ' (관리자)'}
                      {post.role === 'seller' && ' (파트너스)'}
                    </span>
                    <span style={dividerStyle}>|</span>
                    <span style={viewsStyle}>조회수 {post.views}</span>
                  </div>
                </div>

                {/* 오른쪽 썸네일 이미지 (있을 경우) */}
                {hasImages && (
                  <div style={thumbnailContainerStyle}>
                    <img src={images[0]} alt="" style={thumbnailStyle} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 페이징 버튼 */}
      {totalPages > 1 && (
        <div style={paginationContainerStyle}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={{ ...pageButtonStyle, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                ...pageNumberStyle,
                backgroundColor: page === p ? 'var(--primary)' : 'transparent',
                color: page === p ? 'white' : '#4a5568',
                fontWeight: page === p ? 'bold' : 'normal',
              }}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            style={{ ...pageButtonStyle, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            다음
          </button>
        </div>
      )}

      {/* 액션바 (검색창 + 글쓰기 버튼) */}
      <div style={actionRowStyle}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyle}>
          <input
            type="text"
            placeholder="제목, 내용 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={searchInputStyle}
          />
          <button type="submit" style={searchButtonStyle}>🔍 검색</button>
        </form>

        <button onClick={handleWriteClick} style={writeButtonStyle}>
          ✏️ 글쓰기
        </button>
      </div>
    </div>
  );
};

// --- Styles ---
const heroHeaderStyle = {
  textAlign: 'center',
  marginBottom: '40px',
  background: 'linear-gradient(135deg, #F5F7FA 0%, #E4E8F0 100%)',
  padding: '40px 20px',
  borderRadius: '20px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
};

const titleStyle = {
  fontSize: '2.2rem',
  fontWeight: '900',
  color: 'var(--primary-dark)',
  marginBottom: '10px',
};

const subtitleStyle = {
  fontSize: '1.05rem',
  color: '#718096',
  lineHeight: '1.6',
  maxWidth: '600px',
  margin: '0 auto',
};

const categoryContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  justifyContent: 'center',
  marginBottom: '30px',
};

const categoryButtonStyle = {
  padding: '10px 18px',
  borderRadius: '30px',
  fontSize: '0.92rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const actionRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '15px',
  marginTop: '30px',
  borderTop: '1px solid #edf2f7',
  paddingTop: '20px',
};

const searchFormStyle = {
  display: 'flex',
  gap: '8px',
  flex: 1,
  maxWidth: '400px',
};

const searchInputStyle = {
  flex: 1,
  padding: '10px 15px',
  borderRadius: '30px',
  border: '1px solid #cbd5e1',
  fontSize: '0.9rem',
  outline: 'none',
};

const searchButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#4a5568',
  color: 'white',
  border: 'none',
  borderRadius: '30px',
  fontSize: '0.9rem',
  fontWeight: '700',
  cursor: 'pointer',
};

const writeButtonStyle = {
  padding: '10px 24px',
  backgroundColor: 'var(--primary)',
  color: 'white',
  border: 'none',
  borderRadius: '30px',
  fontSize: '0.95rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(38, 166, 154, 0.3)',
  transition: 'transform 0.2s',
};

const listContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  borderTop: '2px solid #475569',
  borderBottom: '1px solid #e2e8f0',
};

const postCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: '0',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  boxShadow: 'none',
};

const cardLeftStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  marginRight: '20px',
};

const badgeRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '6px',
};

const noticeBadgeStyle = {
  backgroundColor: '#ef4444',
  color: 'white',
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: '800',
};

const categoryLabelStyle = (cat) => {
  let bgColor = '#e2e8f0';
  let color = '#4a5568';
  if (cat === 'notice') { bgColor = '#fef2f2'; color = '#ef4444'; }
  else if (cat === 'daily') { bgColor = '#e0f2fe'; color = '#0284c7'; }
  else if (cat === 'review') { bgColor = '#fce7f3'; color = '#db2777'; }
  else if (cat === 'knowledge') { bgColor = '#fef3c7'; color = '#d97706'; }
  else if (cat === 'store_story') { bgColor = '#dcfce7'; color = '#15803d'; }

  return {
    backgroundColor: bgColor,
    color: color,
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '800',
  };
};

const dateStyle = {
  fontSize: '0.8rem',
  color: '#a0aec0',
};

const postTitleStyle = {
  fontSize: '1rem',
  color: 'var(--body-text)',
  marginBottom: '6px',
  lineHeight: '1.4',
};

const authorRowStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.82rem',
  color: '#718096',
};

const avatarStyle = {
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  marginRight: '6px',
  objectFit: 'cover',
};

const avatarFallbackStyle = {
  marginRight: '6px',
};

const authorNameStyle = {
  fontWeight: '600',
};

const dividerStyle = {
  margin: '0 8px',
  color: '#e2e8f0',
};

const viewsStyle = {
  color: '#a0aec0',
};

const thumbnailContainerStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '4px',
  overflow: 'hidden',
  flexShrink: 0,
};

const thumbnailStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const infoBoxStyle = {
  textAlign: 'center',
  padding: '60px 20px',
  border: '1px dashed #e2e8f0',
  borderRadius: '16px',
  color: '#718096',
};

const paginationContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  marginTop: '40px',
};

const pageButtonStyle = {
  padding: '8px 16px',
  border: '1px solid #e2e8f0',
  borderRadius: '30px',
  backgroundColor: 'white',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  color: '#4a5568',
};

const pageNumberStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: 'none',
  fontSize: '0.9rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};

export default CommunityPage;
