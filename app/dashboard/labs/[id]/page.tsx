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
            const response = await fetch('/api/pcs');
            const data = await response.json();
            if (data.success) {
                // Filter PCs that belong to this lab
                const labPCs = data.data.filter((pc: PC) => pc.location === lab?.name || (lab && pc.location === lab.name));
                setPcs(labPCs);
            }
        } catch (error) {
            console.error('Failed to fetch PCs:', error);
        } finally {
            setPcsLoading(false);
        }
    };

    // Re-fetch PCs when lab data is loaded
    useEffect(() => {
        if (lab) {
            fetchPCs();
        }
    }, [lab]);

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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                    </span>
                );
            case "maintenance":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Maintenance
                    </span>
                );
            case "offline":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Offline
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        <span>Loading lab details...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!lab) {
        return (
            <div className="p-8">
                <div className="flex flex-col items-center justify-center py-20">
                    <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">error</span>
                    <p className="text-slate-600 font-medium">Lab not found</p>
                    <Link href="/dashboard/labs" className="mt-4 text-blue-600 hover:text-blue-700">
                        Back to Labs
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <Link
                        href="/dashboard/labs"
                        className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 w-fit"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Back to Labs
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                {lab.name}
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">
                                {lab.description || 'No description'}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{pcs.length}</div>
                                <div className="text-xs text-slate-600">Devices</div>
                            </div>
                            <div className="w-px h-10 bg-blue-200"></div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{lab.capacity}</div>
                                <div className="text-xs text-slate-600">Capacity</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PCs List */}
                <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-lg text-slate-900">Devices in this Lab</h3>
                    </div>
                    {pcsLoading ? (
                        <div className="px-6 py-12 text-center">
                            <div className="flex items-center justify-center gap-2 text-slate-600 font-medium">
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                <span>Loading devices...</span>
                            </div>
                        </div>
                    ) : pcs.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                <span className="material-symbols-outlined text-4xl text-slate-300">computer</span>
                                <p className="font-medium text-slate-600">No devices assigned to this lab yet.</p>
                                <p className="text-sm text-slate-500">
                                    Go to <Link href="/dashboard/pcs" className="text-blue-600 hover:text-blue-700 font-medium">All PCs</Link> and use the Edit button to assign devices.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Hostname</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Model</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">OS</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Last Seen</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pcs.map((pc) => {
                                        const lastSeenDate = new Date(pc.lastSeen);
                                        const lastSeenFormatted = lastSeenDate.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        });

                                        return (
                                            <tr key={pc.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="text-sm font-bold text-slate-900">{pc.hostname}</div>
                                                        <div className="text-xs text-slate-500">{pc.brand || 'Unknown Brand'}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                {getOSIcon(pc.os)}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-semibold text-slate-900">
                                                            {pc.cpu?.model || 'Unknown CPU'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-700">
                                                        {pc.os || 'Unknown'} {pc.osVersion || ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{getStatusBadge(pc.status)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-600">{lastSeenFormatted}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link
                                                        href={`/dashboard/pcs/${pc.id}`}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
