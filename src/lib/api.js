// Paldo REST API Client
// Cloudflare Pages Functions (/functions/api/) 연동용 통합 API 클라이언트

const BASE_URL = ''; // 동일 도메인(Pages 호스팅)이므로 상대 경로 사용

// 공통 fetch 헬퍼
async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 로컬스토리지에 보관된 세션 토큰 주입
  const token = localStorage.getItem('paldo_session_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'API 요청 중 오류가 발생했습니다.');
  }

  // Supabase의 반환 구조 { data, error }와 호환되도록 wrapping 처리
  return { data, error: null };
}

export const api = {
  // 1. 인증 (Auth)
  auth: {
    async signup(email, password, profileData = {}) {
      try {
        const { data } = await request(`${BASE_URL}/api/auth?action=signup`, {
          method: 'POST',
          body: JSON.stringify({ email, password, ...profileData }),
        });
        if (data.token) {
          localStorage.setItem('paldo_session_token', data.token);
        }
        return { data: data.user, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async login(email, password) {
      try {
        const { data } = await request(`${BASE_URL}/api/auth?action=login`, {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (data.token) {
          localStorage.setItem('paldo_session_token', data.token);
        }
        return { data: { user: data.user, session: { user: data.user } }, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async getSession() {
      try {
        const token = localStorage.getItem('paldo_session_token');
        if (!token) return { data: { session: null }, error: null };

        const { data } = await request(`${BASE_URL}/api/auth?action=session`);
        return { data: { session: { user: data.user } }, error: null };
      } catch (err) {
        localStorage.removeItem('paldo_session_token');
        return { data: { session: null }, error: err.message };
      }
    },

    async getUser() {
      try {
        const token = localStorage.getItem('paldo_session_token');
        if (!token) return { data: { user: null }, error: null };

        const { data } = await request(`${BASE_URL}/api/auth?action=session`);
        return { data: data.user, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async logout() {
      try {
        await request(`${BASE_URL}/api/auth?action=logout`, { method: 'POST' });
      } catch {
        // 네트워크 실패해도 로컬은 무조건 로그아웃 처리
      } finally {
        localStorage.removeItem('paldo_session_token');
      }
      return { error: null };
    },

    async updateProfile(profileData) {
      try {
        const { data } = await request(`${BASE_URL}/api/auth?action=update_profile`, {
          method: 'POST',
          body: JSON.stringify(profileData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async updatePassword(newPassword) {
      try {
        const { data } = await request(`${BASE_URL}/api/auth?action=update_password`, {
          method: 'POST',
          body: JSON.stringify({ password: newPassword }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async getMyCoupons() {
      try {
        const { data } = await request(`${BASE_URL}/api/auth?action=coupons`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    }
  },

  // 2. 강아지 매물 (Dogs)
  dogs: {
    async getList(filters = {}) {
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            params.append(key, val);
          }
        });
        const { data } = await request(`${BASE_URL}/api/dogs?${params.toString()}`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async getDetail(id) {
      try {
        const { data } = await request(`${BASE_URL}/api/dogs?id=${id}`);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async create(dogData) {
      try {
        const { data } = await request(`${BASE_URL}/api/dogs`, {
          method: 'POST',
          body: JSON.stringify(dogData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async delete(id) {
      try {
        const { data } = await request(`${BASE_URL}/api/dogs?id=${id}`, {
          method: 'DELETE',
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async updateStatus(id, status) {
      try {
        const { data } = await request(`${BASE_URL}/api/dogs?action=update_status`, {
          method: 'POST',
          body: JSON.stringify({ id, status }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async update(id, dogData) {
      try {
        const { data } = await request(`${BASE_URL}/api/dogs?action=update`, {
          method: 'POST',
          body: JSON.stringify({ id, ...dogData }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 10. 시스템 배너 (Banners)
  banners: {
    async getList() {
      try {
        const { data } = await request(`${BASE_URL}/api/banners`);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async adminCreate(bannerData) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin/banners`, {
          method: 'POST',
          body: JSON.stringify(bannerData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async adminDelete(id) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin/banners?id=${id}`, {
          method: 'DELETE',
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 3. 상점 및 리뷰 (Store/Reviews)
  store: {
    async getList() {
      try {
        const { data } = await request(`${BASE_URL}/api/store?action=list`);
        return { data: data || [], error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },
    async getProfile(sellerId) {
      try {
        const { data } = await request(`${BASE_URL}/api/store?seller_id=${sellerId}`);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async getReviews(sellerId) {
      try {
        const { data } = await request(`${BASE_URL}/api/store?action=reviews&seller_id=${sellerId}`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async createReview(reviewData) {
      try {
        const { data } = await request(`${BASE_URL}/api/store?action=create_review`, {
          method: 'POST',
          body: JSON.stringify(reviewData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 4. 북마크 (Bookmarks)
  bookmarks: {
    async getList() {
      try {
        const { data } = await request(`${BASE_URL}/api/bookmarks`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async toggle(dogId) {
      try {
        const { data } = await request(`${BASE_URL}/api/bookmarks?action=toggle`, {
          method: 'POST',
          body: JSON.stringify({ dog_id: dogId }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async check(dogId) {
      try {
        const { data } = await request(`${BASE_URL}/api/bookmarks?action=check&dog_id=${dogId}`);
        return { data, error: null };
      } catch (err) {
        return { data: { bookmarked: false }, error: err.message };
      }
    }
  },

  // 5. 알림 및 신고 (Notifications/Reports)
  notifications: {
    async getList() {
      try {
        const { data } = await request(`${BASE_URL}/api/notifications`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async markAsRead(id) {
      try {
        const { data } = await request(`${BASE_URL}/api/notifications?action=read`, {
          method: 'POST',
          body: JSON.stringify({ id })
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async markAllAsRead() {
      try {
        const { data } = await request(`${BASE_URL}/api/notifications?action=read_all`, {
          method: 'POST',
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async create(notiData) {
      try {
        const { data } = await request(`${BASE_URL}/api/notifications`, {
          method: 'POST',
          body: JSON.stringify(notiData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  reports: {
    async create(reportData) {
      try {
        const { data } = await request(`${BASE_URL}/api/reports`, {
          method: 'POST',
          body: JSON.stringify(reportData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 6. 1:1 채팅 (Chat)
  chat: {
    async getRooms() {
      try {
        const { data } = await request(`${BASE_URL}/api/chat?action=rooms`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async getMessages(roomId) {
      try {
        const { data } = await request(`${BASE_URL}/api/chat?action=messages&room_id=${roomId}`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async sendMessage(roomId, message) {
      try {
        const { data } = await request(`${BASE_URL}/api/chat?action=send_message`, {
          method: 'POST',
          body: JSON.stringify({ room_id: roomId, message }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async createRoom(sellerId, buyerId, dogId) {
      try {
        const { data } = await request(`${BASE_URL}/api/chat?action=create_room`, {
          method: 'POST',
          body: JSON.stringify({ seller_id: sellerId, buyer_id: buyerId, dog_id: dogId }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async markRead(roomId) {
      try {
        const { data } = await request(`${BASE_URL}/api/chat?action=mark_read`, {
          method: 'POST',
          body: JSON.stringify({ room_id: roomId }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 7. 사업자 신청 (Business)
  business: {
    async apply(bizData) {
      try {
        const { data } = await request(`${BASE_URL}/api/business?action=apply`, {
          method: 'POST',
          body: JSON.stringify(bizData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async getLastApplication() {
      try {
        const { data } = await request(`${BASE_URL}/api/business?action=last_application`);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 8. 광고 및 분석 (Ads/Analytics)
  ads: {
    async getCount(adType, status = 'active') {
      try {
        const { data } = await request(`${BASE_URL}/api/ads?action=count&ad_type=${adType}&status=${status}`);
        return { data: data?.count || 0, error: null };
      } catch (err) {
        return { data: 0, error: err.message };
      }
    },

    async getList(filters = {}) {
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            params.append(key, val);
          }
        });
        const { data } = await request(`${BASE_URL}/api/ads?${params.toString()}`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async create(adData) {
      try {
        const { data } = await request(`${BASE_URL}/api/ads`, {
          method: 'POST',
          body: JSON.stringify(adData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async requestAdPurchase(payload) {
      try {
        const { data } = await request(`${BASE_URL}/api/ads/request`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  analytics: {
    async logActivity(dogId, breed, actionType = 'view') {
      try {
        const { data } = await request(`${BASE_URL}/api/analytics`, {
          method: 'POST',
          body: JSON.stringify({ dog_id: dogId, breed, action_type: actionType }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 9. 관리자 기능 (Admin)
  admin: {
    async getStats() {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=stats`);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async getUsers() {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=users`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async getDogs() {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=dogs`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async getCoupons() {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=coupons`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async getApplications() {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=applications`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async getReports() {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=reports`);
        return { data, error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async approveApplication(id, userId) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=approve_app`, {
          method: 'POST',
          body: JSON.stringify({ id, user_id: userId }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async rejectApplication(id, reason) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=reject_app`, {
          method: 'POST',
          body: JSON.stringify({ id, reason }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async updateUserGrade(userId, grade) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=update_grade`, {
          method: 'POST',
          body: JSON.stringify({ user_id: userId, grade }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async createCoupon(couponData) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=create_coupon`, {
          method: 'POST',
          body: JSON.stringify(couponData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async issueCouponToAll(couponId) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=issue_all`, {
          method: 'POST',
          body: JSON.stringify({ coupon_id: couponId }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async issueCouponToUser(couponId, userId) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=issue_user`, {
          method: 'POST',
          body: JSON.stringify({ coupon_id: couponId, user_id: userId }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async sendGlobalNotice(message) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=send_global_notice`, {
          method: 'POST',
          body: JSON.stringify({ message }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async deleteDog(dogId) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=delete_dog`, {
          method: 'POST',
          body: JSON.stringify({ dog_id: dogId }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async resolveReport(reportId) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=resolve_report`, {
          method: 'POST',
          body: JSON.stringify({ id: reportId }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async expireAds() {
      try {
        const { data } = await request(`${BASE_URL}/api/admin?action=expire_ads`, {
          method: 'POST',
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async getAdRequests() {
      try {
        const { data } = await request(`${BASE_URL}/api/admin/ads`);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async updateAdRequestStatus(id, status) {
      try {
        const { data } = await request(`${BASE_URL}/api/admin/ads`, {
          method: 'PATCH',
          body: JSON.stringify({ id, status }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // ─── 쿠폰 시스템 ──────────────────────────────────────────
  coupons: {
    async getMyCoupons() {
      try {
        const { data } = await request(`${BASE_URL}/api/coupons?action=my`);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async issueWelcomePack(targetUserId) {
      try {
        const { data } = await request(`${BASE_URL}/api/coupons`, {
          method: 'POST',
          body: JSON.stringify({ action: 'issue_welcome_pack', target_user_id: targetUserId })
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 10. 파일 업로드 (R2)
  async uploadFile(file, fileName = null) {
    try {
      const token = localStorage.getItem('paldo_session_token');
      const targetFileName = fileName || file.name || 'file.jpg';
      
      const headers = {
        'Content-Type': file.type || 'application/octet-stream',
        // 서버에서 디코딩할 수 있도록 파일명 URL 인코딩하여 커스텀 헤더로 전달
        'X-File-Name': encodeURIComponent(targetFileName),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // FormData를 쓰지 않고 Blob(File) 자체를 body로 넘겨 원시 스트림 유지
      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        headers,
        body: file
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || '파일 업로드 실패');
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  // 11. 포트원 결제 및 본인인증 (Payment / Certification)
  payment: {
    async verify(imp_uid, merchant_uid, amount, adId, pay_method, extra = {}) {
      try {
        const { data } = await request(`${BASE_URL}/api/payment/verify`, {
          method: 'POST',
          body: JSON.stringify({ imp_uid, merchant_uid, amount, ad_id: adId, pay_method, ...extra }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async getHistory() {
      try {
        const { data } = await request(`${BASE_URL}/api/payment/history`);
        return { data: data.history || [], error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async requestCancel(paymentId) {
      try {
        const { data } = await request(`${BASE_URL}/api/payment/cancel-request`, {
          method: 'POST',
          body: JSON.stringify({ payment_id: paymentId })
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  certification: {
    async verify(imp_uid) {
      try {
        const { data } = await request(`${BASE_URL}/api/certification/verify`, {
          method: 'POST',
          body: JSON.stringify({ imp_uid }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 12. 정기결제(빌키) 연동
  subscription: {
    async register(customer_uid, plan_name, merchant_uid, amount) {
      try {
        const { data } = await request(`${BASE_URL}/api/subscription/register`, {
          method: 'POST',
          body: JSON.stringify({ customer_uid, plan_name, merchant_uid, amount }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 13. 커뮤니티 게시판 (Community Board)
  board: {
    async getList(category = 'all', page = 1, limit = 10, search = '') {
      try {
        const { data } = await request(`${BASE_URL}/api/board?action=list&category=${category}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
        return { data, error: null };
      } catch (err) {
        return { data: { posts: [], total: 0 }, error: err.message };
      }
    },
    async getDetail(id) {
      try {
        const { data } = await request(`${BASE_URL}/api/board?action=detail&id=${id}`);
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async create(postData) {
      try {
        const { data } = await request(`${BASE_URL}/api/board?action=create`, {
          method: 'POST',
          body: JSON.stringify(postData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async update(postData) {
      try {
        const { data } = await request(`${BASE_URL}/api/board?action=update`, {
          method: 'POST',
          body: JSON.stringify(postData),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async delete(id) {
      try {
        const { data } = await request(`${BASE_URL}/api/board?action=delete`, {
          method: 'POST',
          body: JSON.stringify({ id }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 14. 댓글 (Comments)
  comments: {
    async create(post_id, content) {
      try {
        const { data } = await request(`${BASE_URL}/api/comments?action=create`, {
          method: 'POST',
          body: JSON.stringify({ post_id, content }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    async delete(id) {
      try {
        const { data } = await request(`${BASE_URL}/api/comments?action=delete`, {
          method: 'POST',
          body: JSON.stringify({ id }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  },

  // 15. 결제 (Payment)
  payment: {
    async getHistory() {
      try {
        const { data } = await request(`${BASE_URL}/api/payment/history`);
        return { data: data.history || [], error: null };
      } catch (err) {
        return { data: [], error: err.message };
      }
    },

    async verify(imp_uid, merchant_uid, amount, ad_id, pay_method, vbankInfo = {}) {
      try {
        const { data } = await request(`${BASE_URL}/api/payment/verify`, {
          method: 'POST',
          body: JSON.stringify({ imp_uid, merchant_uid, amount, ad_id, pay_method, ...vbankInfo }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async requestCancel(payment_id) {
      try {
        const { data } = await request(`${BASE_URL}/api/payment/cancel-request`, {
          method: 'POST',
          body: JSON.stringify({ payment_id }),
        });
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    }
  }
};
