const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const api = {
    get: async (endpoint: string) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: getAuthHeaders(),
            credentials: 'include',
        });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({ error: res.statusText }));
            const err = new Error(errBody.error || res.statusText);
            (err as Error & { response?: { data: unknown } }).response = { data: errBody };
            throw err;
        }
        const data = await res.json();
        return { data };
    },
    post: async (endpoint: string, body: unknown) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({ error: res.statusText }));
            const err = new Error(errBody.error || res.statusText);
            (err as Error & { response?: { data: unknown } }).response = { data: errBody };
            throw err;
        }
        const data = await res.json();
        return { data };
    },
    put: async (endpoint: string, body?: unknown) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({ error: res.statusText }));
            const err = new Error(errBody.error || res.statusText);
            (err as Error & { response?: { data: unknown } }).response = { data: errBody };
            throw err;
        }
        const data = await res.json();
        return { data };
    },
    delete: async (endpoint: string) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include',
        });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({ error: res.statusText }));
            const err = new Error(errBody.error || res.statusText);
            (err as Error & { response?: { data: unknown } }).response = { data: errBody };
            throw err;
        }
        const data = await res.json();
        return { data };
    },
};

export default api;
