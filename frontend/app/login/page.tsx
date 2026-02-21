'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Truck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            router.replace('/dashboard');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background glow effects */}
            <div className="absolute top-[-20%] left-[-10%] w-125 h-125 bg-[#00C2FF] opacity-[0.06] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-125 h-125 bg-[#00C2FF] opacity-[0.04] rounded-full blur-[120px] pointer-events-none" />

            {/* Grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#00C2FF 1px, transparent 1px), linear-gradient(90deg, #00C2FF 1px, transparent 1px)', backgroundSize: '60px 60px' }}
            />

            <div className="w-full max-w-md relative z-10">

                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-[#00C2FF] to-[#0066FF] mb-4 shadow-lg shadow-[#00C2FF]/20">
                        <Truck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">FleetFlow</h1>
                    <p className="text-[#8892A4] mt-1 text-sm">Fleet & Logistics Management</p>
                </div>

                {/* Card */}
                <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
                    <p className="text-[#8892A4] text-sm mb-7">Sign in to your account to continue</p>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    required
                                    className="w-full bg-[#1E293B] border border-[#2D3748] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#4B5563] text-sm focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-[#CBD5E1]">Password</label>
                                <button type="button" className="text-xs text-[#00C2FF] hover:text-white transition-colors">
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                                <input
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
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

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full bg-linear-to-r from-[#00C2FF] to-[#0066FF] hover:from-[#00A8E0] hover:to-[#0052D9] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-[#00C2FF]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>
                </div>

                {/* Role hint */}
                <div className="mt-6 bg-[#111827]/60 border border-[#1E293B] rounded-xl px-5 py-4">
                    <p className="text-[#4B5563] text-xs font-medium uppercase tracking-wider mb-3">Available Roles</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'].map(role => (
                            <span key={role} className="text-[#8892A4] flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]/60 shrink-0" />
                                {role}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-[#4B5563] text-xs">
                        Don&apos;t have an account?{' '}
                        <button
                            type="button"
                            onClick={() => router.push('/register')}
                            className="text-[#00C2FF] hover:text-white font-medium"
                        >
                            Create one
                        </button>
                    </p>
                </div>

                <p className="text-center text-[#4B5563] text-xs mt-4">
                    &ldquo;Moving smarter, one mile at a time.&rdquo;
                </p>
            </div>
        </main>
    );
}
