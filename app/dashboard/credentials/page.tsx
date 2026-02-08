"use client";
import { apiUrl } from "@/lib/paths";
import { getPath } from "@/lib/navigation";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Credential {
    id: string;
    name: string;
    credentialKey: string;
    isActive: boolean;
    createdAt: string;
    createdBy: string;
}

export default function CredentialsPage() {
    const [creds, setCreds] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Create States
    const [newName, setNewName] = useState("");
    const [newKey, setNewKey] = useState("");

    // Edit States
    const [editingCred, setEditingCred] = useState<Credential | null>(null);
    const [editName, setEditName] = useState("");
    const [editKey, setEditKey] = useState("");

    // Delete State
    const [credToDelete, setCredToDelete] = useState<Credential | null>(null);

    useEffect(() => {
        fetchCreds();
    }, []);

    async function fetchCreds() {
        setLoading(true);
        try {
            const res = await fetch(apiUrl("/api/credentials"));
            if (res.ok) {
                const data = await res.json();
                setCreds(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function createCred(e: React.FormEvent) {
        e.preventDefault();
        if (!newName) return;

        setError("");
        setActionLoading(true);

        try {
            const payload: any = { name: newName };
            if (newKey) payload.credentialKey = newKey;

            const res = await fetch(apiUrl("/api/credentials"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                setNewName("");
                setNewKey("");
                setShowCreateModal(false);
                fetchCreds();
            } else {
                setError(data.error || "Gagal membuat kredensial");
            }
        } catch (e) {
            console.error(e);
            setError("Terjadi kesalahan");
        } finally {
            setActionLoading(false);
        }
    }

    async function updateCred(e: React.FormEvent) {
        e.preventDefault();
        if (!editingCred || !editName || !editKey) return;

        setError("");
        setActionLoading(true);

        try {
            const res = await fetch(apiUrl("/api/credentials"), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingCred.id,
                    name: editName,
                    credentialKey: editKey
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setEditingCred(null);
                setEditName("");
                setEditKey("");
                setShowEditModal(false);
                fetchCreds();
            } else {
                setError(data.error || "Gagal memperbarui kredensial");
            }
        } catch (e) {
            console.error(e);
            setError("Terjadi kesalahan");
        } finally {
            setActionLoading(false);
        }
    }

    async function deleteCred() {
        if (!credToDelete) return;
        setActionLoading(true);
        try {
            await fetch(apiUrl(`/api/credentials?id=${credToDelete.id}`), { method: "DELETE" });
            setShowDeleteModal(false);
            setCredToDelete(null);
            fetchCreds();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    }

    const openEditModal = (cred: Credential) => {
        setEditingCred(cred);
        setEditName(cred.name);
        setEditKey(cred.credentialKey);
        setShowEditModal(true);
    };

    const openDeleteModal = (cred: Credential) => {
        setCredToDelete(cred);
        setShowDeleteModal(true);
    };

    // Filtered credentials based on search
    const filteredCreds = creds.filter(cred => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            cred.name.toLowerCase().includes(query) ||
            cred.credentialKey.toLowerCase().includes(query)
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
                    <span className="font-bold text-slate-900">Kredensial</span>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            Kunci Kredensial
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Kelola kunci login untuk Aplikasi Desktop. Anda dapat mengatur kunci secara manual atau generate otomatis.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tambah Kredensial
                    </button>
                </div>

                {/* Search Bar - Single Line */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-4 py-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex items-center h-9 flex-1 min-w-[200px] max-w-xs rounded-md bg-white border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                            <div className="flex items-center justify-center pl-3 pr-2">
                                <span className="material-symbols-outlined text-slate-400 text-[16px]">
                                    search
                                </span>
                            </div>
                            <input
                                className="w-full h-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                                placeholder="Cari nama atau kunci..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex-1"></div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 border-b border-slate-300">
                            <tr>
                                <th className="px-5 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">NAMA LABEL</th>
                                <th className="px-4 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">KUNCI KREDENSIAL</th>
                                <th className="px-4 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">DIBUAT OLEH</th>
                                <th className="px-4 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">TANGGAL DIBUAT</th>
                                <th className="px-4 py-3 text-right text-xs font-extrabold text-slate-800 uppercase tracking-wider">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2 text-slate-600 font-medium">
                                            <span className="material-symbols-outlined animate-spin">sync</span>
                                            <span>Memuat kredensial...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCreds.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-500">
                                            <span className="material-symbols-outlined text-4xl text-slate-300">key</span>
                                            <p className="font-medium text-slate-600">
                                                {creds.length === 0 ? "Tidak ada kredensial ditemukan. Buat kredensial baru untuk memulai." : "Tidak ada kredensial yang cocok dengan pencarian."}
                                            </p>
                                            {creds.length === 0 && (
                                                <button
                                                    onClick={() => setShowCreateModal(true)}
                                                    className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                                                >
                                                    Buat Kredensial Pertama
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCreds.map(cred => (
                                    <tr key={cred.id} className="hover:bg-slate-50 transition">
                                        <td className="px-5 py-4 font-bold text-slate-900">{cred.name}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <code
                                                    className="font-mono text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 text-sm select-all cursor-pointer hover:bg-blue-100 transition"
                                                    onClick={() => navigator.clipboard.writeText(cred.credentialKey)}
                                                    title="Klik untuk menyalin"
                                                >
                                                    {cred.credentialKey}
                                                </code>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(cred.credentialKey)}
                                                    className="text-slate-400 hover:text-blue-600"
                                                    title="Salin"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-700">{cred.createdBy || '-'}</td>
                                        <td className="px-4 py-4 text-sm text-slate-700">{new Date(cred.createdAt).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(cred)}
                                                    className="p-1.5 rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(cred)}
                                                    className="p-1.5 rounded-md hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                                    title="Hapus"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination and Results Count - Below Table */}
                {!loading && filteredCreds.length > 0 && (
                    <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 shadow-sm px-4 py-3">
                        <span className="text-sm text-slate-600">
                            Menampilkan <span className="font-bold text-slate-900">{filteredCreds.length}</span> dari <span className="font-bold text-slate-900">{creds.length}</span> Kredensial
                        </span>
                        <div className="flex items-center gap-1">
                            <button className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            <button className="px-3 py-1.5 text-sm font-bold text-white bg-blue-600 rounded-md">1</button>
                            <button className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Tambah Kredensial Baru</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={createCred} className="p-6 flex flex-col gap-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nama Label <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="contoh: Lab Komputer 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Kunci Kredensial (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                                    placeholder="Kosongkan untuk generate otomatis"
                                />
                                <p className="text-xs text-slate-500 mt-1">Jika dikosongkan, kunci akan di-generate secara otomatis.</p>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? 'Menyimpan...' : 'Buat Kredensial'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingCred && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Edit Kredensial</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={updateCred} className="p-6 flex flex-col gap-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nama Label <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Kunci Kredensial <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editKey}
                                    onChange={(e) => setEditKey(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                                />
                                <p className="text-xs text-amber-600 mt-2">
                                    ⚠️ Peringatan: Mengubah kunci ini akan memutus koneksi aplikasi yang menggunakan kunci lama.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && credToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 className="font-bold text-lg text-slate-900">Konfirmasi Hapus</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-700">
                                Apakah Anda yakin ingin mencabut kredensial <span className="font-bold">{credToDelete.name}</span>?
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                Tindakan ini tidak dapat dibatalkan dan akan memutus koneksi semua aplikasi yang menggunakan kunci ini.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={deleteCred}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Menghapus...' : 'Hapus Kredensial'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
