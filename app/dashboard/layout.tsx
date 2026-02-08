
"use client";
import { apiUrl, assetUrl } from "@/lib/paths";
import { getPath } from "@/lib/navigation";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
    role: string;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // Basic accessibility setup
        document.addEventListener('contextmenu', (e) => { }, true);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
                return true;
            }
        }, true);
        document.body.style.pointerEvents = 'auto';
        document.body.style.userSelect = 'auto';

        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await fetch(apiUrl('/api/auth/me'));
            if (!response.ok) {
                router.push(getPath('/'));
                return;
            }
            const data = await response.json();
            if (data.success) {
                setUser(data.user);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            router.push(getPath('/'));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Clear localStorage data from Guru session
            localStorage.removeItem('activeLabId');
            localStorage.removeItem('activeLabName');
            localStorage.removeItem('scheduledEndTime');

            const response = await fetch(apiUrl('/api/auth/logout'), {
                method: 'POST',
                credentials: 'include'
            });
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            if (response.ok) {
                router.push(getPath('/'));
                router.refresh();
            } else {
                router.push(getPath('/'));
            }
        } catch (error) {
            router.push(getPath('/'));
        }
    };

    // Helper untuk active class
    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return pathname === path; // Exact match untuk dashboard
        }
        return pathname === path || pathname.startsWith(path + '/'); // startsWith untuk subpages
    };
    const linkClass = (path: string) => `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isActive(path) ? 'bg-brand text-white shadow-[0_8px_20px_rgba(99,102,241,0.25)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`;
    const iconClass = (path: string) => `material-symbols-outlined text-[20px] ${isActive(path) ? 'font-light' : 'group-hover:text-brand transition-colors font-light'}`;

    return (
        <div className="font-sans bg-slate-50 text-slate-900 h-screen flex overflow-hidden selection:bg-primary-100 selection:text-primary-700">
            {/* Sidebar */}
            <aside className={`${sidebarCollapsed ? 'w-0 opacity-0 invisible' : 'w-72 opacity-100 visible'} bg-slate-950 border-r border-white/5 flex flex-col flex-shrink-0 z-30 shadow-2xl relative transition-all duration-300 ease-in-out overflow-hidden`}>
                <div className="h-20 flex items-center px-6 border-b border-white/5 bg-slate-950">
                    <div className="flex items-center gap-3 group">
                        <div
                            className="bg-center bg-no-repeat bg-contain rounded-xl size-10 shadow-lg p-2 bg-white/5 border border-white/10 group-hover:scale-105 transition-transform duration-500"
                            style={{
                                backgroundImage: `url("${assetUrl('/logo.png')}")`,
                            }}
                        ></div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-display font-semibold tracking-wider text-white uppercase">
                                {user?.role === 'admin' ? 'Admin Lab' : 'Panel Guru'}
                            </h1>
                            <p className="text-slate-500 text-[9px] font-mono tracking-[0.2em] opacity-60">
                                {user?.role === 'admin' ? 'MANAJEMEN PERANGKAT' : 'MONITORING LAB'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 flex flex-col gap-8 overflow-y-auto flex-1 custom-scrollbar">
                    <nav className="flex flex-col gap-1.5">
                        <div className="px-4 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                            Menu Utama
                        </div>
                        <Link href={getPath("/dashboard")} className={linkClass('/dashboard')}>
                            <span className={iconClass('/dashboard')}>dashboard</span>
                            <span className="text-sm font-medium tracking-tight">Ringkasan Analitik</span>
                        </Link>
                        <Link href={getPath("/dashboard/pcs")} className={linkClass('/dashboard/pcs')}>
                            <span className={iconClass('/dashboard/pcs')}>computer</span>
                            <span className="text-sm font-medium tracking-tight">Daftar Komputer</span>
                        </Link>
                        {user?.role === 'guru' && (
                            <>
                                <Link href={getPath("/dashboard/sessions")} className={linkClass('/dashboard/sessions')}>
                                    <span className={iconClass('/dashboard/sessions')}>history</span>
                                    <span className="text-sm font-medium tracking-tight">Riwayat Sesi</span>
                                </Link>
                                <Link href={getPath("/dashboard/issues")} className={linkClass('/dashboard/issues')}>
                                    <span className={iconClass('/dashboard/issues')}>report</span>
                                    <span className="text-sm font-medium tracking-tight">Laporan Masalah</span>
                                </Link>
                            </>
                        )}
                    </nav>
                    <nav className="flex flex-col gap-1.5">
                        <div className="px-4 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                            Pusat Kontrol
                        </div>

                        {user?.role === 'admin' && (
                            <Link href={getPath("/dashboard/labs")} className={linkClass('/dashboard/labs')}>
                                <span className={iconClass('/dashboard/labs')}>meeting_room</span>
                                <span className="text-sm font-medium tracking-tight">Manajemen Lab</span>
                            </Link>
                        )}

                        {user?.role === 'admin' && (
                            <Link href={getPath("/dashboard/users")} className={linkClass('/dashboard/users')}>
                                <span className={iconClass('/dashboard/users')}>manage_accounts</span>
                                <span className="text-sm font-medium tracking-tight">Akses Pengguna</span>
                            </Link>
                        )}
                        {user?.role === 'admin' && (
                            <Link href={getPath("/dashboard/issues")} className={linkClass('/dashboard/issues')}>
                                <span className={iconClass('/dashboard/issues')}>report</span>
                                <span className="text-sm font-medium tracking-tight">Laporan Masalah</span>
                            </Link>
                        )}
                        {user?.role === 'admin' && (
                            <Link href={getPath("/dashboard/sessions")} className={linkClass('/dashboard/sessions')}>
                                <span className={iconClass('/dashboard/sessions')}>history</span>
                                <span className="text-sm font-medium tracking-tight">Riwayat Sesi Guru</span>
                            </Link>
                        )}
                        <Link href={getPath("/dashboard/credentials")} className={linkClass('/dashboard/credentials')}>
                            <span className={iconClass('/dashboard/credentials')}>key</span>
                            <span className="text-sm font-medium tracking-tight">Kunci Kredensial</span>
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-50 transition-all duration-300">
                {/* Header */}
                <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title={sidebarCollapsed ? "Tampilkan Sidebar" : "Sembunyikan Sidebar"}
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                {sidebarCollapsed ? 'menu_open' : 'menu'}
                            </span>
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-800 hover:text-slate-900 transition-colors">
                            <span className="material-symbols-outlined text-[24px] font-medium">notifications</span>
                            <span className="absolute top-1.5 right-1.5 size-2.5 bg-red-500 rounded-full ring-2 ring-white shadow-sm"></span>
                        </button>
                        {/* User Profile with Dropdown */}
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center gap-3 hover:bg-slate-50 p-2 -m-2 rounded-lg transition-colors"
                            >
                                <div className="relative">
                                    <div className="size-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md ring-2 ring-indigo-100">
                                        {loading ? (
                                            <span className="material-symbols-outlined text-[20px] animate-spin font-medium">sync</span>
                                        ) : user ? (
                                            user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()
                                        ) : (
                                            'U'
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                                </div>
                                <div className="flex flex-col hidden lg:block text-left">
                                    <p className="text-sm font-semibold text-slate-900 leading-tight">
                                        {loading ? 'Memuat...' : user?.name || user?.username || 'Pengguna'}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        {user?.role === 'admin' ? 'Administrator' : 'Guru'}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 text-[20px] hidden lg:block">
                                    {showProfileDropdown ? 'expand_less' : 'expand_more'}
                                </span>
                            </button>

                            {/* Dropdown Menu */}
                            {showProfileDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {user?.name || user?.username || 'Pengguna'}
                                        </p>
                                        <p className="text-xs text-slate-500">{user?.email || 'Tidak ada email'}</p>
                                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-medium rounded-full uppercase tracking-wide">
                                            <span className="material-symbols-outlined text-[12px]">verified_user</span>
                                            {user?.role === 'admin' ? 'Administrator' : 'Guru'}
                                        </span>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setShowProfileDropdown(false);
                                                setShowLogoutModal(true);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors group"
                                        >
                                            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">logout</span>
                                            <div>
                                                <p className="text-sm font-medium">Keluar</p>
                                                <p className="text-[11px] text-red-400">Akhiri sesi Anda</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    {children}
                </main>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 text-center">
                            <div className="size-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600 text-[32px]">logout</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Konfirmasi Keluar</h3>
                            <p className="text-slate-600 text-sm">
                                Apakah Anda yakin ingin keluar dari sistem? Anda harus login kembali untuk mengakses dashboard.
                            </p>
                        </div>
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    setShowLogoutModal(false);
                                    handleLogout();
                                }}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
