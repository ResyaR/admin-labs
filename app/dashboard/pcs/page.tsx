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

  // Filter states
  const [osFilter, setOsFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [pcToEdit, setPcToEdit] = useState<PC | null>(null);
  const [labs, setLabs] = useState<any[]>([]);
  const [editLocation, setEditLocation] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchPCs();
    fetchLabs();
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

  const fetchLabs = async () => {
    try {
      const response = await fetch('/api/labs');
      const data = await response.json();
      if (data.success) {
        setLabs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch labs:', error);
    }
  };

  const handleEditClick = (pc: PC) => {
    setPcToEdit(pc);
    setEditLocation(pc.location || "");
    setShowEditModal(true);
  };

  const handleEditConfirm = async () => {
    if (!pcToEdit) return;
    try {
      setUpdating(true);
      const response = await fetch(`/api/pcs/${pcToEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: editLocation || null,
          status: pcToEdit.status
        }),
      });
      if (!response.ok) {
        alert('Failed to update PC location.');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setPcs(pcs.map(pc => pc.id === pcToEdit.id ? { ...pc, location: editLocation } : pc));
        setShowEditModal(false);
        setPcToEdit(null);
      } else {
        alert(data.error || 'Failed to update PC');
      }
    } catch (error) {
      console.error('Error updating PC:', error);
      alert('An error occurred while updating PC');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setPcToEdit(null);
  };

  // Get unique filter values from data
  const uniqueOSes = Array.from(new Set(pcs.map(pc => pc.os).filter(Boolean))) as string[];
  const uniqueLocations = Array.from(new Set(pcs.map(pc => pc.location).filter(Boolean))) as string[];

  const filteredPCs = pcs.filter((pc) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        pc.hostname.toLowerCase().includes(query) ||
        pc.brand?.toLowerCase().includes(query) ||
        pc.cpu?.model.toLowerCase().includes(query) ||
        pc.location?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // OS filter
    if (osFilter !== "all" && pc.os !== osFilter) return false;

    // Location filter
    if (locationFilter !== "all" && pc.location !== locationFilter) return false;

    // Status filter
    if (statusFilter !== "all" && pc.status !== statusFilter) return false;

    return true;
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
    return totalCapacity > 0 ? `${totalCapacity}GB` : "Unknown";
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
          </div>
        </div>

        {/* Filters Bar - Fixed Alignment */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="w-full">
              <div className="relative flex items-center h-10 w-full max-w-md rounded-md bg-white border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <div className="flex items-center justify-center pl-3 pr-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">
                    search
                  </span>
                </div>
                <input
                  className="w-full h-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                  placeholder="Search by hostname, brand, CPU, location..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={osFilter}
                  onChange={(e) => setOsFilter(e.target.value)}
                  className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="all">OS: All</option>
                  {uniqueOSes.map(os => (
                    <option key={os} value={os}>{os}</option>
                  ))}
                </select>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="all">Location: All</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-4 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* View Toggle */}
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

        {/* Results Count */}
        {!pcsLoading && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Showing <span className="font-bold text-slate-900">{filteredPCs.length}</span> of <span className="font-bold text-slate-900">{pcs.length}</span> PCs
            </span>
            {(searchQuery || osFilter !== "all" || locationFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setOsFilter("all");
                  setLocationFilter("all");
                  setStatusFilter("all");
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">clear</span>
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Content - Table or Grid View */}
        {viewMode === "table" ? (
          <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left" scope="col">
                      <div className="flex items-center">
                        <input
                          className="rounded border-slate-400 bg-white text-blue-600 focus:ring-blue-500/50"
                          type="checkbox"
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider min-w-[180px]" scope="col">
                      PC ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider min-w-[200px]" scope="col">MODEL</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider min-w-[180px]" scope="col">SPECS</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider min-w-[120px]" scope="col">LOCATION</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider min-w-[100px]" scope="col">STATUS</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider min-w-[120px]" scope="col">LAST SEEN</th>
                    <th className="w-16 px-4 py-3 text-center" scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {pcsLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-600 font-medium">
                          <span className="material-symbols-outlined animate-spin">sync</span>
                          <span>Loading PCs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPCs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                          <span className="material-symbols-outlined text-4xl text-slate-400">computer</span>
                          <span className="font-medium text-slate-600">
                            {pcs.length === 0 ? "No PCs found. Start spec-detector to register PCs." : "No PCs match your filters."}
                          </span>
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
                          className={`hover:bg-slate-50 transition-colors ${hasWarnings ? 'bg-amber-50/50' : ''} border-b border-slate-100 last:border-0`}
                        >
                          <td className="px-4 py-4">
                            <input
                              className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/50"
                              type="checkbox"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-0.5">
                              <div className="text-sm font-bold text-slate-900">
                                {pc.hostname}
                              </div>
                              <div className="text-xs font-medium text-slate-500">
                                {pc.brand || 'Unknown Brand'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">
                                  {getOSIcon(pc.os)}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-slate-900 truncate max-w-[200px]" title={pc.cpu?.model || 'Unknown CPU'}>
                                {pc.cpu?.model || 'Unknown CPU'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block w-fit">
                                {getRAMDisplay(pc.rams)}
                              </div>
                              <div className="text-xs font-medium text-slate-600">
                                {getStorageDisplay(pc.storages)}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[150px]" title={`${pc.os || 'Unknown'} ${pc.osVersion || ''}`}>
                                {pc.os || 'Unknown'} {pc.osVersion || ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-bold text-slate-900">
                              {pc.location || 'Unassigned'}
                            </div>
                          </td>
                          <td className="px-4 py-4">{getStatusBadge(pc.status)}</td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-slate-600">
                              {lastSeenFormatted}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/dashboard/pcs/${pc.id}`}
                                className="p-1.5 rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                                title="View Details"
                              >
                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                              </Link>
                              <button
                                onClick={() => handleEditClick(pc)}
                                className="p-1.5 rounded-md hover:bg-amber-50 text-slate-600 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100"
                                title="Edit Location"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit_location</span>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(pc)}
                                className="p-1.5 rounded-md hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                title="Delete PC"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
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
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pcsLoading ? (
              <div className="col-span-full flex items-center justify-center py-20">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Loading PCs...</span>
                </div>
              </div>
            ) : filteredPCs.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">computer</span>
                <span className="font-medium text-slate-600">
                  {pcs.length === 0 ? "No PCs found. Start spec-detector to register PCs." : "No PCs match your filters."}
                </span>
              </div>
            ) : (
              filteredPCs.map((pc) => {
                const hasWarnings = (pc._count?.changes || 0) > 0;
                const lastSeenDate = new Date(pc.lastSeen);
                const lastSeenFormatted = lastSeenDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={pc.id}
                    className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all overflow-hidden group ${hasWarnings ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
                      }`}
                  >
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-900 truncate" title={pc.hostname}>
                            {pc.hostname}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {pc.brand || 'Unknown Brand'}
                          </p>
                        </div>
                        <div className="ml-2">{getStatusBadge(pc.status)}</div>
                      </div>

                      {/* OS Icon and CPU */}
                      <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                          <span className="material-symbols-outlined text-[24px]">
                            {getOSIcon(pc.os)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate" title={pc.cpu?.model}>
                            {pc.cpu?.model || 'Unknown CPU'}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {pc.cpu?.cores || 0} Cores
                          </div>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">RAM:</span>
                          <span className="font-bold text-slate-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                            {getRAMDisplay(pc.rams)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Storage:</span>
                          <span className="font-semibold text-slate-700 truncate ml-2" title={getStorageDisplay(pc.storages)}>
                            {getStorageDisplay(pc.storages)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Location:</span>
                          <span className="font-bold text-slate-900">
                            {pc.location || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>{lastSeenFormatted}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/pcs/${pc.id}`}
                            className="p-2 rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </Link>
                          <button
                            onClick={() => handleEditClick(pc)}
                            className="p-2 rounded-md hover:bg-amber-50 text-slate-600 hover:text-amber-600 transition-all"
                            title="Edit Location"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit_location</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(pc)}
                            className="p-2 rounded-md hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all"
                            title="Delete PC"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && pcToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">Confirm Delete</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-700">
                Are you sure you want to delete <span className="font-bold">{pcToDelete.hostname}</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete PC'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Location Modal */}
      {showEditModal && pcToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Edit PC Location</h3>
              <button onClick={handleEditCancel} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-sm font-semibold text-slate-900">{pcToEdit.hostname}</div>
                <div className="text-xs text-slate-500 mt-0.5">{pcToEdit.brand || 'Unknown Brand'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assign to Lab
                </label>
                <select
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">-- Unassigned --</option>
                  {labs.map(lab => (
                    <option key={lab.id} value={lab.name}>{lab.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">Select the physical lab/location for this device.</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={handleEditCancel}
                disabled={updating}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditConfirm}
                disabled={updating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
