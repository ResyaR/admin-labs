
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
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(true);

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

        try {
            const res = await fetch("/api/credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            });
            if (res.ok) {
                setNewName("");
                fetchCreds();
            }
        } catch (e) {
            console.error(e);
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

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 text-primary">Application Credentials (Login Keys)</h1>
            <p className="text-gray-400 mb-8 max-w-2xl">
                Generate credentials for the Desktop Application. The key generated below acts as the password/token to access the Spec Detector application.
            </p>

            {/* Create Form */}
            <div className="bg-dark-surface p-6 rounded-xl mb-8 border border-dark-border">
                <h2 className="text-lg font-semibold mb-4 text-white">Generate New Credential</h2>
                <form onSubmit={createCred} className="flex gap-4">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Credential Label (e.g. Lab 1, Staff A)"
                        className="flex-1 bg-dark-base text-white px-4 py-3 rounded-lg border border-dark-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    />
                    <button
                        type="submit"
                        className="bg-primary hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg shadow-primary/20"
                    >
                        Generate Key
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-dark-surface rounded-xl border border-dark-border overflow-hidden shadow-card">
                <table className="w-full text-left">
                    <thead className="bg-dark-base text-gray-400 text-sm uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Label / Name</th>
                            <th className="p-4 font-medium">Credential Key</th>
                            <th className="p-4 font-medium">Created By</th>
                            <th className="p-4 font-medium">Created At</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300 divide-y divide-dark-border">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading credentials...</td></tr>
                        ) : creds.map(cred => (
                            <tr key={cred.id} className="hover:bg-dark-base/50 transition">
                                <td className="p-4 font-semibold text-white">{cred.name}</td>
                                <td className="p-4">
                                    <span className="font-mono text-warning bg-warning/10 px-2 py-1 rounded text-sm select-all cursor-pointer" title="Click to copy" onClick={() => navigator.clipboard.writeText(cred.credentialKey)}>
                                        {cred.credentialKey}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-400">{cred.createdBy || '-'}</td>
                                <td className="p-4 text-sm text-gray-500">{new Date(cred.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => deleteCred(cred.id)}
                                        className="text-danger hover:text-red-400 text-sm font-medium hover:underline"
                                    >
                                        Revoke
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && creds.length === 0 && (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-500">No active credentials found. Generate one above.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
