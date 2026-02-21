'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ArrowLeft, User, ShieldCheck, FileCheck2, FileWarning, MapPin, Truck, AlertTriangle, Calendar, Award } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

type DriverStatus = 'OFF_DUTY' | 'ON_DUTY' | 'SUSPENDED';

interface Trip {
    id: string;
    origin: string;
    destination: string;
    status: string;
    distanceKm: number | null;
    createdAt: string;
    completedAt: string | null;
    vehicle: { name: string; licensePlate: string; };
}

interface Alert {
    id: string;
    type: string;
    message: string;
    createdAt: string;
}

interface Driver {
    id: string;
    name: string;
    licenseNumber: string;
    licenseExpiry: string;
    licenseCategory: string;
    insuranceDetails: string | null;
    status: DriverStatus;
    medicalClearance: boolean;
    safetyScore: number;
    tripCompletionRate: number;
    createdAt: string;
    trips: Trip[];
    alerts: Alert[];
}

export default function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const { accessToken, user } = useAuth();
    const router = useRouter();
    const [driver, setDriver] = useState<Driver | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    const fetchDriver = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/drivers/${id}`);
            setDriver(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch driver details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (accessToken) fetchDriver();
    }, [accessToken, fetchDriver]);

    const handleStatusChange = async (newStatus: DriverStatus) => {
        if (!confirm(`Are you sure you want to mark this driver as ${newStatus.replace('_', ' ')}?`)) return;

        try {
            setStatusUpdating(true);
            await api.put(`/drivers/${id}/status`, { status: newStatus });
            fetchDriver();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            alert(axiosErr.response?.data?.error || 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'ON_DUTY': return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
            case 'OFF_DUTY': return 'bg-[#6B7280]/10 text-[#9CA3AF] border-[#6B7280]/20';
            case 'SUSPENDED': return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';

            case 'COMPLETED': return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
            case 'DISPATCHED': return 'bg-[#00C2FF]/10 text-[#00C2FF] border-[#00C2FF]/20';
            case 'CANCELLED': return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';
            default: return 'bg-[#6B7280]/10 text-[#9CA3AF] border-[#6B7280]/20';
        }
    };

    const isLicenseExpiring = (dateStr: string) => {
        const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return diff < 30;
    };

    const canEdit = user && ['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER'].includes(user.role);

    if (loading) return <div className="min-h-screen bg-[#060B16] flex items-center justify-center text-white">Loading...</div>;
    if (error || !driver) return <div className="min-h-screen bg-[#060B16] flex items-center justify-center text-red-500">{error || 'Driver not found'}</div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#060B16] text-white">
                <nav className="sticky top-0 z-40 border-b border-[#1E293B] bg-[#0A0F1E]/90 backdrop-blur-md px-6 py-3.5 flex items-center">
                    <button onClick={() => router.push('/drivers')} className="flex items-center gap-2 text-[#8892A4] hover:text-white transition-colors text-sm font-medium mr-6">
                        <ArrowLeft className="w-4 h-4" /> Back to Drivers
                    </button>
                    <div className="flex items-center gap-3 border-l border-[#1E293B] pl-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C2FF] to-[#0066FF] flex items-center justify-center">
                            <Truck className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">FleetFlow</span>
                        <div className="hidden md:flex items-center gap-1 border-l border-[#1E293B] pl-6 h-8">
                            <Link href="/dashboard" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Dashboard</Link>
                            <Link href="/vehicles" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Vehicles</Link>
                            <Link href="/trips" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Trips</Link>
                            <Link href="/drivers" className="px-3 py-1.5 text-sm text-white bg-[#1E293B] rounded-lg transition-colors">Drivers</Link>
                            <Link href="/maintenance" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Maintenance</Link>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header Profile Card */}
                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00C2FF]/20 to-[#0066FF]/20 flex items-center justify-center border border-[#00C2FF]/30 shrink-0">
                                <User className="w-10 h-10 text-[#00C2FF]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">{driver.name}</h1>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-mono text-[#CBD5E1] bg-[#1E293B] px-2.5 py-1 rounded-lg text-sm border border-[#2D3748]">
                                        {driver.licenseNumber}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(driver.status)}`}>
                                        {driver.status.replace('_', ' ')}
                                    </span>
                                    {driver.medicalClearance ? (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full border border-[#10B981]/20">
                                            <FileCheck2 className="w-3.5 h-3.5" /> Medical Cleared
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-1 rounded-full border border-[#EF4444]/20">
                                            <FileWarning className="w-3.5 h-3.5" /> Missing Clearance
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {canEdit && (
                            <div className="flex bg-[#1E293B] rounded-xl p-1 border border-[#2D3748]">
                                <button
                                    onClick={() => handleStatusChange('OFF_DUTY')}
                                    disabled={statusUpdating || driver.status === 'OFF_DUTY'}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${driver.status === 'OFF_DUTY' ? 'bg-[#6B7280] text-white shadow-md' : 'text-[#8892A4] hover:text-white hover:bg-[#2D3748]'}`}
                                >
                                    Off Duty
                                </button>
                                <button
                                    onClick={() => handleStatusChange('ON_DUTY')}
                                    disabled={statusUpdating || driver.status === 'ON_DUTY'}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${driver.status === 'ON_DUTY' ? 'bg-[#10B981] text-white shadow-md' : 'text-[#8892A4] hover:text-white hover:bg-[#2D3748]'}`}
                                >
                                    On Duty
                                </button>
                                <button
                                    onClick={() => handleStatusChange('SUSPENDED')}
                                    disabled={statusUpdating || driver.status === 'SUSPENDED'}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${driver.status === 'SUSPENDED' ? 'bg-[#EF4444] text-white shadow-md' : 'text-[#8892A4] hover:text-white hover:bg-[#2D3748]'}`}
                                >
                                    Suspend
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Details & KPI */}
                        <div className="space-y-6">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
                                    <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center mb-3">
                                        <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                                    </div>
                                    <p className="text-[#8892A4] text-xs font-medium mb-1">Safety Score</p>
                                    <p className="text-2xl font-bold text-white">{driver.safetyScore}%</p>
                                </div>
                                <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
                                    <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center mb-3">
                                        <Award className="w-4 h-4 text-[#8B5CF6]" />
                                    </div>
                                    <p className="text-[#8892A4] text-xs font-medium mb-1">Trip Completion</p>
                                    <p className="text-2xl font-bold text-white">{(driver.tripCompletionRate * 100).toFixed(0)}%</p>
                                </div>
                            </div>

                            {/* Info Card */}
                            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    Credentials
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-[#8892A4] mb-1">License Class</p>
                                        <p className="text-sm font-medium text-[#CBD5E1] bg-[#1E293B] px-3 py-1.5 rounded-lg w-fit">
                                            Class {driver.licenseCategory}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#8892A4] mb-1">Expiration Date</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-white">{new Date(driver.licenseExpiry).toLocaleDateString()}</p>
                                            {isLicenseExpiring(driver.licenseExpiry) && (
                                                <span className="text-xs bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded flex items-center gap-1 border border-[#F59E0B]/30"><AlertTriangle className="w-3 h-3" /> Expiring Soon</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#8892A4] mb-1">Insurance / Bonding</p>
                                        <p className="text-sm text-white">{driver.insuranceDetails || 'None provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#8892A4] mb-1">Joined Date</p>
                                        <p className="text-sm text-white flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#8892A4]" /> {new Date(driver.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Activity */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Alerts Section (if any) */}
                            {driver.alerts && driver.alerts.length > 0 && (
                                <div className="bg-[#111827] border border-[#EF4444]/30 rounded-2xl overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#EF4444]"></div>
                                    <div className="px-6 py-4 border-b border-[#1E293B] flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                                        <h3 className="font-semibold text-white">Active Alerts</h3>
                                        <span className="ml-2 bg-[#EF4444] text-white text-xs font-bold px-2 py-0.5 rounded-full">{driver.alerts.length}</span>
                                    </div>
                                    <div className="divide-y divide-[#1E293B]">
                                        {driver.alerts.map(alert => (
                                            <div key={alert.id} className="px-6 py-3 bg-[#EF4444]/5 flex justify-between items-center">
                                                <div>
                                                    <p className="text-[#EF4444] text-sm font-medium">{alert.type}</p>
                                                    <p className="text-[#CBD5E1] text-xs mt-0.5">{alert.message}</p>
                                                </div>
                                                <span className="text-xs text-[#8892A4]">{new Date(alert.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Trips Table */}
                            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
                                <div className="px-6 py-5 border-b border-[#1E293B] flex justify-between items-center bg-[#1A2235]/50">
                                    <h3 className="text-lg font-semibold text-white">Recent Trips</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-[#1E293B] bg-[#111827]">
                                                <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Route</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Vehicle</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1E293B]">
                                            {driver.trips.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-[#8892A4]">
                                                        No trips assigned yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                driver.trips.map(trip => (
                                                    <tr key={trip.id} className="hover:bg-[#1E293B]/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-[#00C2FF] shrink-0" />
                                                                <div>
                                                                    <p className="text-white text-sm font-medium">{trip.origin} → {trip.destination}</p>
                                                                    {trip.distanceKm && <p className="text-[#8892A4] text-xs mt-0.5">{trip.distanceKm} km</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-[#CBD5E1]">
                                                            {trip.vehicle.name} <span className="text-xs text-[#8892A4]">({trip.vehicle.licensePlate})</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-[#8892A4]">
                                                            {new Date(trip.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(trip.status)}`}>
                                                                {trip.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
