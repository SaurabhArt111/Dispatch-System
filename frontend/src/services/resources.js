import api, { unwrap } from './api';

/* ---------------- Auth ---------------- */
export const authApi = {
  login: (email, password) => unwrap(api.post('/auth/login', { email, password })),
  refresh: () => unwrap(api.post('/auth/refresh')),
  logout: () => unwrap(api.post('/auth/logout')),
  me: () => unwrap(api.get('/auth/me'))
};

/* ---------------- Users ---------------- */
export const userApi = {
  list: () => unwrap(api.get('/users')),
  roles: () => unwrap(api.get('/users/roles')),
  create: (payload) => unwrap(api.post('/users', payload)),
  update: (id, payload) => unwrap(api.patch(`/users/${id}`, payload)),
  resetPassword: (id, password) => unwrap(api.post(`/users/${id}/reset-password`, { password })),
  forceLogout: (id) => unwrap(api.post(`/users/${id}/force-logout`)),
  sessions: (id) => unwrap(api.get(`/users/${id}/sessions`)),
  revokeSession: (sessionId) => unwrap(api.post(`/users/sessions/${sessionId}/revoke`))
};

/* ---------------- Godowns ---------------- */
export const godownApi = {
  list: () => unwrap(api.get('/godowns')),
  create: (payload) => unwrap(api.post('/godowns', payload)),
  update: (id, payload) => unwrap(api.patch(`/godowns/${id}`, payload)),
  createScreenPairing: (id, deviceLabel) => unwrap(api.post(`/godowns/${id}/screens`, { deviceLabel })),
  listScreens: () => unwrap(api.get('/godowns/screens/all'))
};

/* ---------------- Screen (TV) ---------------- */
export const screenApi = {
  pair: (pairingCode) => unwrap(api.post('/screen/pair', { pairingCode })),
  whoami: (token) => unwrap(api.get('/screen/whoami', { headers: { Authorization: `Bearer ${token}` } })),
  heartbeat: (token) => unwrap(api.post('/screen/heartbeat', {}, { headers: { Authorization: `Bearer ${token}` } })),
  jobs: (token) => unwrap(api.get('/screen/jobs', { headers: { Authorization: `Bearer ${token}` } }))
};

/* ---------------- DC ---------------- */
export const dcApi = {
  list: (params) => unwrap(api.get('/dc', { params })),
  get: (id) => unwrap(api.get(`/dc/${id}`))
};

/* ---------------- Godown Jobs ---------------- */
export const jobApi = {
  listAll: (params) => unwrap(api.get('/jobs', { params })),
  listForGodown: (godownCode) => unwrap(api.get(`/jobs/godown/${godownCode}`)),
  acknowledge: (id) => unwrap(api.post(`/jobs/${id}/acknowledge`)),
  updateStatus: (id, status, note) => unwrap(api.patch(`/jobs/${id}/status`, { status, note }))
};

/* ---------------- Rolls / Packing ---------------- */
export const rollApi = {
  create: (payload) => unwrap(api.post('/rolls', payload)),
  listForJob: (jobId) => unwrap(api.get(`/rolls/job/${jobId}`)),
  markPacked: (jobId) => unwrap(api.post(`/rolls/job/${jobId}/mark-packed`))
};

/* ---------------- QR ---------------- */
export const qrApi = {
  generate: (rollId) => unwrap(api.post(`/qr/roll/${rollId}`)),
  bulkGenerate: (rollIds) => unwrap(api.post('/qr/bulk', { rollIds })),
  markPrinted: (id) => unwrap(api.post(`/qr/${id}/mark-printed`)),
  lookup: (code) => unwrap(api.get(`/qr/lookup/${encodeURIComponent(code)}`))
};

/* ---------------- Scan ---------------- */
export const scanApi = {
  scan: (code) => unwrap(api.post('/scan', { code }))
};

/* ---------------- Transfers ---------------- */
export const transferApi = {
  list: () => unwrap(api.get('/transfers')),
  request: (payload) => unwrap(api.post('/transfers', payload)),
  markTransferred: (id) => unwrap(api.post(`/transfers/${id}/mark-transferred`)),
  confirmReceipt: (id) => unwrap(api.post(`/transfers/${id}/confirm-receipt`))
};

/* ---------------- Vehicles ---------------- */
export const vehicleApi = {
  list: () => unwrap(api.get('/vehicles')),
  create: (payload) => unwrap(api.post('/vehicles', payload)),
  update: (id, payload) => unwrap(api.patch(`/vehicles/${id}`, payload))
};

/* ---------------- Dispatch ---------------- */
export const dispatchApi = {
  board: () => unwrap(api.get('/dispatch/board')),
  list: () => unwrap(api.get('/dispatch')),
  startLoading: (payload) => unwrap(api.post('/dispatch/start-loading', payload)),
  scanIntoLoad: (id, rollId) => unwrap(api.post(`/dispatch/${id}/scan`, { rollId })),
  confirmLoaded: (id) => unwrap(api.post(`/dispatch/${id}/confirm-loaded`)),
  markDispatched: (id) => unwrap(api.post(`/dispatch/${id}/dispatch`))
};

/* ---------------- Notifications ---------------- */
export const notificationApi = {
  list: (room) => unwrap(api.get('/notifications', { params: { room } })),
  markRead: (id) => unwrap(api.post(`/notifications/${id}/read`))
};

/* ---------------- Audit + Sync ---------------- */
export const auditApi = {
  list: (params) => unwrap(api.get('/audit', { params }))
};

export const syncApi = {
  list: (params) => unwrap(api.get('/sync', { params })),
  triggerMock: () => unwrap(api.post('/sync/trigger-mock'))
};
