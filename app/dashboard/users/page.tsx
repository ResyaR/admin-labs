"use client";
import { apiUrl } from "@/lib/paths";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
    role: string;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Create States
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState("guru");

    // Edit States
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editRole, setEditRole] = useState("");
    const [editPassword, setEditPassword] = useState("");

    // Delete State
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        try {
            const res = await fetch(apiUrl("/api/users"));
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setUsers(data.data);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function createUser(e: React.FormEvent) {
        e.preventDefault();
        if (!newUsername || !newPassword) return;

        setError("");
        setActionLoading(true);

        try {
            const payload = {
                username: newUsername,
                password: newPassword,
                name: newName,
                email: newEmail,
                role: newRole
            };

            const res = await fetch(apiUrl("/api/users"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setNewUsername("");
                setNewPassword("");
                setNewName("");
                setNewEmail("");
                setNewRole("guru");
                setShowCreateModal(false);
                fetchUsers();
            } else {
                setError(data.error || "Gagal membuat pengguna");
            }
        } catch (e) {
            console.error(e);
            setError("Terjadi kesalahan sistem");
        } finally {
            setActionLoading(false);
        }
    }

    async function updateUser(e: React.FormEvent) {
        e.preventDefault();
        if (!editingUser) return;

        setError("");
        setActionLoading(true);

        try {
            const payload: any = {
                id: editingUser.id,
                name: editName,
                email: editEmail,
                role: editRole,
            };

            if (editPassword) {
                payload.password = editPassword;
            }

            const res = await fetch(apiUrl("/api/users"), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setEditingUser(null);
                setEditName("");
                setEditEmail("");
                setEditRole("");
                setEditPassword("");
                setShowEditModal(false);
                fetchUsers();
            } else {
                setError(data.error || "Gagal memperbarui pengguna");
            }
        } catch (e) {
            console.error(e);
            setError("Terjadi kesalahan sistem");
        } finally {
            setActionLoading(false);
        }
    }

    async function deleteUser() {
        if (!userToDelete) return;
        setActionLoading(true);
        try {
            const res = await fetch(apiUrl(`/api/users?id=${userToDelete.id}`), { method: "DELETE" });
            const data = await res.json();

            if (res.ok && data.success) {
                setShowDeleteModal(false);
                setUserToDelete(null);
                fetchUsers();
            } else {
                alert(data.error || "Gagal menghapus pengguna");
            }
        } catch (e) {
            console.error(e);
            alert("Terjadi kesalahan sistem");
        } finally {
            setActionLoading(false);
        }
    }

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditName(user.name || "");
        setEditEmail(user.email || "");
        setEditRole(user.role);
        setEditPassword("");
        setShowEditModal(true);
    };

    const openDeleteModal = (user: User) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    // Filtered users based on search
    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            (user.name && user.name.toLowerCase().includes(query)) ||
            user.username.toLowerCase().includes(query) ||
            (user.email && user.email.toLowerCase().includes(query))
        );
    });

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-[10px] font-bold uppercase rounded-lg border border-violet-200 tracking-wide">Administrator</span>;
            case 'guru':
                return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-lg border border-emerald-200 tracking-wide">Guru</span>;
            default:
                return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg border border-slate-200 tracking-wide">{role}</span>;
        }
    };

    return (
        <div className="p-4 pt-2">
            <div className="w-full mx-auto flex flex-col gap-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/dashboard" className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        Dashboard
                    </Link>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    <span className="font-bold text-slate-900">Akses Pengguna</span>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            Manajemen Pengguna
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Kelola akses dan peran pengguna aplikasi. Termasuk Admin dan Guru.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Tambah Pengguna
                    </button>
                </div>

                {/* Search Bar */}
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
                                placeholder="Cari nama, username, atau email..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 border-b border-slate-300">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">PENGGUNA</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">ROLE</th>
                                    <th className="px-4 py-3 text-xs font-extrabold text-slate-800 uppercase tracking-wider">EMAIL</th>
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
                                                <span>Memuat pengguna...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            Tidak ada pengguna ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition">
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="font-bold text-slate-900">{user.name || user.username}</p>
                                                    <p className="text-xs text-slate-500 font-mono">@{user.username}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-700">{user.email || '-'}</td>
                                            <td className="px-4 py-4 text-sm text-slate-700">{new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1.5 rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                                                        title="Edit"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => openDeleteModal(user)}
                                                            className="p-1.5 rounded-md hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                                            title="Hapus"
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
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">Tambah Pengguna Baru</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={createUser} className="p-6 flex flex-col gap-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Username login"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Password login"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="Nama pengguna"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role / Peran</label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="guru">Guru</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email (Opsional)</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="email@sekolah.sch.id"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-slate-100">
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
                                    {actionLoading ? 'Menyimpan...' : 'Simpan Pengguna'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">Edit Pengguna</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={updateUser} className="p-6 flex flex-col gap-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    disabled
                                    value={editingUser.username}
                                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-md cursor-not-allowed"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role / Peran</label>
                                    <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="guru">Guru</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-100 mt-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ganti Password (Opsional)</label>
                                <input
                                    type="password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Isi hanya jika ingin mengubah password"
                                />
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
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 bg-red-50">
                            <h3 className="font-bold text-lg text-red-900 flex items-center gap-2">
                                <span className="material-symbols-outlined">warning</span>
                                Konfirmasi Hapus
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-700">
                                Apakah Anda yakin ingin menghapus pengguna <span className="font-bold">{userToDelete.name || userToDelete.username}</span>?
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                Tindakan ini tidak dapat dibatalkan. Pengguna tidak akan bisa login lagi.
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
                                onClick={deleteUser}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {actionLoading ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
