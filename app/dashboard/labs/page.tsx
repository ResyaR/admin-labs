"use client";
import { apiUrl } from "@/lib/paths";
import { getPath } from "@/lib/navigation";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Lab {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    pcCount: number;
    createdAt?: string;
    activeTeachersCount?: number;
    activeTeachers?: Array<{
        id: string;
        name: string;
        startedAt: string;
        scheduledEndTime?: string;
    }>;
}

export default function LabsPage() {
    const router = useRouter();
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('guru');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        capacity: "0",
    });
    const [submitting, setSubmitting] = useState(false);

    // UI State
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    useEffect(() => {
        fetchUser();
        fetchLabs();
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

    const fetchLabs = async () => {
        try {
            const response = await fetch(apiUrl('/api/labs'));
            const data = await response.json();
            if (data.success) {
                setLabs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch labs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLab = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch(apiUrl('/api/labs'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                setLabs([data.data, ...labs]);
                setShowModal(false);
                setFormData({ name: "", description: "", capacity: "0" });
            } else {
                alert(data.error || 'Gagal membuat lab');
            }
        } catch (error) {
            console.error('Error creating lab:', error);
            alert('Gagal membuat lab');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLab = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus lab ini?')) return;

        try {
            const response = await fetch(apiUrl(`/api/labs/${id}`), {
                method: 'DELETE',
            });

            const data = await response.json();
            if (data.success) {
                setLabs(labs.filter(lab => lab.id !== id));
            } else {
                alert(data.error || 'Gagal menghapus lab');
            }
        } catch (error) {
            console.error('Error deleting lab:', error);
            alert('Gagal menghapus lab');
        }
    };

    // Filtered labs based on search
    const filteredLabs = labs.filter(lab => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            lab.name.toLowerCase().includes(query) ||
            lab.description?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="p-4 pt-2">
            <div className="w-full mx-auto flex flex-col gap-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <Link href={getPath("/dashboard")} className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        Dashboard
                    </Link>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    <span className="font-bold text-slate-900">{userRole === 'admin' ? 'Manajemen Lab' : 'Pilih Lab'}</span>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {userRole === 'admin' ? 'Manajemen Lab Komputer' : 'Monitoring Lab Komputer'}
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            {userRole === 'admin' ? 'Kelola lokasi fisik (Lab) untuk perangkat Anda.' : 'Pilih lab untuk mulai memantau aktivitas perangkat.'}
                        </p>
                    </div>
                    {userRole === 'admin' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Tambah Lab Baru
                        </button>
                    )}
                </div>

                {/* Search and View Toggle - Single Line */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-4 py-2">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative flex items-center h-9 flex-1 min-w-[200px] max-w-xs rounded-md bg-white border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                            <div className="flex items-center justify-center pl-3 pr-2">
                                <span className="material-symbols-outlined text-slate-400 text-[16px]">
                                    search
                                </span>
                            </div>
                            <input
                                className="w-full h-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                                placeholder="Cari nama atau deskripsi lab..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* View Toggle */}
                        <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                            <button
                                onClick={() => setViewMode("table")}
                                className={`p-1.5 rounded transition-all ${viewMode === "table"
                                    ? "bg-white shadow-sm text-blue-600"
                                    : "hover:bg-slate-200 text-slate-500"
                                    }`}
                                title="Tampilan Tabel"
                            >
                                <span className="material-symbols-outlined text-[18px]">table_rows</span>
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 rounded transition-all ${viewMode === "grid"
                                    ? "bg-white shadow-sm text-blue-600"
                                    : "hover:bg-slate-200 text-slate-500"
                                    }`}
                                title="Tampilan Kartu"
                            >
                                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content - Table or Grid View */}
                {viewMode === "table" ? (
                    <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 border-b border-slate-300">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">NAMA LAB</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">DESKRIPSI</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">KAPASITAS</th>
                                    {userRole === 'admin' && (
                                        <th className="px-4 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">GURU AKTIF</th>
                                    )}
                                    <th className="px-4 py-3 text-right text-xs font-extrabold text-slate-800 uppercase tracking-wider">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-600 font-medium">
                                                <span className="material-symbols-outlined animate-spin">sync</span>
                                                <span>Memuat data lab...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredLabs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                                <span className="material-symbols-outlined text-4xl text-slate-300">meeting_room</span>
                                                <p className="font-medium text-slate-600">
                                                    {labs.length === 0 ? "Tidak ada lab ditemukan. Buat lab pertama Anda." : "Tidak ada lab yang cocok dengan pencarian."}
                                                </p>
                                                {labs.length === 0 && (
                                                    <button
                                                        onClick={() => setShowModal(true)}
                                                        className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                                                    >
                                                        Buat Lab Pertama
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLabs.map((lab) => (
                                        <tr key={lab.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-900">{lab.name}</div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-700">
                                                {lab.description || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                                                <span className={lab.pcCount > lab.capacity ? "text-red-600" : "text-slate-900"}>
                                                    {lab.pcCount || 0}
                                                </span>
                                                <span className="text-slate-400 font-normal mx-1">/</span>
                                                <span>{lab.capacity || 0} Unit</span>
                                            </td>
                                            {userRole === 'admin' && (
                                                <td className="px-4 py-4">
                                                    {lab.activeTeachersCount && lab.activeTeachersCount > 0 ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                            <div>
                                                                <span className="text-sm font-bold text-emerald-700">
                                                                    {lab.activeTeachersCount} Aktif
                                                                </span>
                                                                <p className="text-xs text-slate-500 max-w-[150px] truncate">
                                                                    {lab.activeTeachers?.map(t => t.name).join(', ')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-slate-400">-</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={getPath(`/dashboard/labs/${lab.id}`)}
                                                        className="p-1.5 rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                                                        title={userRole === 'admin' ? 'Kelola Perangkat' : 'Pantau Perangkat'}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            {userRole === 'admin' ? 'settings' : 'visibility'}
                                                        </span>
                                                    </Link>
                                                    {userRole === 'admin' && (
                                                        <button
                                                            onClick={() => handleDeleteLab(lab.id)}
                                                            className="p-1.5 rounded-md hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                                            title="Hapus Lab"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full flex items-center justify-center py-20">
                                <div className="flex items-center gap-2 text-slate-600 font-medium">
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                    <span>Memuat data lab...</span>
                                </div>
                            </div>
                        ) : filteredLabs.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                                <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">meeting_room</span>
                                <span className="font-medium text-slate-600">
                                    {labs.length === 0 ? "Tidak ada lab ditemukan. Buat lab pertama Anda." : "Tidak ada lab yang cocok dengan pencarian."}
                                </span>
                                {labs.length === 0 && (
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                                    >
                                        Buat Lab Pertama
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredLabs.map((lab) => (
                                <div
                                    key={lab.id}
                                    className="bg-white rounded-xl border-2 border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                                >
                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-slate-900 truncate" title={lab.name}>
                                                    {lab.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-2" title={lab.description || ''}>
                                                    {lab.description || 'Tidak ada deskripsi'}
                                                </p>
                                            </div>
                                            <div className="ml-3 h-12 w-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                <span className="material-symbols-outlined text-[28px]">meeting_room</span>
                                            </div>
                                        </div>

                                        {/* Capacity & Occupancy */}
                                        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-slate-500 uppercase">Penggunaan:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className={`font-bold ${lab.pcCount > lab.capacity ? "text-red-600" : "text-slate-900"}`}>
                                                        {lab.pcCount || 0}
                                                    </span>
                                                    <span className="text-slate-400 text-xs font-normal">/ {lab.capacity || 0} Unit</span>
                                                </div>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${lab.pcCount >= lab.capacity ? 'bg-amber-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min(100, (lab.pcCount / (lab.capacity || 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Active Teachers Badge */}
                                        {userRole === 'admin' && (
                                            <div className={`mb-4 p-3 rounded-lg border ${lab.activeTeachersCount && lab.activeTeachersCount > 0
                                                ? 'bg-emerald-50 border-emerald-200'
                                                : 'bg-slate-50 border-slate-100'
                                                }`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-lg ${lab.activeTeachersCount && lab.activeTeachersCount > 0
                                                        ? 'text-emerald-600'
                                                        : 'text-slate-400'
                                                        }`}>
                                                        {lab.activeTeachersCount && lab.activeTeachersCount > 0 ? 'person' : 'person_off'}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        {lab.activeTeachersCount && lab.activeTeachersCount > 0 ? (
                                                            <>
                                                                <p className="text-sm font-bold text-emerald-700">
                                                                    {lab.activeTeachersCount} Guru Aktif
                                                                </p>
                                                                <p className="text-xs text-emerald-600 truncate">
                                                                    {lab.activeTeachers?.map(t => t.name).join(', ')}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-slate-500">Tidak ada guru aktif</p>
                                                        )}
                                                    </div>
                                                    {lab.activeTeachersCount && lab.activeTeachersCount > 0 && (
                                                        <span className="flex size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                            <Link
                                                href={getPath(`/dashboard/labs/${lab.id}`)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    {userRole === 'admin' ? 'settings' : 'visibility'}
                                                </span>
                                                {userRole === 'admin' ? 'Kelola' : 'Mulai Pantau'}
                                            </Link>
                                            {userRole === 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteLab(lab.id)}
                                                    className="p-2 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                                                    title="Hapus Lab"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Pagination and Results Count - Below Table */}
                {!loading && filteredLabs.length > 0 && (
                    <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 shadow-sm px-4 py-3">
                        <span className="text-sm text-slate-600">
                            Menampilkan <span className="font-bold text-slate-900">{filteredLabs.length}</span> dari <span className="font-bold text-slate-900">{labs.length}</span> Lab
                        </span>
                        <div className="flex items-center gap-1">
                            <button className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            <button className="px-3 py-1.5 text-sm font-bold text-white bg-blue-600 rounded-md">1</button>
                            {filteredLabs.length > 10 && (
                                <>
                                    <button className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">2</button>
                                    <button className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">3</button>
                                </>
                            )}
                            <button className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Tambah Lab Baru</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateLab} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nama Lab <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="contoh: Lab Komputer 1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Deskripsi
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Deskripsi opsional..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Kapasitas (Unit)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Membuat...' : 'Buat Lab'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
