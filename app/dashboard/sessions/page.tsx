"use client";
import { apiUrl } from "@/lib/paths";

import Link from "next/link";
import { useState, useEffect } from "react";

interface TeachingSession {
    id: string;
    labName: string;
    startedAt: string;
    endedAt: string | null;
    duration: number | null;
    notes: string | null;
    lab: {
        name: string;
        description: string | null;
    };
    user?: {
        name: string | null;
        username: string;
    };
}

export default function SessionHistoryPage() {
    const [sessions, setSessions] = useState<TeachingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalSessions: 0, totalMinutes: 0 });
    const [userRole, setUserRole] = useState<string>("");

    useEffect(() => {
        fetchUser();
        fetchSessions();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await fetch(apiUrl('/api/auth/me'));
            const data = await response.json();
            if (data.success) {
                setUserRole(data.user.role);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const fetchSessions = async () => {
        try {
            const response = await fetch(apiUrl('/api/teaching-sessions?limit=50'));
            const data = await response.json();
            if (data.success) {
                setSessions(data.data);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes: number | null) => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}j ${mins}m`;
        }
        return `${mins} menit`;
    };

    return (
        <div className="p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/dashboard" className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        Dashboard
                    </Link>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    <span className="font-bold text-slate-900">Riwayat Sesi</span>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
                            {userRole === 'admin' ? 'Riwayat Sesi Semua Guru' : 'Riwayat Sesi Mengajar'}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {userRole === 'admin'
                                ? 'Pantau aktivitas pemantauan laboratorium oleh semua Guru'
                                : 'Log aktivitas pemantauan laboratorium Anda'}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <span className="material-symbols-outlined text-2xl">calendar_month</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">{stats.totalSessions}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sesi</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <span className="material-symbols-outlined text-2xl">schedule</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">{Math.round(stats.totalMinutes / 60)}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Jam</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                <span className="material-symbols-outlined text-2xl">avg_pace</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">
                                    {stats.totalSessions > 0 ? Math.round(stats.totalMinutes / stats.totalSessions) : 0}
                                </p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata (menit)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sessions List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-white">
                            <span className="material-symbols-outlined">history</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Daftar Sesi</h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">sync</span>
                            <p className="mt-4 text-slate-500 font-medium">Memuat riwayat sesi...</p>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="p-12 text-center">
                            <span className="material-symbols-outlined text-6xl text-slate-300">event_busy</span>
                            <p className="mt-4 text-slate-500 font-medium">Belum ada riwayat sesi</p>
                            <p className="text-slate-400 text-sm mt-1">Mulai sesi pertama Anda dengan memilih lab di Dashboard</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {sessions.map((session) => (
                                <div key={session.id} className="p-5 hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                <span className="material-symbols-outlined text-2xl">meeting_room</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">{session.labName}</h3>
                                                <p className="text-slate-500 text-sm">{formatDate(session.startedAt)}</p>
                                                {userRole === 'admin' && session.user && (
                                                    <p className="text-blue-600 text-sm font-medium mt-1">
                                                        👤 {session.user.name || session.user.username}
                                                    </p>
                                                )}
                                                {session.notes && (
                                                    <p className="text-slate-400 text-sm mt-1 italic">"{session.notes}"</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 md:text-right">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase">Waktu</p>
                                                <p className="text-slate-700 font-semibold">
                                                    {formatTime(session.startedAt)} - {session.endedAt ? formatTime(session.endedAt) : 'Berlangsung'}
                                                </p>
                                            </div>
                                            <div className="min-w-[80px]">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Durasi</p>
                                                <p className={`font-bold ${session.endedAt ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {session.endedAt ? formatDuration(session.duration) : 'Aktif'}
                                                </p>
                                            </div>
                                            {!session.endedAt && (
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full animate-pulse">
                                                    SEDANG BERLANGSUNG
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
