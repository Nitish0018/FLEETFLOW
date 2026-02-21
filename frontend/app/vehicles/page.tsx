'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import {
    Truck, Plus, Search, Edit2, LogOut, User, Bell,
    ChevronLeft, ChevronRight, X, Trash2, AlertTriangle,
    Gauge, Weight, LayoutDashboard,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    AVAILABLE: { label: 'Available', color: '#10B981', bg: '#10B98120' },
    ON_TRIP:   { label: 'On Trip',   color: '#00C2FF', bg: '#00C2FF20' },
    IN_SHOP:   { label: 'In Shop',   color: '#F59E0B', bg: '#F59E0B20' },
    RETIRED:   { label: 'Retired',   color: '#6B7280', bg: '#6B728020' },
};

const VEHICLE_TYPES = ['TRUCK', 'VAN', 'BIKE', 'OTHER'];
const TYPE_LABEL: Record<string, string> = { TRUCK: 'Truck', VAN: 'Van', BIKE: 'Bike', OTHER: 'Other' };

interface Vehicle {
    id: string;
    name: string;
    model: string | null;
    licensePlate: string;
    type: string;
    status: string;
    maxCapacityKg: number;
    odometerKm: number;
    createdAt: string;
    _count: { trips: number; maintenanceLogs: number };
}

interface FormData {
    name: string;
    model: string;
    licensePlate: string;
    type: string;
    maxCapacityKg: string;
    odometerKm: string;
}

const emptyForm: FormData = {
    name: '', model: '', licensePlate: '', type: 'VAN', maxCapacityKg: '', odometerKm: '0',
};

