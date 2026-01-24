"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalPCs: number;
  activePCs: number;
  maintenancePCs: number;
  offlinePCs: number;
  osBreakdown: Array<{ name: string; count: number }>;
  locationBreakdown: Array<{ name: string; count: number }>;
  recentChanges: Array<{
    id: string;
    severity: string;
    message: string;
    subMessage: string;
    location: string;
    time: string;
    changeType: string;
  }>;
  dailyTrend?: Array<{ day: string; date: string; count: number }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('guru');
  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [selectedLabName, setSelectedLabName] = useState<string | null>(null);
  const [pcs, setPcs] = useState<any[]>([]);
  const [pcsLoading, setPcsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Session scheduling modal
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [pendingLab, setPendingLab] = useState<any>(null);
  const [sessionEndTime, setSessionEndTime] = useState<string>('');
  const [labStatus, setLabStatus] = useState<any>(null);
  const [sessionError, setSessionError] = useState<string>('');
  const [scheduledEndTime, setScheduledEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    // Let fetchUser handle all initialization based on role
    fetchUser();

    // Set up refresh interval
    const interval = setInterval(() => {
      const currentLabId = localStorage.getItem('activeLabId');
      if (currentLabId && userRole === 'guru') {
        fetchFilteredStats(currentLabId);
        fetchPCs(currentLabId);
      } else if (userRole === 'admin') {
        fetchStats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [userRole]);

  // Timer for session countdown and auto-end
  useEffect(() => {
    if (!scheduledEndTime) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = scheduledEndTime.getTime() - now.getTime();

      if (diff <= 0) {
        // Auto-end session
        handleEndSession();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}j ${minutes}m ${seconds}d`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}d`);
      } else {
        setTimeRemaining(`${seconds} detik`);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [scheduledEndTime]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success) {
        setUserRole(data.user.role);
        if (data.user.role === 'guru') {
          fetchLabs();
          // For Guru, load saved lab from localStorage
          const savedLabId = localStorage.getItem('activeLabId');
          const savedLabName = localStorage.getItem('activeLabName');
          const savedEndTime = localStorage.getItem('scheduledEndTime');
          if (savedLabId) {
            setSelectedLabId(savedLabId);
            setSelectedLabName(savedLabName);
            fetchFilteredStats(savedLabId);
            fetchPCs(savedLabId);
            if (savedEndTime) {
              setScheduledEndTime(new Date(savedEndTime));
            }
          } else {
            setLoading(false);
          }
        } else {
          // For Admin, clear any leftover Guru localStorage data and fetch all stats
          localStorage.removeItem('activeLabId');
          localStorage.removeItem('activeLabName');
          localStorage.removeItem('scheduledEndTime');
          setSelectedLabId(null);
          setSelectedLabName(null);
          fetchStats();
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await fetch('/api/labs');
      const data = await response.json();
      if (data.success) {
        setLabs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch labs:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredStats = async (labId: string) => {
    try {
      const response = await fetch(`/api/stats?labId=${labId}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch filtered stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPCs = async (labId: string) => {
    try {
      setPcsLoading(true);
      const response = await fetch(`/api/pcs?labId=${labId}`);
      const data = await response.json();
      if (data.success) {
        setPcs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch PCs:', error);
    } finally {
      setPcsLoading(false);
    }
  };

  const openSessionModal = async (lab: any) => {
    setPendingLab(lab);
    setSessionError('');

    // Set default end time to 2 hours from now (format for datetime-local)
    const defaultEnd = new Date();
    defaultEnd.setHours(defaultEnd.getHours() + 2);
    // Format: YYYY-MM-DDTHH:mm
    const formatted = defaultEnd.toISOString().slice(0, 16);
    setSessionEndTime(formatted);

    // Fetch lab status
    try {
      const response = await fetch(`/api/labs/status?labId=${lab.id}`);
      const data = await response.json();
      if (data.success) {
        setLabStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch lab status:', error);
    }

    setShowSessionModal(true);
  };

  const handleConfirmSession = async () => {
    if (!pendingLab || !sessionEndTime) return;

    // Parse datetime-local value directly
    const endTime = new Date(sessionEndTime);

    // Validate that end time is in the future
    if (endTime <= new Date()) {
      setSessionError('Waktu berakhir harus di masa depan');
      return;
    }

    setSessionError('');

    try {
      const response = await fetch('/api/teaching-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labId: pendingLab.id,
          labName: pendingLab.name,
          scheduledEndTime: endTime.toISOString()
        })
      });
      const data = await response.json();

      if (data.success) {
        setSelectedLabId(pendingLab.id);
        setSelectedLabName(pendingLab.name);
        setScheduledEndTime(endTime);
        localStorage.setItem('activeLabId', pendingLab.id);
        localStorage.setItem('activeLabName', pendingLab.name);
        localStorage.setItem('scheduledEndTime', endTime.toISOString());
        setShowSessionModal(false);
        setLoading(true);
        fetchFilteredStats(pendingLab.id);
        fetchPCs(pendingLab.id);
      } else {
        setSessionError(data.error || 'Gagal memulai sesi');
      }
    } catch (error) {
      console.error('Failed to start teaching session:', error);
      setSessionError('Terjadi kesalahan');
    }
  };

  const handleEndSession = async () => {
    // End teaching session
    try {
      await fetch('/api/teaching-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    } catch (error) {
      console.error('Failed to end teaching session:', error);
    }

    setSelectedLabId(null);
    setSelectedLabName(null);
    setScheduledEndTime(null);
    setTimeRemaining('');
    localStorage.removeItem('activeLabId');
    localStorage.removeItem('activeLabName');
    localStorage.removeItem('scheduledEndTime');
    fetchStats();
  };

  const handleRefresh = async () => {
    if (selectedLabId) {
      setIsRefreshing(true);
      await Promise.all([
        fetchFilteredStats(selectedLabId),
        fetchPCs(selectedLabId)
      ]);
      setIsRefreshing(false);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return { bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' };
      case 'warning': return { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' };
      default: return { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

  const getOSIcon = (os: string | null) => {
    if (!os) return "computer";
    const osLower = os.toLowerCase();
    if (osLower.includes("windows")) return "desktop_windows";
    if (osLower.includes("mac")) return "desktop_mac";
    if (osLower.includes("linux")) return "laptop_chromebook";
    return "computer";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Servis
          </span>
        );
      case "offline":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Offline
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="size-16 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
            <div className="absolute inset-0 size-16 rounded-full border-4 border-transparent border-r-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="text-center">
            <p className="text-slate-700 font-semibold">Memuat Dashboard</p>
            <p className="text-slate-400 text-sm mt-1">Mengambil data analitik...</p>
          </div>
        </div>
      </div>
    );
  }

  const defaultStats: DashboardStats = {
    totalPCs: 0, activePCs: 0, maintenancePCs: 0, offlinePCs: 0,
    osBreakdown: [], locationBreakdown: [], recentChanges: []
  };

  // For Guru with selected lab, calculate stats from filtered PCs
  let { totalPCs, activePCs, maintenancePCs, offlinePCs, osBreakdown, locationBreakdown, recentChanges } = stats || defaultStats;

  // Override with actual PC counts if Guru has selected a lab
  if (userRole === 'guru' && selectedLabId && pcs.length > 0) {
    totalPCs = pcs.length;
    activePCs = pcs.filter((pc: any) => pc.status === 'active').length;
    maintenancePCs = pcs.filter((pc: any) => pc.status === 'maintenance').length;
    offlinePCs = pcs.filter((pc: any) => pc.status === 'offline').length;

    // Calculate OS breakdown from pcs
    const osMap: { [key: string]: number } = {};
    pcs.forEach((pc: any) => {
      const os = pc.os || 'Unknown';
      osMap[os] = (osMap[os] || 0) + 1;
    });
    osBreakdown = Object.entries(osMap).map(([name, count]) => ({ name, count }));
  }

  const utilizationRate = totalPCs > 0 ? ((activePCs / totalPCs) * 100).toFixed(0) : '0';

  const osColors = ['from-indigo-500 to-indigo-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-cyan-500 to-cyan-600', 'from-emerald-500 to-emerald-600'];

  if (userRole === 'guru' && !selectedLabId) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Guru Welcome Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-8 shadow-2xl text-white">
            <div className="relative z-10">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase">Dashboard Guru</h1>
              <p className="mt-2 text-blue-100 font-medium max-w-xl">
                Silakan pilih Lab untuk memulai sesi monitoring perangkat hari ini.
              </p>
            </div>
          </div>

          {/* Lab Selection Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined">meeting_room</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Pilih Lab Mengajar</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.map((lab) => (
                <div key={lab.id} className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-blue-500 hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined text-[32px]">meeting_room</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-2xl font-black text-slate-900 leading-tight">{lab.pcCount || 0}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perangkat</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{lab.name}</h3>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2 italic">
                      {lab.description || 'Tidak ada deskripsi lab.'}
                    </p>

                    <button
                      onClick={() => openSessionModal(lab)}
                      className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 shadow-md transition-all active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[20px]">login</span>
                      Pilih Lab
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Session Scheduling Modal */}
        {showSessionModal && pendingLab && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <h3 className="text-lg font-bold">Mulai Sesi Monitoring</h3>
                <p className="text-blue-100 text-sm">{pendingLab.name}</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Lab Status */}
                {labStatus && (
                  <div className={`p-4 rounded-xl border ${labStatus.isFull ? 'bg-red-50 border-red-200' : labStatus.count > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-2xl ${labStatus.isFull ? 'text-red-600' : labStatus.count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {labStatus.isFull ? 'block' : labStatus.count > 0 ? 'group' : 'check_circle'}
                      </span>
                      <div>
                        <p className={`font-bold ${labStatus.isFull ? 'text-red-800' : labStatus.count > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                          {labStatus.isFull ? 'Lab Penuh!' : labStatus.count > 0 ? `${labStatus.count} Guru Aktif` : 'Lab Tersedia'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {labStatus.activeTeachers?.map((t: any) => t.name).join(', ') || 'Tidak ada guru aktif'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date Time Picker */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <span className="material-symbols-outlined text-lg align-middle mr-1">event</span>
                    Sesi Berakhir Sampai:
                  </label>
                  <input
                    type="datetime-local"
                    value={sessionEndTime}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setSessionEndTime(e.target.value)}
                    className="w-full px-4 py-3 text-lg font-bold text-center border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none"
                  />
                  <p className="text-slate-500 text-sm mt-2 text-center">
                    Sesi akan otomatis berakhir pada tanggal dan waktu ini
                  </p>
                </div>

                {/* Error Message */}
                {sessionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {sessionError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmSession}
                  disabled={labStatus?.isFull}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                  Mulai Sesi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 pt-2">
      <div className="w-full mx-auto flex flex-col gap-4">

        {/* Conditional Header for Active Session */}
        {userRole === 'guru' && selectedLabId ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-8 shadow-2xl text-white">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2 font-black text-emerald-200 uppercase tracking-[0.2em] text-[10px]">
                  <span className="flex size-2 bg-white rounded-full animate-ping"></span>
                  Sesi Aktif
                </div>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                  Monitoring: {selectedLabName}
                </h1>
                <p className="text-emerald-100 mt-2 text-sm lg:text-base font-medium">
                  Hanya menampilkan data untuk lab yang Anda pilih saat ini.
                </p>
                {timeRemaining && (
                  <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${scheduledEndTime && (scheduledEndTime.getTime() - new Date().getTime()) < 10 * 60 * 1000
                    ? 'bg-red-500/30 text-red-100 animate-pulse'
                    : 'bg-white/20 text-white'
                    }`}>
                    <span className="material-symbols-outlined text-lg">timer</span>
                    Sisa waktu: {timeRemaining}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-60"
                  title="Refresh data sekarang"
                >
                  <span className={`material-symbols-outlined text-xl ${isRefreshing ? 'animate-spin' : ''}`}>
                    {isRefreshing ? 'sync' : 'refresh'}
                  </span>
                  {isRefreshing ? 'Memuat...' : 'Refresh'}
                </button>
                <button
                  onClick={handleEndSession}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  Selesai / Ganti Lab
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 size-96 bg-white/5 rounded-full"></div>
          </div>
        ) : (
          /* Hero Header for Admin */
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Dashboard
                </h1>
                <p className="text-slate-400 mt-2 text-sm lg:text-base max-w-xl">
                  Ringkasan dan analitik perangkat komputer lab Anda.
                </p>
              </div>
              {userRole === 'admin' && (
                <div className="flex items-center gap-4">
                  <Link
                    href="/dashboard/pcs"
                    className="group flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-[1.02]"
                  >
                    <span className="material-symbols-outlined text-xl">devices</span>
                    <span>Lihat Semua</span>
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Fleet */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <span className="material-symbols-outlined text-white text-2xl">dns</span>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">TOTAL</span>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Komputer</p>
              <p className="text-4xl font-bold text-slate-900 tracking-tight">{totalPCs}</p>
            </div>
          </div>

          {/* Active */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{utilizationRate}%</span>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Aktif & Online</p>
              <p className="text-4xl font-bold text-slate-900 tracking-tight">{activePCs}</p>
            </div>
          </div>

          {/* Maintenance */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <span className="material-symbols-outlined text-white text-2xl">build</span>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">SERVIS</span>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Dalam Perbaikan</p>
              <p className="text-4xl font-bold text-slate-900 tracking-tight">{maintenancePCs}</p>
            </div>
          </div>

          {/* Offline */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <span className="material-symbols-outlined text-white text-2xl">power_off</span>
                </div>
                {offlinePCs > 0 ? (
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full animate-pulse">PERINGATAN</span>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">OK</span>
                )}
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Offline</p>
              <p className="text-4xl font-black text-slate-900 tracking-tight">{offlinePCs}</p>
            </div>
          </div>
        </div>

        {/* PC List for Active Session - Integrated into Dashboard */}
        {userRole === 'guru' && selectedLabId && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">grid_view</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Status Perangkat Real-time</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 capitalize">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500"></span> Online
                </div>
                <span className="text-slate-200">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-slate-300"></span> Offline
                </div>
              </div>
            </div>

            <div className="p-8">
              {pcsLoading ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined animate-spin text-4xl text-emerald-600">sync</span>
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Menyinkronkan Perangkat...</span>
                </div>
              ) : pcs.length === 0 ? (
                <div className="py-20 text-center text-slate-400 italic">
                  Belum ada perangkat yang terdeteksi di lab ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {pcs.map((pc) => (
                    <Link
                      key={pc.id}
                      href={`/dashboard/pcs/${pc.id}`}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all bg-slate-50/30 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`size-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${pc.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          <span className="material-symbols-outlined">computer</span>
                        </div>
                        {getStatusBadge(pc.status)}
                      </div>
                      <h4 className="font-black text-slate-900 text-base truncate mb-1 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{pc.hostname}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[14px]">{getOSIcon(pc.os)}</span>
                        {pc.os || 'N/A'}
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-300 uppercase italic">Specs detected</span>
                        <span className="text-[10px] font-black text-slate-700">{pc.rams?.[0]?.capacity || '0'}GB RAM</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts Grid - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Activity Trend - 7 Days */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined">bar_chart</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Aktivitas 7 Hari Terakhir</h3>
                    <p className="text-xs text-slate-500">Perubahan hardware yang terdeteksi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="material-symbols-outlined text-violet-500 text-lg">trending_up</span>
                  <span className="font-bold">{stats?.dailyTrend?.reduce((sum, d) => sum + d.count, 0) || 0} total</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.dailyTrend || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} width={30} />
                    <Tooltip
                      cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl">
                              <p className="font-bold text-violet-300 text-sm">{payload[0].payload.date}</p>
                              <p className="text-xl font-black">{payload[0].value} <span className="text-xs text-slate-300">aktivitas</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Status Online/Offline Chart */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                    <span className="material-symbols-outlined">wifi</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Status Koneksi</h3>
                    <p className="text-xs text-slate-500">Distribusi status perangkat</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="material-symbols-outlined text-emerald-500 text-lg">devices</span>
                  <span className="font-bold">{totalPCs} unit</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Online', value: activePCs, fill: '#10b981' },
                      { name: 'Maintenance', value: maintenancePCs, fill: '#f59e0b' },
                      { name: 'Offline', value: offlinePCs, fill: '#ef4444' },
                    ]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} width={30} />
                    <Tooltip
                      cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const percent = ((payload[0].value as number) / (totalPCs || 1) * 100).toFixed(0);
                          return (
                            <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl">
                              <p className="font-bold text-lg">{payload[0].payload.name}</p>
                              <p className="text-xl font-black">{payload[0].value} <span className="text-xs text-slate-300">unit</span> ({percent}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {[{ fill: '#10b981' }, { fill: '#f59e0b' }, { fill: '#ef4444' }].map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-600">{activePCs}</p>
                  <p className="text-xs text-slate-500 font-bold">Online</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-amber-600">{maintenancePCs}</p>
                  <p className="text-xs text-slate-500 font-bold">Maintenance</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-red-600">{offlinePCs}</p>
                  <p className="text-xs text-slate-500 font-bold">Offline</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity & Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity List */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Log Aktivitas Labs Hari Ini</h3>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {recentChanges.length > 0 ? recentChanges.map((alert, idx) => {
                const styles = getSeverityStyles(alert.severity);
                return (
                  <div key={idx} className="p-5 hover:bg-slate-50 transition-colors flex items-start gap-4 group">
                    <div className={`size-2.5 rounded-full ${styles.dot} mt-1.5 shrink-0 shadow-lg group-hover:scale-125 transition-transform`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${styles.text}`}>{alert.severity}</span>
                        <span className="text-slate-200 font-black">/</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{alert.location}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{alert.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tighter italic">Host: {alert.subMessage}</p>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(alert.time)}</span>
                  </div>
                );
              }) : (
                <div className="py-20 text-center flex flex-col items-center gap-4 grayscale opacity-40">
                  <span className="material-symbols-outlined text-6xl">verified</span>
                  <p className="text-xs font-black uppercase tracking-widest">Semua Sistem Lab Normal</p>
                </div>
              )}
            </div>
          </div>

          {/* OS Breakdown - Pie Chart */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <span className="material-symbols-outlined">pie_chart</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Distribusi OS</h3>
              </div>
            </div>
            <div className="p-6">
              {osBreakdown.length > 0 ? (
                <>
                  <div className="h-[250px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={osBreakdown.map((os, idx) => ({ ...os, fill: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'][idx % 5] }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="name"
                        >
                          {osBreakdown.map((_, idx) => (
                            <Cell key={idx} fill={['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'][idx % 5]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const percent = ((payload[0].value as number) / totalPCs * 100).toFixed(1);
                              return (
                                <div className="bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-xl">
                                  <p className="font-bold">{payload[0].name}</p>
                                  <p>{percent}% ({payload[0].value} unit)</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Label - Percentage of largest OS */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-3xl font-black text-slate-900">
                          {osBreakdown[0] ? ((osBreakdown[0].count / totalPCs) * 100).toFixed(0) : 0}%
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          {osBreakdown[0]?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    {osBreakdown.map((os, idx) => {
                      const percent = ((os.count / totalPCs) * 100).toFixed(0);
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <span
                            className="size-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'][idx % 5] }}
                          ></span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-slate-800">{os.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">{os.count} unit</span>
                                <span className="text-base font-black text-slate-900">{percent}%</span>
                              </div>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'][idx % 5]
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-400 italic text-xs">
                  Tidak ada data OS terdeteksi.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center justify-center gap-2 py-8 opacity-40 border-t border-slate-200 max-w-sm mx-auto">
          <div className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-900">Lab Master Analytics</div>
          <p className="text-[10px] font-bold text-slate-500 uppercase italic">Control Panel Version 2.4.0 • 2026</p>
        </div>
      </div>
    </div>
  );
}
