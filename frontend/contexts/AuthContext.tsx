'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (params: { name: string; email: string; password: string; companyId: string }) => Promise<void>;
    updateProfile: (params: { name?: string }) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('fleetflow_user');
        const token = localStorage.getItem('fleetflow_token');
        if (stored && token) {
            setUser(JSON.parse(stored));
            setAccessToken(token);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Login failed');
        }
        const data = await res.json();
        setUser(data.user);
        setAccessToken(data.accessToken);
        localStorage.setItem('fleetflow_user', JSON.stringify(data.user));
        localStorage.setItem('fleetflow_token', data.accessToken);
        localStorage.setItem('fleetflow_refresh', data.refreshToken);
    };

    const register = async ({ name, email, password, companyId }: { name: string; email: string; password: string; companyId: string }) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, companyId }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.error || 'Registration failed');
        }
        const data = await res.json();
        setUser(data.user);
        setAccessToken(data.accessToken);
        localStorage.setItem('fleetflow_user', JSON.stringify(data.user));
        localStorage.setItem('fleetflow_token', data.accessToken);
        localStorage.setItem('fleetflow_refresh', data.refreshToken);
    };

    const updateProfile = async (params: { name?: string }) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
            },
            body: JSON.stringify(params),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.error || 'Failed to update profile');
        }
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('fleetflow_user', JSON.stringify(data.user));
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('fleetflow_refresh');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        }).catch(() => { });
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('fleetflow_user');
        localStorage.removeItem('fleetflow_token');
        localStorage.removeItem('fleetflow_refresh');
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, register, updateProfile, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
