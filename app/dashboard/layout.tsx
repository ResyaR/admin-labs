
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
    const [searchQuery, setSearchQuery] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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
            const response = await fetch('/api/auth/me');
            if (!response.ok) {
                router.push('/');
                return;
            }
            const data = await response.json();
            if (data.success) {
                setUser(data.user);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            if (response.ok) {
                router.push('/');
                router.refresh();
            } else {
                router.push('/');
            }
        } catch (error) {
            router.push('/');
        }
    };

    // Helper untuk active class
    const isActive = (path: string) => pathname === path;
    const linkClass = (path: string) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors group ${isActive(path) ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`;
    const iconClass = (path: string) => `material-symbols-outlined text-[20px] ${isActive(path) ? '' : 'group-hover:text-primary-500 transition-colors'}`;

    return (
        <div className="font-sans bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 h-screen flex overflow-hidden selection:bg-primary-100 selection:text-primary-700">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 z-30 transition-all duration-300">
                <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-md size-8 shadow-sm ring-1 ring-white/10"
                            style={{
                                backgroundImage:
                                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAOR6oZf4M-MgoO-DcBzzBfVQltB08eP8yGIxAH58HgHyHfmgeQYbD8VjIWu0gJWVb4FH_LfkC63eaqZQAhfP6WyC_NhQ1UIJWBKmI4vz5_L1awJR6lQCDp3skrzhTa7UsHDtVS3bp89NQ1XfnEVjOc24lnd8BvNFrlOBdz2JmYgMpjOIpPxEGdOe24zdq19knKrXc6QsnOmevbWKo10T__CZKe_5xG1hXrgGfjf7WgG-dqO-eDp92Vx5ToCCIDb_c5_UTOGDHtTk4")',
                            }}
                        ></div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold tracking-wide text-white uppercase">
                                EduTech Admin
                            </h1>
                            <p className="text-slate-400 text-[10px] font-medium tracking-wider">
                                SYSTEM CONSOLE
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-4 flex flex-col gap-6 overflow-y-auto flex-1">
                    <nav className="flex flex-col gap-1">
                        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Overview
                        </div>
                        <Link href="/dashboard" className={linkClass('/dashboard')}>
                            <span className={iconClass('/dashboard')}>dashboard</span>
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        <Link href="/dashboard/pcs" className={linkClass('/dashboard/pcs')}>
                            <span className={iconClass('/dashboard/pcs')}>computer</span>
                            <span className="text-sm font-medium">All PCs</span>
                        </Link>
                        <Link href="/dashboard/network" className={linkClass('/dashboard/network')}>
                            <span className={iconClass('/dashboard/network')}>lan</span>
                            <span className="text-sm font-medium">Network Map</span>
                        </Link>
                    </nav>
                    <nav className="flex flex-col gap-1">
                        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Management
                        </div>
                        <Link href="/dashboard/hardware" className={linkClass('/dashboard/hardware')}>
                            <span className={iconClass('/dashboard/hardware')}>inventory</span>
                            <span className="text-sm font-medium">Hardware</span>
                        </Link>
                        <Link href="/dashboard/software" className={linkClass('/dashboard/software')}>
                            <span className={iconClass('/dashboard/software')}>security_update</span>
                            <span className="text-sm font-medium">Software & Updates</span>
                        </Link>
                        <Link href="/dashboard/users" className={linkClass('/dashboard/users')}>
                            <span className={iconClass('/dashboard/users')}>manage_accounts</span>
                            <span className="text-sm font-medium">Users & Access</span>
                        </Link>
                        <Link href="/dashboard/credentials" className={linkClass('/dashboard/credentials')}>
                            <span className={iconClass('/dashboard/credentials')}>key</span>
                            <span className="text-sm font-medium">App Credentials</span>
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-50 dark:bg-slate-900">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden text-slate-500 dark:text-slate-300">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <nav className="hidden sm:flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                            <span className="hover:text-slate-800 dark:hover:text-white cursor-pointer">
                                Admin
                            </span>
                            <span className="mx-2 text-slate-300">/</span>
                            <span className="text-slate-800 dark:text-white">Dashboard</span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                                    search
                                </span>
                            </span>
                            <input
                                className="block w-64 pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md leading-5 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all shadow-sm"
                                placeholder="Search machine ID..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                        <button className="relative p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-[22px]">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-danger rounded-full ring-2 ring-white dark:ring-slate-800"></span>
                        </button>
                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                            <div className="relative">
                                <div className="size-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-slate-200 dark:ring-slate-700">
                                    {loading ? (
                                        <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                                    ) : user ? (
                                        user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()
                                    ) : (
                                        'U'
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                            </div>
                            <div className="flex flex-col hidden lg:block">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {loading ? 'Loading...' : user?.name || user?.username || 'User'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                    {loading ? '' : user?.role || 'Admin'}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
                                title="Logout"
                            >
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                    {children}
                </main>
            </div>
        </div>
    );
}
