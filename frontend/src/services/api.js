async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const fetchStats = () => apiFetch('/api/stats');

export const fetchCalls = ({ page = 1, limit = 20, outcome, search } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (outcome && outcome !== 'all') params.set('outcome', outcome);
  if (search) params.set('search', search);
  return apiFetch(`/api/calls?${params}`);
};

export const fetchCall = (id) => apiFetch(`/api/calls/${id}`);
