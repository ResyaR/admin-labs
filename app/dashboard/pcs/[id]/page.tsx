"use client";
import { apiUrl } from "@/lib/paths";
import { getPath } from "@/lib/navigation";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface PCDetail {
    id: string;
    hostname: string;
    brand: string | null;
    os: string | null;
    osVersion: string | null;
    location: string | null;
    status: string;
    lastSeen: string;
    createdAt: string;
    updatedAt: string;
    cpu: {
        model: string;
        cores: number;
        threads: number;
        clock: string | null;
        maxClock: string | null;
        architecture: string | null;
    } | null;
    rams: Array<{
        id: string;
        manufacturer: string | null;
        model: string | null;
        capacity: string | null;
        type: string | null;
        speed: string | null;
        formFactor: string | null;
        serialNumber: string | null;
        bankLabel: string | null;
    }>;
    storages: Array<{
        id: string;
        manufacturer: string | null;
        model: string | null;
        size: string | null;
        type: string | null;
        interface: string | null;
        serialNumber: string | null;
        health: string | null;
    }>;
    gpu: {
        id: string;
        manufacturer: string | null;
        model: string | null;
        vram: string | null;
        driver: string | null;
    } | null;
    networks: Array<{
        id: string;
        name: string;
        macAddr: string | null;
        ipv4: string | null;
        isUp: boolean;
        bandwidth: string | null;
    }>;
    motherboard: {
        manufacturer: string | null;
        model: string | null;
        bios: string | null;
        serialNumber: string | null;
    } | null;
    changes: Array<{
        id: string;
        changeType: string;
        componentType: string;
        oldValue: string | null;
        newValue: string | null;
        severity: string;
        createdAt: string;
    }>;
}

