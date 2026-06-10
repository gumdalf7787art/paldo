// ⚠️ 이 파일은 임시 호환성 shim입니다.
// 아직 api.js로 마이그레이션이 완료되지 않은 컴포넌트들을 위해 빈 객체를 내보냅니다.
// 각 파일이 api.js로 전환 완료되면 이 파일은 삭제하세요.

const noop = () => Promise.resolve({ data: null, error: 'supabase is not configured' });
const noopObj = new Proxy({}, {
  get: () => noopObj,
  apply: () => Promise.resolve({ data: null, error: 'supabase is not configured' }),
});

export const supabase = {
  from: () => ({
    select: () => ({ eq: () => ({ single: noop, maybeSingle: noop, order: () => ({ limit: () => ({ maybeSingle: noop }), maybeSingle: noop }), limit: () => ({ maybeSingle: noop }) }), order: () => ({ limit: () => ({ maybeSingle: noop }), maybeSingle: noop }) }),
    insert: noop,
    update: () => ({ eq: noop }),
    delete: () => ({ eq: noop }),
    upsert: () => ({ select: () => ({ single: noop }) }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: noop,
    updateUser: noop,
  },
  storage: {
    from: () => ({
      upload: noop,
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
    send: noop,
    subscribe: () => ({}),
  }),
  removeChannel: noop,
  rpc: noop,
};
