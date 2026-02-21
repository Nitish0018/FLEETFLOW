'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Truck, Mail, Lock, Eye, EyeOff, AlertCircle, Building2, User as UserIcon, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !companyId || !email || !password) {
            setError('All fields are required.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await register({ name, email, password, companyId });
            router.replace('/dashboard');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-125 h-125 bg-[#00C2FF] opacity-[0.06] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-125 h-125 bg-[#00C2FF] opacity-[0.04] rounded-full blur-[120px] pointer-events-none" />
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage:
                        'linear-gradient(#00C2FF 1px, transparent 1px), linear-gradient(90deg, #00C2FF 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="w-full max-w-md relative z-10">
                <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="mb-6 inline-flex items-center gap-2 text-xs text-[#8892A4] hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-3 h-3" /> Back to login
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-[#00C2FF] to-[#0066FF] mb-4 shadow-lg shadow-[#00C2FF]/20">
                        <Truck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
                    <p className="text-[#8892A4] mt-1 text-sm">Set up FleetFlow for your company</p>
                </div>

                <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Full name</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Alex Sharma"
                                        className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Company ID</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                                    <input
                                        type="text"
                                        value={companyId}
                                        onChange={e => setCompanyId(e.target.value)}
                                        placeholder="e.g. fleetflow-demo"
                                        className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] transition-all"
                                    />
                                </div>
                                <p className="mt-1 text-[11px] text-[#203e67]">
                                    Used to group users from the same organisation. You can use any slug (e.g. your company name).
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Work email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl pl-10 pr-10 py-3 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#00C2FF] transition-colors"
                                    >
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Confirm password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-linear-to-r from-[#00C2FF] to-[#0066FF] hover:from-[#00A8E0] hover:to-[#0052D9] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-[#00C2FF]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...
                                </>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[#4B5563] text-xs mt-6">
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="text-[#00C2FF] hover:text-white font-medium"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </main>
    );
}
