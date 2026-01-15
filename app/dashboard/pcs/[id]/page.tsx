"use client";

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
        detectedAt: string;
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
        status: ''
    });

    useEffect(() => {
        if (pcId) {
            fetchPCDetail();
        }
    }, [pcId]);

    // Fetch Labs when modal opens
    useEffect(() => {
        if (showEditModal) {
            fetchLabs();
            setEditForm({
                location: pc?.location || '',
                status: pc?.status || 'active'
            });
        }
    }, [showEditModal]);

    const fetchLabs = async () => {
        try {
            const res = await fetch('/api/labs');
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
            const response = await fetch(`/api/pcs/${pcId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch PC details');
            }
            const data = await response.json();
            if (data.success) {
                setPc(data.data);
            } else {
                setError(data.error || 'Failed to load PC details');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/pcs/${pcId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (data.success) {
                setPc({ ...pc!, location: editForm.location, status: editForm.status });
                setShowEditModal(false);
            } else {
                alert('Failed to update: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            alert('Error updating configuration');
            console.error(e);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 uppercase tracking-wide">ONLINE</span>;
            case "maintenance":
                return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200 uppercase tracking-wide">MAINTENANCE</span>;
            case "offline":
                return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200 uppercase tracking-wide">OFFLINE</span>;
            default:
                return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200 uppercase tracking-wide">UNKNOWN</span>;
        }
    };

    // Helper to calculate totals
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
                    <p className="text-slate-500 font-medium animate-pulse">Synchronizing hardware data...</p>
                </div>
            </div>
        );
    }

    if (error || !pc) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[500px] text-center">
                <div className="size-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
                    <span className="material-symbols-outlined text-4xl">dns</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Device Not Found</h3>
                <p className="text-slate-500 max-w-md mb-8">The requested hardware node could not be located in the inventory database.</p>
                <Link href="/dashboard/pcs" className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">
                    Return to Inventory
                </Link>
            </div>
        );
    }

    return (
        <div className="font-sans text-slate-900 bg-slate-50/50 min-h-full pb-20">
            <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">

                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-3 font-medium">
                            <Link href="/dashboard/pcs" className="hover:text-blue-600 transition-colors">Hardware Lab</Link>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                            <span className="text-blue-600 font-semibold">{pc.hostname}</span>
                        </nav>
                        <div className="flex items-center gap-4 flex-wrap">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">{pc.hostname}</h1>
                            {getStatusBadge(pc.status)}
                        </div>
                        <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm md:text-base">
                            <span className="material-symbols-outlined text-lg text-slate-400">location_on</span>
                            {pc.location ? pc.location : 'Location Unassigned'} • {pc.brand || 'Generic Device'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm hover:border-slate-300">
                            <span className="material-symbols-outlined text-lg">print</span> Print QR
                        </button>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:translate-y-0.5"
                        >
                            <span className="material-symbols-outlined text-lg">edit</span> Edit Config
                        </button>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {/* CPU Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                                <span className="material-symbols-outlined">memory</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-400 tracking-tighter">CPU</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xl lg:text-2xl font-bold truncate" title={pc.cpu?.model}>{pc.cpu?.model || 'Unknown CPU'}</p>
                                <p className="text-sm text-slate-500 font-mono mt-1">{pc.cpu?.clock || 'N/A'}</p>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Cores</span>
                                    <span className="text-blue-600">{pc.cpu?.cores || 0} Physical</span>
                                </div>
                                <div className="flex gap-1 h-1.5">
                                    {Array.from({ length: Math.min(8, pc.cpu?.cores || 4) }).map((_, i) => (
                                        <div key={i} className="flex-1 bg-blue-500 rounded-full opacity-60"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RAM Card - Clickable */}
                    <div
                        onClick={() => setShowRamModal(true)}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
                                <span className="material-symbols-outlined">developer_board</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase">Details</span>
                                <span className="text-xs font-mono font-bold text-slate-400 tracking-tighter">RAM</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xl lg:text-2xl font-bold">{totalRAM > 0 ? `${totalRAM} GB` : 'N/A'}</p>
                                <p className="text-sm text-slate-500 font-mono mt-1">{pc.rams[0]?.type || 'DDR'} • {pc.rams.length} Slots</p>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Capacity</span>
                                    <span className="text-purple-600">Total Installed</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 w-full rounded-full opacity-80"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Storage Card - Clickable */}
                    <div
                        onClick={() => setShowStorageModal(true)}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                <span className="material-symbols-outlined">hard_drive</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase">Details</span>
                                <span className="text-xs font-mono font-bold text-slate-400 tracking-tighter">STORAGE</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xl lg:text-2xl font-bold">{totalStorage > 0 ? `${totalStorage} GB` : 'N/A'}</p>
                                <p className="text-sm text-slate-500 font-mono mt-1">{pc.storages[0]?.type || 'Drive'} • {pc.storages.length} Disk(s)</p>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Health</span>
                                    <span className="text-emerald-600">{pc.storages[0]?.health || 'Good'}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-full rounded-full opacity-80"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OS Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl group-hover:bg-slate-200 transition-colors">
                                <span className="material-symbols-outlined">window</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-400 tracking-tighter">OS</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xl lg:text-2xl font-bold truncate" title={pc.os || ''}>{pc.os || 'Unknown OS'}</p>
                                <p className="text-sm text-slate-500 font-mono mt-1 w-full truncate">{pc.osVersion || 'Unknown Ver'}</p>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Status</span>
                                    <span className="text-slate-700">Active</span>
                                </div>
                                <div className="flex gap-1 h-1.5">
                                    <div className="flex-1 bg-slate-300 rounded-full overflow-hidden"></div>
                                    <div className="flex-1 bg-slate-300 rounded-full overflow-hidden"></div>
                                    <div className="flex-1 bg-slate-100 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Core Components */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">dns</span>
                                    Core Components
                                </h3>
                                <span className="text-xs font-mono text-slate-400">UUID: {pc.id.slice(-8).toUpperCase()}</span>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                {/* Motherboard */}
                                <div className="group">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-600 transition-colors">Motherboard</p>
                                    <p className="text-lg font-semibold text-slate-900 truncate" title={pc.motherboard?.model || 'Unknown'}>{pc.motherboard?.model || 'Generic Board'}</p>
                                    <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-500">
                                        <span>{pc.motherboard?.manufacturer || 'Unknown Mfg'}</span>
                                        <span className="size-1 rounded-full bg-slate-300"></span>
                                        <span>BIOS {pc.motherboard?.bios || 'N/A'}</span>
                                        <span className="size-1 rounded-full bg-slate-300"></span>
                                        <span title="Serial Number">SN: {pc.motherboard?.serialNumber || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* GPU */}
                                <div className="group">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-red-600 transition-colors">Graphics Processing</p>
                                    <p className="text-lg font-semibold text-slate-900 truncate" title={pc.gpu?.model || 'Integrated Graphics'}>
                                        {pc.gpu?.model || 'Integrated Graphics'}
                                    </p>
                                    <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-500">
                                        <span>{pc.gpu?.vram || 'Shared Memory'}</span>
                                        <span className="size-1 rounded-full bg-slate-300"></span>
                                        <span>{pc.gpu?.driver ? `Dr. ${pc.gpu.driver}` : 'Native Driver'}</span>
                                    </div>
                                </div>

                                {/* Primary Storage */}
                                <div className="group">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-600 transition-colors">Primary Disk</p>
                                    <p className="text-lg font-semibold text-slate-900 truncate" title={pc.storages[0]?.model || 'Generic Disk'}>
                                        {pc.storages[0]?.model || 'Generic Storage'}
                                    </p>
                                    <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-500">
                                        <span>{pc.storages[0]?.size || '0 GB'}</span>
                                        <span className="size-1 rounded-full bg-slate-300"></span>
                                        <span>{pc.storages[0]?.interface || 'SATA/NVMe'}</span>
                                    </div>
                                </div>

                                {/* Architecture */}
                                <div className="group">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-purple-600 transition-colors">System Architecture</p>
                                    <p className="text-lg font-semibold text-slate-900 truncate">
                                        {pc.cpu?.architecture || 'x64-based PC'}
                                    </p>
                                    <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-500">
                                        <span>{pc.os || 'Windows'}</span>
                                        <span className="size-1 rounded-full bg-slate-300"></span>
                                        <span>{pc.osVersion?.split(' ')[0] || 'Build'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Network Interfaces */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">lan</span>
                                    Network Interfaces
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4">Interface</th>
                                            <th className="px-6 py-4">MAC Address</th>
                                            <th className="px-6 py-4">IP Address</th>
                                            <th className="px-6 py-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(!pc.networks || pc.networks.length === 0) ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No network interfaces detected</td>
                                            </tr>
                                        ) : pc.networks.map((net, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className={`size-2.5 rounded-full ${net.isUp ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`}></div>
                                                    <div>
                                                        <span className="text-sm font-semibold text-slate-900 block">{net.name}</span>
                                                        {net.bandwidth && <span className="text-[10px] text-slate-500 font-mono">{net.bandwidth}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-slate-500 border-r border-transparent">{net.macAddr || '--'}</td>
                                                <td className="px-6 py-4 text-sm font-mono text-blue-600 font-bold">{net.ipv4 || '--'}</td>
                                                <td className="px-6 py-4 text-sm text-right">
                                                    {net.isUp ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs uppercase bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                            Connected
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium text-xs uppercase">
                                                            Disconnected
                                                        </span>
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
                    <div className="space-y-8">

                        {/* System Info (Replacing Peripherals) */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-blue-600">settings_system_daydream</span>
                                System Info
                            </h3>
                            <div className="space-y-4">
                                {/* Hostname */}
                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div className="size-10 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                                        <span className="material-symbols-outlined">computer</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900">Hostname</p>
                                        <p className="text-xs font-mono text-slate-700 uppercase tracking-tight truncate">{pc.hostname}</p>
                                    </div>
                                </div>

                                {/* Architecture */}
                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div className="size-10 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                                        <span className="material-symbols-outlined">memory</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900">Architecture</p>
                                        <p className="text-xs font-mono text-slate-700 tracking-tight">{pc.cpu?.architecture || 'amd64'}</p>
                                    </div>
                                </div>

                                {/* Keyboard */}
                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div className="size-10 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                                        <span className="material-symbols-outlined">keyboard</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900">Keyboard</p>
                                        <p className="text-xs text-slate-700 tracking-tight">Enhanced (101- or 102-key)</p>
                                    </div>
                                </div>

                                {/* Mouse */}
                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div className="size-10 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                                        <span className="material-symbols-outlined">mouse</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900">Mouse</p>
                                        <p className="text-xs text-slate-700 tracking-tight">Microsoft HID-compliant mouse</p>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-slate-200 my-4"></div>

                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div className="size-10 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                                        <span className="material-symbols-outlined">schedule</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Last Seen</p>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">{formatDate(pc.lastSeen)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div className="size-10 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                                        <span className="material-symbols-outlined">add_circle</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Registered</p>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">{formatDate(pc.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div className="size-10 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                                        <span className="material-symbols-outlined">update</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Last Updated</p>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">{formatDate(pc.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Events */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-blue-600">history_edu</span>
                                History Logs
                            </h3>
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-0.5 before:bg-slate-100">
                                {(!pc.changes || pc.changes.length === 0) ? (
                                    <div className="relative pl-8 h-20 flex items-center text-sm text-slate-400 italic">No history logs available</div>
                                ) : pc.changes.slice(0, 5).map((change) => (
                                    <div key={change.id} className="relative pl-8 group">
                                        <span className="absolute left-0 top-1.5 size-6 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center group-hover:border-blue-100 transition-colors">
                                            <span className="size-2 bg-slate-400 rounded-full group-hover:bg-blue-500 transition-colors"></span>
                                        </span>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 font-mono mb-0.5">{formatDate(change.detectedAt)}</p>
                                            <p className="text-sm font-bold text-slate-900 leading-tight">
                                                {change.changeType.replace('_', ' ')}: {change.componentType}
                                            </p>
                                            {change.newValue && (
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={change.newValue}>
                                                    New: {change.newValue}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-widest gap-4">
                    <p>© 2024 Lab Management System</p>
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p>Data Synchronized</p>
                    </div>
                </footer>

            </div>

            {/* Edit Config Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Edit Configuration</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateConfig} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Location / Lab
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editForm.location}
                                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                >
                                    <option value="">-- Unassigned --</option>
                                    {labs.map(lab => (
                                        <option key={lab.id} value={lab.name}>{lab.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Select the physical lab/location for this device.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Status
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="offline">Offline</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RAM Details Modal - STRUCTURED LIKE APP */}
            {showRamModal && (
                <div onClick={() => setShowRamModal(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-purple-100 flex items-center justify-between bg-purple-50 rounded-t-2xl">
                            <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3 text-purple-700">
                                <span className="material-symbols-outlined">developer_board</span>
                                RAM Details - All Modules
                            </h3>
                            <button onClick={() => setShowRamModal(false)} className="size-8 rounded-full hover:bg-white/50 flex items-center justify-center text-purple-700 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            {(pc.rams || []).length > 0 ? pc.rams.map((ram, index) => (
                                <div key={index} className="bg-slate-50/80 p-6 border border-purple-100 rounded-lg shadow-sm">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-4 border-b border-purple-100 pb-3">
                                        <span className="text-purple-700 font-bold tracking-wider">MODULE #{index + 1}</span>
                                        <span className="text-xs text-slate-400 font-mono">SLOT: DIMM_{index}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                        <div>
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Manufacturer</p>
                                            <p className="text-slate-900 font-bold">{ram.manufacturer || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Model / Part No.</p>
                                            <p className="text-slate-700 font-mono">{ram.model || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Serial Number</p>
                                            <p className="text-slate-700 font-mono tracking-wide">{ram.serialNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Capacity & Type</p>
                                            <p className="text-slate-700 font-mono">
                                                <span className="text-purple-600 font-bold">{ram.capacity || '-'}</span> <span className="text-slate-300">|</span> {ram.type || 'DDR'} {ram.formFactor || ''}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Speed</p>
                                            <p className="text-purple-600 font-mono font-bold">{ram.speed ? `${ram.speed} MHz` : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Bank Label</p>
                                            <p className="text-slate-500 font-mono">{ram.bankLabel || `BANK ${index}`}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-slate-400 text-center py-12">No RAM modules detected</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Storage Details Modal - STRUCTURED LIKE APP */}
            {showStorageModal && (
                <div onClick={() => setShowStorageModal(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50 rounded-t-2xl">
                            <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3 text-emerald-700">
                                <span className="material-symbols-outlined">hard_drive</span>
                                Storage Details - All Drives
                            </h3>
                            <button onClick={() => setShowStorageModal(false)} className="size-8 rounded-full hover:bg-white/50 flex items-center justify-center text-emerald-700 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            {(pc.storages || []).length > 0 ? pc.storages.map((storage, index) => (
                                <div key={index} className="bg-slate-50/80 p-6 border border-emerald-100 rounded-lg shadow-sm">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-4 border-b border-emerald-100 pb-3">
                                        <span className="text-emerald-700 font-bold tracking-wider">DRIVE #{index + 1}</span>
                                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-sm font-bold uppercase border border-emerald-200">{storage.type || 'Unknown'}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                        <div className="col-span-1 md:col-span-2">
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Model Name</p>
                                            <p className="text-slate-900 font-bold text-base">{storage.model || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Manufacturer</p>
                                            <p className="text-slate-700 font-mono">{storage.manufacturer || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Serial Number</p>
                                            <p className="text-slate-700 font-mono tracking-wide">{storage.serialNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Capacity</p>
                                            <p className="text-emerald-600 font-bold font-mono text-lg">{storage.size || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1 font-bold">Interface</p>
                                            <p className="text-slate-700 font-mono">{storage.interface || 'Unknown'}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-slate-400 text-center py-12">No Storage data available</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
