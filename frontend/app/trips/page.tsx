'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
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

const statusColors: Record<TripStatus, string> = {
    DRAFT: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    DISPATCHED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export default function TripsPage() {
    const { user, loading: authLoading } = useAuth();
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
                api.get('/vehicles?status=AVAILABLE&limit=100'),
                api.get('/drivers?available=true&limit=100'),
            ]);
            setVehicles(vRes.data.vehicles);
            setDrivers(dRes.data.drivers);
        } catch {
            console.error('Failed to load form data');
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) fetchTrips();
    }, [authLoading, user, router, fetchTrips]);

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

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#00C2FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0F1E] text-white">
            {/* Nav */}
            <nav className="border-b border-white/10 bg-[#0A0F1E]/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <h1 className="text-xl font-bold bg-linear-to-r from-[#00C2FF] to-[#00FFA3] bg-clip-text text-transparent">
                            FleetFlow
                        </h1>
                        <div className="hidden md:flex gap-6 text-sm">
                            <a href="/dashboard" className="text-white/60 hover:text-white transition">Dashboard</a>
                            <a href="/vehicles" className="text-white/60 hover:text-white transition">Vehicles</a>
                            <a href="/trips" className="text-white font-semibold">Trips</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-white/60">{user?.name}</span>
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#00C2FF] to-[#00FFA3] flex items-center justify-center text-black font-bold text-sm">
                            {user?.name?.charAt(0)}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold">Trip Dispatcher</h2>
                        <p className="text-white/60 text-sm">Manage trips and shipments</p>
                    </div>
                    {canCreate && (
                        <button
                            onClick={openModal}
                            className="px-5 py-2.5 bg-linear-to-r from-[#00C2FF] to-[#00FFA3] text-black font-semibold rounded-lg hover:opacity-90 transition"
                        >
                            + New Trip
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search by origin or destination..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#00C2FF]/50 w-64"
                    />
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00C2FF]/50"
                    >
                        <option value="">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="DISPATCHED">Dispatched</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {error && <p className="text-red-400 mb-4">{error}</p>}

                {/* Table */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 text-white/60 text-sm">
                                <tr>
                                    <th className="px-4 py-3 text-left">Origin</th>
                                    <th className="px-4 py-3 text-left">Destination</th>
                                    <th className="px-4 py-3 text-left">Vehicle</th>
                                    <th className="px-4 py-3 text-left">Driver</th>
                                    <th className="px-4 py-3 text-left">Cargo (kg)</th>
                                    <th className="px-4 py-3 text-left">Created</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {trips.map((trip) => (
                                    <motion.tr
                                        key={trip.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-t border-white/5 hover:bg-white/5 transition cursor-pointer"
                                        onClick={() => router.push(`/trips/${trip.id}`)}
                                    >
                                        <td className="px-4 py-4 font-medium">{trip.origin}</td>
                                        <td className="px-4 py-4">{trip.destination}</td>
                                        <td className="px-4 py-4 text-sm">
                                            <span className="text-white">{trip.vehicle.name}</span>
                                            <span className="text-white/40 ml-2">{trip.vehicle.licensePlate}</span>
                                        </td>
                                        <td className="px-4 py-4">{trip.driver.name}</td>
                                        <td className="px-4 py-4">{trip.cargoWeightKg.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm text-white/60">
                                            {new Date(trip.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[trip.status]}`}>
                                                {trip.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button className="text-[#00C2FF] hover:underline text-sm">View</button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {trips.length === 0 && !loading && (
                        <div className="text-center py-12 text-white/40">
                            No trips found. Create your first trip!
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-30"
                        >
                            Prev
                        </button>
                        <span className="px-4 py-1 text-white/60">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-30"
                        >
                            Next
                        </button>
                    </div>
                )}
            </main>

            {/* Create Trip Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0F1629] border border-white/10 rounded-2xl p-6 w-full max-w-lg"
                        >
                            <h3 className="text-xl font-bold mb-6">Create New Trip</h3>

                            {formError && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                    {formError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">Origin</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.origin}
                                            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00C2FF]/50"
                                            placeholder="City or address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">Destination</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.destination}
                                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00C2FF]/50"
                                            placeholder="City or address"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">Vehicle</label>
                                        <select
                                            required
                                            value={formData.vehicleId}
                                            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00C2FF]/50"
                                        >
                                            <option value="">Select vehicle</option>
                                            {vehicles.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name} ({v.licensePlate}) – {v.maxCapacityKg}kg
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/60 mb-1">Driver</label>
                                        <select
                                            required
                                            value={formData.driverId}
                                            onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00C2FF]/50"
                                        >
                                            <option value="">Select driver</option>
                                            {drivers.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} ({d.licenseNumber})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Cargo Weight (kg)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.cargoWeightKg}
                                        onChange={(e) => setFormData({ ...formData, cargoWeightKg: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00C2FF]/50"
                                        placeholder="5000"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-5 py-2 bg-linear-to-r from-[#00C2FF] to-[#00FFA3] text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                                    >
                                        {submitting ? 'Creating...' : 'Create Trip'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
