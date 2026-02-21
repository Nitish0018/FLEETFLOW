'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

export const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                router.replace('/unauthorized');
            }
        }
    }, [user, loading, router, allowedRoles]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E]">
                <div className="w-8 h-8 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    return <>{children}</>;
};
