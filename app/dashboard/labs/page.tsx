"use client";

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
}

export default function LabsPage() {
    const router = useRouter();
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
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
        fetchLabs();
    }, []);

    const fetchLabs = async () => {
        try {
            const response = await fetch('/api/labs');
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
            const response = await fetch('/api/labs', {
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
                alert(data.error || 'Failed to create lab');
            }
        } catch (error) {
            console.error('Error creating lab:', error);
            alert('Failed to create lab');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLab = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lab?')) return;

        try {
            const response = await fetch(`/api/labs/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (data.success) {
                setLabs(labs.filter(lab => lab.id !== id));
            } else {
                alert(data.error || 'Failed to delete lab');
            }
        } catch (error) {
            console.error('Error deleting lab:', error);
            alert('Failed to delete lab');
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
        <div className="p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            Computer Labs
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Manage physical locations (Labs) for your devices.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Add New Lab
                    </button>
                </div>

                {/* Search and View Toggle */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                    <div className="flex flex-col gap-4">
                        <div className="w-full">
                            <div className="relative flex items-center h-10 w-full max-w-md rounded-md bg-white border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                <div className="flex items-center justify-center pl-3 pr-2">
                                    <span className="material-symbols-outlined text-slate-400 text-[18px]">
                                        search
                                    </span>
                                </div>
                                <input
                                    className="w-full h-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                                    placeholder="Search labs by name or description..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">
                                Showing <span className="font-bold text-slate-900">{filteredLabs.length}</span> of <span className="font-bold text-slate-900">{labs.length}</span> labs
                            </span>
                            <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`p-2 rounded transition-all ${viewMode === "table"
                                        ? "bg-white shadow-sm text-blue-600"
                                        : "hover:bg-slate-200 text-slate-500"
                                        }`}
                                    title="Table View"
                                >
                                    <span className="material-symbols-outlined text-[20px]">table_rows</span>
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded transition-all ${viewMode === "grid"
                                        ? "bg-white shadow-sm text-blue-600"
                                        : "hover:bg-slate-200 text-slate-500"
                                        }`}
                                    title="Card View"
                                >
                                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content - Table or Grid View */}
                {viewMode === "table" ? (
                    <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Occupancy</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-600 font-medium">
                                                <span className="material-symbols-outlined animate-spin">sync</span>
                                                <span>Loading labs...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredLabs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                                <span className="material-symbols-outlined text-4xl text-slate-300">meeting_room</span>
                                                <p className="font-medium text-slate-600">
                                                    {labs.length === 0 ? "No labs found. Create one to get started." : "No labs match your search."}
                                                </p>
                                                {labs.length === 0 && (
                                                    <button
                                                        onClick={() => setShowModal(true)}
                                                        className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                                                    >
                                                        Create First Lab
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLabs.map((lab) => (
                                        <tr key={lab.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{lab.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {lab.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                                <span className={lab.pcCount > lab.capacity ? "text-red-600" : "text-slate-900"}>
                                                    {lab.pcCount || 0}
                                                </span>
                                                <span className="text-slate-400 font-normal mx-1">/</span>
                                                <span>{lab.capacity || 0} Sets</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/dashboard/labs/${lab.id}`}
                                                        className="p-1.5 rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                                                        title="Manage Devices"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">settings</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteLab(lab.id)}
                                                        className="p-1.5 rounded-md hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                                        title="Delete Lab"
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
                ) : (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full flex items-center justify-center py-20">
                                <div className="flex items-center gap-2 text-slate-600 font-medium">
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                    <span>Loading labs...</span>
                                </div>
                            </div>
                        ) : filteredLabs.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                                <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">meeting_room</span>
                                <span className="font-medium text-slate-600">
                                    {labs.length === 0 ? "No labs found. Create one to get started." : "No labs match your search."}
                                </span>
                                {labs.length === 0 && (
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                                    >
                                        Create First Lab
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
                                                    {lab.description || 'No description'}
                                                </p>
                                            </div>
                                            <div className="ml-3 h-12 w-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                <span className="material-symbols-outlined text-[28px]">meeting_room</span>
                                            </div>
                                        </div>

                                        {/* Capacity & Occupancy */}
                                        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-slate-500 uppercase">Usage:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className={`font-bold ${lab.pcCount > lab.capacity ? "text-red-600" : "text-slate-900"}`}>
                                                        {lab.pcCount || 0}
                                                    </span>
                                                    <span className="text-slate-400 text-xs font-normal">/ {lab.capacity || 0} Sets</span>
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

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                            <Link
                                                href={`/dashboard/labs/${lab.id}`}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">settings</span>
                                                Manage
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteLab(lab.id)}
                                                className="p-2 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                                                title="Delete Lab"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Add New Lab</h3>
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
                                    Lab Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="e.g. Computer Lab 1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Optional description..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Capacity (Sets)
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
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Lab'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
