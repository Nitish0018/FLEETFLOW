'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/vehicles', label: 'Vehicles' },
  { href: '/trips', label: 'Trips' },
  { href: '/drivers', label: 'Drivers' },
  { href: '/maintenance', label: 'Maintenance' },
  { href: '/fuel', label: 'Fuel' },
  { href: '/expenses', label: 'Expenses' },
];

export function MainNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#0A0F1E]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#00C2FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[#00C2FF]/20">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">FleetFlow</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'text-white bg-[#1E293B]'
                    : 'text-[#8892A4] hover:text-white hover:bg-[#1E293B]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Alert bell */}
        <button className="relative p-2 rounded-lg hover:bg-[#1E293B] transition-colors">
          <Bell className="w-4 h-4 text-[#8892A4]" />
        </button>

        <Link
          href="/profile"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2D3748] text-sm border border-[#00C2FF]/20 shadow-[0_0_10px_rgba(0,194,255,0.1)] hover:bg-[#3A4A63] transition-colors"
        >
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
  );
}
