import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell 
} from 'recharts';

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [stats, setStats] = useState({ users: 0, applications: 0, dogs: 0, clicks: 0 });
  const [chartData, setChartData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [reports, setReports] = useState([]);
  const [adRequests, setAdRequests] = useState([]);
  const navigate = useNavigate();

  // 쿠폰 생성용 상태
  const [newCoupon, setNewCoupon] = useState({ 
    code: '', 
    name: '', 
    amount: 0, 
    benefit_type: 'ad_exemption', 
    auto_issue_type: 'none',
    valid_until: '',
    ad_type: 'all'
  });
  const [issueData, setIssueData] = useState({ userId: '', couponId: '' });
  const [issueTargetType, setIssueTargetType] = useState('individual'); // 'individual', 'all_sellers'
  const [userSearch, setUserSearch] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  async function checkAdmin() {
    const { data: sessionData, error: sessionErr } = await api.auth.getSession();
    if (sessionErr || !sessionData?.session) return navigate('/login');

    const { data: profile } = await api.auth.getUser();

    if (profile?.role !== 'admin') {
      alert('관리자만 접근 가능합니다.');
      return navigate('/');
    }

    setIsAdmin(true);
    // 진입 시 광고 만료 처리
    await api.admin.expireAds();
    fetchAdminData();
  }

  async function fetchAdminData() {
    setLoading(true);

    try {
      // 1. 요약 통계 및 차트
      const { data: statsData } = await api.admin.getStats();
      if (statsData) {
        setStats({ 
          users: statsData.userCount || 0, 
          applications: statsData.pendingApplications || 0, 
          dogs: statsData.dogCount || 0, 
          clicks: statsData.clickCount || 0 
        });
        setChartData(statsData.chartData || []);
        
        const totalViews = statsData.chartData?.reduce((acc, c) => acc + c.views, 0) || 0;
        const totalClicks = statsData.chartData?.reduce((acc, c) => acc + c.clicks, 0) || 0;
        setEventData([
          { name: '페이지 뷰', value: totalViews },
          { name: '클릭 액션', value: totalClicks },
        ]);
      }

      // 2. 신청 리스트
      const { data: apps } = await api.admin.getApplications();
      setApplications(apps || []);

      // 3. 전체 회원
      const { data: userList } = await api.admin.getUsers();
      setUsers(userList || []);

      // 4. 전체 게시물
      const { data: dogList } = await api.admin.getDogs();
      setDogs(dogList || []);

      // 5. 쿠폰 목록
      const { data: couponList } = await api.admin.getCoupons();
      setCoupons(couponList || []);

      // 6. 신고 내역 목록
      const { data: reportList } = await api.admin.getReports();
      setReports(reportList || []);

      // 7. 광고 신청 내역
      const { data: adReqList } = await api.admin.getAdRequests();
      setAdRequests(adReqList || []);

    } catch (error) {
      console.error('Data fetch error:', error);
    }

    setLoading(false);
  }

  useEffect(() => {
    setTimeout(() => checkAdmin(), 0);
  }, []);

  const handleApprove = async (app) => {
    if (!window.confirm(`${app.business_name} 승인하시겠습니까?`)) return;
    
    const { error } = await api.admin.approveApplication(app.id, app.user_id);
    if (error) {
      alert('승인 처리 중 오류가 발생했습니다: ' + error);
    } else {
      alert('승인되었습니다. (자동 쿠폰 지급 완료)');
      fetchAdminData();
    }
  };

  const handleReject = async (app) => {
    const reason = window.prompt(`${app.business_name} 신청을 반려하시겠습니까?\n반려 사유를 입력해 주세요:`);
    if (reason === null) return; // 사용자가 취소한 경우

    const { error } = await api.admin.rejectApplication(app.id, reason || '관리자 반려');
    if (error) {
      alert('반려 처리 중 오류가 발생했습니다: ' + error);
    } else {
      alert('반려 처리되었습니다.');
      fetchAdminData();
    }
  };

  const handleUpdateGrade = async (userId, newGrade) => {
    const { error } = await api.admin.updateUserGrade(userId, newGrade);
    if (error) {
      alert('등급 변경 실패: ' + error);
    } else {
      alert('등급이 변경되었습니다.');
      fetchAdminData();
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (isCreating) return;
    setIsCreating(true);

    const { error } = await api.admin.createCoupon({
      code: newCoupon.code,
      name: newCoupon.name,
      discount_rate: parseInt(newCoupon.amount),
      auto_issue_type: newCoupon.auto_issue_type,
      valid_until: newCoupon.valid_until || null,
      ad_type: newCoupon.ad_type
    });

    setIsCreating(false);
    if (error) {
      alert('생성 실패: ' + error);
    } else {
      alert('광고 아이템이 생성되었습니다.');
      setNewCoupon({ code: '', name: '', amount: 0, benefit_type: 'ad_exemption', auto_issue_type: 'none', valid_until: '', ad_type: 'all' });
      fetchAdminData();
    }
  };

  const handleIssueCoupon = async (e) => {
    e.preventDefault();
    if (isIssuing) return;
    if (!issueData.couponId) return alert('발급할 쿠폰을 선택해 주세요.');

    setIsIssuing(true);

    if (issueTargetType === 'all_sellers') {
      if (!window.confirm('모든 사업자 회원에게 쿠폰을 일괄 발급하시겠습니까?')) {
        setIsIssuing(false);
        return;
      }
      
      const { error } = await api.admin.issueCouponToAll(parseInt(issueData.couponId));
      setIsIssuing(false);
      if (error) {
        return alert('일괄 발급 실패: ' + error);
      }
      alert('모든 사업자에게 쿠폰이 발급되었습니다.');
      setIssueData({ userId: '', couponId: '' });
      fetchAdminData();
    } else {
      // 개별 유저 발급
      if (!issueData.userId) {
        setIsIssuing(false);
        return alert('대상 유저를 선택해 주세요.');
      }

      const { error } = await api.admin.issueCouponToUser(parseInt(issueData.couponId), issueData.userId);
      setIsIssuing(false);
      if (error) {
        alert('발급 실패: ' + error);
      } else {
        alert('개별 쿠폰이 성공적으로 발급되었습니다.');
        setIssueData({ userId: '', couponId: '' });
        fetchAdminData();
      }
    }
  };

  const handleSendGlobalMessage = async () => {
    const message = window.prompt('모든 회원에게 발송할 공지 메시지를 입력하세요:');
    if (!message) return;

    if (!window.confirm('정말 모든 회원(일반, 사업자 포함)에게 알림을 발송하시겠습니까?')) return;

    const { error } = await api.admin.sendGlobalNotice(message);
    if (error) {
      alert('발송 실패: ' + error);
    } else {
      alert('성공적으로 모든 회원에게 공지 알림이 발송되었습니다!');
    }
  };

  const handleDeleteReportedDog = async (report) => {
    if (!window.confirm(`정말 해당 게시물(ID: ${report.dog_id})을 강제 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    
    const { error } = await api.admin.deleteDog(report.dog_id);
    if (error) {
      alert('게시물 삭제 중 오류: ' + error);
    } else {
      alert('게시물이 삭제되었고, 판매자에게 알림이 전송되었습니다.');
      fetchAdminData();
    }
  };

  const handleDeletePost = async (dogId) => {
    const { error } = await api.admin.deleteDog(dogId);
    if (error) {
      alert('게시물 삭제 중 오류: ' + error);
    } else {
      alert('게시물이 강제 삭제되었고, 판매자에게 시스템 알림이 전송되었습니다.');
      fetchAdminData();
    }
  };

  const handleResolveReport = async (reportId) => {
    if (!window.confirm('게시물 삭제 없이 이 신고를 반려(패스)하시겠습니까?')) return;
    const { error } = await api.admin.resolveReport(reportId);
    if (error) {
      alert('처리 실패: ' + error);
    } else {
      alert('반려 처리되었습니다.');
      fetchAdminData();
    }
  };

  const handleUpdateAdRequestStatus = async (id, status) => {
    let confirmMsg = '상태를 변경하시겠습니까?';
    if (status === 'active') confirmMsg = '승인 처리하시겠습니까?\n세금계산서가 자동 발행되며 광고 쿠폰이 발급됩니다.';
    if (status === 'rejected') confirmMsg = '정말 취소(반려) 처리하시겠습니까?';

    if (!window.confirm(confirmMsg)) return;

    const { data, error } = await api.admin.updateAdRequestStatus(id, status);
    if (error) {
      alert('상태 업데이트 중 오류가 발생했습니다: ' + error);
    } else {
      let msg = data?.message || '처리되었습니다.';
      if (data?.taxInvoiceIssued) msg += '\n🧾 세금계산서 발행 완료';
      alert(msg);
      fetchAdminData();
    }
  };

  if (!isAdmin || loading) return <div style={fullCenterStyle}>데이터를 동기화 중입니다...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
      <nav style={sidebarStyle}>
        <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '800' }}>다잇독 어드민 v1.0</h2>
        </div>
        <div style={{ marginTop: '20px' }}>
          {[
            { id: 'summary', icon: '📊', label: '활동 통계' },
            { id: 'business', icon: '📝', label: '입점 승인' },
            { id: 'users', icon: '👥', label: '회원 관리' },
            { id: 'dogs', icon: '🐶', label: '게시물 관리' },
            { id: 'reports', icon: '🚨', label: '신고 관리' },
            { id: 'adRequests', icon: '🛒', label: '광고 신청 관리' },
            { id: 'coupons', icon: '🎫', label: '쿠폰 시스템' }
          ].map(item => (
            <div 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              style={{ ...navItemStyle, backgroundColor: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent' }}
            >
              <span>{item.icon}</span>
              <span style={{ marginLeft: '10px' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </nav>

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
            { activeTab === 'summary' && '실시간 활동 통계' }
            { activeTab === 'business' && '입점 신청 관리' }
            { activeTab === 'users' && '전체 회원 관리' }
            { activeTab === 'dogs' && '분양 게시물 관리' }
            { activeTab === 'reports' && '🚨 신고 내역 관리' }
            { activeTab === 'adRequests' && '🛒 광고 신청 관리' }
            { activeTab === 'coupons' && '쿠폰 시스템 관리' }
          </h1>
          <div style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', fontSize: '0.9rem' }}>
            마지막 업데이트: {new Date().toLocaleTimeString()}
          </div>
        </header>

        {activeTab === 'summary' && (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <StatCard label="총 회원" value={stats.users} color="#4A90E2" />
              <StatCard label="승인 대기" value={stats.applications} color="#F5A623" />
              <StatCard label="활성 매물" value={stats.dogs} color="#7ED321" />
              <StatCard label="누적 활동수" value={stats.clicks} color="#9013FE" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
              <div className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ marginBottom: '20px' }}>최근 7일 페이지 뷰 트렌드</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="date" fontSize={12} stroke="#999" />
                      <YAxis fontSize={12} stroke="#999" />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#4A90E2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ marginBottom: '20px' }}>활동 분포</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventData}>
                      <XAxis dataKey="name" fontSize={12} stroke="#999" />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                        {eventData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#4A90E2' : '#7ED321'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="glass-card fade-in" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={thStyle}>신청일</th>
                  <th style={thStyle}>사업장명</th>
                  <th style={thStyle}>대표자</th>
                  <th style={thStyle}>연락처</th>
                  <th style={thStyle}>사업자등록번호</th>
                  <th style={thStyle}>동물판매업번호</th>
                  <th style={thStyle}>상태</th>
                  <th style={thStyle}>관리</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>{new Date(app.created_at).toLocaleDateString()}</td>
                    <td style={tdStyle}><b>{app.business_name}</b></td>
                    <td style={tdStyle}>{app.representative_name}</td>
                    <td style={tdStyle}>{app.phone}</td>
                    <td style={tdStyle}>{app.biz_no}</td>
                    <td style={tdStyle}>{app.animal_sale_no || '-'}</td>
                    <td style={tdStyle}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700',
                        backgroundColor: app.status === 'pending' ? '#fff4e5' : (app.status === 'approved' ? '#eefbe7' : '#ffeaea'),
                        color: app.status === 'pending' ? '#f5a623' : (app.status === 'approved' ? '#7ed321' : '#ff4757')
                      }}>
                        {app.status === 'pending' ? '승인 대기' : (app.status === 'approved' ? '승인 완료' : '반려')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        {app.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(app)} style={tableBtnStyle}>승인</button>
                            <button onClick={() => handleReject(app)} style={{ ...tableBtnStyle, backgroundColor: '#ff4757' }}>반려</button>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            if (app.file_url) {
                              window.open(app.file_url);
                            } else {
                              alert('첨부된 증빙 서류가 없습니다.');
                            }
                          }} 
                          style={{ 
                            ...tableBtnStyle, 
                            backgroundColor: app.file_url ? '#eee' : '#f5f5f5', 
                            color: app.file_url ? '#666' : '#ccc',
                            cursor: app.file_url ? 'pointer' : 'not-allowed'
                          }}
                        >
                          서류 확인
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'dogs' && (
          <div className="glass-card fade-in" style={{ padding: '0' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>시스템 전체 게시물 목록</h3>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>등록된 모든 강아지 분양 게시물을 관리합니다.</p>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={thStyle}>사진</th>
                  <th style={thStyle}>견종/이름</th>
                  <th style={thStyle}>지역/가격</th>
                  <th style={thStyle}>등록일</th>
                  <th style={thStyle}>판매자 ID</th>
                  <th style={thStyle}>상태</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {dogs.map(dog => (
                  <tr key={dog.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}><img src={dog.image_url} alt="dog" style={{ width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover' }}/></td>
                    <td style={tdStyle}>
                      <strong>{dog.breed}</strong><br/>
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>{dog.nickname}</span>
                    </td>
                    <td style={tdStyle}>{dog.region}<br/>{dog.price === 0 ? '무료' : `${dog.price}만`}</td>
                    <td style={tdStyle}>{new Date(dog.created_at).toLocaleDateString()}</td>
                    <td style={tdStyle}><small style={{ color: '#999' }}>{dog.seller_id.split('-')[0]}...</small></td>
                    <td style={tdStyle}>
                      <span style={{ padding: '4px 8px', backgroundColor: '#eefbe7', color: '#7ed321', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {dog.status === 'available' ? '분양중' : '분양완료'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button 
                        onClick={() => {
                          if(window.confirm('관리자 권한으로 이 게시물을 강제 삭제하시겠습니까?')) {
                             handleDeletePost(dog.id);
                          }
                        }} 
                        style={{ ...tableBtnStyle, backgroundColor: '#ff4757' }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dogs.length === 0 && <div style={{ padding: '50px', textAlign: 'center', color: '#ccc' }}>등록된 게시물이 없습니다.</div>}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-card fade-in" style={{ padding: '0' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>가입 회원 목록</h3>
              <button onClick={handleSendGlobalMessage} style={{ ...tableBtnStyle, backgroundColor: '#4A90E2', padding: '10px 15px', fontSize: '0.9rem' }}>📢 전체 회원에게 공지 발송</button>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={thStyle}>이메일</th>
                  <th style={thStyle}>닉네임</th>
                  <th style={thStyle}>가입일</th>
                  <th style={thStyle}>권한</th>
                  <th style={thStyle}>등급</th>
                  <th style={thStyle}>등급 조정</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>{u.email || 'OAuth 유저'}</td>
                    <td style={tdStyle}>{u.nickname}</td>
                    <td style={tdStyle}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={tdStyle}>{u.role}</td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: '700', color: u.grade === 'Gold' ? '#f5a623' : (u.grade === 'Silver' ? '#999' : '#cd7f32') }}>
                        [{u.grade || 'Bronze'}]
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <select 
                        value={u.grade || 'Bronze'} 
                        onChange={(e) => handleUpdateGrade(u.id, e.target.value)}
                        style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                      >
                        <option value="Bronze">Bronze</option>
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="glass-card fade-in" style={{ padding: '0' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>사용자 신고 접수 내역</h3>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>허위 매물이나 규정 위반으로 접수된 내역입니다.</p>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={thStyle}>접수일시</th>
                  <th style={thStyle}>신고자</th>
                  <th style={thStyle}>대상 (판매자)</th>
                  <th style={thStyle}>사유</th>
                  <th style={thStyle}>상세내용</th>
                  <th style={thStyle}>상태</th>
                  <th style={thStyle}>관리</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id} style={{ borderBottom: '1px solid #eee', opacity: report.status === 'resolved' ? 0.6 : 1 }}>
                    <td style={tdStyle}>{new Date(report.created_at).toLocaleString()}</td>
                    <td style={tdStyle}>{report.reporter_nickname || '알 수 없음'} ({report.reporter_email || '-'})</td>
                    <td style={tdStyle}>
                      <b>{report.target_dog_breed || report.target_dog_name || `ID: ${report.dog_id}`}</b>
                      <br/><small style={{color: '#888'}}>판매자: {report.seller_nickname || '알 수 없음'} ({report.seller_email || '-'})</small>
                    </td>
                    <td style={tdStyle}><span style={{ color: '#e63946', fontWeight: 'bold' }}>{report.reason_type}</span></td>
                    <td style={tdStyle}><div style={{ maxWidth: '200px', fontSize: '0.85rem' }}>{report.details || '-'}</div></td>
                    <td style={tdStyle}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem',
                        backgroundColor: report.status === 'pending' ? '#fff4e5' : '#eee',
                        color: report.status === 'pending' ? '#f5a623' : '#666'
                      }}>
                        {report.status === 'pending' ? '처리 대기' : '조치 완료'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {report.status === 'pending' && (
                          <>
                            <button onClick={() => handleDeleteReportedDog(report)} style={{ ...tableBtnStyle, backgroundColor: '#ff4757' }}>삭제</button>
                            <button onClick={() => handleResolveReport(report.id)} style={{ ...tableBtnStyle, backgroundColor: '#eee', color: '#666' }}>반려</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>접수된 신고 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'adRequests' && (
          <div className="fade-in glass-card" style={{ padding: '30px' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>신청일시</th>
                  <th style={thStyle}>광고 구역</th>
                  <th style={thStyle}>상점/신청자</th>
                  <th style={thStyle}>사업자정보</th>
                  <th style={thStyle}>결제금액</th>
                  <th style={thStyle}>상태</th>
                  <th style={thStyle}>관리 액션</th>
                </tr>
              </thead>
              <tbody>
                {adRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={tdStyle}>{new Date(req.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--primary-dark)' }}>{req.title}</td>
                    <td style={tdStyle}>
                      {req.business_name || req.nickname}
                      {req.representative_name && <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '4px' }}>({req.representative_name})</span>}
                      <br/>
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>{req.email}</span>
                    </td>
                    <td style={tdStyle}>{req.biz_no || '미등록'}</td>
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{req.price?.toLocaleString()}원</td>
                    <td style={tdStyle}>
                      {req.status === 'pending' && <span style={{ ...badgeStyle, backgroundColor: '#f39c12' }}>입금대기</span>}
                      {req.status === 'active' && <span style={{ ...badgeStyle, backgroundColor: '#2ecc71' }}>승인/발행완료</span>}
                      {req.status === 'rejected' && <span style={{ ...badgeStyle, backgroundColor: '#e74c3c' }}>반려/취소</span>}
                    </td>
                    <td style={tdStyle}>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleUpdateAdRequestStatus(req.id, 'active')} style={{ ...tableBtnStyle, backgroundColor: 'var(--primary)' }}>확인(세금계산서)</button>
                          <button onClick={() => handleUpdateAdRequestStatus(req.id, 'rejected')} style={{ ...tableBtnStyle, backgroundColor: '#eee', color: '#666' }}>취소</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {adRequests.length === 0 && (
                  <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>접수된 광고 구매 신청 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="fade-in">
            {/* 1. 쿠폰 템플릿 생성 섹션 */}
            <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '20px', fontWeight: '800' }}>✨ 새 쿠폰 템플릿 생성</h3>
              <form onSubmit={handleCreateCoupon} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div>
                  <label style={smallLabel}>쿠폰명</label>
                  <input required style={adminInput} value={newCoupon.name} onChange={e => setNewCoupon({...newCoupon, name: e.target.value})} placeholder="신규 가입 감사 쿠폰" />
                </div>
                <div>
                  <label style={smallLabel}>쿠폰 코드</label>
                  <input required style={adminInput} value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} placeholder="WELCOME2024" />
                </div>
                <div>
                  <label style={smallLabel}>광고 보장 기간 (일수)</label>
                  <input required type="number" style={adminInput} value={newCoupon.amount} onChange={e => setNewCoupon({...newCoupon, amount: e.target.value})} />
                </div>
                <div>
                  <label style={smallLabel}>적용 가능 구역</label>
                  <select style={adminInput} value={newCoupon.ad_type} onChange={e => setNewCoupon({...newCoupon, ad_type: e.target.value})}>
                    <option value="all">전체 구역 가능</option>
                    <option value="main">메인페이지 메인배너 전용</option>
                    <option value="breed">품종별 페이지 메인배너 전용</option>
                    <option value="safe">메인페이지 안심분양 전용</option>
                    <option value="popular">메인페이지 인기분양 전용</option>
                    <option value="special">메인페이지 스페셜분양 전용</option>
                  </select>
                </div>
                <div>
                  <label style={smallLabel}>혜택 종류</label>
                  <select style={adminInput} value={newCoupon.benefit_type} onChange={e => {
                    const val = e.target.value;
                    setNewCoupon({
                      ...newCoupon, 
                      benefit_type: val, 
                      amount: val.startsWith('post_reg') ? 20 : newCoupon.amount
                    });
                  }}>
                    <option value="ad_exemption">일반 광고비 면제권</option>
                    <option value="ad_main">메인 페이지 광고권</option>
                    <option value="ad_safe_1m">안심분양 광고 (1개월)</option>
                    <option value="ad_popular_1m">인기분양 광고 (1개월)</option>
                    <option value="ad_special_1m">스페셜분양 광고 (1개월)</option>
                    <option value="post_reg_1m">게시물 등록 1개월 쿠폰 (1달 20개)</option>
                    <option value="post_reg_2m">게시물 등록 2개월 쿠폰 (1달 20개)</option>
                    <option value="post_reg_3m">게시물 등록 3개월 쿠폰 (1달 20개)</option>
                    <option value="post_reg_4m">게시물 등록 4개월 쿠폰 (1달 20개)</option>
                    <option value="post_reg_5m">게시물 등록 5개월 쿠폰 (1달 20개)</option>
                    <option value="post_reg_6m">게시물 등록 6개월 쿠폰 (1달 20개)</option>
                  </select>
                </div>
                <div>
                  <label style={smallLabel}>유효 기한 (설정 시 이후 자동 소멸)</label>
                  <input type="date" style={adminInput} value={newCoupon.valid_until} onChange={e => setNewCoupon({...newCoupon, valid_until: e.target.value})} />
                </div>
                <div>
                  <label style={smallLabel}>자동 발급 설정</label>
                  <select style={adminInput} value={newCoupon.auto_issue_type} onChange={e => setNewCoupon({...newCoupon, auto_issue_type: e.target.value})}>
                    <option value="none">수동 발급용 (자동없음)</option>
                    <option value="welcome">사업자 승인 시 자동발급</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" disabled={isCreating} style={{ ...createBtnStyle, width: '100%', height: '45px', backgroundColor: isCreating ? '#999' : '#2D3436', cursor: isCreating ? 'not-allowed' : 'pointer' }}>
                    {isCreating ? '등록 중...' : '쿠폰 템플릿 등록'}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. 쿠폰 개별 발급 섹션 */}
            <div className="glass-card" style={{ padding: '30px', marginBottom: '30px', border: '2px solid #eef2f7' }}>
              <h3 style={{ marginBottom: '20px', fontWeight: '800', color: 'var(--primary-dark)' }}>🎁 사업자에게 쿠폰 선물하기</h3>
              <form onSubmit={handleIssueCoupon} style={{ display: 'grid', gap: '20px' }}>
                
                {/* 2-1 발송 대상 형태 선택 */}
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="radio" name="targetType" value="individual" checked={issueTargetType === 'individual'} onChange={() => setIssueTargetType('individual')} />
                    특정 사업자 선택 (개별 발송)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="radio" name="targetType" value="all_sellers" checked={issueTargetType === 'all_sellers'} onChange={() => setIssueTargetType('all_sellers')} />
                    모든 사업자 전체 발송
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  {issueTargetType === 'individual' && (
                    <>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={smallLabel}>검색어로 찾기 (이름/이메일)</label>
                        <input 
                          type="text" 
                          style={adminInput} 
                          placeholder="검색어를 입력하세요..." 
                          value={userSearch} 
                          onChange={(e) => setUserSearch(e.target.value)} 
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={smallLabel}>대상 사업자 선택</label>
                        <select required style={adminInput} value={issueData.userId} onChange={e => setIssueData({...issueData, userId: e.target.value})}>
                          <option value="">사업자를 선택하세요</option>
                          {users
                            .filter(u => u.role === 'seller') // 일반유저 제외
                            .filter(u => userSearch === '' || 
                               (u.nickname && u.nickname.includes(userSearch)) || 
                               (u.email && u.email.includes(userSearch))
                            )
                            .map(u => (
                              <option key={u.id} value={u.id}>{u.nickname} ({u.email || 'OAuth'})</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={smallLabel}>발급할 쿠폰 선택</label>
                    <select required style={adminInput} value={issueData.couponId} onChange={e => setIssueData({...issueData, couponId: e.target.value})}>
                      <option value="">쿠폰을 선택하세요</option>
                      {coupons.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" disabled={isIssuing} style={{ ...createBtnStyle, backgroundColor: isIssuing ? '#999' : 'var(--primary-dark)', height: '45px', padding: '0 30px', cursor: isIssuing ? 'not-allowed' : 'pointer' }}>
                    {isIssuing ? '발급 중...' : '쿠폰 발급하기'}
                  </button>
                </div>
              </form>
            </div>

            {/* 3. 현재 등록된 쿠폰 목록 (심플) */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ marginBottom: '15px' }}>현재 시스템 쿠폰 목록</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {coupons.map(c => (
                  <div key={c.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '10px', backgroundColor: '#f9f9f9' }}>
                    <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>코드: {c.code}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '5px', color: 'var(--primary)' }}>
                      {c.auto_issue_type === 'welcome' ? '✅ 사업자 웰컴 자동발급' : '👤 수동 발급용'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="glass-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', borderLeft: `5px solid ${color}` }}>
    <span style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px' }}>{label}</span>
    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#333' }}>{(value || 0).toLocaleString()}</span>
  </div>
);

const sidebarStyle = { width: '260px', backgroundColor: '#2D3436', color: 'white', display: 'flex', flexDirection: 'column' };
const navItemStyle = { padding: '15px 30px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', fontSize: '0.95rem' };
const fullCenterStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '700' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const thStyle = { padding: '15px 20px', fontSize: '0.85rem', color: '#666', borderBottom: '2px solid #eee' };
const tdStyle = { padding: '15px 20px', fontSize: '0.9rem', color: '#444' };
const tableBtnStyle = { padding: '5px 12px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' };
const adminInput = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #eee', outline: 'none' };
const smallLabel = { display: 'block', fontSize: '0.75rem', color: '#777', marginBottom: '5px' };
const badgeStyle = { padding: '4px 8px', borderRadius: '12px', color: 'white', fontSize: '0.75rem', fontWeight: 'bold' };
const createBtnStyle = { padding: '12px 30px', borderRadius: '8px', border: 'none', backgroundColor: '#2D3436', color: 'white', fontWeight: '800', cursor: 'pointer' };

export default AdminPage;