export default function PCDetailPage() {
    const router = useRouter();
    const params = useParams();
    const pcId = params?.id as string;

    const [pc, setPc] = useState<PCDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRamModal, setShowRamModal] = useState(false);
    const [showStorageModal, setShowStorageModal] = useState(false);

    // Edit Config State
    const [showEditModal, setShowEditModal] = useState(false);
    const [labs, setLabs] = useState<any[]>([]);
    const [editForm, setEditForm] = useState({
        location: '',
        status: '',
        cpuModel: '',
        ramCapacity: ''
    });

    useEffect(() => {
        if (pcId) {
            fetchPCDetail();
        }
    }, [pcId]);

    useEffect(() => {
        if (showEditModal) {
            fetchLabs();
            setEditForm({
                location: pc?.location || '',
                status: pc?.status || 'active',
                cpuModel: pc?.cpu?.model || '',
                ramCapacity: pc?.rams?.[0]?.capacity || ''
            });
        }
    }, [showEditModal]);

    const fetchLabs = async () => {
        try {
            const res = await fetch(apiUrl('/api/labs'));
            const data = await res.json();
            if (data.success) {
                setLabs(data.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchPCDetail = async () => {
        try {
            setLoading(true);
            const response = await fetch(apiUrl(`/api/pcs/${pcId}`));
            if (!response.ok) {
                throw new Error('Gagal memuat detail PC');
            }
            const data = await response.json();
            if (data.success) {
                setPc(data.data);
            } else {
                setError(data.error || 'Gagal memuat detail PC');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const hasWarnings = (pc?.changes?.filter(c => c.severity === 'warning' || c.severity === 'critical').length || 0) > 0 && pc?.status !== 'maintenance';

    // Helper: Check if a specific component has mismatch warning
    const getCpuMismatch = () => {
        if (pc?.status === 'maintenance') return null;
        return pc?.changes?.find(c => c.componentType === 'cpu' && (c.severity === 'warning' || c.severity === 'critical'));
    };

    const getRamMismatch = () => {
        if (pc?.status === 'maintenance') return null;
        return pc?.changes?.find(c => c.componentType === 'ram' && (c.severity === 'warning' || c.severity === 'critical'));
    };

    const cpuMismatch = getCpuMismatch();
    const ramMismatch = getRamMismatch();

    const handleUpdateConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(apiUrl(`/api/pcs/${pcId}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (data.success) {
                await fetchPCDetail();
                setShowEditModal(false);
            } else {
                alert('Gagal memperbarui: ' + (data.error || 'Error tidak diketahui'));
            }
        } catch (e) {
            alert('Error saat memperbarui konfigurasi');
            console.error(e);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg uppercase tracking-wide shadow-sm">ONLINE</span>;
            case "maintenance":
                return <span className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg uppercase tracking-wide shadow-sm">MAINTENANCE</span>;
            case "offline":
                return <span className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg uppercase tracking-wide shadow-sm">OFFLINE</span>;
            default:
                return <span className="px-3 py-1.5 bg-slate-500 text-white text-xs font-bold rounded-lg uppercase tracking-wide shadow-sm">UNKNOWN</span>;
        }
    };

    const totalRAM = (pc?.rams || []).reduce((sum, ram) => {
        const capacity = ram.capacity || "";
        const match = capacity.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
    }, 0);

    const totalStorage = (pc?.storages || []).reduce((sum, storage) => {
        const size = storage.size || "";
        const match = size.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
    }, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                    <p className="text-slate-600 font-medium">Memuat data perangkat...</p>
                </div>
            </div>
        );
    }

    if (error || !pc) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[500px] text-center">
                <div className="size-20 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl">error</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Perangkat Tidak Ditemukan</h3>
                <p className="text-slate-500 max-w-md mb-8">Perangkat yang diminta tidak dapat ditemukan dalam database inventaris.</p>
                <Link href={getPath("/dashboard/pcs")} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Kembali ke Daftar PC
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50">
            <div className="max-w-7xl mx-auto p-4 md:p-6">

                {/* Header Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                <Link href={getPath("/dashboard/pcs")} className="hover:text-blue-600 transition-colors">Daftar PC</Link>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                                <span className="text-slate-900 font-medium">{pc.hostname}</span>
                            </nav>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{pc.hostname}</h1>
                                {getStatusBadge(pc.status)}
                                {hasWarnings && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-xs font-bold text-white rounded-lg shadow animate-pulse">
                                        <span className="material-symbols-outlined text-[16px]">warning</span>
                                        HARDWARE MISMATCH
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
                                <span className="material-symbols-outlined text-lg text-slate-400">location_on</span>
                                {pc.location || 'Lokasi belum ditentukan'} • {pc.brand || 'Perangkat Generik'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span>
                            Edit Konfigurasi
                        </button>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* CPU */}
                    <div className={`bg-white p-5 rounded-xl border shadow-sm ${cpuMismatch ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${cpuMismatch ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                <span className="material-symbols-outlined">memory</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Prosesor</span>
                            {cpuMismatch && (
                                <span className="ml-auto text-red-500" title="Hardware Mismatch">
                                    <span className="material-symbols-outlined text-[18px]">error</span>
                                </span>
                            )}
                        </div>
                        <p className="text-lg font-bold text-slate-900 truncate" title={pc.cpu?.model}>{pc.cpu?.model || 'Tidak Diketahui'}</p>
                        <p className="text-sm text-slate-500 mt-1">{pc.cpu?.cores || 0} Core • {pc.cpu?.clock || 'N/A'}</p>
                        {cpuMismatch && (
                            <div className="mt-3 p-2 bg-red-100 rounded-lg border border-red-200">
                                <p className="text-xs font-bold text-red-700">⚠️ Tidak Sesuai Baseline</p>
                                <p className="text-xs text-red-600 mt-1">
                                    <span className="font-semibold">Baseline:</span> {cpuMismatch.oldValue || 'N/A'}
                                </p>
                                <p className="text-xs text-red-600">
                                    <span className="font-semibold">Aktual:</span> {cpuMismatch.newValue || 'N/A'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* RAM */}
                    <div
                        onClick={() => setShowRamModal(true)}
                        className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition-all ${ramMismatch ? 'border-red-300 bg-red-50/30 hover:border-red-400' : 'border-slate-200 hover:border-purple-300'}`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${ramMismatch ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                                <span className="material-symbols-outlined">developer_board</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Memori</span>
                            {ramMismatch && (
                                <span className="ml-auto text-red-500" title="Hardware Mismatch">
                                    <span className="material-symbols-outlined text-[18px]">error</span>
                                </span>
                            )}
                        </div>
                        <p className="text-lg font-bold text-slate-900">{totalRAM > 0 ? `${totalRAM} GB` : 'N/A'}</p>
                        <p className="text-sm text-slate-500 mt-1">{pc.rams[0]?.type || 'DDR'} • {pc.rams.length} Slot</p>
                        {ramMismatch && (
                            <div className="mt-3 p-2 bg-red-100 rounded-lg border border-red-200">
                                <p className="text-xs font-bold text-red-700">⚠️ Tidak Sesuai Baseline</p>
                                <p className="text-xs text-red-600 mt-1">
                                    <span className="font-semibold">Baseline:</span> {ramMismatch.oldValue || 'N/A'}
                                </p>
                                <p className="text-xs text-red-600">
                                    <span className="font-semibold">Aktual:</span> {ramMismatch.newValue || 'N/A'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Storage */}
                    <div
                        onClick={() => setShowStorageModal(true)}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <span className="material-symbols-outlined">hard_drive</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Penyimpanan</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900">{totalStorage > 0 ? `${totalStorage} GB` : 'N/A'}</p>
                        <p className="text-sm text-slate-500 mt-1">{pc.storages[0]?.type || 'Disk'} • {pc.storages.length} Drive</p>
                    </div>

                    {/* OS */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                <span className="material-symbols-outlined">window</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Sistem Operasi</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900 truncate" title={pc.os || ''}>{pc.os || 'Tidak Diketahui'}</p>
                        <p className="text-sm text-slate-500 mt-1 truncate">{pc.osVersion || 'Versi tidak diketahui'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Komponen Utama */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">dns</span>
                                    Komponen Utama
                                </h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Motherboard */}
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Motherboard</p>
                                    <p className="text-base font-semibold text-slate-900">{pc.motherboard?.model || 'Tidak Diketahui'}</p>
                                    <p className="text-sm text-slate-500 mt-1">{pc.motherboard?.manufacturer || 'Unknown'}</p>
                                    {pc.motherboard?.serialNumber && (
                                        <p className="text-xs text-slate-400 mt-1 font-mono">SN: {pc.motherboard.serialNumber}</p>
                                    )}
                                </div>

                                {/* GPU */}
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Kartu Grafis</p>
                                    <p className="text-base font-semibold text-slate-900">{pc.gpu?.model || 'Grafis Terintegrasi'}</p>
                                    <p className="text-sm text-slate-500 mt-1">{pc.gpu?.vram || 'Shared Memory'}</p>
                                </div>

                                {/* Primary Storage */}
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Disk Utama</p>
                                    <p className="text-base font-semibold text-slate-900">{pc.storages[0]?.model || 'Tidak Diketahui'}</p>
                                    <p className="text-sm text-slate-500 mt-1">{pc.storages[0]?.size || '0 GB'} • {pc.storages[0]?.interface || 'SATA'}</p>
                                </div>

                                {/* Architecture */}
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Arsitektur</p>
                                    <p className="text-base font-semibold text-slate-900">{pc.cpu?.architecture || 'x64'}</p>
                                    <p className="text-sm text-slate-500 mt-1">{pc.os || 'Windows'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Network Interfaces */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">lan</span>
                                    Antarmuka Jaringan
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-3">Interface</th>
                                            <th className="px-6 py-3">MAC Address</th>
                                            <th className="px-6 py-3">IP Address</th>
                                            <th className="px-6 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(!pc.networks || pc.networks.length === 0) ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">Tidak ada antarmuka jaringan terdeteksi</td>
                                            </tr>
                                        ) : pc.networks.map((net, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-2.5 rounded-full ${net.isUp ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                        <span className="text-sm font-medium text-slate-900">{net.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-slate-500">{net.macAddr || '--'}</td>
                                                <td className="px-6 py-4 text-sm font-mono text-blue-600 font-semibold">{net.ipv4 || '--'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {net.isUp ? (
                                                        <span className="text-emerald-600 font-bold text-xs uppercase bg-emerald-50 px-2 py-1 rounded">Terhubung</span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs uppercase">Terputus</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Info Sistem */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
                                <span className="material-symbols-outlined text-blue-600">info</span>
                                Info Sistem
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                    <div className="size-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined">computer</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">Hostname</p>
                                        <p className="text-xs text-slate-600 font-mono truncate">{pc.hostname}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                    <div className="size-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined">schedule</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Terakhir Online</p>
                                        <p className="text-xs text-slate-600">{formatDate(pc.lastSeen)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                    <div className="size-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined">add_circle</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Terdaftar</p>
                                        <p className="text-xs text-slate-600">{formatDate(pc.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                    <div className="size-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined">update</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Terakhir Diperbarui</p>
                                        <p className="text-xs text-slate-600">{formatDate(pc.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Riwayat Perubahan */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
                                <span className="material-symbols-outlined text-blue-600">history</span>
                                Riwayat Perubahan
                            </h3>
                            <div className="space-y-4">
                                {(!pc.changes || pc.changes.length === 0) ? (
                                    <p className="text-sm text-slate-400 text-center py-6">Tidak ada riwayat perubahan</p>
                                ) : pc.changes.slice(0, 5).map((change) => (
                                    <div key={change.id} className="p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
                                        <p className="text-xs text-slate-400 mb-1">{formatDate(change.createdAt)}</p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {change.changeType.replace('_', ' ')}: {change.componentType}
                                        </p>
                                        {change.newValue && (
                                            <p className="text-xs text-slate-500 mt-1 truncate">Baru: {change.newValue}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Config Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Edit Konfigurasi</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateConfig} className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                            {/* Konfigurasi Dasar */}
                            <div className="pb-3 border-b border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Konfigurasi Dasar</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi / Lab</label>
                                <select
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editForm.location}
                                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                >
                                    <option value="">-- Belum Ditentukan --</option>
                                    {labs.map(lab => (
                                        <option key={lab.id} value={lab.name}>{lab.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                >
                                    <option value="active">Aktif</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="offline">Offline</option>
                                </select>
                            </div>

                            {/* Edit Baseline */}
                            <div className="pt-4 pb-3 border-b border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Edit Baseline Hardware</p>
                                <p className="text-xs text-slate-500 mt-1">Perbarui baseline untuk menghapus peringatan Hardware Mismatch</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Model CPU (Baseline)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    value={editForm.cpuModel}
                                    onChange={e => setEditForm({ ...editForm, cpuModel: e.target.value })}
                                    placeholder="contoh: Intel Core i5-10400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kapasitas RAM (Baseline)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    value={editForm.ramCapacity}
                                    onChange={e => setEditForm({ ...editForm, ramCapacity: e.target.value })}
                                    placeholder="contoh: 8 GB atau 16 GB"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                                    Batal
                                </button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RAM Details Modal */}
            {showRamModal && (
                <div onClick={() => setShowRamModal(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-purple-50 rounded-t-xl">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-purple-700">
                                <span className="material-symbols-outlined">developer_board</span>
                                Detail RAM - Semua Modul
                            </h3>
                            <button onClick={() => setShowRamModal(false)} className="size-8 rounded-full hover:bg-purple-100 flex items-center justify-center text-purple-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            {(pc.rams || []).length > 0 ? pc.rams.map((ram, index) => (
                                <div key={index} className="bg-slate-50 p-5 border border-purple-100 rounded-lg">
                                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-purple-100">
                                        <span className="text-purple-700 font-bold">MODUL #{index + 1}</span>
                                        <span className="text-xs text-slate-400 font-mono">SLOT: DIMM_{index}</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Produsen</p>
                                            <p className="text-slate-900 font-semibold">{ram.manufacturer || 'Tidak Diketahui'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Model</p>
                                            <p className="text-slate-700 font-mono">{ram.model || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Kapasitas</p>
                                            <p className="text-purple-600 font-bold">{ram.capacity || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Tipe</p>
                                            <p className="text-slate-700">{ram.type || 'DDR'} {ram.formFactor || ''}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Kecepatan</p>
                                            <p className="text-purple-600 font-semibold">{ram.speed ? `${ram.speed} MHz` : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Serial</p>
                                            <p className="text-slate-500 font-mono text-xs">{ram.serialNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-slate-400 text-center py-12">Tidak ada modul RAM terdeteksi</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Storage Details Modal */}
            {showStorageModal && (
                <div onClick={() => setShowStorageModal(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50 rounded-t-xl">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-700">
                                <span className="material-symbols-outlined">hard_drive</span>
                                Detail Penyimpanan - Semua Drive
                            </h3>
                            <button onClick={() => setShowStorageModal(false)} className="size-8 rounded-full hover:bg-emerald-100 flex items-center justify-center text-emerald-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            {(pc.storages || []).length > 0 ? pc.storages.map((storage, index) => (
                                <div key={index} className="bg-slate-50 p-5 border border-emerald-100 rounded-lg">
                                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-emerald-100">
                                        <span className="text-emerald-700 font-bold">DRIVE #{index + 1}</span>
                                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold uppercase">{storage.type || 'Unknown'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div className="col-span-2 md:col-span-3">
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Model</p>
                                            <p className="text-slate-900 font-semibold">{storage.model || 'Tidak Diketahui'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Produsen</p>
                                            <p className="text-slate-700">{storage.manufacturer || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Kapasitas</p>
                                            <p className="text-emerald-600 font-bold text-lg">{storage.size || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Interface</p>
                                            <p className="text-slate-700">{storage.interface || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Kesehatan</p>
                                            <p className="text-emerald-600 font-semibold">{storage.health || 'Baik'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Serial</p>
                                            <p className="text-slate-500 font-mono text-xs">{storage.serialNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-slate-400 text-center py-12">Tidak ada penyimpanan terdeteksi</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
