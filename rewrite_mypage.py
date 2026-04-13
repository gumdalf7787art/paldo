import os

content = """import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';

const regions = [
  '서울시', '인천시', '경기도', '부산시', '대구시', '대전시', '광주시', '울산시', 
  '강원도', '충청남도', '충청북도', '경상남도', '경상북도', '전라남도', '전라북도', '제주도', '세종시'
];

const MyPage = () => {
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

  // 비밀번호 변경 상태
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(null);

  // 관심아이, 채팅, 통계, 관리 데이터
  const [bookmarks, setBookmarks] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [myDogs, setMyDogs] = useState([]); 
  const [dogStats, setDogStats] = useState({});
  const [chartData, setChartData] = useState([]);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // 첫 페이지는 대시보드(dashboard)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [businessApp, setBusinessApp] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (location.state?.openRoomId && chatRooms.length > 0) {
      const room = chatRooms.find(r => r.id === location.state.openRoomId);
      if (room) {
        setSelectedRoom(room);
        setActiveTab('chats');
      }
    }
  }, [location.state, chatRooms]);

  useEffect(() => {
    if (newPassword && confirmPassword) {
      setPasswordMatch(newPassword === confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [newPassword, confirmPassword]);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }
    setSession(session);

    // 1. 프로필
    let { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profileData) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert([{ 
          id: session.user.id, 
          nickname: session.user.user_metadata?.nickname || '새로운가족',
          role: 'user',
          grade: 'Bronze'
        }])
        .select().single();
      profileData = newProfile;
    }

    if (profileData) {
      setProfile(profileData);
      setNickname(profileData.nickname || '팔도회원');
      setPhone(profileData.phone || '');
      setAddress(profileData.address || '');
    }

    // 2. 찜 목록
    const { data: bookmarkData } = await supabase
      .from('bookmarks')
      .select('dogs(*)')
      .eq('user_id', session.user.id);

    if (bookmarkData) {
      const activeDogs = bookmarkData.map(b => b.dogs).filter(d => d && d.status === 'available');
      setBookmarks(activeDogs);
    }

    // 3. 채팅방
    if (session.user.id) fetchChatRooms(session.user.id);

    // 4. 사업자 신청
    const { data: bData } = await supabase
      .from('business_applications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle();
    setBusinessApp(bData);

    // 5. 사업자 기능: 게시물, 통계 등
    if (profileData && (profileData.role === 'seller' || profileData.role === 'admin')) {
      await fetchSellerData(session.user.id);
    }

    setLoading(false);
  };

  const fetchSellerData = async (userId) => {
    // 5.1 내 개시물
    const { data: dogsData } = await supabase
      .from('dogs')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    let dogs = dogsData || [];
    setMyDogs(dogs);

    // 5.2 조회수 및 찜 집계
    const dogIds = dogs.map(d => d.id);
    
    // 전체 북마크 가져오기 (게시물별 카운트용)
    const { data: allBookmarks } = await supabase.from('bookmarks').select('dog_id').in('dog_id', dogIds);
    
    // 전체 애널리틱스 로그 가져오기 (조회수용) - page_path에 dog.id가 포함된 것
    const { data: allLogs } = await supabase.from('analytics_logs').select('created_at, page_path').eq('event_type', 'page_view');

    const statsMap = {};
    dogs.forEach(d => {
      statsMap[d.id] = { views: 0, likes: 0 };
    });

    allBookmarks?.forEach(b => {
      if (statsMap[b.dog_id]) statsMap[b.dog_id].likes += 1;
    });

    const dailyViewsMap = {};
    allLogs?.forEach(log => {
      const isForMyDog = dogIds.some(id => log.page_path.includes(id));
      if (isForMyDog) {
        // Find which dog
        const dogId = dogIds.find(id => log.page_path.includes(id));
        if (dogId) statsMap[dogId].views += 1;
        
        // 날짜별 집계
        const dateStr = new Date(log.created_at).toLocaleDateString();
        dailyViewsMap[dateStr] = (dailyViewsMap[dateStr] || 0) + 1;
      }
    });

    setDogStats(statsMap);

    // 차트용 데이터 가공 (최근 7일)
    const chartArr = Object.keys(dailyViewsMap).map(k => ({ date: k, views: dailyViewsMap[k] }));
    if (chartArr.length === 0) {
      // 데이터가 없으면 오늘 기준으로 0점 더미 추가
      chartArr.push({ date: new Date().toLocaleDateString(), views: 0 });
    }
    setChartData(chartArr.slice(-7));
  };

  const fetchChatRooms = async (userId) => {
    const { data } = await supabase
      .from('chat_rooms')
      .select(`*, dogs(nickname, breed, image_url), buyer:profiles!chat_rooms_buyer_id_fkey(nickname), seller:profiles!chat_rooms_seller_id_fkey(nickname)`)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    if (data) setChatRooms(data);
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
    const { error } = await supabase.from('profiles').update({ nickname, phone, address }).eq('id', session.user.id);
    if (!error) {
      alert('저장되었습니다.');
      setIsEditingProfile(false);
      setProfile({ ...profile, nickname, phone, address });
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!passwordMatch || newPassword.length < 6) return alert('비밀번호를 확인해주세요.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      alert('비밀번호가 변경되었습니다.');
      setNewPassword(''); setConfirmPassword(''); setIsChangingPassword(false);
    } else {
      alert(error.message);
    }
  };

  const handleDeletePost = async (dogId) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    const { error } = await supabase.from('dogs').delete().eq('id', dogId);
    if (!error) {
      alert('삭제되었습니다.');
      setMyDogs(prev => prev.filter(d => d.id !== dogId));
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

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 3fr', gap: '30px' }}>
          
          {/* 사이드바 */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={avatarStyle}>🐶</div>
                <h3 style={{ margin: '15px 0 5px', fontWeight: '800', fontSize: '1.2rem' }}>{profile?.nickname}</h3>
                <p style={{ color: '#999', fontSize: '0.85rem' }}>{session?.user?.email}</p>
                {isSeller && <span style={{ display: 'inline-block', marginTop: '10px', padding: '4px 10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>⭐ 인증 사업자</span>}
              </div>

              {/* 내비게이션 메뉴 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle('dashboard')}>🏠 대시보드</button>
                {isSeller && (
                  <>
                    <button onClick={() => navigate('/upload')} style={{ ...navBtnStyle('upload'), color: 'var(--primary)' }}>➕ 분양등록</button>
                    <button onClick={() => setActiveTab('posts')} style={navBtnStyle('posts')}>🐶 게시물관리</button>
                    <button onClick={() => setActiveTab('stats')} style={navBtnStyle('stats')}>📊 통계확인</button>
                  </>
                )}
                <button onClick={() => setActiveTab('chats')} style={navBtnStyle('chats')}>💬 팔톡</button>
                <button onClick={() => setActiveTab('bookmarks')} style={navBtnStyle('bookmarks')}>💝 관심아이</button>
              </div>

              {/* 설정, 로그아웃 */}
              <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button onClick={() => setIsEditingProfile(!isEditingProfile)} style={{ ...actionBtnStyle, fontSize: '0.85rem', marginBottom: '10px' }}>⚙️ 프로필 설정</button>
                <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} style={{ ...actionBtnStyle, color: '#ff4757', border: 'none' }}>로그아웃</button>

                {profile?.role === 'user' && (
                  !businessApp ? (
                    <button onClick={() => setIsApplyModalOpen(true)} style={{ ...actionBtnStyle, border: 'none', background: 'none', color: '#888', fontSize: '0.75rem', textDecoration: 'underline' }}>사업자로 등록하기</button>
                  ) : (
                    businessApp.status === 'pending' ? <div style={{ fontSize:'0.75rem', color:'var(--primary)', textAlign:'center' }}>사업자 등록 검토 중</div> : null
                  )
                )}
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 영역 */}
          <main>
            <div className="glass-card" style={{ padding: '40px', minHeight: '700px' }}>
              
              {/* === 프로필 편집 화면 === */}
              {isEditingProfile && (
                <div className="fade-in" style={{ marginBottom: '40px', padding: '30px', backgroundColor: '#fcfcfc', borderRadius: '15px', border: '1px solid #eee' }}>
                  <h3 style={{ marginBottom: '20px' }}>프로필 설정</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <StatBox title="우리 아이들" value={isSeller ? myDogs.length : bookmarks.length} suffix="마리" color="var(--primary)" icon={isSeller ? "🐶" : "💝"} />
                    {isSeller && <StatBox title="총 방문자 분석" value={totalViews} suffix="회" color="#4A90E2" icon="👀" />}
                    <StatBox title="진행중인 팔톡" value={chatRooms.length} suffix="건" color="#F5A623" icon="💬" />
                  </div>
                  
                  {/* 최신 알림 및 요약 */}
                  <div style={{ padding: '20px', backgroundColor: '#fcfcfc', borderRadius: '15px', border: '1px solid #eee' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>최근 대화 (팔톡)</h3>
                    {chatRooms.slice(0, 3).map(room => (
                      <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                        <div><b>{room.dogs?.nickname}</b>에 대한 문의</div>
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
                  
                  <div style={{ overflowX: 'auto' }}>
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
                              <button onClick={() => handleEditPost(dog)} style={{ ...tableBtnStyle, marginRight: '5px' }}>수정</button>
                              <button onClick={() => handleDeletePost(dog.id)} style={{ ...tableBtnStyle, backgroundColor: '#ff6b6b', color: 'white' }}>삭제</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {myDogs.length === 0 && <div style={emptyStyle}>등록된 분양글이 없습니다.</div>}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && isSeller && (
                <div className="fade-in">
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '30px' }}>통계 확인</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '30px' }}>
                    <div className="glass-card" style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>최근 7일 조회수 트렌드</h3>
                      <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" fontSize={12} stroke="#999" />
                            <YAxis fontSize={12} stroke="#999" />
                            <RechartsTooltip />
                            <Line type="monotone" dataKey="views" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>인기 아이 랭킹 (찜 많은 순)</h3>
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
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'chats' && (
                <div className="fade-in">
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '30px' }}>팔톡 대화목록</h2>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {chatRooms.length === 0 ? (
                      <div style={emptyStyle}>진행 중인 대화가 없습니다.</div>
                    ) : (
                      chatRooms.map(room => (
                        <div key={room.id} onClick={() => setSelectedRoom(room)} style={chatRoomItemStyle}>
                          <img src={room.dogs?.image_url} alt="dog" style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{room.dogs?.nickname}</div>
                            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>
                              대화 상대: {session.user.id === room.buyer_id ? room.seller?.nickname : room.buyer?.nickname}
                            </div>
                            <div style={{ fontSize: '0.95rem', color: '#444' }}>{room.last_message || '대화를 시작해주세요.'}</div>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#ccc' }}>{new Date(room.updated_at).toLocaleDateString()}</div>
                        </div>
                      ))
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

            </div>
          </main>
        </div>
      </div>

      {selectedRoom && <ChatWindow room={selectedRoom} userId={session.user.id} onClose={() => { setSelectedRoom(null); fetchChatRooms(session.user.id); }} />}
      {isApplyModalOpen && <BusinessApplyModal userId={session.user.id} onClose={() => setIsApplyModalOpen(false)} onSuccess={setBusinessApp} />}
    </div>
  );
};

// --- 자식 컴포넌트: 통계 박스 ---
const StatBox = ({ title, value, suffix, color, icon }) => (
  <div style={{ padding: '25px', borderRadius: '20px', border: '1px solid #eee', backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
    <div style={{ width: '50px', height: '50px', borderRadius: '15px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{icon}</div>
    <div>
      <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '5px' }}>{title}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#333' }}>{value.toLocaleString()}<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>{suffix}</span></div>
    </div>
  </div>
);

// --- 나머지 기존 컴포넌트들 (BusinessApplyModal, ChatWindow) ---
const BusinessApplyModal = ({ userId, onClose, onSuccess }) => {
  const [form, setForm] = useState({ bizName: '', repName: '', phone: '', address: '', bizNo: '', animalNo: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('사업자등록증 파일을 첨부해 주세요.');
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('business-docs').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('business-docs').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('business_applications').insert([{
        user_id: userId, business_name: form.bizName, representative_name: form.repName,
        phone: form.phone, address: form.address, biz_no: form.bizNo, animal_sale_no: form.animalNo, file_url: publicUrl
      }]);
      if (dbError) throw dbError;

      alert('사업자 등록 신청 완료!');
      onClose();
      const { data } = await supabase.from('business_applications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>대표 이름</label><input required style={inputStyle} value={form.repName} onChange={e => setForm({...form, repName: e.target.value})} /></div>
            <div><label style={labelStyle}>핸드폰</label><input required style={inputStyle} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          </div>
          <div><label style={labelStyle}>주소</label><input required style={inputStyle} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div><label style={labelStyle}>사업자등록번호</label><input required style={inputStyle} value={form.bizNo} onChange={e => setForm({...form, bizNo: e.target.value})} /></div>
          <div><label style={labelStyle}>동물판매업번호</label><input required style={inputStyle} value={form.animalNo} onChange={e => setForm({...form, animalNo: e.target.value})} /></div>
          <div><label style={labelStyle}>파일첨부</label><input type="file" required onChange={e => setFile(e.target.files[0])} /></div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" disabled={uploading} style={{ ...miniBtnStyle, flex: 1, padding: '15px' }}>확인</button>
            <button type="button" onClick={onClose} style={{ ...miniBtnStyle, backgroundColor: '#eee', color: '#666', flex: 1 }}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChatWindow = ({ room, userId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    fetchMessages();
    const channel = supabase.channel(`room_${room.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${room.id}` }, (payload) => {
      setMessages(prev => [...prev, payload.new]);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room.id]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase.from('chat_messages').select('*').eq('room_id', room.id).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const { error } = await supabase.from('chat_messages').insert([{ room_id: room.id, sender_id: userId, content: input }]);
    if (!error) {
      await supabase.from('chat_rooms').update({ last_message: input, updated_at: new Date() }).eq('id', room.id);
      setInput('');
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div className="glass-card" style={chatWindowStyle}>
        <div style={chatHeaderStyle}>
          <div><div style={{ fontWeight: '800' }}>{room.dogs?.nickname} 상담</div></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        <div ref={scrollRef} style={messageAreaStyle}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.sender_id === userId ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
              <div style={{ padding: '10px 15px', borderRadius: '15px', backgroundColor: msg.sender_id === userId ? 'var(--primary)' : '#f0f0f0', color: msg.sender_id === userId ? 'white' : '#333' }}>{msg.content}</div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} style={chatInputAreaStyle}>
          <input value={input} onChange={(e) => setInput(e.target.value)} style={chatInputStyle} />
          <button type="submit" style={sendBtnStyle}>전송</button>
        </form>
      </div>
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
const chatWindowStyle = { width: '400px', height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, backgroundColor: 'white' };
const chatHeaderStyle = { padding: '20px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const messageAreaStyle = { flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column' };
const chatInputAreaStyle = { padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: 'white' };
const chatInputStyle = { flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #eee', outline: 'none' };
const sendBtnStyle = { padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '800', cursor: 'pointer' };
const thStyle = { padding: '12px', fontSize: '0.85rem', color: '#666' };
const tdStyle = { padding: '12px', fontSize: '0.9rem', color: '#444' };
const tableBtnStyle = { padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.8rem' };

export default MyPage;
"""

with open(r"c:\Users\검달프\Desktop\Paldo\src\pages\MyPage.jsx", "w", encoding="utf-8") as f:
    f.write(content)
