'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Truck, Plus, Search, Filter, MoreVertical, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Vehicle {
    id: string;
    name: string;
    licensePlate: string;
    type: string;
    status: string;
    maxCapacityKg: number;
    odometerKm: number;
    _count: { trips: number; maintenanceLogs: number };
}

export default function VehiclesPage() {
    const { accessToken, user, logout } = useAuth();
    const router = useRouter();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Add Vehicle Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ name: '', model: '', licensePlate: '', type: 'VAN', maxCapacityKg: 1000, odometerKm: 0 });

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const fetchVehicles = useCallback(async () => {
        if (!accessToken) return;
        try {
            const query = new URLSearchParams();
            if (search) query.append('search', search);
            if (statusFilter) query.append('status', statusFilter);

            const res = await fetch(`${API}/vehicles?${query}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const data = await res.json();
            setVehicles(data.vehicles || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [accessToken, search, statusFilter]);

    useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/vehicles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify(newVehicle),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setNewVehicle({ name: '', model: '', licensePlate: '', type: 'VAN', maxCapacityKg: 1000, odometerKm: 0 });
                fetchVehicles();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to add vehicle');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
            case 'ON_TRIP': return 'bg-[#00C2FF]/10 text-[#00C2FF] border-[#00C2FF]/20';
            case 'IN_SHOP': return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
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
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#00C2FF] to-[#0066FF] flex items-center justify-center">
                                <Truck className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">FleetFlow</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-1">
                            <Link href="/dashboard" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Dashboard</Link>
                            <Link href="/vehicles" className="px-3 py-1.5 text-sm text-white bg-[#1E293B] rounded-lg transition-colors">Vehicles</Link>
                            <Link href="/trips" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Trips</Link>
                            <Link href="/drivers" className="px-3 py-1.5 text-sm text-[#8892A4] hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors">Drivers</Link>
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

                <div className="max-w-7xl mx-auto px-6 py-8">

                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Vehicle Registry</h1>
                            <p className="text-[#8892A4] text-sm mt-0.5">Manage your fleet, track status, and view history.</p>
                        </div>

                        {user?.role === 'FLEET_MANAGER' || user?.role === 'SUPER_ADMIN' ? (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-linear-to-r from-[#00C2FF] to-[#0066FF] hover:from-[#00A8E0] hover:to-[#0052D9] text-white font-medium py-2 px-4 rounded-xl transition-all shadow-lg shadow-[#00C2FF]/20 flex items-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Vehicle
                            </button>
                        ) : null}
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                            <input
                                type="text"
                                placeholder="Search by name or license plate..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#111827] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#00C2FF] transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none bg-[#111827] border border-[#1E293B] rounded-xl pl-10 pr-8 py-2.5 text-white text-sm focus:outline-none focus:border-[#00C2FF] transition-all"
                            >
                                <option value="">All Statuses</option>
                                <option value="AVAILABLE">Available</option>
                                <option value="ON_TRIP">On Trip</option>
                                <option value="IN_SHOP">In Shop</option>
                                <option value="RETIRED">Retired</option>
                            </select>
                        </div>
                    </div>

                    {/* Vehicles Table */}
                    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#1E293B] bg-[#1A2235]/50">
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Vehicle</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">License Plate</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Odometer</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider">Capacity</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-[#8892A4] uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E293B]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-[#8892A4]">Loading vehicles...</td>
                                        </tr>
                                    ) : vehicles.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1E293B] mb-3">
                                                    <Truck className="w-5 h-5 text-[#4B5563]" />
                                                </div>
                                                <p className="text-[#CBD5E1] font-medium">No vehicles found</p>
                                                <p className="text-[#8892A4] text-sm mt-1">Try adjusting your filters or add a new vehicle.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        vehicles.map((v) => (
                                            <tr key={v.id} className="hover:bg-[#1E293B]/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-[#1E293B] flex items-center justify-center">
                                                            <Truck className="w-5 h-5 text-[#8892A4]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium text-sm">{v.name}</p>
                                                            <p className="text-[#8892A4] text-xs">{v.type}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-sm bg-[#1E293B] px-2 py-1 rounded text-[#CBD5E1] border border-[#2D3748]">
                                                        {v.licensePlate}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 flex items-center justify-center w-fit rounded-full text-xs font-medium border ${getStatusColor(v.status)}`}>
                                                        {v.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#CBD5E1]">
                                                    {v.odometerKm.toLocaleString()} km
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#CBD5E1]">
                                                    {v.maxCapacityKg.toLocaleString()} kg
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
                </div>

                {/* Add Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#1E293B] flex justify-between items-center bg-[#1A2235]/50">
                                <h3 className="text-lg font-semibold text-white">Add New Vehicle</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-[#8892A4] hover:text-white">&times;</button>
                            </div>
                            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[#8892A4] mb-1">Vehicle Name</label>
                                    <input required value={newVehicle.name} onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })} className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none" placeholder="e.g. Ford Transit 01" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">License Plate</label>
                                        <input required value={newVehicle.licensePlate} onChange={e => setNewVehicle({ ...newVehicle, licensePlate: e.target.value.toUpperCase() })} className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none font-mono tracking-wider" placeholder="ABC-1234" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">Vehicle Type</label>
                                        <select value={newVehicle.type} onChange={e => setNewVehicle({ ...newVehicle, type: e.target.value })} className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none">
                                            <option value="VAN">Van</option>
                                            <option value="TRUCK">Truck</option>
                                            <option value="BIKE">Bike</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">Capacity (kg)</label>
                                        <input type="number" required value={newVehicle.maxCapacityKg} onChange={e => setNewVehicle({ ...newVehicle, maxCapacityKg: Number(e.target.value) })} className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#8892A4] mb-1">Odometer (km)</label>
                                        <input type="number" value={newVehicle.odometerKm} onChange={e => setNewVehicle({ ...newVehicle, odometerKm: Number(e.target.value) })} className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none" />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-[#2D3748] text-white text-sm font-medium rounded-xl hover:bg-[#1E293B] transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 bg-linear-to-r from-[#00C2FF] to-[#0066FF] text-white text-sm font-medium rounded-xl hover:from-[#00A8E0] hover:to-[#0052D9] transition-all shadow-lg shadow-[#00C2FF]/20">Save Vehicle</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
