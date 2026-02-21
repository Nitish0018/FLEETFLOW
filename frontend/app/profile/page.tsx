'use client';

import { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Truck, User, LogOut, Mail, Briefcase, ShieldCheck, MapPin, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, updateProfile, logout } = useAuth();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) setEditName(user.name);
    }, [user]);

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await updateProfile({ name: editName });
            setIsEditing(false);
        } catch (e) {
            console.error('Failed to update profile', e);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
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

                <div className="max-w-4xl mx-auto px-6 py-12">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Your Profile</h1>
                            <p className="text-[#8892A4] text-sm mt-0.5">Manage your personal information and account settings.</p>
                        </div>
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="bg-[#1E293B] hover:bg-[#2D3748] text-white font-medium py-2 px-4 rounded-xl transition-colors border border-[#2D3748] flex items-center gap-2 text-sm">
                                <Edit3 className="w-4 h-4" /> Edit Profile
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button onClick={() => { setIsEditing(false); setEditName(user?.name || ''); }} className="px-4 py-2 border border-[#2D3748] text-white text-sm font-medium rounded-xl hover:bg-[#1E293B] transition-colors">
                                    Cancel
                                </button>
                                <button disabled={loading} onClick={handleSave} className="bg-gradient-to-r from-[#00C2FF] to-[#0066FF] text-white text-sm font-medium py-2 px-4 rounded-xl hover:from-[#00A8E0] hover:to-[#0052D9] transition-all shadow-lg shadow-[#00C2FF]/20 flex items-center gap-2">
                                    {loading ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Left Column: Avatar & Basic Info */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 text-center flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00C2FF]/20 to-[#0066FF]/20 border-[3px] border-[#00C2FF]/40 flex items-center justify-center mb-4 relative shadow-lg shadow-[#00C2FF]/10">
                                    <User className="w-16 h-16 text-[#00C2FF]" />
                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#10B981] border-2 border-[#111827] rounded-full"></div>
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
                                <span className="px-2.5 py-1 bg-[#00C2FF]/10 text-[#00C2FF] rounded-full text-xs font-semibold border border-[#00C2FF]/20 uppercase tracking-wider mb-4">
                                    {user?.role?.replace(/_/g, ' ')}
                                </span>
                                <p className="text-[#8892A4] text-xs">Active Since {new Date().getFullYear()}</p>
                            </div>

                            {/* Quick Contact Info */}
                            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Contact Info</h3>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center text-[#8892A4]">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[#4B5563] text-xs">Email Address</p>
                                        <p className="text-[#CBD5E1] truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center text-[#8892A4]">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[#4B5563] text-xs">Location</p>
                                        <p className="text-[#CBD5E1] truncate">HQ Office</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Roles & Settings */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-5">Account Details</h3>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4 border-b border-[#1E293B] pb-5">
                                        <div>
                                            <label className="text-xs text-[#8892A4] font-medium uppercase tracking-wider mb-1 block">Full Name</label>
                                            {isEditing ? (
                                                <input
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl px-3 py-2 text-white text-sm focus:border-[#00C2FF] outline-none"
                                                    autoFocus
                                                />
                                            ) : (
                                                <p className="text-white text-sm">{user?.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-[#8892A4] font-medium uppercase tracking-wider mb-1 block">Role</label>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <ShieldCheck className="w-4 h-4 text-[#00C2FF]" />
                                                <p className="text-white text-sm font-medium">{user?.role?.replace(/_/g, ' ')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-b border-[#1E293B] pb-5">
                                        <div>
                                            <label className="text-xs text-[#8892A4] font-medium uppercase tracking-wider mb-1 block">Company ID</label>
                                            <div className="flex items-center gap-1.5">
                                                <Briefcase className="w-4 h-4 text-[#8B5CF6]" />
                                                <p className="text-white text-sm font-mono bg-[#1E293B] px-1.5 rounded">{user?.companyId || 'company-1'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[#8892A4] font-medium uppercase tracking-wider mb-1 block">Account ID</label>
                                            <p className="text-[#CBD5E1] text-sm font-mono">{user?.id}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="text-xs text-[#8892A4] font-medium uppercase tracking-wider mb-2 block">System Permissions</label>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2.5 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-md text-xs">Vehicle Management</span>
                                            <span className="px-2.5 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-md text-xs">Driver Assignment</span>
                                            <span className="px-2.5 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-md text-xs">Trip Dispatching</span>
                                            <span className="px-2.5 py-1 bg-[#1E293B] text-[#8892A4] border border-[#2D3748] rounded-md text-xs">Billing & Invoices</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Box */}
                            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-2">Security & Preferences</h3>
                                <p className="text-sm text-[#8892A4] mb-5">Update your password to keep your account secure.</p>
                                <button className="bg-[#1E293B] hover:bg-[#2D3748] text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors border border-[#2D3748]">
                                    Change Password
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
