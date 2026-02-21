'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
    Truck, AlertTriangle, Activity, Package,
    LogOut, User, Bell, TrendingUp, Fuel, Wrench, Users, LayoutDashboard,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Summary {
    totalVehicles: number;
    activeFleet: number;
    inShop: number;
    availableVehicles: number;
    utilizationRate: number;
    totalDrivers: number;
    activeDrivers: number;
    pendingCargo: number;
    activeCargo: number;
    unreadAlerts: number;
    fuelSpendThisMonth: number;
    maintenanceCostThisMonth: number;
}

interface MonthlyFuel { month: string; cost: number; litres: number; }
interface VehicleStatus { status: string; count: number; }

const STATUS_COLORS: Record<string, string> = {
    AVAILABLE: '#10B981',
    ON_TRIP: '#00C2FF',
    IN_SHOP: '#F59E0B',
    RETIRED: '#6B7280',
};

export default function DashboardPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();
    const [summary, setSummary] = useState<Summary | null>(null);
    const [monthlyFuel, setMonthlyFuel] = useState<MonthlyFuel[]>([]);
    const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!accessToken) return;
        const headers = { Authorization: `Bearer ${accessToken}` };
        try {
            const [s, f, v] = await Promise.all([
                fetch(`${API}/dashboard/summary`, { headers }).then(r => r.json()),
                fetch(`${API}/dashboard/monthly-fuel`, { headers }).then(r => r.json()),
                fetch(`${API}/dashboard/vehicle-status`, { headers }).then(r => r.json()),
            ]);
            setSummary(s);
            setMonthlyFuel(f);
            setVehicleStatus(v);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLogout = async () => { await logout(); router.replace('/login'); };

    const kpis = summary ? [
        { label: 'Active Fleet', value: summary.activeFleet, icon: Truck, color: '#00C2FF', sub: `${summary.availableVehicles} available` },
        { label: 'Maintenance Alerts', value: summary.inShop, icon: AlertTriangle, color: '#F59E0B', sub: `${summary.totalVehicles} total vehicles` },
        { label: 'Utilization Rate', value: `${summary.utilizationRate}%`, icon: Activity, color: '#10B981', sub: `${summary.activeDrivers} drivers on duty` },
        { label: 'Pending Cargo', value: summary.pendingCargo, icon: Package, color: '#8B5CF6', sub: `${summary.activeCargo} active trips` },
    ] : [];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#060B16] text-white">

                {/* Navbar */}
                <nav className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#0A0F1E]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#00C2FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[#00C2FF]/20">
                                <Truck className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">FleetFlow</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-1">
                            <Link href="/dashboard" className="px-3 py-1.5 text-sm text-white bg-[#1E293B] rounded-lg transition-colors">Dashboard</Link>
                            <Link href="/vehicles" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Vehicles</Link>
                            <Link href="/trips" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Trips</Link>
                            <Link href="/drivers" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Drivers</Link>
                            <Link href="/maintenance" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Maintenance</Link>
                            <Link href="/fuel" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Fuel</Link>
                            <Link href="/expenses" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Expenses</Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Alert bell */}
                        <button className="relative p-2 rounded-lg hover:bg-[#1E293B] transition-colors">
                            <Bell className="w-4 h-4 text-[#8892A4]" />
                            {summary && summary.unreadAlerts > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </button>

                        <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2D3748] text-sm border border-[#00C2FF]/20 shadow-[0_0_10px_rgba(0,194,255,0.1)] hover:bg-[#3A4A63] transition-colors">
                            <User className="w-3.5 h-3.5 text-[#00C2FF]" />
                            <span className="text-white">{user?.name}</span>
                            <span className="px-1.5 py-0.5 bg-[#00C2FF]/10 text-[#00C2FF] rounded text-xs font-medium border border-[#00C2FF]/20 hidden sm:block">
                                {user?.role?.replace(/_/g, ' ')}
                            </span>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-sm text-[#8892A4] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1E293B]"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </nav>

                <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-white">Command Center</h1>
                        <p className="text-[#8892A4] text-sm mt-0.5">Real-time fleet overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 animate-pulse h-28" />
                            ))
                        ) : kpis.map(kpi => (
                            <div key={kpi.label} className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 hover:border-[#2D3748] transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-[#8892A4] text-sm">{kpi.label}</p>
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${kpi.color}15` }}>
                                        <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-white mb-1">{kpi.value}</p>
                                <p className="text-[#4B5563] text-xs">{kpi.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Financial cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Fuel Spend (This Month)', value: summary ? `₹${(summary.fuelSpendThisMonth || 0).toLocaleString()}` : '—', icon: Fuel, color: '#F59E0B' },
                            { label: 'Maintenance Cost (This Month)', value: summary ? `₹${(summary.maintenanceCostThisMonth || 0).toLocaleString()}` : '—', icon: Wrench, color: '#EF4444' },
                            { label: 'Total Drivers', value: summary?.totalDrivers ?? '—', icon: Users, color: '#8B5CF6' },
                        ].map(card => (
                            <div key={card.label} className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 flex items-center gap-4">
                                <div className="p-3 rounded-xl" style={{ backgroundColor: `${card.color}15` }}>
                                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                                </div>
                                <div>
                                    <p className="text-[#8892A4] text-xs mb-1">{card.label}</p>
                                    <p className="text-xl font-bold text-white">{card.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Fuel Bar Chart */}
                        <div className="lg:col-span-2 bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="w-4 h-4 text-[#00C2FF]" />
                                <h2 className="text-sm font-semibold text-white">Monthly Fuel Spend (Last 6 Months)</h2>
                            </div>
                            {loading ? (
                                <div className="h-48 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : monthlyFuel.length === 0 ? (
                                <div className="h-48 flex items-center justify-center text-[#4B5563] text-sm">No fuel data yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={monthlyFuel} barSize={24}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                                        <XAxis dataKey="month" tick={{ fill: '#8892A4', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#8892A4', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #2D3748', borderRadius: 8 }}
                                            labelStyle={{ color: '#CBD5E1' }}
                                            itemStyle={{ color: '#00C2FF' }}
                                            formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Fuel Cost']}
                                        />
                                        <Bar dataKey="cost" fill="#00C2FF" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Vehicle Status Pie */}
                        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Truck className="w-4 h-4 text-[#00C2FF]" />
                                <h2 className="text-sm font-semibold text-white">Vehicle Status</h2>
                            </div>
                            {loading ? (
                                <div className="h-48 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : vehicleStatus.length === 0 ? (
                                <div className="h-48 flex items-center justify-center text-[#4B5563] text-sm">No vehicles yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={vehicleStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                                            {vehicleStatus.map((entry) => (
                                                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #2D3748', borderRadius: 8 }}
                                            itemStyle={{ color: '#CBD5E1' }}
                                        />
                                        <Legend
                                            formatter={(value) => <span style={{ color: '#8892A4', fontSize: 12 }}>{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            </div >
        </ProtectedRoute >
    );
}
