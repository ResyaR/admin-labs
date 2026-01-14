"use client";

import { useState, useEffect } from "react";

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

    // Create States
    const [newName, setNewName] = useState("");
    const [newKey, setNewKey] = useState("");

    // Edit States
    const [editingCred, setEditingCred] = useState<Credential | null>(null);
    const [editName, setEditName] = useState("");
    const [editKey, setEditKey] = useState("");

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchCreds();
    }, []);

    async function fetchCreds() {
        setLoading(true);
        try {
            const res = await fetch("/api/credentials");
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

            const res = await fetch("/api/credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                setNewName("");
                setNewKey("");
                fetchCreds();
            } else {
                setError(data.error || "Failed to create credential");
            }
        } catch (e) {
            console.error(e);
            setError("Something went wrong");
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
            const res = await fetch("/api/credentials", {
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
                fetchCreds();
            } else {
                setError(data.error || "Failed to update credential");
            }
        } catch (e) {
            console.error(e);
            setError("Something went wrong");
        } finally {
            setActionLoading(false);
        }
    }

    async function deleteCred(id: string) {
        if (!confirm("Are you sure you want to revoke this credential?")) return;
        try {
            await fetch(`/api/credentials?id=${id}`, { method: "DELETE" });
            fetchCreds();
        } catch (e) {
            console.error(e);
        }
    }

    const openEditModal = (cred: Credential) => {
        setEditingCred(cred);
        setEditName(cred.name);
        setEditKey(cred.credentialKey);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-slate-900">Application Credentials</h1>
            <p className="text-slate-600 mb-8 max-w-2xl text-lg">
                Manage login keys for the Desktop Application. You can manually set the key or let it generate automatically.
            </p>

            {/* Create Form */}
            <div className="bg-white p-8 rounded-xl mb-8 border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6 text-slate-900">Add New Credential</h2>
                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                        {error}
                    </div>
                )}
                <form onSubmit={createCred} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Label Name</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Science Lab 1"
                            className="w-full bg-white text-slate-900 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            required
                        />
                    </div>
                    <div className="md:col-span-5">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Credential Key (Optional)</label>
                        <input
                            type="text"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            placeholder="Leave empty to auto-generate"
                            className="w-full bg-white text-slate-900 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-mono"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold transition shadow-sm flex items-center justify-center gap-2"
                        >
                            {actionLoading ? "Saving..." : "Add Credential"}
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-sm font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                            <th className="p-5">Label / Name</th>
                            <th className="p-5">Credential Key</th>
                            <th className="p-5">Created By</th>
                            <th className="p-5">Created At</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading credentials...</td></tr>
                        ) : creds.map(cred => (
                            <tr key={cred.id} className="hover:bg-slate-50 transition">
                                <td className="p-5 font-bold text-slate-900 text-lg">{cred.name}</td>
                                <td className="p-5">
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-primary-700 bg-primary-50 px-3 py-1.5 rounded-md border border-primary-100 text-base select-all cursor-pointer hover:bg-primary-100 transition" onClick={() => navigator.clipboard.writeText(cred.credentialKey)}>
                                            {cred.credentialKey}
                                        </code>
                                        <button onClick={() => navigator.clipboard.writeText(cred.credentialKey)} className="text-slate-400 hover:text-primary-600" title="Copy">
                                            <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                        </button>
                                    </div>
                                </td>
                                <td className="p-5 text-sm">{cred.createdBy || '-'}</td>
                                <td className="p-5 text-sm">{new Date(cred.createdAt).toLocaleDateString()}</td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => openEditModal(cred)}
                                            className="text-slate-500 hover:text-primary-600 font-medium transition flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => deleteCred(cred.id)}
                                            className="text-slate-500 hover:text-red-600 font-medium transition flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && creds.length === 0 && (
                            <tr><td colSpan={5} className="p-16 text-center text-slate-500">No active credentials found. Create a new one to get started.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingCred && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Edit Credential</h3>
                            <button onClick={() => setEditingCred(null)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={updateCred} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Label Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-white text-slate-900 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Credential Key</label>
                                <input
                                    type="text"
                                    value={editKey}
                                    onChange={(e) => setEditKey(e.target.value)}
                                    className="w-full bg-white text-slate-900 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-mono"
                                    required
                                />
                                <p className="text-xs text-amber-600 mt-2">
                                    Warning: Changing this key will disconnect any apps currently using the old key.
                                </p>
                            </div>
                            <div className="pt-4 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setEditingCred(null)}
                                    className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition shadow-sm disabled:opacity-50"
                                >
                                    {actionLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
