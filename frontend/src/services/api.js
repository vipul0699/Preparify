const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...getAuthHeaders(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
      const retry = await fetch(`${API_BASE}${url}`, { ...options, headers });
      return handleResponse(retry);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return handleResponse(res);
}

async function handleResponse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data };
  return data;
}

async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
    return true;
  } catch {
    return false;
  }
}

// Auth
export const authApi = {
  register: (data) => request('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login/', { method: 'POST', body: JSON.stringify(data) }),
  googleLogin: (token) => request('/auth/google/', { method: 'POST', body: JSON.stringify({ token }) }),
  getProfile: () => request('/auth/profile/'),
  getScores: () => request('/auth/scores/'),
};

// Quiz
export const quizApi = {
  generate: (topic, difficulty) => request('/quiz/generate/', { method: 'POST', body: JSON.stringify({ topic, difficulty }) }),
  submit: (questionId, userAnswer) => request('/quiz/submit/', { method: 'POST', body: JSON.stringify({ question_id: questionId, user_answer: userAnswer }) }),
  ingest: (topic, content) => {
    const body = content instanceof FormData ? content : JSON.stringify({ topic, content });
    return request('/quiz/ingest/', { method: 'POST', body });
  },
};
