'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter, useParams } from 'next/navigation';
import {
    Truck, ArrowLeft, Edit2, AlertTriangle, Wrench, Fuel,
    MapPin, User, Bell, LogOut, X, CheckCircle, LayoutDashboard,
    Gauge, Weight, Calendar, Hash,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    AVAILABLE: { label: 'Available', color: '#10B981', bg: '#10B98120' },
    ON_TRIP:   { label: 'On Trip',   color: '#00C2FF', bg: '#00C2FF20' },
    IN_SHOP:   { label: 'In Shop',   color: '#F59E0B', bg: '#F59E0B20' },
    RETIRED:   { label: 'Retired',   color: '#6B7280', bg: '#6B728020' },
};

const TYPE_LABEL: Record<string, string> = { TRUCK: 'Truck', VAN: 'Van', BIKE: 'Bike', OTHER: 'Other' };
const VEHICLE_TYPES = ['TRUCK', 'VAN', 'BIKE', 'OTHER'];
const ALL_STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

interface MaintenanceLog {
    id: string;
    type: string;
    description: string;
    cost: number | null;
    date: string;
    status: string;
}

interface FuelLog {
    id: string;
    litres: number;
    cost: number;
    date: string;
}

interface Trip {
    id: string;
    origin: string;
    destination: string;
    status: string;
    createdAt: string;
    driver: { name: string } | null;
}

interface Vehicle {
    id: string;
    name: string;
    model: string | null;
    licensePlate: string;
    type: string;
    status: string;
    maxCapacityKg: number;
    odometerKm: number;
    companyId: string;
    createdAt: string;
    maintenanceLogs: MaintenanceLog[];
    fuelLogs: FuelLog[];
    trips: Trip[];
}

interface EditForm {
    name: string;
    model: string;
    licensePlate: string;
    type: string;
    maxCapacityKg: string;
    odometerKm: string;
}

