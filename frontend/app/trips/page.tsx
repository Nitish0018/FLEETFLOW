'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Truck, MapPin, Search, Filter, MoreVertical, Plus, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

interface Trip {
    id: string;
    origin: string;
    destination: string;
    status: TripStatus;
    cargoWeightKg: number;
    distanceKm: number | null;
    odometerStart: number;
    odometerEnd: number | null;
    createdAt: string;
    completedAt: string | null;
    vehicle: { id: string; name: string; licensePlate: string };
    driver: { id: string; name: string };
}

interface Vehicle {
    id: string;
    name: string;
    licensePlate: string;
    status: string;
    maxCapacityKg: number;
}

interface Driver {
    id: string;
    name: string;
    licenseNumber: string;
    status: string;
}

export default function TripsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        cargoWeightKg: '',
        vehicleId: '',
        driverId: '',
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchTrips = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (status) params.set('status', status);
            if (search) params.set('search', search);
            params.set('page', String(page));
            params.set('limit', '15');

            const res = await api.get(`/trips?${params}`);
            setTrips(res.data.trips);
            setTotalPages(res.data.pages);
        } catch (err) {
            console.error(err);
            setError('Failed to load trips');
        } finally {
            setLoading(false);
        }
    }, [status, search, page]);

    const fetchFormData = async () => {
        try {
            const [vRes, dRes] = await Promise.all([
                api.get('/vehicles?status=AVAILABLE&limit=100').catch(() => ({ data: { vehicles: [] } })),
                api.get('/drivers?available=true&limit=100').catch(() => ({ data: { drivers: [] } })),
            ]);
            setVehicles(vRes.data.vehicles || []);
            setDrivers(dRes.data.drivers || []);
        } catch {
            console.error('Failed to load form data');
        }
    };

    useEffect(() => {
        if (user) fetchTrips();
    }, [user, fetchTrips]);

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const openModal = async () => {
        await fetchFormData();
        setFormData({
            origin: '',
            destination: '',
            cargoWeightKg: '',
            vehicleId: '',
            driverId: '',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');

        try {
            await api.post('/trips', {
                ...formData,
                cargoWeightKg: Number(formData.cargoWeightKg),
            });
            setShowModal(false);
            fetchTrips();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setFormError(axiosErr.response?.data?.error || 'Failed to create trip');
        } finally {
            setSubmitting(false);
        }
    };

    const canCreate = user && ['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER'].includes(user.role);

    const getStatusColor = (status: TripStatus) => {
        switch (status) {
            case 'DRAFT': return 'bg-[#6B7280]/10 text-[#9CA3AF] border-[#6B7280]/20';
            case 'DISPATCHED': return 'bg-[#00C2FF]/10 text-[#00C2FF] border-[#00C2FF]/20';
            case 'COMPLETED': return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
            case 'CANCELLED': return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';
            default: return 'bg-[#6B7280]/10 text-[#9CA3AF] border-[#6B7280]/20';
        }
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
                            <Link href="/trips" className="px-3 py-1.5 text-sm text-white bg-[#1E293B] rounded-lg transition-colors">Trips</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2D3748] text-sm border border-[#00C2FF]/20 shadow-[0_0_10px_rgba(0,194,255,0.1)] hover:bg-[#3A4A63] transition-colors">
                            <User className="w-3.5 h-3.5 text-[#00C2FF]" />
                            <span className="text-white">{user?.name}</span>
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
                            <h1 className="text-2xl font-bold text-white">Trip Dispatcher</h1>
                            <p className="text-[#8892A4] text-sm mt-0.5">Manage trips, shipments, and assign drivers.</p>
                        </div>
                        {canCreate && (
                            <button
                                onClick={openModal}
                                className="bg-gradient-to-r from-[#00C2FF] to-[#0066FF] hover:from-[#00A8E0] hover:to-[#0052D9] text-white font-medium py-2 px-4 rounded-xl transition-all shadow-lg shadow-[#00C2FF]/20 flex items-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" /> New Trip
                            </button>
                        )}
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                            <input
                                type="text"
                                placeholder="Search by origin or destination..."
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
                                <option value="DRAFT">Draft</option>
                                <option value="DISPATCHED">Dispatched</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
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
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Route</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Vehicle & Driver</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Cargo</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E293B]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-[#8892A4]">Loading trips...</td>
                                        </tr>
                                    ) : trips.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1E293B] mb-3">
                                                    <MapPin className="w-5 h-5 text-[#4B5563]" />
                                                </div>
                                                <p className="text-[#CBD5E1] font-medium">No trips found</p>
                                                <p className="text-[#8892A4] text-sm mt-1">Try adjusting your filters or dispatch a new trip.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        trips.map((trip) => (
                                            <tr key={trip.id} className="hover:bg-[#1E293B]/30 transition-colors cursor-pointer" onClick={() => router.push(`/trips/${trip.id}`)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-[#1E293B] flex items-center justify-center shrink-0">
                                                            <MapPin className="w-5 h-5 text-[#8892A4]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium text-sm">{trip.origin}</p>
                                                            <div className="flex items-center gap-1 text-[#8892A4] text-xs mt-0.5">
                                                                <span className="w-1 h-1 rounded-full bg-[#4B5563]"></span>
                                                                <p className="truncate">{trip.destination}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-[#CBD5E1]">{trip.driver?.name || 'Unassigned'}</p>
                                                    <p className="text-xs text-[#8892A4] mt-0.5 font-mono">{trip.vehicle?.licensePlate || 'No Vehicle'}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#CBD5E1]">
                                                    {trip.cargoWeightKg.toLocaleString()} kg
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 flex items-center justify-center w-fit rounded-full text-xs font-medium border ${getStatusColor(trip.status)}`}>
                                                        {trip.status}
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

                {/* Create Trip Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-[#1E293B] flex justify-between items-center bg-[#1A2235]/50">
                                <h3 className="text-lg font-semibold text-white">Dispatch New Trip</h3>
                                <button onClick={() => setShowModal(false)} className="text-[#8892A4] hover:text-white">&times;</button>
                            </div>

                            {formError && (
                                <div className="mx-6 mt-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-[#EF4444] text-sm">
                                    {formError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">Origin Address</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.origin}
                                            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                            className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none"
                                            placeholder="e.g. Warehouse A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">Destination Address</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.destination}
                                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                            className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none"
                                            placeholder="e.g. Retail Store B"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">Assign Vehicle</label>
                                        <select
                                            required
                                            value={formData.vehicleId}
                                            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                                            className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none appearance-none"
                                        >
                                            <option value="">Select vehicle</option>
                                            {vehicles.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.licensePlate} • {v.maxCapacityKg}kg cap.
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">Assign Driver</label>
                                        <select
                                            required
                                            value={formData.driverId}
                                            onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                                            className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none appearance-none"
                                        >
                                            <option value="">Select driver</option>
                                            {drivers.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1">Total Cargo Weight (kg)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.cargoWeightKg}
                                        onChange={(e) => setFormData({ ...formData, cargoWeightKg: e.target.value })}
                                        className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none"
                                        placeholder="e.g. 5000"
                                    />
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
                                        {submitting ? 'Dispatching...' : 'Dispatch Trip'}
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
