import api from '../utils/api';

// Auth
export const register          = (data)          => api.post('/auth/register', data);
export const verifyOTP         = (data)          => api.post('/auth/verify-otp', data);
export const resendOTP         = (data)          => api.post('/auth/resend-otp', data);
export const login             = (data)          => api.post('/auth/login', data);
export const logout            = ()              => api.post('/auth/logout');

// Profile
export const getProfile        = ()              => api.get('/profile/me');
export const updateProfile     = (data)          => api.put('/profile/update', data);
export const updateVibe        = (data)          => api.put('/profile/vibe', data);
export const updateInterests   = (data)          => api.put('/profile/interests', data);
export const verifyId          = (data)          => api.post('/profile/verify-id', data);
export const verifyFace        = (data)          => api.post('/profile/verify-face', data);
export const updateSafetyCircle = (data)         => api.put('/profile/safety-circle', data);

// Events
export const getEvents         = (params)        => api.get('/events', { params });
export const getEventById      = (id)            => api.get(`/events/${id}`);
export const createEvent       = (data)          => api.post('/events', data);
export const joinEvent         = (id)            => api.post(`/events/${id}/join`);
export const leaveEvent        = (id)            => api.post(`/events/${id}/leave`);
export const getMyEvents       = ()              => api.get('/events/my/created');
export const getJoinedEvents   = ()              => api.get('/events/my/joined');

// Matches
export const getSuggestions    = ()              => api.get('/matches/suggestions');
export const sendMatchRequest  = (data)          => api.post('/matches/request', data);
export const getPendingMatches = ()              => api.get('/matches/pending');
export const getActiveMatches  = ()              => api.get('/matches/active');
export const acceptMatch       = (id)            => api.post(`/matches/${id}/accept`);
export const rejectMatch       = (id)            => api.post(`/matches/${id}/reject`);

// Chat
export const getChats          = ()              => api.get('/chats');
export const getChatMessages   = (chatId, params) => api.get(`/chats/${chatId}/messages`, { params });
export const sendMessage       = (chatId, data)  => api.post(`/chats/${chatId}/messages`, data);

// Dashboard
export const getDashboardStats = ()              => api.get('/dashboard/stats');

// Reports & Block
export const reportUser        = (data)          => api.post('/reports', data);
export const blockUser         = (userId)        => api.post(`/users/${userId}/block`);
export const unblockUser       = (userId)        => api.post(`/users/${userId}/unblock`);

// Safety
export const createCheckIn     = (data)          => api.post('/safety/checkin', data);

// Ratings
export const rateUser          = (data)          => api.post('/ratings', data);
