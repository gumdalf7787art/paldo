import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const CommunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 현재 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await api.auth.getUser();
      setCurrentUser(data);
    };
    fetchUser();
  }, []);

  // 게시글 상세 & 댓글 정보 조회
  const fetchDetail = async () => {
    setLoading(true);
    const { data, error } = await api.board.getDetail(id);
    if (error || !data) {
      alert('게시글을 찾을 수 없거나 삭제되었습니다.');
      navigate('/community');
      return;
    }
    setPost(data.post);
    setComments(data.comments || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    const { error } = await api.board.delete(id);
    if (error) {
      alert(error);
    } else {
      alert('게시글이 삭제되었습니다.');
      navigate('/community');
    }
  };

  // 게시글 수정 페이지 이동
  const handleEditPost = () => {
    navigate('/community/write', { state: { post } });
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const { error } = await api.comments.create(id, commentInput);
    if (error) {
      alert(error);
    } else {
      setCommentInput('');
      fetchDetail(); // 댓글 새로고침
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    const { error } = await api.comments.delete(commentId);
    if (error) {
      alert(error);
    } else {
      fetchDetail();
    }
  };

  // 카테고리 표시 이름 매핑
  const categoryLabels = {
    notice: '📢 공지사항',
    daily: '🐾 댕댕이 일상',
    review: '💝 입양 후기',
    knowledge: '💡 양육 정보/Q&A',
    store_story: '🏠 매장 스토리',
  };

  if (loading) {
    return <div className="container" style={infoBoxStyle}>상세 정보를 불러오는 중입니다...</div>;
  }

  if (!post) {
    return <div className="container" style={infoBoxStyle}>존재하지 않는 게시글입니다.</div>;
  }

  const isAuthor = currentUser && currentUser.id === post.user_id;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canManage = isAuthor || isAdmin;

  const images = post.images ? JSON.parse(post.images) : [];

  return (
    <div className="container fade-in" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      
      {/* 뒤로가기 버튼 */}
      <button onClick={() => navigate('/community')} style={backButtonStyle}>
        ← 목록으로 돌아가기
      </button>

      {/* 게시글 영역 */}
      <article style={articleStyle}>
        {/* 상단 정보 */}
        <div style={headerStyle}>
          <span style={categoryBadgeStyle(post.category)}>
            {categoryLabels[post.category] || post.category}
          </span>
          <h1 style={titleStyle}>{post.title}</h1>
          
          <div style={metaRowStyle}>
            <div style={authorColStyle}>
              {post.profile_image ? (
                <img src={post.profile_image} alt="" style={avatarStyle} />
              ) : (
                <span style={avatarFallbackStyle}>👤</span>
              )}
              <div style={authorInfoStyle}>
                <span style={authorNameStyle}>
                  {post.nickname || '사용자'}
                  {post.role === 'admin' && <span style={roleBadgeStyle('admin')}>관리자</span>}
                  {post.role === 'seller' && <span style={roleBadgeStyle('seller')}>파트너스</span>}
                </span>
                <span style={dateStyle}>
                  {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div style={statsColStyle}>
              <span>조회 {post.views}</span>
            </div>
          </div>
        </div>

        {/* 게시글 이미지 갤러리 (본문 내에 삽입된 이미지가 없는 레거시 글의 하위호환성 유지) */}
        {images.length > 0 && !(post.content && post.content.includes('<img')) && (
          <div style={galleryStyle}>
            {images.map((imgUrl, index) => (
              <img
                key={index}
                src={imgUrl}
                alt={`첨부 이미지 ${index + 1}`}
                style={galleryImageStyle}
              />
            ))}
          </div>
        )}

        {/* 게시글 본문 (Rich HTML 지원) */}
        <div 
          style={bodyContentStyle} 
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        {/* 게시글 관리 버튼 (본인 혹은 어드민) */}
        {canManage && (
          <div style={manageBtnGroupStyle}>
            <button onClick={handleEditPost} style={editButtonStyle}>수정</button>
            <button onClick={handleDeletePost} style={deleteButtonStyle}>삭제</button>
          </div>
        )}
      </article>

      {/* 댓글 스레드 영역 */}
      <section style={commentSectionStyle}>
        <h3 style={commentTitleStyle}>💬 댓글 ({comments.length})</h3>

        {/* 댓글 목록 */}
        <div style={commentListStyle}>
          {comments.map((comment) => {
            const isCommentOwner = currentUser && currentUser.id === comment.user_id;
            const canDeleteComment = isCommentOwner || isAdmin;

            return (
              <div key={comment.id} style={commentItemStyle}>
                <div style={commentHeaderStyle}>
                  <div style={commentAuthorRowStyle}>
                    {comment.profile_image ? (
                      <img src={comment.profile_image} alt="" style={commentAvatarStyle} />
                    ) : (
                      <span style={{ marginRight: '6px' }}>👤</span>
                    )}
                    <span style={commentAuthorNameStyle}>
                      {comment.nickname || '사용자'}
                      {comment.role === 'admin' && <span style={roleBadgeStyle('admin')}>관리자</span>}
                      {comment.role === 'seller' && <span style={roleBadgeStyle('seller')}>파트너스</span>}
                    </span>
                    <span style={commentDateStyle}>
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>

                  {canDeleteComment && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      style={commentDeleteButtonStyle}
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div style={commentContentStyle}>
                  {comment.content}
                </div>
              </div>
            );
          })}

          {comments.length === 0 && (
            <div style={noCommentStyle}>첫 번째 댓글을 달아 소통을 시작해보세요!</div>
          )}
        </div>

        {/* 댓글 작성 폼 */}
        {currentUser ? (
          <form onSubmit={handleCommentSubmit} style={commentFormStyle}>
            <textarea
              placeholder="따뜻한 응원이나 유익한 피드백의 댓글을 남겨주세요."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              style={commentTextareaStyle}
              rows="3"
            />
            <div style={commentSubmitRowStyle}>
              <button type="submit" style={commentSubmitButtonStyle}>
                댓글 등록
              </button>
            </div>
          </form>
        ) : (
          <div style={commentLoginBoxStyle}>
            <p style={{ margin: '0 0 10px 0', color: '#718096' }}>댓글을 작성하려면 로그인이 필요합니다.</p>
            <button onClick={() => navigate('/login')} style={commentLoginButtonStyle}>
              로그인하러 가기
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

// --- Styles ---
const infoBoxStyle = {
  textAlign: 'center',
  padding: '80px 20px',
  color: '#718096',
  fontSize: '1.1rem',
};

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
  transition: 'color 0.2s',
};

const articleStyle = {
  backgroundColor: 'white',
  borderRadius: '20px',
  border: '1px solid #edf2f7',
  padding: '35px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
  marginBottom: '30px',
};

const headerStyle = {
  borderBottom: '1px solid #edf2f7',
  paddingBottom: '20px',
  marginBottom: '25px',
};

const categoryBadgeStyle = (cat) => {
  let bgColor = '#f1f5f9';
  let color = '#475569';
  if (cat === 'notice') { bgColor = '#fef2f2'; color = '#ef4444'; }
  else if (cat === 'daily') { bgColor = '#e0f2fe'; color = '#0284c7'; }
  else if (cat === 'review') { bgColor = '#fce7f3'; color = '#db2777'; }
  else if (cat === 'knowledge') { bgColor = '#fef3c7'; color = '#d97706'; }
  else if (cat === 'store_story') { bgColor = '#dcfce7'; color = '#15803d'; }

  return {
    backgroundColor: bgColor,
    color: color,
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '800',
    display: 'inline-block',
    marginBottom: '12px',
  };
};

const titleStyle = {
  fontSize: '1.8rem',
  fontWeight: '900',
  color: 'var(--body-text)',
  lineHeight: '1.3',
  marginBottom: '15px',
};

const metaRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '15px',
};

const authorColStyle = {
  display: 'flex',
  alignItems: 'center',
};

const avatarStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  marginRight: '10px',
  objectFit: 'cover',
  border: '1px solid #e2e8f0',
};

const avatarFallbackStyle = {
  fontSize: '1.8rem',
  marginRight: '10px',
};

const authorInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const authorNameStyle = {
  fontSize: '0.92rem',
  fontWeight: '700',
  color: '#2d3748',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const roleBadgeStyle = (role) => {
  const isSeller = role === 'seller';
  return {
    backgroundColor: isSeller ? '#faf5ff' : '#fff7ed',
    color: isSeller ? '#7e22ce' : '#c2410c',
    border: isSeller ? '1px solid #e9d5ff' : '1px solid #ffedd5',
    fontSize: '0.7rem',
    padding: '1px 5px',
    borderRadius: '4px',
    fontWeight: '800',
    marginLeft: '4px',
  };
};

const dateStyle = {
  fontSize: '0.8rem',
  color: '#a0aec0',
};

const statsColStyle = {
  fontSize: '0.85rem',
  color: '#a0aec0',
};

const galleryStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  marginBottom: '25px',
};

const galleryImageStyle = {
  width: '100%',
  borderRadius: '12px',
  objectFit: 'contain',
  maxHeight: '500px',
  backgroundColor: '#f8fafc',
};

const bodyContentStyle = {
  fontSize: '1.05rem',
  color: '#2d3748',
  lineHeight: '1.8',
  whiteSpace: 'pre-wrap',
  marginBottom: '30px',
};

const manageBtnGroupStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  borderTop: '1px solid #edf2f7',
  paddingTop: '20px',
};

const editButtonStyle = {
  padding: '8px 16px',
  backgroundColor: 'white',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontSize: '0.88rem',
  fontWeight: '700',
  color: '#475569',
  cursor: 'pointer',
};

const deleteButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  borderRadius: '8px',
  fontSize: '0.88rem',
  fontWeight: '700',
  color: '#ef4444',
  cursor: 'pointer',
};

const commentSectionStyle = {
  backgroundColor: 'white',
  borderRadius: '20px',
  border: '1px solid #edf2f7',
  padding: '30px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
};

const commentTitleStyle = {
  fontSize: '1.2rem',
  fontWeight: '800',
  color: 'var(--body-text)',
  marginBottom: '20px',
  borderBottom: '1px solid #edf2f7',
  paddingBottom: '15px',
};

const commentListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  marginBottom: '30px',
};

const commentItemStyle = {
  borderBottom: '1px solid #f7fafc',
  paddingBottom: '15px',
};

const commentHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const commentAuthorRowStyle = {
  display: 'flex',
  alignItems: 'center',
};

const commentAvatarStyle = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  marginRight: '6px',
  objectFit: 'cover',
  border: '1px solid #e2e8f0',
};

