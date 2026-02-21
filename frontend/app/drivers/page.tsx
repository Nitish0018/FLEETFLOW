'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Truck, MapPin, Search, Filter, MoreVertical, Plus, User, LogOut, ShieldCheck, FileCheck2, FileWarning } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

type DriverStatus = 'OFF_DUTY' | 'ON_DUTY' | 'SUSPENDED';
type LicenseCategory = 'TRUCK' | 'VAN' | 'BIKE';

interface Driver {
    id: string;
    name: string;
    licenseNumber: string;
    licenseExpiry: string;
    licenseCategory: LicenseCategory;
    status: DriverStatus;
    medicalClearance: boolean;
    safetyScore: number;
    tripCompletionRate: number;
    createdAt: string;
}

export default function DriversPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        licenseNumber: '',
        licenseExpiry: '',
        licenseCategory: 'TRUCK',
        medicalClearance: false,
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchDrivers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (status) params.set('status', status);
            if (search) params.set('search', search);
            params.set('page', String(page));
            params.set('limit', '15');

            const res = await api.get(`/drivers?${params}`);
            setDrivers(res.data.drivers);
            setTotalPages(res.data.pages);
        } catch (err) {
            console.error(err);
            setError('Failed to load drivers');
        } finally {
            setLoading(false);
        }
    }, [status, search, page]);

    useEffect(() => {
        if (user) fetchDrivers();
    }, [user, fetchDrivers]);

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const openModal = () => {
        setFormData({
            name: '',
            licenseNumber: '',
            licenseExpiry: '',
            licenseCategory: 'TRUCK',
            medicalClearance: false,
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');

        try {
            await api.post('/drivers', {
                ...formData,
                medicalClearance: Boolean(formData.medicalClearance),
                // transform YYYY-MM-DD string into an ISO date ending
                licenseExpiry: formData.licenseExpiry ? new Date(formData.licenseExpiry).toISOString() : new Date().toISOString()
            });
            setShowModal(false);
            fetchDrivers();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setFormError(axiosErr.response?.data?.error || 'Failed to add driver');
        } finally {
            setSubmitting(false);
        }
    };

    const canCreate = user && ['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER'].includes(user.role);

    const getStatusColor = (status: DriverStatus) => {
        switch (status) {
            case 'ON_DUTY': return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
            case 'OFF_DUTY': return 'bg-[#6B7280]/10 text-[#9CA3AF] border-[#6B7280]/20';
            case 'SUSPENDED': return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';
            default: return 'bg-[#6B7280]/10 text-[#9CA3AF] border-[#6B7280]/20';
        }
    };

    const isLicenseExpiring = (dateStr: string) => {
        const expiry = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
        return diffDays < 30; // expiring in less than 30 days
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
                            <Link href="/drivers" className="px-3 py-1.5 text-sm text-white bg-[#1E293B] rounded-lg transition-colors">Drivers</Link>
                            <Link href="/maintenance" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Maintenance</Link>
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
                            <h1 className="text-2xl font-bold text-white">Drivers & Personnel</h1>
                            <p className="text-[#8892A4] text-sm mt-0.5">Manage operator profiles, licenses, and duty status.</p>
                        </div>
                        {canCreate && (
                            <button
                                onClick={openModal}
                                className="bg-gradient-to-r from-[#00C2FF] to-[#0066FF] hover:from-[#00A8E0] hover:to-[#0052D9] text-white font-medium py-2 px-4 rounded-xl transition-all shadow-lg shadow-[#00C2FF]/20 flex items-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Driver
                            </button>
                        )}
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                            <input
                                type="text"
                                placeholder="Search by name or license..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full bg-[#111827] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#00C2FF] transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                className="appearance-none bg-[#111827] border border-[#1E293B] rounded-xl pl-10 pr-8 py-2.5 text-white text-sm focus:outline-none focus:border-[#00C2FF] transition-all"
                            >
                                <option value="">All Statuses</option>
                                <option value="ON_DUTY">On Duty</option>
                                <option value="OFF_DUTY">Off Duty</option>
                                <option value="SUSPENDED">Suspended</option>
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
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Driver Info</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">License & Type</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Clearance</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E293B]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-[#8892A4]">Loading drivers...</td>
                                        </tr>
                                    ) : drivers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1E293B] mb-3">
                                                    <ShieldCheck className="w-5 h-5 text-[#4B5563]" />
                                                </div>
                                                <p className="text-[#CBD5E1] font-medium">No drivers found</p>
                                                <p className="text-[#8892A4] text-sm mt-1">Try adjusting your filters or add a new driver.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        drivers.map((driver) => (
                                            <tr key={driver.id} className="hover:bg-[#1E293B]/30 transition-colors cursor-pointer" onClick={() => router.push(`/drivers/${driver.id}`)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#00C2FF]/20 to-[#0066FF]/20 flex items-center justify-center shrink-0 border border-[#00C2FF]/30">
                                                            <User className="w-5 h-5 text-[#00C2FF]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium text-sm">{driver.name}</p>
                                                            <div className="flex items-center gap-1 text-[#8892A4] text-xs mt-0.5">
                                                                <span className="text-[#10B981]">Safety: {driver.safetyScore}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium font-mono text-[#CBD5E1]">{driver.licenseNumber}</p>
                                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                                        <span className="text-xs text-[#8892A4]">{driver.licenseCategory}</span>
                                                        {isLicenseExpiring(driver.licenseExpiry) ? (
                                                            <span className="text-xs font-medium text-[#F59E0B] flex items-center gap-1">
                                                                <FileWarning className="w-3 h-3" /> Expiring soon
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-[#8892A4]">Exp: {new Date(driver.licenseExpiry).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#CBD5E1]">
                                                    {driver.medicalClearance ? (
                                                        <span className="text-[#10B981] flex items-center gap-1"><FileCheck2 className="w-4 h-4" /> Cleared</span>
                                                    ) : (
                                                        <span className="text-[#EF4444] flex items-center gap-1"><FileWarning className="w-4 h-4" /> Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 flex items-center justify-center w-fit rounded-full text-xs font-medium border ${getStatusColor(driver.status)}`}>
                                                        {driver.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button className="text-[#8892A4] hover:text-white p-2 rounded-lg hover:bg-[#1E293B] transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
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

                {/* Create Driver Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-[#1E293B] flex justify-between items-center bg-[#1A2235]/50">
                                <h3 className="text-lg font-semibold text-white">Add New Driver</h3>
                                <button onClick={() => setShowModal(false)} className="text-[#8892A4] hover:text-white">&times;</button>
                            </div>

                            {formError && (
                                <div className="mx-6 mt-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-[#EF4444] text-sm">
                                    {formError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">License Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.licenseNumber}
                                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                            className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none"
                                            placeholder="e.g. D12345678"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">License Category</label>
                                        <select
                                            required
                                            value={formData.licenseCategory}
                                            onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value as LicenseCategory })}
                                            className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none appearance-none"
                                        >
                                            <option value="TRUCK">Class A - Truck</option>
                                            <option value="VAN">Class B - Van</option>
                                            <option value="BIKE">Class C - Bike/Motorcycle</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1">License Expiration Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.licenseExpiry}
                                        onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                                        className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            id="medicalClearance"
                                            checked={formData.medicalClearance}
                                            onChange={(e) => setFormData({ ...formData, medicalClearance: e.target.checked })}
                                            className="w-4 h-4 bg-[#1E293B] border-[#2D3748] rounded text-[#00C2FF] focus:ring-[#00C2FF] focus:ring-offset-[#111827] cursor-pointer"
                                        />
                                    </div>
                                    <label htmlFor="medicalClearance" className="text-sm text-white cursor-pointer select-none">
                                        Medical Clearance Verified
                                    </label>
                                </div>


                                <div className="pt-4 flex gap-3">
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
                                        className="flex-1 bg-gradient-to-r from-[#00C2FF] to-[#0066FF] text-white text-sm font-medium rounded-xl hover:from-[#00A8E0] hover:to-[#0052D9] transition-all shadow-lg shadow-[#00C2FF]/20 disabled:opacity-50"
                                    >
                                        {submitting ? 'Adding...' : 'Add Driver'}
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
