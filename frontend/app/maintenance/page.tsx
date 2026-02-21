'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Wrench, CheckCircle2, Clock, Truck, Plus, Search, Filter, AlertTriangle, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

type MaintenanceType = 'SCHEDULED' | 'URGENT';
type MaintenanceStatus = 'OPEN' | 'RESOLVED';

interface Vehicle {
    id: string;
    name: string;
    licensePlate: string;
    status: string;
}

interface MaintenanceLog {
    id: string;
    vehicleId: string;
    type: MaintenanceType;
    description: string;
    cost: number | null;
    date: string;
    status: MaintenanceStatus;
    vehicle?: {
        name: string;
        licensePlate: string;
    };
}

export default function MaintenancePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [status, setStatus] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        vehicleId: '',
        type: 'SCHEDULED' as MaintenanceType,
        description: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (status) params.set('status', status);
            params.set('page', String(page));
            params.set('limit', '15');

            const res = await api.get(`/maintenance?${params}`);
            setLogs(res.data.logs);
            setTotalPages(res.data.pages);
        } catch (err) {
            console.error(err);
            setError('Failed to load maintenance logs');
        } finally {
            setLoading(false);
        }
    }, [status, page]);

    const fetchVehicles = useCallback(async () => {
        try {
            // Need available or in_shop vehicles? We probably just want all active vehicles to log maintenance 
            const res = await api.get('/vehicles?limit=100');
            setVehicles(res.data.vehicles);
        } catch (err) {
            console.error('Failed to load vehicles for select', err);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchLogs();
            fetchVehicles();
        }
    }, [user, fetchLogs, fetchVehicles]);

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const openModal = () => {
        setFormData({
            vehicleId: '',
            type: 'SCHEDULED',
            description: '',
            cost: '',
            date: new Date().toISOString().split('T')[0],
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');

        try {
            await api.post('/maintenance', {
                ...formData,
                cost: formData.cost ? Number(formData.cost) : null,
                date: new Date(formData.date).toISOString()
            });
            setShowModal(false);
            fetchLogs();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setFormError(axiosErr.response?.data?.error || 'Failed to add log');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async (id: string) => {
        if (!confirm('Mark this maintenance issue as resolved and return vehicle to Available?')) return;
        try {
            await api.put(`/maintenance/${id}/resolve`);
            fetchLogs();
        } catch (err) {
            console.error(err);
            alert('Failed to resolve maintenance log');
        }
    };

    const canCreate = user && ['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER'].includes(user.role);

    const getStatusTypeColor = (type: MaintenanceType) => {
        return type === 'URGENT'
            ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
            : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
    };

    const getStatusColor = (status: MaintenanceStatus) => {
        return status === 'RESOLVED'
            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
            : 'bg-[#00C2FF]/10 text-[#00C2FF] border-[#00C2FF]/20';
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#060B16] text-white">
                {/* Navigation */}
                <nav className="sticky top-0 z-40 border-b border-[#1E293B] bg-[#0A0F1E]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C2FF] to-[#0066FF] flex items-center justify-center">
                                <Truck className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">FleetFlow</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-1">
                            <Link href="/dashboard" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Dashboard</Link>
                            <Link href="/vehicles" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Vehicles</Link>
                            <Link href="/trips" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Trips</Link>
                            <Link href="/drivers" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Drivers</Link>
                            <Link href="/maintenance" className="px-3 py-1.5 text-sm text-white bg-[#1E293B] rounded-lg transition-colors">Maintenance</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
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

                <main className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Maintenance Logs</h1>
                            <p className="text-[#8892A4] text-sm mt-0.5">Track vehicle service history and shop status.</p>
                        </div>
                        {canCreate && (
                            <button
                                onClick={openModal}
                                className="bg-gradient-to-r from-[#00C2FF] to-[#0066FF] hover:from-[#00A8E0] hover:to-[#0052D9] text-white font-medium py-2 px-4 rounded-xl transition-all shadow-lg shadow-[#00C2FF]/20 flex items-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" /> Log Service
                            </button>
                        )}
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                className="appearance-none bg-[#111827] border border-[#1E293B] rounded-xl pl-10 pr-8 py-2.5 text-white text-sm focus:outline-none focus:border-[#00C2FF] transition-all"
                            >
                                <option value="">All Statuses</option>
                                <option value="OPEN">Open (In Shop)</option>
                                <option value="RESOLVED">Resolved</option>
                            </select>
                        </div>
                    </div>

                    {error && <p className="text-[#EF4444] mb-4 text-sm font-medium">{error}</p>}

                    {/* Table */}
                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#1E293B] bg-[#1A2235]/50">
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Date & Vehicle</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Description & Cost</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E293B]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-[#8892A4]">Loading maintenance logs...</td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1E293B] mb-3">
                                                    <Wrench className="w-5 h-5 text-[#4B5563]" />
                                                </div>
                                                <p className="text-[#CBD5E1] font-medium">No service logs found</p>
                                                <p className="text-[#8892A4] text-sm mt-1">Record a maintenance event to see it here.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-[#1E293B]/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[#1E293B] border border-[#2D3748] flex items-center justify-center shrink-0">
                                                            <Wrench className="w-4 h-4 text-[#8892A4]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium text-sm">{log.vehicle?.name}</p>
                                                            <div className="flex items-center gap-1.5 text-[#8892A4] text-xs mt-0.5">
                                                                <span className="font-mono">{log.vehicle?.licensePlate}</span>
                                                                <span>&bull;</span>
                                                                <span>{new Date(log.date).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 flex items-center gap-1 w-fit rounded-full text-xs font-medium border ${getStatusTypeColor(log.type)}`}>
                                                        {log.type === 'URGENT' ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-[#CBD5E1] line-clamp-2 max-w-sm">{log.description}</p>
                                                    {log.cost !== null && (
                                                        <p className="text-xs font-medium text-[#10B981] mt-1">₹{log.cost.toLocaleString()}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex w-fit rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {log.status === 'OPEN' && canCreate && (
                                                        <button
                                                            onClick={() => handleResolve(log.id)}
                                                            className="flex items-center gap-1.5 ml-auto text-xs font-medium text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 px-3 py-1.5 rounded-lg transition-colors border border-[#10B981]/20"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 bg-[#111827] border border-[#1E293B] text-sm text-[#8892A4] rounded hover:bg-[#1E293B] hover:text-white transition disabled:opacity-30"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-1 text-[#8892A4] text-sm flex items-center">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 bg-[#111827] border border-[#1E293B] text-sm text-[#8892A4] rounded hover:bg-[#1E293B] hover:text-white transition disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </main>

                {/* Create Maintenance Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-[#1E293B] flex justify-between items-center bg-[#1A2235]/50">
                                <h3 className="text-lg font-semibold text-white">Log Service Event</h3>
                                <button onClick={() => setShowModal(false)} className="text-[#8892A4] hover:text-white">&times;</button>
                            </div>

                            {formError && (
                                <div className="mx-6 mt-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-[#EF4444] text-sm">
                                    {formError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1">Vehicle</label>
                                    <select
                                        required
                                        value={formData.vehicleId}
                                        onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                                        className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none appearance-none"
                                    >
                                        <option value="">Select a vehicle...</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.name} ({v.licensePlate})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">Service Type</label>
                                        <select
                                            required
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as MaintenanceType })}
                                            className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none appearance-none"
                                        >
                                            <option value="SCHEDULED">Scheduled / Routine</option>
                                            <option value="URGENT">Urgent / Breakdown</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">Date Logged</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1">Estimated/Actual Cost (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                        className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none"
                                        placeholder="Optional"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1">Issue Description</label>
                                    <textarea
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none resize-none h-24"
                                        placeholder="Describe the issue and parts needed..."
                                    />
                                    <p className="text-xs text-[#6B7280] mt-1.5">Note: Saving this instantly marks the vehicle as "In Shop" and removes it from the dispatcher pool.</p>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 border border-[#2D3748] text-white text-sm font-medium rounded-xl hover:bg-[#1E293B] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-gradient-to-r from-[#00C2FF] to-[#0066FF] text-white text-sm font-medium rounded-xl hover:from-[#00A8E0] hover:to-[#0052D9] transition-all shadow-lg shadow-[#00C2FF]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Wrench className="w-4 h-4" /> {submitting ? 'Logging...' : 'Log Service'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