export default function VehicleDetailPage() {
    const { user, accessToken, logout } = useAuth();
    const router = useRouter();
    const params = useParams();
    const vehicleId = params?.id as string;

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Edit modal
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState<EditForm>({ name: '', model: '', licensePlate: '', type: 'VAN', maxCapacityKg: '', odometerKm: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Status change
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);

    // OOS confirm
    const [showOOS, setShowOOS] = useState(false);
    const [oosLoading, setOosLoading] = useState(false);

    const [unreadAlerts, setUnreadAlerts] = useState(0);

    const headers = useCallback(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
    }), [accessToken]);

    const fetchVehicle = useCallback(async () => {
        if (!accessToken || !vehicleId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/vehicles/${vehicleId}`, { headers: headers() });
            if (res.status === 404) { setNotFound(true); return; }
            const data = await res.json();
            setVehicle(data);
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [accessToken, vehicleId, headers]);

    useEffect(() => { fetchVehicle(); }, [fetchVehicle]);

    useEffect(() => {
        if (!accessToken) return;
        fetch(`${API}/alerts?unread=true`, { headers: headers() })
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setUnreadAlerts(d.total ?? 0))
            .catch(() => { });
    }, [accessToken, headers]);

    const handleLogout = async () => { await logout(); router.replace('/login'); };

    const canManage = user?.role === 'FLEET_MANAGER' || user?.role === 'SUPER_ADMIN';

    // Edit
    const openEdit = () => {
        if (!vehicle) return;
        setEditForm({
            name: vehicle.name,
            model: vehicle.model ?? '',
            licensePlate: vehicle.licensePlate,
            type: vehicle.type,
            maxCapacityKg: String(vehicle.maxCapacityKg),
            odometerKm: String(vehicle.odometerKm),
        });
        setEditError('');
        setShowEdit(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError('');
        if (!editForm.name || !editForm.licensePlate || !editForm.maxCapacityKg) {
            setEditError('Name, license plate, and capacity are required.');
            return;
        }
        setEditLoading(true);
        try {
            const res = await fetch(`${API}/vehicles/${vehicleId}`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({
                    name: editForm.name,
                    model: editForm.model || undefined,
                    licensePlate: editForm.licensePlate,
                    type: editForm.type,
                    maxCapacityKg: Number(editForm.maxCapacityKg),
                    odometerKm: Number(editForm.odometerKm),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setEditError(data.error || 'Update failed'); return; }
            setShowEdit(false);
            fetchVehicle();
        } catch {
            setEditError('Network error. Please try again.');
        } finally {
            setEditLoading(false);
        }
    };

    // Status change
    const handleStatusChange = async () => {
        if (!newStatus) return;
        setStatusLoading(true);
        try {
            await fetch(`${API}/vehicles/${vehicleId}/status`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({ status: newStatus }),
            });
            setShowStatusModal(false);
            fetchVehicle();
        } catch { /* noop */ } finally {
            setStatusLoading(false);
        }
    };

    // OOS (retire)
    const handleOOS = async () => {
        setOosLoading(true);
        try {
            await fetch(`${API}/vehicles/${vehicleId}`, { method: 'DELETE', headers: headers() });
            router.push('/vehicles');
        } catch { /* noop */ } finally {
            setOosLoading(false);
        }
    };

    const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const tripStatusColor: Record<string, string> = { DRAFT: '#8892A4', DISPATCHED: '#00C2FF', COMPLETED: '#10B981', CANCELLED: '#EF4444' };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#060B16] text-white">

                {/* Navbar */}
                <nav className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#0A0F1E]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#00C2FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[#00C2FF]/20">
                                <Truck className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">FleetFlow</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#8892A4] hover:text-white hover:bg-[#1E293B] transition-colors"
                            >
                                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                            </button>
                            <button
                                onClick={() => router.push('/vehicles')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20"
                            >
                                <Truck className="w-3.5 h-3.5" /> Vehicles
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="relative p-2 rounded-lg hover:bg-[#1E293B] transition-colors">
                            <Bell className="w-4 h-4 text-[#8892A4]" />
                            {unreadAlerts > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E293B] text-sm">
                            <User className="w-3.5 h-3.5 text-[#8892A4]" />
                            <span className="text-[#CBD5E1]">{user?.name}</span>
                            <span className="px-1.5 py-0.5 bg-[#00C2FF]/10 text-[#00C2FF] rounded text-xs font-medium border border-[#00C2FF]/20">
                                {user?.role?.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-[#8892A4] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1E293B]">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </nav>

                <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

                    {/* Back */}
                    <button
                        onClick={() => router.push('/vehicles')}
                        className="flex items-center gap-2 text-sm text-[#8892A4] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Vehicles
                    </button>

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 animate-pulse h-32" />
                            ))}
                        </div>
                    ) : notFound || !vehicle ? (
                        <div className="text-center py-20 text-[#4B5563]">
                            <Truck className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="text-lg">Vehicle not found</p>
                            <button onClick={() => router.push('/vehicles')} className="mt-4 text-sm text-[#00C2FF] hover:underline">
                                Back to Vehicle Registry
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Vehicle header card */}
                            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#00C2FF]/20 to-[#0066FF]/20 border border-[#00C2FF]/20 flex items-center justify-center shrink-0">
                                            <Truck className="w-7 h-7 text-[#00C2FF]" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-white">{vehicle.name}</h1>
                                            {vehicle.model && <p className="text-[#8892A4] text-sm">{vehicle.model}</p>}
                                            <div className="flex items-center gap-3 mt-2">
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                        color: STATUS_CONFIG[vehicle.status]?.color,
                                                        backgroundColor: STATUS_CONFIG[vehicle.status]?.bg,
                                                    }}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CONFIG[vehicle.status]?.color }} />
                                                    {STATUS_CONFIG[vehicle.status]?.label}
                                                </span>
                                                <span className="font-mono text-xs text-[#8892A4] bg-[#0A0F1E] px-2 py-1 rounded-lg border border-[#1E293B]">
                                                    {vehicle.licensePlate}
                                                </span>
                                                <span className="text-xs text-[#4B5563]">{TYPE_LABEL[vehicle.type] ?? vehicle.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {canManage && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={openEdit}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-[#CBD5E1] rounded-xl text-sm hover:bg-[#2D3748] transition-colors"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            {vehicle.status !== 'ON_TRIP' && vehicle.status !== 'RETIRED' && (
                                                <button
                                                    onClick={() => { setNewStatus(''); setShowStatusModal(true); }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 rounded-xl text-sm hover:bg-[#F59E0B]/20 transition-colors"
                                                >
                                                    <Gauge className="w-3.5 h-3.5" /> Change Status
                                                </button>
                                            )}
                                            {vehicle.status !== 'RETIRED' && (
                                                <button
                                                    onClick={() => setShowOOS(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm hover:bg-red-500/20 transition-colors"
                                                >
                                                    <AlertTriangle className="w-3.5 h-3.5" /> Out of Service
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Specs grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#1E293B]">
                                    {[
                                        { icon: Weight, label: 'Max Capacity', value: `${vehicle.maxCapacityKg.toLocaleString()} kg` },
                                        { icon: Gauge, label: 'Odometer', value: `${vehicle.odometerKm.toLocaleString()} km` },
                                        { icon: Hash, label: 'Total Trips', value: vehicle.trips.length.toString() },
                                        { icon: Calendar, label: 'Added', value: fmt(vehicle.createdAt) },
                                    ].map(spec => (
                                        <div key={spec.label} className="bg-[#0A0F1E] rounded-xl p-4 border border-[#1E293B]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <spec.icon className="w-3.5 h-3.5 text-[#4B5563]" />
                                                <span className="text-xs text-[#4B5563]">{spec.label}</span>
                                            </div>
                                            <p className="text-white font-semibold">{spec.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Main content grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Maintenance Logs */}
                                <div className="lg:col-span-1 bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
                                    <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1E293B]">
                                        <Wrench className="w-4 h-4 text-[#F59E0B]" />
                                        <h2 className="text-sm font-semibold text-white">Maintenance History</h2>
                                        <span className="ml-auto text-xs text-[#4B5563]">{vehicle.maintenanceLogs.length} records</span>
                                    </div>
                                    <div className="divide-y divide-[#1E293B]">
                                        {vehicle.maintenanceLogs.length === 0 ? (
                                            <div className="py-10 text-center text-[#4B5563] text-sm">
                                                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                No maintenance logs
                                            </div>
                                        ) : vehicle.maintenanceLogs.map(log => (
                                            <div key={log.id} className="px-5 py-3.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white truncate">{log.description}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.type === 'URGENT' ? 'text-red-400 bg-red-400/10' : 'text-[#8892A4] bg-[#1E293B]'}`}>
                                                                {log.type}
                                                            </span>
                                                            <span className="text-xs text-[#4B5563]">{fmt(log.date)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        {log.cost != null && (
                                                            <p className="text-sm font-medium text-white">₹{log.cost.toLocaleString()}</p>
                                                        )}
                                                        <span className={`text-xs font-medium ${log.status === 'RESOLVED' ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                                                            {log.status === 'RESOLVED' ? '✓ Resolved' : '⦿ Open'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right column: Fuel logs + Trips */}
                                <div className="lg:col-span-2 space-y-6">

                                    {/* Fuel Logs */}
                                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
                                        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1E293B]">
                                            <Fuel className="w-4 h-4 text-[#F59E0B]" />
                                            <h2 className="text-sm font-semibold text-white">Fuel Logs</h2>
                                            <span className="ml-auto text-xs text-[#4B5563]">{vehicle.fuelLogs.length} entries</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            {vehicle.fuelLogs.length === 0 ? (
                                                <div className="py-10 text-center text-[#4B5563] text-sm">
                                                    <Fuel className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                    No fuel logs yet
                                                </div>
                                            ) : (
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-[#1E293B] text-[#4B5563] text-xs uppercase">
                                                            <th className="text-left px-5 py-3 font-medium">Date</th>
                                                            <th className="text-left px-4 py-3 font-medium">Litres</th>
                                                            <th className="text-left px-4 py-3 font-medium">Cost</th>
                                                            <th className="text-left px-4 py-3 font-medium">₹/L</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#1E293B]">
                                                        {vehicle.fuelLogs.map(log => (
                                                            <tr key={log.id} className="hover:bg-[#0A0F1E]/60 transition-colors">
                                                                <td className="px-5 py-3 text-[#8892A4]">{fmt(log.date)}</td>
                                                                <td className="px-4 py-3 text-white">{log.litres}L</td>
                                                                <td className="px-4 py-3 text-white">₹{log.cost.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-[#8892A4]">₹{(log.cost / log.litres).toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Trips */}
                                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
                                        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1E293B]">
                                            <MapPin className="w-4 h-4 text-[#00C2FF]" />
                                            <h2 className="text-sm font-semibold text-white">Recent Trips</h2>
                                            <span className="ml-auto text-xs text-[#4B5563]">{vehicle.trips.length} trips</span>
                                        </div>
                                        <div className="divide-y divide-[#1E293B]">
                                            {vehicle.trips.length === 0 ? (
                                                <div className="py-10 text-center text-[#4B5563] text-sm">
                                                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                    No trips recorded
                                                </div>
                                            ) : vehicle.trips.map(trip => (
                                                <div key={trip.id} className="px-5 py-3.5 flex items-center gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-white font-medium truncate">{trip.origin}</span>
                                                            <span className="text-[#4B5563] shrink-0">→</span>
                                                            <span className="text-white font-medium truncate">{trip.destination}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-[#4B5563]">
                                                            {trip.driver && (
                                                                <span className="flex items-center gap-1">
                                                                    <User className="w-3 h-3" /> {trip.driver.name}
                                                                </span>
                                                            )}
                                                            <span>{fmt(trip.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className="text-xs font-medium px-2 py-1 rounded-lg shrink-0"
                                                        style={{
                                                            color: tripStatusColor[trip.status] ?? '#8892A4',
                                                            backgroundColor: `${tripStatusColor[trip.status] ?? '#8892A4'}15`,
                                                        }}
                                                    >
                                                        {trip.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Edit Modal ── */}
            {showEdit && vehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E293B]">
                            <h2 className="text-lg font-semibold text-white">Edit Vehicle</h2>
                            <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg text-[#8892A4] hover:text-white hover:bg-[#1E293B] transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
                            {editError && (
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    <AlertTriangle className="w-4 h-4 shrink-0" /> {editError}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">Vehicle Name *</label>
                                    <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white focus:outline-none focus:border-[#00C2FF]/50 transition-colors" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">Model</label>
                                    <input type="text" value={editForm.model} onChange={e => setEditForm(f => ({ ...f, model: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white focus:outline-none focus:border-[#00C2FF]/50 transition-colors" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">License Plate *</label>
                                    <input type="text" value={editForm.licensePlate}
                                        onChange={e => setEditForm(f => ({ ...f, licensePlate: e.target.value.toUpperCase() }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#00C2FF]/50 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">Type</label>
                                    <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white focus:outline-none focus:border-[#00C2FF]/50 transition-colors cursor-pointer">
                                        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">Max Capacity (kg) *</label>
                                    <input type="number" min="1" value={editForm.maxCapacityKg}
                                        onChange={e => setEditForm(f => ({ ...f, maxCapacityKg: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white focus:outline-none focus:border-[#00C2FF]/50 transition-colors" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1.5">Odometer (km)</label>
                                    <input type="number" min="0" value={editForm.odometerKm}
                                        onChange={e => setEditForm(f => ({ ...f, odometerKm: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-sm text-white focus:outline-none focus:border-[#00C2FF]/50 transition-colors" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowEdit(false)}
                                    className="flex-1 py-2.5 border border-[#1E293B] rounded-xl text-sm text-[#8892A4] hover:text-white hover:border-[#2D3748] transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={editLoading}
                                    className="flex-1 py-2.5 bg-[#00C2FF] text-[#060B16] font-semibold rounded-xl text-sm hover:bg-[#00B0E8] disabled:opacity-50 transition-colors">
                                    {editLoading ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Change Status Modal ── */}
            {showStatusModal && vehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-semibold text-white">Change Vehicle Status</h3>
                            <button onClick={() => setShowStatusModal(false)} className="p-1.5 rounded-lg text-[#8892A4] hover:text-white hover:bg-[#1E293B]">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2 mb-5">
                            {ALL_STATUSES.filter(s => s !== vehicle.status && s !== 'ON_TRIP').map(s => {
                                const sc = STATUS_CONFIG[s];
                                return (
                                    <button
                                        key={s}
                                        onClick={() => setNewStatus(s)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${newStatus === s ? 'border-[#00C2FF]/50 bg-[#00C2FF]/5' : 'border-[#1E293B] hover:border-[#2D3748]'}`}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sc.color }} />
                                        <span className="text-sm text-white">{sc.label}</span>
                                        {newStatus === s && <CheckCircle className="w-4 h-4 ml-auto text-[#00C2FF]" />}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowStatusModal(false)}
                                className="flex-1 py-2.5 border border-[#1E293B] rounded-xl text-sm text-[#8892A4] hover:text-white hover:border-[#2D3748] transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleStatusChange} disabled={!newStatus || statusLoading}
                                className="flex-1 py-2.5 bg-[#00C2FF] text-[#060B16] font-semibold rounded-xl text-sm hover:bg-[#00B0E8] disabled:opacity-50 transition-colors">
                                {statusLoading ? 'Updating…' : 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── OOS Confirm Dialog ── */}
            {showOOS && vehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Retire Vehicle?</h3>
                                <p className="text-[#8892A4] text-xs mt-0.5">This will remove it from the active fleet.</p>
                            </div>
                        </div>
                        <p className="text-sm text-[#CBD5E1] mb-6">
                            <span className="font-medium text-white">{vehicle.name}</span> ({vehicle.licensePlate}) will be marked as{' '}
                            <span className="text-[#6B7280] font-medium">Retired</span>.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowOOS(false)}
                                className="flex-1 py-2.5 border border-[#1E293B] rounded-xl text-sm text-[#8892A4] hover:text-white hover:border-[#2D3748] transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleOOS} disabled={oosLoading}
                                className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 disabled:opacity-50 transition-colors">
                                {oosLoading ? 'Retiring…' : 'Retire Vehicle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
}
