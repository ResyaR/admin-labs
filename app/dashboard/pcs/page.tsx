"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
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
  rams: Array<{
    manufacturer: string | null;
    model: string | null;
    capacity: string | null;
    type: string | null;
  }>;
  storages: Array<{
    manufacturer: string | null;
    model: string | null;
    size: string | null;
    type: string | null;
  }>;
  _count?: {
    changes: number;
  };
}

export default function AllPCsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [pcsLoading, setPcsLoading] = useState(true);
  const [selectedPC, setSelectedPC] = useState<PC | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pcDetail, setPcDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [pcToDelete, setPcToDelete] = useState<PC | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Fetch user data
    fetchUser();
    // Fetch PCs data
    fetchPCs();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchPCs = async () => {
    try {
      setPcsLoading(true);
      const response = await fetch('/api/pcs');
      if (!response.ok) {
        console.error('Failed to fetch PCs');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setPcs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch PCs:', error);
    } finally {
      setPcsLoading(false);
    }
  };

  const fetchPCDetail = async (pcId: string) => {
    try {
      setDetailLoading(true);
      const response = await fetch(`/api/pcs/${pcId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch PC detail:', response.status, errorData);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setPcDetail(data.data);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch PC detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDetailClick = async (pc: PC) => {
    setSelectedPC(pc);
    setShowDetailModal(true);
    await fetchPCDetail(pc.id);
  };

  const handleDeleteClick = (pc: PC) => {
    setPcToDelete(pc);
    setDeleteConfirmModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pcToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/pcs/${pcToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to delete PC:', errorData);
        alert('Failed to delete PC. Please try again.');
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Remove PC from list
        setPcs(pcs.filter(pc => pc.id !== pcToDelete.id));
        setDeleteConfirmModal(false);
        setPcToDelete(null);
      } else {
        alert(data.error || 'Failed to delete PC');
      }
    } catch (error) {
      console.error('Error deleting PC:', error);
      alert('An error occurred while deleting PC');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmModal(false);
    setPcToDelete(null);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Pastikan cookie dikirim
      });

      // Hapus cookie di client juga (backup)
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';

      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        console.error('Logout failed');
        // Tetap redirect meskipun ada error
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Tetap redirect meskipun ada error
      router.push('/');
    }
  };

  // Filter PCs berdasarkan search query
  const filteredPCs = pcs.filter((pc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      pc.hostname.toLowerCase().includes(query) ||
      pc.brand?.toLowerCase().includes(query) ||
      pc.cpu?.model.toLowerCase().includes(query) ||
      pc.location?.toLowerCase().includes(query)
    );
  });

  // Helper function untuk mendapatkan icon berdasarkan OS
  const getOSIcon = (os: string | null) => {
    if (!os) return "computer";
    const osLower = os.toLowerCase();
    if (osLower.includes("windows")) return "desktop_windows";
    if (osLower.includes("mac")) return "desktop_mac";
    if (osLower.includes("linux")) return "laptop_chromebook";
    return "computer";
  };

  // Helper function untuk format RAM
  const getRAMDisplay = (rams: PC["rams"]) => {
    if (!rams || rams.length === 0) return "Unknown";
    const totalCapacity = rams
      .map((ram) => {
        const capacity = ram.capacity || "";
        const match = capacity.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .reduce((sum, val) => sum + val, 0);
    return totalCapacity > 0 ? `${totalCapacity}GB RAM` : "Unknown";
  };

  // Helper function untuk format Storage
  const getStorageDisplay = (storages: PC["storages"]) => {
    if (!storages || storages.length === 0) return "Unknown";
    return storages
      .map((s) => s.size || "Unknown")
      .filter((s) => s !== "Unknown")
      .join(", ") || "Unknown";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Maintenance
          </span>
        );
      case "offline":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Offline
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              All PCs List
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage and monitor all computer specifications across school labs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined text-[18px]">file_upload</span>
              Export Data
            </button>
            <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm transition-colors">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add New PC
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="w-full lg:w-96">
              <div className="relative flex items-center h-10 w-full rounded-md bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/50 transition-all">
                <div className="flex items-center justify-center pl-3 pr-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">
                    search
                  </span>
                </div>
                <input
                  className="w-full h-full bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0"
                  placeholder="Search by ID, Model, or Serial Number"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <select className="h-10 px-4 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                <option>OS: All</option>
                <option>Windows</option>
                <option>macOS</option>
                <option>Linux</option>
              </select>
              <select className="h-10 px-4 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                <option>Location: All</option>
                <option>Science Lab A</option>
                <option>Media Lab</option>
                <option>Library Main</option>
              </select>
              <select className="h-10 px-4 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                <option>Status: All</option>
                <option>Active</option>
                <option>Maintenance</option>
                <option>Offline</option>
              </select>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
              <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-md border border-slate-200 dark:border-slate-600">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded transition-all ${viewMode === "table"
                    ? "bg-white dark:bg-slate-800 shadow-sm text-primary-600 dark:text-primary-400"
                    : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">table_rows</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-all ${viewMode === "grid"
                    ? "bg-white dark:bg-slate-800 shadow-sm text-primary-600 dark:text-primary-400"
                    : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-visible">
            <table className="w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="w-12 px-3 py-4 text-left" scope="col">
                    <div className="flex items-center gap-2">
                      <input
                        className="rounded border-slate-300 dark:border-slate-600 bg-transparent text-primary-600 dark:text-primary-400 focus:ring-primary-500/50"
                        type="checkbox"
                      />
                    </div>
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors group min-w-[180px]"
                    scope="col"
                  >
                    <div className="flex items-center gap-1">
                      PC ID
                      <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100">
                        unfold_more
                      </span>
                    </div>
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[200px]"
                    scope="col"
                  >
                    Model
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[180px]"
                    scope="col"
                  >
                    Specs
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[120px]"
                    scope="col"
                  >
                    Location
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[100px]"
                    scope="col"
                  >
                    Status
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[120px]"
                    scope="col"
                  >
                    Last Seen
                  </th>
                  <th className="w-16 px-4 py-4 text-center" scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                {pcsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        <span>Loading PCs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPCs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-4xl">computer</span>
                        <span>No PCs found. Start spec-detector to register PCs.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPCs.map((pc) => {
                    const hasWarnings = (pc._count?.changes || 0) > 0;
                    const lastSeenDate = new Date(pc.lastSeen);
                    const lastSeenFormatted = lastSeenDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <tr
                        key={pc.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group ${hasWarnings ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                          }`}
                      >
                        <td className="px-3 py-4">
                          <input
                            className="rounded border-slate-300 dark:border-slate-600 bg-transparent text-primary-600 dark:text-primary-400 focus:ring-primary-500/50"
                            type="checkbox"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {pc.hostname}
                            </div>
                            {hasWarnings && (
                              <span className="material-symbols-outlined text-amber-500 text-[16px] flex-shrink-0" title="Component changes detected">
                                warning
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {pc.brand || 'Unknown Brand'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center min-w-0">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3 text-slate-500 dark:text-slate-300 flex-shrink-0">
                              <span className="material-symbols-outlined text-[18px]">
                                {getOSIcon(pc.os)}
                              </span>
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-200 truncate" title={pc.cpu?.model || 'Unknown CPU'}>
                              {pc.cpu?.model || 'Unknown CPU'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded w-fit">
                              {getRAMDisplay(pc.rams)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate" title={`${getStorageDisplay(pc.storages)} • ${pc.os || 'Unknown OS'} ${pc.osVersion || ''}`}>
                              {getStorageDisplay(pc.storages)} • {pc.os || 'Unknown OS'} {pc.osVersion || ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-500 dark:text-slate-400 truncate" title={pc.location || 'Unassigned'}>
                            {pc.location || 'Unassigned'}
                          </div>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(pc.status)}</td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {lastSeenFormatted}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDetailClick(pc)}
                              className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              title="View Details"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(pc)}
                              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete PC"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-4">
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <span className="mr-2">Rows per page:</span>
            <select className="py-1 pl-2 pr-8 text-sm rounded bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
            <span className="ml-4">Showing 1-{filteredPCs.length} of {pcs.length}</span>
          </div>
          <div className="flex gap-1">
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50 transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded bg-primary-600 text-white text-sm font-medium">
              1
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors">
              2
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors">
              3
            </button>
            <span className="flex items-center justify-center h-8 w-8 text-slate-500">...</span>
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {
        showDetailModal && selectedPC && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-6xl max-h-[90vh] bg-[#0f1114] rounded-lg border border-[#2a2e37] shadow-2xl overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#2a2e37] bg-[#16181d]">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold font-mono text-white">
                    {selectedPC.hostname}
                  </h2>
                  <div className="px-2 py-0.5 border border-[#00f3ff]/30 bg-[#00f3ff]/10 text-[#00f3ff] text-xs font-bold uppercase tracking-wider rounded-sm">
                    Active Node
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPC(null);
                    setPcDetail(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#050607]">
                {detailLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-4xl text-[#00f3ff] animate-spin mb-4">
                        sync
                      </span>
                      <p className="text-slate-400">Loading details...</p>
                    </div>
                  </div>
                ) : pcDetail ? (
                  <div className="space-y-6">
                    {/* Spec Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* CPU Card */}
                      <div className="bg-[#0f1114] p-1 relative overflow-hidden group border border-white/5 hover:border-[#00f3ff]/30 transition-all rounded-sm">
                        <div className="relative z-10 bg-[#16181d]/50 p-5 h-full flex flex-col justify-between backdrop-blur-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-[#5d677a] text-xs font-bold uppercase tracking-widest">Processor</h3>
                              <p className="text-xl font-bold text-white mt-1 group-hover:text-[#00f3ff] transition-colors font-mono tracking-tight">
                                {pcDetail.cpu?.model || 'Unknown'}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-4xl text-[#2a2e37] group-hover:text-[#00f3ff]/20 transition-colors">memory</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end text-xs font-mono">
                              <span className="text-[#5d677a]">CLOCK</span>
                              <span className="text-[#00f3ff] font-bold">{pcDetail.cpu?.clock || '-'}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-[#5d677a] font-mono uppercase">
                              <span>Cores: <span className="text-white">{pcDetail.cpu?.cores || '-'}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* RAM Card */}
                      <div className="bg-[#0f1114] p-1 relative overflow-hidden group border border-white/5 hover:border-[#bc13fe]/30 transition-all rounded-sm">
                        <div className="relative z-10 bg-[#16181d]/50 p-5 h-full flex flex-col justify-between backdrop-blur-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-[#5d677a] text-xs font-bold uppercase tracking-widest">Memory</h3>
                              <p className="text-xl font-bold text-white mt-1 group-hover:text-[#bc13fe] transition-colors font-mono tracking-tight">
                                {pcDetail.rams && pcDetail.rams.length > 0
                                  ? `${pcDetail.rams[0].manufacturer || ''} ${pcDetail.rams[0].model || ''}`.trim() || 'Unknown'
                                  : 'Unknown'}
                              </p>
                              <p className="text-sm text-[#5d677a] mt-0.5 font-mono">
                                {pcDetail.rams && pcDetail.rams.length > 0
                                  ? `${pcDetail.rams[0].capacity || ''} ${pcDetail.rams[0].type || ''}`.trim() || '-'
                                  : '-'}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-4xl text-[#2a2e37] group-hover:text-[#bc13fe]/20 transition-colors">developer_board</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end text-xs font-mono">
                              <span className="text-[#5d677a]">TOTAL</span>
                              <span className="text-[#bc13fe] font-bold">
                                {pcDetail.rams?.reduce((sum: number, ram: any) => {
                                  const match = (ram.capacity || '').match(/(\d+)/);
                                  return sum + (match ? parseInt(match[1]) : 0);
                                }, 0) || 0}GB
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-[#5d677a] font-mono uppercase">
                              <span>Slots: <span className="text-white">{pcDetail.rams?.length || 0}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Storage Card */}
                      <div className="bg-[#0f1114] p-1 relative overflow-hidden group border border-white/5 hover:border-[#00ff9d]/30 transition-all rounded-sm">
                        <div className="relative z-10 bg-[#16181d]/50 p-5 h-full flex flex-col justify-between backdrop-blur-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-[#5d677a] text-xs font-bold uppercase tracking-widest">Storage</h3>
                              <p className="text-xl font-bold text-white mt-1 group-hover:text-[#00ff9d] transition-colors font-mono tracking-tight">
                                {pcDetail.storages && pcDetail.storages.length > 0
                                  ? `${pcDetail.storages[0].manufacturer || ''} ${pcDetail.storages[0].model || ''}`.trim() || 'Unknown'
                                  : 'Unknown'}
                              </p>
                              <p className="text-sm text-[#5d677a] mt-0.5 font-mono">
                                {pcDetail.storages && pcDetail.storages.length > 0
                                  ? `${pcDetail.storages[0].size || ''} ${pcDetail.storages[0].type || ''} ${pcDetail.storages[0].interface || ''}`.trim() || '-'
                                  : '-'}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-4xl text-[#2a2e37] group-hover:text-[#00ff9d]/20 transition-colors">hard_drive</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end text-xs font-mono">
                              <span className="text-[#5d677a]">CAPACITY</span>
                              <span className="text-[#00ff9d] font-bold">
                                {pcDetail.storages?.reduce((sum: number, storage: any) => {
                                  const match = (storage.size || '').match(/(\d+)/);
                                  return sum + (match ? parseInt(match[1]) : 0);
                                }, 0) || 0}GB
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-[#5d677a] font-mono uppercase">
                              <span>Drives: <span className="text-white">{pcDetail.storages?.length || 0}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* System Card */}
                      <div className="bg-[#0f1114] p-1 relative overflow-hidden group border border-white/5 hover:border-white/30 transition-all rounded-sm">
                        <div className="relative z-10 bg-[#16181d]/50 p-5 h-full flex flex-col justify-between backdrop-blur-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-[#5d677a] text-xs font-bold uppercase tracking-widest">System</h3>
                              <p className="text-xl font-bold text-white mt-1 font-mono tracking-tight">
                                {pcDetail.os || 'Unknown'}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-4xl text-[#2a2e37] group-hover:text-white/20 transition-colors">window</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end text-xs font-mono">
                              <span className="text-[#5d677a]">VERSION</span>
                              <span className="text-white font-bold">{pcDetail.osVersion || '-'}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-[#5d677a] font-mono uppercase">
                              <span>Build: <span className="text-white">{pcDetail.osBuild || '-'}</span></span>
                              <span>Arch: <span className="text-white">{pcDetail.arch || '-'}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hardware Matrix & Network */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Hardware Matrix */}
                      <div className="lg:col-span-2 bg-[#0f1114] relative shadow-lg border border-[#2a2e37] rounded-sm">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#00f3ff]/20"></div>
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2a2e37]">
                            <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-3 text-white">
                              <span className="material-symbols-outlined text-[#00f3ff]">settings_input_component</span>
                              Hardware Matrix
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                            <div className="group">
                              <p className="text-[#00f3ff]/70 text-xs font-mono uppercase tracking-widest mb-1 group-hover:text-[#00f3ff] transition-colors">Motherboard Interface</p>
                              <p className="text-white text-lg font-bold tracking-wide">{pcDetail.motherboard?.model || 'Unknown'}</p>
                              <p className="text-[#5d677a] text-sm font-mono mt-1">BIOS: - <span className="text-[#2a2e37]">|</span> DATE: -</p>
                            </div>
                            <div className="group">
                              <p className="text-[#00f3ff]/70 text-xs font-mono uppercase tracking-widest mb-1 group-hover:text-[#00f3ff] transition-colors">Graphics Processing</p>
                              <p className="text-white text-lg font-bold tracking-wide">{pcDetail.gpu?.model || 'Unknown'}</p>
                              <p className="text-[#5d677a] text-sm font-mono mt-1">- <span className="text-[#2a2e37]">|</span> DRIVER: -</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Network */}
                      <div className="bg-[#0f1114] p-6 shadow-lg border border-[#2a2e37] rounded-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-3 text-white">
                            <span className="material-symbols-outlined text-[#00f3ff]">lan</span>
                            Network Uplink
                          </h3>
                          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-sm">
                            <span className="size-1.5 rounded-full bg-[#00ff9d] animate-pulse"></span>
                            <span className="text-[#00ff9d] text-xs font-bold font-mono tracking-wider">CONNECTED</span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse font-mono text-sm">
                            <thead>
                              <tr className="text-[#5d677a] text-xs uppercase tracking-wider">
                                <th className="py-3 font-normal pl-2">Interface</th>
                                <th className="py-3 font-normal">IPv4</th>
                                <th className="py-3 font-normal text-right pr-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="text-white/90">
                              {pcDetail.networks && pcDetail.networks.length > 0 ? (
                                pcDetail.networks.map((net: any, idx: number) => (
                                  <tr key={idx} className="border-t border-[#2a2e37]">
                                    <td className="py-3 pl-2">{net.name}</td>
                                    <td className="py-3">{net.ipv4 || '-'}</td>
                                    <td className="py-3 text-right pr-2">
                                      <span className={`text-xs ${net.isUp ? 'text-[#00ff9d]' : 'text-[#ff2a2a]'}`}>
                                        {net.isUp ? 'UP' : 'DOWN'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={3} className="py-4 text-center text-[#5d677a]">No network interfaces</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* RAM & Storage Details */}
                    {(pcDetail.rams && pcDetail.rams.length > 0) || (pcDetail.storages && pcDetail.storages.length > 0) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* RAM Details */}
                        {pcDetail.rams && pcDetail.rams.length > 0 && (
                          <div className="bg-[#0f1114] p-6 border border-[#2a2e37] rounded-sm">
                            <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-3 text-white mb-4">
                              <span className="material-symbols-outlined text-[#bc13fe]">developer_board</span>
                              RAM Modules
                            </h3>
                            <div className="space-y-3">
                              {pcDetail.rams.map((ram: any, idx: number) => (
                                <div key={idx} className="bg-[#16181d] p-3 rounded-sm border border-[#2a2e37]">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="text-white font-bold text-sm">
                                        Slot {ram.slotIndex !== null ? ram.slotIndex : idx}
                                      </p>
                                      <p className="text-[#5d677a] text-xs font-mono mt-1">
                                        {ram.manufacturer || 'Unknown'} {ram.model || ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-4 text-xs text-[#5d677a] font-mono">
                                    <span>Capacity: <span className="text-white">{ram.capacity || '-'}</span></span>
                                    <span>Type: <span className="text-white">{ram.type || '-'}</span></span>
                                    {ram.speed && <span>Speed: <span className="text-white">{ram.speed}</span></span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Storage Details */}
                        {pcDetail.storages && pcDetail.storages.length > 0 && (
                          <div className="bg-[#0f1114] p-6 border border-[#2a2e37] rounded-sm">
                            <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-3 text-white mb-4">
                              <span className="material-symbols-outlined text-[#00ff9d]">hard_drive</span>
                              Storage Devices
                            </h3>
                            <div className="space-y-3">
                              {pcDetail.storages.map((storage: any, idx: number) => (
                                <div key={idx} className="bg-[#16181d] p-3 rounded-sm border border-[#2a2e37]">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="text-white font-bold text-sm">
                                        Drive {storage.diskIndex !== null ? storage.diskIndex : idx}
                                      </p>
                                      <p className="text-[#5d677a] text-xs font-mono mt-1">
                                        {storage.manufacturer || 'Unknown'} {storage.model || ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-4 text-xs text-[#5d677a] font-mono">
                                    <span>Size: <span className="text-white">{storage.size || '-'}</span></span>
                                    <span>Type: <span className="text-white">{storage.type || '-'}</span></span>
                                    {storage.interface && <span>Interface: <span className="text-white">{storage.interface}</span></span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <p>No details available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        deleteConfirmModal && pcToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">
                      warning
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Delete PC
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Are you sure you want to delete <span className="font-semibold">{pcToDelete.hostname}</span>?
                    All associated data including CPU, GPU, RAM, Storage, and Network information will be permanently deleted.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
