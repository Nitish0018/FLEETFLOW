'use client';

import { useState, useEffect, use } from 'react';
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
    odometerStart: number;
    odometerEnd: number | null;
    distanceKm: number | null;
    fuelConsumed: number | null;
    createdAt: string;
    completedAt: string | null;
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
        type: string;
        maxCapacityKg: number;
        odometerKm: number;
    };
    driver: {
        id: string;
        name: string;
        licenseNumber: string;
        licenseCategory: string;
    };
}

const statusColors: Record<TripStatus, string> = {
    DRAFT: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    DISPATCHED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Complete modal
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [odometerEnd, setOdometerEnd] = useState('');
    const [fuelConsumed, setFuelConsumed] = useState('');
    const [completing, setCompleting] = useState(false);
    const [completeError, setCompleteError] = useState('');

    // Cancel modal
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // Start
    const [starting, setStarting] = useState(false);

    const fetchTrip = async () => {
        try {
            const res = await api.get(`/trips/${id}`);
            setTrip(res.data);
        } catch {
            setError('Failed to load trip');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) fetchTrip();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user, router, id]);

    const canManage = user && ['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER'].includes(user.role);

    const handleDispatch = async () => {
        setStarting(true);
        try {
            await api.put(`/trips/${id}/dispatch`);
            fetchTrip();
        } catch {
            setError('Failed to dispatch trip');
        } finally {
            setStarting(false);
        }
    };

    const handleComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        setCompleting(true);
        setCompleteError('');

        try {
            await api.put(`/trips/${id}/complete`, {
                odometerEnd: Number(odometerEnd),
                fuelConsumed: fuelConsumed ? Number(fuelConsumed) : null,
            });
            setShowCompleteModal(false);
            fetchTrip();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setCompleteError(axiosErr.response?.data?.error || 'Failed to complete trip');
        } finally {
            setCompleting(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await api.put(`/trips/${id}/cancel`);
            setShowCancelModal(false);
            fetchTrip();
        } catch {
            setError('Failed to cancel trip');
        } finally {
            setCancelling(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#00C2FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white">
                <p className="text-red-400">{error || 'Trip not found'}</p>
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
                {/* Back + Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/trips')}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">{trip.origin} → {trip.destination}</h2>
                        <p className="text-white/60 text-sm">
                            Created {new Date(trip.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${statusColors[trip.status]}`}>
                        {trip.status}
                    </span>
                </div>

                {error && <p className="text-red-400 mb-4">{error}</p>}

                {/* Action Buttons */}
                {canManage && (
                    <div className="flex gap-3 mb-8">
                        {trip.status === 'DRAFT' && (
                            <>
                                <button
                                    onClick={handleDispatch}
                                    disabled={starting}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                                >
                                    {starting ? 'Dispatching...' : '▶ Dispatch Trip'}
                                </button>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-5 py-2.5 bg-red-600/20 border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-600/30 transition"
                                >
                                    ✕ Cancel Trip
                                </button>
                            </>
                        )}
                        {trip.status === 'DISPATCHED' && (
                            <>
                                <button
                                    onClick={() => setShowCompleteModal(true)}
                                    className="px-5 py-2.5 bg-linear-to-r from-[#00C2FF] to-[#00FFA3] text-black font-semibold rounded-lg hover:opacity-90 transition"
                                >
                                    ✓ Complete Trip
                                </button>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-5 py-2.5 bg-red-600/20 border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-600/30 transition"
                                >
                                    ✕ Cancel Trip
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Info Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Trip Details */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-white/80">Trip Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/40">Origin</span>
                                <span>{trip.origin}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Destination</span>
                                <span>{trip.destination}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Cargo Weight</span>
                                <span>{trip.cargoWeightKg.toLocaleString()} kg</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Distance</span>
                                <span>{trip.distanceKm ? `${trip.distanceKm.toLocaleString()} km` : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Odometer Start</span>
                                <span>{trip.odometerStart.toLocaleString()} km</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Odometer End</span>
                                <span>{trip.odometerEnd ? `${trip.odometerEnd.toLocaleString()} km` : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Fuel Consumed</span>
                                <span>{trip.fuelConsumed ? `${trip.fuelConsumed} L` : '—'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-white/80">Timeline</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/40">Created At</span>
                                <span>{new Date(trip.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Completed At</span>
                                <span>{trip.completedAt ? new Date(trip.completedAt).toLocaleString() : '—'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-white/80">Vehicle</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/40">Name</span>
                                <a href={`/vehicles/${trip.vehicle.id}`} className="text-[#00C2FF] hover:underline">
                                    {trip.vehicle.name}
                                </a>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Plate</span>
                                <span>{trip.vehicle.licensePlate}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Type</span>
                                <span>{trip.vehicle.type.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Capacity</span>
                                <span>{trip.vehicle.maxCapacityKg.toLocaleString()} kg</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Odometer</span>
                                <span>{trip.vehicle.odometerKm.toLocaleString()} km</span>
                            </div>
                        </div>
                    </div>

                    {/* Driver Info */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-white/80">Driver</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/40">Name</span>
                                <span>{trip.driver.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">License #</span>
                                <span>{trip.driver.licenseNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Category</span>
                                <span>{trip.driver.licenseCategory}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Complete Trip Modal */}
            <AnimatePresence>
                {showCompleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCompleteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0F1629] border border-white/10 rounded-2xl p-6 w-full max-w-md"
                        >
                            <h3 className="text-xl font-bold mb-4">Complete Trip</h3>
                            <p className="text-white/60 text-sm mb-6">
                                Enter the final odometer reading to mark this trip as completed.
                            </p>

                            {completeError && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                    {completeError}
                                </div>
                            )}

                            <form onSubmit={handleComplete} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">
                                        End Odometer (km) – start: {trip.odometerStart.toLocaleString()}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={trip.odometerStart}
                                        value={odometerEnd}
                                        onChange={(e) => setOdometerEnd(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00C2FF]/50"
                                        placeholder={`${trip.odometerStart + 100}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Fuel Consumed (L) – optional</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={fuelConsumed}
                                        onChange={(e) => setFuelConsumed(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00C2FF]/50"
                                        placeholder="e.g., 45.5"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCompleteModal(false)}
                                        className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={completing}
                                        className="px-5 py-2 bg-linear-to-r from-[#00C2FF] to-[#00FFA3] text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                                    >
                                        {completing ? 'Completing...' : 'Complete Trip'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cancel Trip Modal */}
            <AnimatePresence>
                {showCancelModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCancelModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0F1629] border border-white/10 rounded-2xl p-6 w-full max-w-md"
                        >
                            <h3 className="text-xl font-bold mb-4 text-red-400">Cancel Trip</h3>
                            <p className="text-white/60 mb-6">
                                Are you sure you want to cancel this trip? The vehicle and driver will be restored to their available status.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                                >
                                    Keep Trip
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {cancelling ? 'Cancelling...' : 'Cancel Trip'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