export default function VehiclesPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();

    // List state
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const LIMIT = 15;
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // OOS confirm dialog
    const [oosTarget, setOosTarget] = useState<Vehicle | null>(null);
    const [oosLoading, setOosLoading] = useState(false);

    // Alerts
    const [unreadAlerts, setUnreadAlerts] = useState(0);

    const headers = useCallback(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
    }), [accessToken]);

    const fetchVehicles = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(LIMIT),
                ...(search && { search }),
                ...(filterStatus && { status: filterStatus }),
                ...(filterType && { type: filterType }),
            });
            const res = await fetch(`${API}/vehicles?${params}`, { headers: headers() });
            const data = await res.json();
            setVehicles(data.vehicles ?? []);
            setTotal(data.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [accessToken, page, search, filterStatus, filterType, headers]);

    useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

    // Fetch unread alert count
    useEffect(() => {
        if (!accessToken) return;
        fetch(`${API}/alerts?unread=true`, { headers: headers() })
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setUnreadAlerts(d.total ?? 0))
            .catch(() => { });
    }, [accessToken, headers]);

    const handleLogout = async () => { await logout(); router.replace('/login'); };

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [search, filterStatus, filterType]);

    // --- Add / Edit ---
    const openAdd = () => { setForm(emptyForm); setFormError(''); setShowAddModal(true); };
    const openEdit = (v: Vehicle) => {
        setEditVehicle(v);
        setForm({
            name: v.name, model: v.model ?? '', licensePlate: v.licensePlate,
            type: v.type, maxCapacityKg: String(v.maxCapacityKg), odometerKm: String(v.odometerKm),
        });
        setFormError('');
    };
    const closeModal = () => { setShowAddModal(false); setEditVehicle(null); setForm(emptyForm); setFormError(''); };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!form.name || !form.licensePlate || !form.type || !form.maxCapacityKg) {
            setFormError('Name, license plate, type, and max capacity are required.');
            return;
        }
        setFormLoading(true);
        try {
            const body = {
                name: form.name,
                model: form.model || undefined,
                licensePlate: form.licensePlate,
                type: form.type,
                maxCapacityKg: Number(form.maxCapacityKg),
                odometerKm: Number(form.odometerKm) || 0,
            };
            const url = editVehicle ? `${API}/vehicles/${editVehicle.id}` : `${API}/vehicles`;
            const method = editVehicle ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) { setFormError(data.error || 'Something went wrong'); return; }
            closeModal();
            fetchVehicles();
        } catch {
            setFormError('Network error. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    // --- Out of Service / Retire ---
    const confirmOOS = async () => {
        if (!oosTarget) return;
        setOosLoading(true);
        try {
            await fetch(`${API}/vehicles/${oosTarget.id}`, {
                method: 'DELETE',
                headers: headers(),
            });
            setOosTarget(null);
            fetchVehicles();
        } catch (e) {
            console.error(e);
        } finally {
            setOosLoading(false);
        }
    };

    const canManage = user?.role === 'FLEET_MANAGER' || user?.role === 'SUPER_ADMIN';
    const totalPages = Math.ceil(total / LIMIT);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#060B16] text-white">

                {/* Navbar */}
                <nav className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#0A0F1E]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C2FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[#00C2FF]/20">
                                <Truck className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">FleetFlow</span>
                        </div>
                        {/* Nav links */}
                        <div className="hidden sm:flex items-center gap-1">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#8892A4] hover:text-white hover:bg-[#1E293B] transition-colors"
                            >
                                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20">
                                <Truck className="w-3.5 h-3.5" /> Vehicles
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="relative p-2 rounded-lg hover:bg-[#1E293B] transition-colors">
                            <Bell className="w-4 h-4 text-[#8892A4]" />
                            {unreadAlerts > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E293B] text-sm">
                            <User className="w-3.5 h-3.5 text-[#8892A4]" />
                            <span className="text-[#CBD5E1]">{user?.name}</span>
                            <span className="px-1.5 py-0.5 bg-[#00C2FF]/10 text-[#00C2FF] rounded text-xs font-medium border border-[#00C2FF]/20">
                                {user?.role?.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-sm text-[#8892A4] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1E293B]"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </nav>

                <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Vehicle Registry</h1>
                            <p className="text-[#8892A4] text-sm mt-0.5">
                                {total} vehicle{total !== 1 ? 's' : ''} registered
                            </p>
                        </div>
                        {canManage && (
                            <button
                                onClick={openAdd}
                                className="flex items-center gap-2 px-4 py-2 bg-[#00C2FF] text-[#060B16] font-semibold rounded-xl text-sm hover:bg-[#00B0E8] transition-colors shadow-lg shadow-[#00C2FF]/20"
                            >
                                <Plus className="w-4 h-4" /> Add Vehicle
                            </button>
                        )}
                    </div>

                    {/* Filter bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892A4]" />
                            <input
                                type="text"
                                placeholder="Search name or plate…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#00C2FF]/50 transition-colors"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="px-3 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-sm text-[#CBD5E1] focus:outline-none focus:border-[#00C2FF]/50 transition-colors cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="px-3 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-sm text-[#CBD5E1] focus:outline-none focus:border-[#00C2FF]/50 transition-colors cursor-pointer"
                        >
                            <option value="">All Types</option>
                            {VEHICLE_TYPES.map(t => (
                                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                            ))}
                        </select>
                        {(search || filterStatus || filterType) && (
                            <button
                                onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); }}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-[#8892A4] hover:text-white border border-[#1E293B] rounded-xl hover:border-[#2D3748] transition-colors"
                            >
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#1E293B] text-[#8892A4] text-xs uppercase tracking-wider">
                                        <th className="text-left px-5 py-3.5 font-medium">Vehicle</th>
                                        <th className="text-left px-4 py-3.5 font-medium">License Plate</th>
                                        <th className="text-left px-4 py-3.5 font-medium">Type</th>
                                        <th className="text-left px-4 py-3.5 font-medium">Status</th>
                                        <th className="text-left px-4 py-3.5 font-medium">Capacity</th>
                                        <th className="text-left px-4 py-3.5 font-medium">Odometer</th>
                                        <th className="text-left px-4 py-3.5 font-medium">Trips</th>
                                        <th className="text-left px-4 py-3.5 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="border-b border-[#1E293B] last:border-0">
                                                {[...Array(8)].map((_, j) => (
                                                    <td key={j} className="px-4 py-4">
                                                        <div className="h-4 bg-[#1E293B] rounded animate-pulse" style={{ width: j === 0 ? '80%' : '60%' }} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : vehicles.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-16 text-[#4B5563]">
                                                <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                <p>No vehicles found</p>
                                                {canManage && <p className="text-xs mt-1">Click &quot;Add Vehicle&quot; to get started</p>}
                                            </td>
                                        </tr>
                                    ) : vehicles.map(v => {
                                        const s = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.RETIRED;
                                        return (
                                            <tr
                                                key={v.id}
                                                className="border-b border-[#1E293B] last:border-0 hover:bg-[#0A0F1E]/60 transition-colors group"
                                            >
                                                <td className="px-5 py-4">
                                                    <button
                                                        onClick={() => router.push(`/vehicles/${v.id}`)}
                                                        className="text-left hover:text-[#00C2FF] transition-colors"
                                                    >
                                                        <p className="font-medium text-white group-hover:text-[#00C2FF] transition-colors">{v.name}</p>
                                                        {v.model && <p className="text-[#4B5563] text-xs mt-0.5">{v.model}</p>}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 font-mono text-[#CBD5E1] text-xs tracking-wide">{v.licensePlate}</td>
                                                <td className="px-4 py-4 text-[#8892A4]">{TYPE_LABEL[v.type] ?? v.type}</td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                                        style={{ color: s.color, backgroundColor: s.bg }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                                                        {s.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1 text-[#CBD5E1]">
                                                        <Weight className="w-3.5 h-3.5 text-[#4B5563]" />
                                                        {v.maxCapacityKg.toLocaleString()} kg
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1 text-[#CBD5E1]">
                                                        <Gauge className="w-3.5 h-3.5 text-[#4B5563]" />
                                                        {v.odometerKm.toLocaleString()} km
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-[#8892A4]">{v._count.trips}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => router.push(`/vehicles/${v.id}`)}
                                                            className="p-1.5 rounded-lg text-[#8892A4] hover:text-[#00C2FF] hover:bg-[#00C2FF]/10 transition-colors"
                                                            title="View details"
                                                        >
                                                            <Gauge className="w-3.5 h-3.5" />
                                                        </button>
                                                        {canManage && (
                                                            <>
                                                                <button
                                                                    onClick={() => openEdit(v)}
                                                                    className="p-1.5 rounded-lg text-[#8892A4] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
                                                                    title="Edit vehicle"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                {v.status !== 'RETIRED' && (
                                                                    <button
                                                                        onClick={() => setOosTarget(v)}
                                                                        className="p-1.5 rounded-lg text-[#8892A4] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                                        title="Retire vehicle"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="border-t border-[#1E293B] px-5 py-3.5 flex items-center justify-between text-sm text-[#8892A4]">
                                <span>{total} total vehicles</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-1.5 rounded-lg hover:bg-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="px-2">Page {page} of {totalPages}</span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-1.5 rounded-lg hover:bg-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Add / Edit Modal ── */}
            {(showAddModal || editVehicle) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E293B]">
                            <h2 className="text-lg font-semibold text-white">
                                {editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 rounded-lg text-[#8892A4] hover:text-white hover:bg-[#1E293B] transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="px-6 py-5 space-y-4">
                            {formError && (
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {formError}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">Vehicle Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Truck Alpha"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#00C2FF]/50 transition-colors"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">Model</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Tata 407"
                                        value={form.model}
                                        onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#00C2FF]/50 transition-colors"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">License Plate *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. MH01AB1234"
                                        value={form.licensePlate}
                                        onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value.toUpperCase() }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white placeholder-[#4B5563] font-mono focus:outline-none focus:border-[#00C2FF]/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">Type *</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white focus:outline-none focus:border-[#00C2FF]/50 transition-colors cursor-pointer"
                                    >
                                        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">Max Capacity (kg) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 5000"
                                        value={form.maxCapacityKg}
                                        onChange={e => setForm(f => ({ ...f, maxCapacityKg: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#00C2FF]/50 transition-colors"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">Starting Odometer (km)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={form.odometerKm}
                                        onChange={e => setForm(f => ({ ...f, odometerKm: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#00C2FF]/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 border border-[#1E293B] rounded-xl text-sm text-[#8892A4] hover:text-white hover:border-[#2D3748] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 py-2.5 bg-[#00C2FF] text-[#060B16] font-semibold rounded-xl text-sm hover:bg-[#00B0E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {formLoading ? 'Saving…' : editVehicle ? 'Save Changes' : 'Add Vehicle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Out of Service Confirm Dialog ── */}
            {oosTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Retire Vehicle?</h3>
                                <p className="text-[#8892A4] text-xs mt-0.5">This action cannot be undone easily.</p>
                            </div>
                        </div>
                        <p className="text-sm text-[#CBD5E1] mb-6">
                            <span className="font-medium text-white">{oosTarget.name}</span> ({oosTarget.licensePlate}) will be marked as{' '}
                            <span className="text-[#6B7280] font-medium">Retired</span> and removed from the active fleet pool.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setOosTarget(null)}
                                className="flex-1 py-2.5 border border-[#1E293B] rounded-xl text-sm text-[#8892A4] hover:text-white hover:border-[#2D3748] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmOOS}
                                disabled={oosLoading}
                                className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                                {oosLoading ? 'Retiring…' : 'Retire Vehicle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
}
