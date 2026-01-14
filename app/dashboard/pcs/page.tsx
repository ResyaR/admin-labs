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
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [pcToDelete, setPcToDelete] = useState<PC | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUser();
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
        alert('Failed to delete PC. Please try again.');
        return;
      }
      const data = await response.json();
      if (data.success) {
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

  const getOSIcon = (os: string | null) => {
    if (!os) return "computer";
    const osLower = os.toLowerCase();
    if (osLower.includes("windows")) return "desktop_windows";
    if (osLower.includes("mac")) return "desktop_mac";
    if (osLower.includes("linux")) return "laptop_chromebook";
    return "computer";
  };

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

  return (
    <div className="p-8">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              All PCs List
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Manage and monitor all computer specifications across school labs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
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
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="w-full lg:w-96">
              <div className="relative flex items-center h-10 w-full rounded-md bg-white border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/50 transition-all">
                <div className="flex items-center justify-center pl-3 pr-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">
                    search
                  </span>
                </div>
                <input
                  className="w-full h-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0"
                  placeholder="Search by ID, Model, or Serial Number"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <select className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                <option>OS: All</option>
                <option>Windows</option>
                <option>macOS</option>
                <option>Linux</option>
              </select>
              <select className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                <option>Location: All</option>
                <option>Science Lab A</option>
                <option>Media Lab</option>
                <option>Library Main</option>
              </select>
              <select className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                <option>Status: All</option>
                <option>Active</option>
                <option>Maintenance</option>
                <option>Offline</option>
              </select>
              <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>
              <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded transition-all ${viewMode === "table"
                    ? "bg-white shadow-sm text-primary-600"
                    : "hover:bg-slate-200 text-slate-500"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">table_rows</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-all ${viewMode === "grid"
                    ? "bg-white shadow-sm text-primary-600"
                    : "hover:bg-slate-200 text-slate-500"
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-12 px-4 py-3.5 text-left" scope="col">
                    <div className="flex items-center">
                      <input
                        className="rounded border-slate-300 bg-transparent text-primary-600 focus:ring-primary-500/50"
                        type="checkbox"
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[180px]" scope="col">
                    PC ID
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[200px]" scope="col">MODEL</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[180px]" scope="col">SPECS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[120px]" scope="col">LOCATION</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[100px]" scope="col">STATUS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[120px]" scope="col">LAST SEEN</th>
                  <th className="w-16 px-4 py-3.5 text-center" scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pcsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        <span>Loading PCs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPCs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
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
                        className={`hover:bg-slate-50 transition-colors ${hasWarnings ? 'bg-amber-50/30' : ''}`}
                      >
                        <td className="px-4 py-4">
                          <input
                            className="rounded border-slate-300 bg-transparent text-primary-600 focus:ring-primary-500/50"
                            type="checkbox"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-sm font-semibold text-slate-900">
                              {pc.hostname}
                            </div>
                            <div className="text-xs text-slate-500">
                              {pc.brand || 'Unknown Brand'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                              <span className="material-symbols-outlined text-[20px]">
                                {getOSIcon(pc.os)}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-slate-900 truncate max-w-[200px]" title={pc.cpu?.model || 'Unknown CPU'}>
                              {pc.cpu?.model || 'Unknown CPU'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="text-xs font-semibold text-slate-900">
                              {getRAMDisplay(pc.rams)}
                            </div>
                            <div className="text-xs text-slate-600">
                              {getStorageDisplay(pc.storages)} • {pc.os || 'Unknown'} {pc.osVersion || ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-slate-700">
                            {pc.location || 'Unassigned'}
                          </div>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(pc.status)}</td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-700">
                            {lastSeenFormatted}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/dashboard/pcs/${pc.id}`}
                              className="text-slate-400 hover:text-primary-600 transition-colors"
                              title="View Details"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(pc)}
                              className="text-slate-400 hover:text-red-600 transition-colors"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-sm text-slate-700">
            <span className="mr-2">Rows per page:</span>
            <select className="py-1 pl-2 pr-8 text-sm rounded bg-white border border-slate-300 text-slate-700 focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
            <span className="ml-4 font-medium">Showing 1-{filteredPCs.length} of {pcs.length}</span>
          </div>
          <div className="flex gap-1">
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-50 transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded bg-primary-600 text-white text-sm font-medium">
              1
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 text-slate-700 text-sm font-medium transition-colors">
              2
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 text-slate-700 text-sm font-medium transition-colors">
              3
            </button>
            <span className="flex items-center justify-center h-8 w-8 text-slate-500">...</span>
            <button className="flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
