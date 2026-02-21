'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Truck, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#0A0F1E] text-white">

                {/* Navbar */}
                <nav className="border-b border-[#1E293B] bg-[#111827] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C2FF] to-[#0066FF] flex items-center justify-center">
                            <Truck className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">FleetFlow</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-[#8892A4]">
                            <User className="w-4 h-4" />
                            <span>{user?.name}</span>
                            <span className="px-2 py-0.5 bg-[#00C2FF]/10 text-[#00C2FF] rounded-full text-xs font-medium border border-[#00C2FF]/20">
                                {user?.role?.replace('_', ' ')}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-sm text-[#8892A4] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1E293B]"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </nav>

                {/* Main content */}
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white">Command Center</h1>
                        <p className="text-[#8892A4] mt-1">Welcome back, {user?.name}. Here&apos;s your fleet at a glance.</p>
                    </div>

                    {/* Coming soon KPI grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        {[
                            { label: 'Active Fleet', value: '—', color: '#00C2FF' },
                            { label: 'Maintenance Alerts', value: '—', color: '#F59E0B' },
                            { label: 'Utilization Rate', value: '—', color: '#10B981' },
                            { label: 'Pending Cargo', value: '—', color: '#8B5CF6' },
                        ].map(kpi => (
                            <div key={kpi.label} className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
                                <p className="text-[#8892A4] text-sm mb-2">{kpi.label}</p>
                                <p className="text-3xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                                <p className="text-[#4B5563] text-xs mt-1">Phase 3 coming soon</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C2FF]/10 to-[#0066FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mx-auto mb-4">
                            <Truck className="w-8 h-8 text-[#00C2FF]" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Authentication Complete ✅</h2>
                        <p className="text-[#8892A4] max-w-md mx-auto text-sm">
                            Phase 2 is done. The dashboard KPIs, vehicle registry, trip dispatcher, and all other modules will be built in the upcoming phases.
                        </p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
