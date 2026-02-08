"use client";
import { apiUrl } from "@/lib/paths";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface IssueReport {
    id: string;
    labId: string;
    pcId: string | null;
    pcHostname: string | null;
    category: string;
    priority: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    reporter: {
        name: string | null;
        username: string;
    };
    lab: {
        name: string;
    };
}

interface PC {
    id: string;
    hostname: string;
}

export default function IssueReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<IssueReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [pcs, setPcs] = useState<PC[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [userRole, setUserRole] = useState<string>("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

    // Form state
    const [formData, setFormData] = useState({
        pcId: "",
        pcHostname: "",
        category: "hardware",
        priority: "medium",
        title: "",
        description: ""
    });
    const [submitting, setSubmitting] = useState(false);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ show: true, type, message });
        setTimeout(() => setToast({ show: false, type: 'success', message: '' }), 4000);
    };

    useEffect(() => {
        fetchUser();
        fetchReports();
        fetchPCs();
    }, [statusFilter]);

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

    const fetchReports = async () => {
        try {
            const url = statusFilter === 'all'
                ? apiUrl('/api/issues')
                : apiUrl(`/api/issues?status=${statusFilter}`);
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setReports(data.data);
                setCounts(data.counts || {});
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPCs = async () => {
        try {
            const labId = localStorage.getItem('activeLabId');
            if (labId) {
                const response = await fetch(apiUrl(`/api/pcs?labId=${labId}`));
                const data = await response.json();
                if (data.success) {
                    setPcs(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch PCs:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const labId = localStorage.getItem('activeLabId');
            if (!labId) {
                showToast('error', 'Pilih lab terlebih dahulu dari Dashboard');
                setTimeout(() => router.push('/dashboard'), 1500);
                return;
            }

            const selectedPC = pcs.find(pc => pc.id === formData.pcId);

            const response = await fetch(apiUrl('/api/issues'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    labId,
                    pcId: formData.pcId || null,
                    pcHostname: selectedPC?.hostname || null,
                    category: formData.category,
                    priority: formData.priority,
                    title: formData.title,
                    description: formData.description
                })
            });

            const data = await response.json();
            if (data.success) {
                setShowModal(false);
                setFormData({
                    pcId: "",
                    pcHostname: "",
                    category: "hardware",
                    priority: "medium",
                    title: "",
                    description: ""
                });
                showToast('success', 'Laporan berhasil dikirim!');
                fetchReports();
            } else {
                showToast('error', data.error || 'Gagal membuat laporan');
            }
        } catch (error) {
            console.error('Failed to create report:', error);
            showToast('error', 'Terjadi kesalahan saat mengirim laporan');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            open: 'bg-red-100 text-red-700 border-red-200',
            in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
            resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            closed: 'bg-slate-100 text-slate-600 border-slate-200'
        };
        const labels: Record<string, string> = {
            open: 'Baru',
            in_progress: 'Diproses',
            resolved: 'Selesai',
            closed: 'Ditutup'
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${styles[status] || styles.open}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            low: 'bg-slate-50 text-slate-600',
            medium: 'bg-blue-50 text-blue-600',
            high: 'bg-orange-50 text-orange-600',
            critical: 'bg-red-50 text-red-600'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${styles[priority] || styles.medium}`}>
                {priority}
            </span>
        );
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            hardware: 'memory',
            software: 'code',
            network: 'wifi',
            other: 'help'
        };
        return icons[category] || 'help';
    };

    const handleStatusChange = async (reportId: string, newStatus: string) => {
        setUpdatingId(reportId);
        try {
            const response = await fetch(apiUrl('/api/issues'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: reportId, status: newStatus })
            });
            const data = await response.json();
            if (data.success) {
                fetchReports();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="p-4 pt-2">
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-top-2 duration-300 ${toast.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    <span className="material-symbols-outlined text-xl">
                        {toast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <span className="font-medium">{toast.message}</span>
                    <button
                        onClick={() => setToast({ ...toast, show: false })}
                        className="ml-2 hover:opacity-70"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}
            <div className="w-full mx-auto flex flex-col gap-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/dashboard" className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        Dashboard
                    </Link>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    <span className="font-bold text-slate-900">Laporan Masalah</span>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Laporan Masalah</h1>
                        <p className="text-slate-500 mt-1">
                            {userRole === 'admin'
                                ? 'Kelola dan tindak lanjuti laporan masalah dari Guru'
                                : 'Laporkan masalah pada perangkat lab kepada Admin'}
                        </p>
                    </div>
                    {userRole !== 'admin' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            Buat Laporan Baru
                        </button>
                    )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { key: 'all', label: 'Semua' },
                        { key: 'open', label: 'Baru' },
                        { key: 'in_progress', label: 'Diproses' },
                        { key: 'resolved', label: 'Selesai' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === tab.key
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {tab.label}
                            {counts[tab.key] !== undefined && (
                                <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
                                    {counts[tab.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Reports List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">sync</span>
                            <p className="mt-4 text-slate-500 font-medium">Memuat laporan...</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="p-12 text-center">
                            <span className="material-symbols-outlined text-6xl text-slate-300">task_alt</span>
                            <p className="mt-4 text-slate-500 font-medium">Tidak ada laporan</p>
                            <p className="text-slate-400 text-sm mt-1">Semua perangkat berjalan dengan baik!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {reports.map((report) => (
                                <div key={report.id} className="p-5 hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`size-12 rounded-xl flex items-center justify-center flex-shrink-0 ${report.category === 'hardware' ? 'bg-purple-100 text-purple-600' :
                                                report.category === 'software' ? 'bg-blue-100 text-blue-600' :
                                                    report.category === 'network' ? 'bg-cyan-100 text-cyan-600' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                <span className="material-symbols-outlined text-2xl">{getCategoryIcon(report.category)}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-slate-900">{report.title}</h3>
                                                    {getPriorityBadge(report.priority)}
                                                </div>
                                                <p className="text-slate-500 text-sm line-clamp-2">{report.description}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                                    {userRole === 'admin' && (
                                                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                                            {report.reporter.name || report.reporter.username}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">meeting_room</span>
                                                        {report.lab.name}
                                                    </span>
                                                    {report.pcHostname && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">computer</span>
                                                            {report.pcHostname}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                        {formatDate(report.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {userRole === 'admin' ? (
                                                <select
                                                    value={report.status}
                                                    onChange={(e) => handleStatusChange(report.id, e.target.value)}
                                                    disabled={updatingId === report.id}
                                                    className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${updatingId === report.id ? 'opacity-50' : ''} ${report.status === 'open' ? 'bg-red-50 border-red-200 text-red-700' :
                                                        report.status === 'in_progress' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                            report.status === 'resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                                'bg-slate-50 border-slate-200 text-slate-600'
                                                        }`}
                                                >
                                                    <option value="open">🔴 Baru</option>
                                                    <option value="in_progress">🟡 Diproses</option>
                                                    <option value="resolved">🟢 Selesai</option>
                                                    <option value="closed">⚫ Ditutup</option>
                                                </select>
                                            ) : (
                                                getStatusBadge(report.status)
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Report Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Buat Laporan Masalah</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* PC Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">PC Bermasalah (Opsional)</label>
                                <select
                                    value={formData.pcId}
                                    onChange={(e) => setFormData({ ...formData, pcId: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                >
                                    <option value="">-- Masalah Umum Lab --</option>
                                    {pcs.map(pc => (
                                        <option key={pc.id} value={pc.id}>{pc.hostname}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category & Priority */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                    >
                                        <option value="hardware">🔧 Hardware</option>
                                        <option value="software">💻 Software</option>
                                        <option value="network">🌐 Jaringan</option>
                                        <option value="other">❓ Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Prioritas</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                    >
                                        <option value="low">Rendah</option>
                                        <option value="medium">Sedang</option>
                                        <option value="high">Tinggi</option>
                                        <option value="critical">Kritis</option>
                                    </select>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Judul Masalah</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Contoh: Monitor tidak menyala"
                                    required
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Deskripsi Detail</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Jelaskan masalah secara detail..."
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-lg">send</span>
                                            Kirim Laporan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
