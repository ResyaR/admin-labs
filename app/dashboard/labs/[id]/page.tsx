"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Lab {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
}

interface PC {
    id: string;
    hostname: string;
    brand: string | null;
    os: string | null;
    osVersion: string | null;
    location: string | null;
    status: string;
    lastSeen: string;
    cpu: {
        model: string;
        cores: number;
        clock: string | null;
    } | null;
    rams: {
        capacity: string;
    }[];
}

export default function LabDetailPage() {
    const router = useRouter();
    const params = useParams();
    const labId = params?.id as string;

    const [lab, setLab] = useState<Lab | null>(null);
    const [pcs, setPcs] = useState<PC[]>([]);
    const [loading, setLoading] = useState(true);
    const [pcsLoading, setPcsLoading] = useState(true);

    useEffect(() => {
        if (labId) {
            fetchLab();
            fetchPCs();
        }
    }, [labId]);

    const fetchLab = async () => {
        try {
            const response = await fetch(`/api/labs`);
            const data = await response.json();
            if (data.success) {
                const foundLab = data.data.find((l: Lab) => l.id === labId);
                if (foundLab) {
                    setLab(foundLab);
                } else {
                    router.push('/dashboard/labs');
                }
            }
        } catch (error) {
            console.error('Failed to fetch lab:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPCs = async () => {
        try {
            setPcsLoading(true);
            const response = await fetch(`/api/pcs?labId=${labId}`);
            const data = await response.json();
            if (data.success) {
                setPcs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch PCs:', error);
        } finally {
            setPcsLoading(false);
        }
    };

    const getOSIcon = (os: string | null) => {
        if (!os) return "computer";
        const osLower = os.toLowerCase();
        if (osLower.includes("windows")) return "desktop_windows";
        if (osLower.includes("mac")) return "desktop_mac";
        if (osLower.includes("linux")) return "laptop_chromebook";
        return "computer";
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Online
                    </span>
                );
            case "maintenance":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Perbaikan
                    </span>
                );
            case "offline":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Offline
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                        {status}
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center py-20 font-medium text-slate-600">
                    <span className="material-symbols-outlined animate-spin mr-2">sync</span>
                    Memuat rincian lab...
                </div>
            </div>
        );
    }

    if (!lab) {
        return (
            <div className="p-8">
                <div className="flex flex-col items-center justify-center py-20">
                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">sentiment_dissatisfied</span>
                    <p className="text-slate-600 font-bold text-lg">Lab tidak ditemukan</p>
                    <Link href="/dashboard/labs" className="mt-4 text-blue-600 hover:underline">
                        Kembali ke Manajemen Lab
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 pt-2">
            <div className="w-full mx-auto flex flex-col gap-5">
                {/* Custom Breadcrumb / Back Link */}
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/dashboard" className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        Dashboard
                    </Link>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    <Link href="/dashboard/labs" className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
                        Manajemen Lab
                    </Link>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    <span className="font-bold text-slate-900">{lab.name}</span>
                </div>

                {/* Lab Info Card */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                                <span className="material-symbols-outlined text-[32px]">meeting_room</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                    {lab.name}
                                </h2>
                                <p className="text-slate-500 font-medium text-sm mt-1">
                                    {lab.description || 'Tidak ada deskripsi tersedia.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center min-w-[100px]">
                                <span className="text-2xl font-black text-blue-600 leading-none">{pcs.length}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider text-center">Terdaftar</span>
                            </div>
                            <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center min-w-[100px]">
                                <span className="text-2xl font-black text-slate-800 leading-none">{lab.capacity}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider text-center">Kapasitas</span>
                            </div>
                            <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center min-w-[100px]">
                                <span className="text-2xl font-black text-blue-700 leading-none">
                                    {lab.capacity > 0 ? Math.round((pcs.length / lab.capacity) * 100) : 0}%
                                </span>
                                <span className="text-[10px] font-bold text-blue-400 uppercase mt-1 tracking-wider text-center">Okupansi</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Devices List Table */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                        <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">monitor</span>
                            Daftar Perangkat di Lab Ini
                        </h3>
                    </div>

                    {pcsLoading ? (
                        <div className="px-6 py-20 text-center flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined animate-spin text-4xl text-blue-600">sync</span>
                            <span className="font-bold text-slate-600">Sedang memuat daftar perangkat...</span>
                        </div>
                    ) : pcs.length === 0 ? (
                        <div className="px-6 py-24 text-center">
                            <div className="max-w-md mx-auto flex flex-col items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                    <span className="material-symbols-outlined text-[40px]">desktop_windows</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-lg">Belum ada perangkat di lab ini</p>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Silakan pergi ke halaman Manajemen PC untuk mendaftarkan perangkat ke lab ini.
                                    </p>
                                </div>
                                <Link href="/dashboard/pcs" className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all">
                                    Ke Manajemen PC
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b-2 border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Informasi Host</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Spesifikasi</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sistem Operasi</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Terakhir Aktif</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Rincian</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-slate-50 bg-white">
                                    {pcs.map((pc) => (
                                        <tr key={pc.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{pc.hostname}</span>
                                                    <span className="text-[11px] font-bold text-slate-400 font-mono mt-0.5">{pc.id.substring(0, 8).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 min-w-[40px] rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                                                        <span className="material-symbols-outlined text-[20px]">memory</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700 line-clamp-1 max-w-[150px]">{pc.cpu?.model || 'Hardware Tak Terdeteksi'}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">{pc.rams?.[0]?.capacity || '0'} GB RAM</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        {getOSIcon(pc.os)}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {pc.os || 'Unknown'} {pc.osVersion ? `(${pc.osVersion})` : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(pc.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-bold text-slate-500">
                                                    {new Date(pc.lastSeen).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/dashboard/pcs/${pc.id}`}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    title="Lihat Detail PC"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500 italic">
                            * Data disinkronkan langsung dari agen spec-detector.
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="font-bold text-slate-600">Ready</span>
                            </div>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                <span className="font-bold text-slate-600">N/A</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