const commentAuthorNameStyle = {
  fontSize: '0.88rem',
  fontWeight: '700',
  color: '#2d3748',
  marginRight: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const commentDateStyle = {
  fontSize: '0.78rem',
  color: '#a0aec0',
};

const commentDeleteButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#e53e3e',
  fontSize: '0.8rem',
  cursor: 'pointer',
  padding: 0,
};

const commentContentStyle = {
  fontSize: '0.95rem',
  color: '#4a5568',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
  paddingLeft: '30px',
};

const noCommentStyle = {
  textAlign: 'center',
  padding: '40px 10px',
  color: '#a0aec0',
  fontSize: '0.9rem',
};

const commentFormStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  borderTop: '1px solid #edf2f7',
  paddingTop: '20px',
};

const commentTextareaStyle = {
  width: '100%',
  padding: '12px 15px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  outline: 'none',
  fontSize: '0.92rem',
  lineHeight: '1.5',
  resize: 'vertical',
  boxSizing: 'border-box',
};

const commentSubmitRowStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const commentSubmitButtonStyle = {
  padding: '10px 20px',
  backgroundColor: 'var(--primary)',
  color: 'white',
  border: 'none',
  borderRadius: '30px',
  fontWeight: 'bold',
  fontSize: '0.88rem',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(38, 166, 154, 0.2)',
};

const commentLoginBoxStyle = {
  borderTop: '1px solid #edf2f7',
  paddingTop: '30px',
  textAlign: 'center',
};

const commentLoginButtonStyle = {
  padding: '10px 24px',
  backgroundColor: '#4a5568',
  color: 'white',
  border: 'none',
  borderRadius: '30px',
  fontSize: '0.9rem',
  fontWeight: '700',
  cursor: 'pointer',
};

export default CommunityDetailPage;
