"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-amber-100 text-amber-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  // Fallback defaults if stats is null (shouldn't happen after loading, but safe practice)
  const defaultStats: DashboardStats = {
    totalPCs: 0,
    activePCs: 0,
    maintenancePCs: 0,
    offlinePCs: 0,
    osBreakdown: [],
    locationBreakdown: [],
    recentChanges: []
  };

  const { totalPCs, activePCs, maintenancePCs, offlinePCs, osBreakdown, locationBreakdown, recentChanges } = stats || defaultStats;

  const utilizationRate = totalPCs > 0 ? ((activePCs / totalPCs) * 100).toFixed(1) : '0';

  // Bright colors for charts
  const chartColors = ["bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-emerald-500", "bg-pink-500"];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-medium tracking-tight text-slate-900">
              Operational Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Real-time hardware telemetry and asset monitoring.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
            <Link href="/dashboard/pcs" className="bg-brand hover:brightness-110 text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-brand/10 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">list</span>
              Full Inventory
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Fleet */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 relative overflow-hidden group hover:border-brand/20 transition-all">
            <div className="absolute left-0 top-0 h-1 w-full bg-brand"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Total Fleet
                </p>
                <h3 className="text-4xl font-display font-medium text-slate-950 tracking-tight">
                  {totalPCs}
                </h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-brand/5 group-hover:border-brand/10 transition-colors">
                <span className="material-symbols-outlined text-brand text-[24px]">
                  computer
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Registered Nodes
            </div>
          </div>

          {/* Online & Active */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
            <div className="absolute left-0 top-0 h-1 w-full bg-emerald-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Online & Active
                </p>
                <h3 className="text-4xl font-display font-medium text-slate-950 tracking-tight">
                  {activePCs}
                </h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                <span className="material-symbols-outlined text-emerald-600 text-[24px]">
                  wifi
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600">
                {utilizationRate}% Capacity
              </span>
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 relative overflow-hidden group hover:border-amber-500/20 transition-all">
            <div className="absolute left-0 top-0 h-1 w-full bg-amber-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Maintenance
                </p>
                <h3 className="text-4xl font-display font-medium text-slate-950 tracking-tight">
                  {maintenancePCs}
                </h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                <span className="material-symbols-outlined text-amber-500 text-[24px]">build_circle</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalPCs > 0 ? (maintenancePCs / totalPCs) * 100 : 0}%` }}></div>
            </div>
          </div>

          {/* Offline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 relative overflow-hidden group hover:border-red-500/20 transition-all">
            <div className="absolute left-0 top-0 h-1 w-full bg-red-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Offline Nodes
                </p>
                <h3 className="text-4xl font-display font-medium text-slate-950 tracking-tight">
                  {offlinePCs}
                </h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                <span className="material-symbols-outlined text-red-500 text-[24px]">cloud_off</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase tracking-widest ${offlinePCs > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {offlinePCs > 0 ? 'Attention Required' : 'All Clear'}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribution by Location */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-300 shadow-md flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Distribution by Location
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Asset allocation across facilities
                </p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center bg-white">
              {locationBreakdown.length > 0 ? (
                <div className="space-y-6">
                  {locationBreakdown.map((location, idx) => (
                    <div key={idx} className="group">
                      <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                        <span>{location.name || "Unassigned"}</span>
                        <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{location.count} Units</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200 shadow-inner">
                        <div
                          className={`bg-primary-600 h-full rounded-full transition-all duration-500 shadow-sm`}
                          style={{ width: `${(location.count / totalPCs) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm font-medium bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
                  No location data available
                </div>
              )}
            </div>
          </div>

          {/* OS Breakdown */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-md flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">
                OS Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Operating System versions
              </p>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-white">
              <div className="relative size-48 mb-6">
                <div className="size-full rounded-full border-[1.5rem] border-slate-100 border-t-primary-500 border-r-purple-500 transform -rotate-45 shadow-sm"></div>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-extrabold text-slate-900">{stats?.osBreakdown[0] ? Math.round((stats.osBreakdown[0].count / totalPCs) * 100) : 0}%</span>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mt-1">
                    Dominant OS
                  </span>
                </div>
              </div>
              <div className="w-full space-y-4">
                {osBreakdown.map((os, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`size-3 rounded-full ${chartColors[idx % chartColors.length]} ring-2 ring-white shadow-sm`}></span>
                      <span className="text-slate-700 font-medium truncate max-w-[140px]" title={os.name}>{os.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                      {os.count}
                    </span>
                  </div>
                ))}
                {osBreakdown.length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-xs italic">No OS data captured</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts and Growth */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent System Alerts */}
          <div className="xl:col-span-2 bg-white rounded-lg border border-slate-200 shadow-card flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">
                  notifications_active
                </span>
                Recent Activity / Alerts
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 border-b border-slate-200">
                    <th className="px-6 py-3 bg-slate-50">Severity</th>
                    <th className="px-6 py-3 bg-slate-50">Event</th>
                    <th className="px-6 py-3 bg-slate-50">Location</th>
                    <th className="px-6 py-3 bg-slate-50 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {recentChanges.length > 0 ? recentChanges.map((alert, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-900">
                          {alert.message}
                        </div>
                        <div className="text-xs text-slate-500">{alert.subMessage}</div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {alert.location}
                      </td>
                      <td className="px-6 py-3 text-right text-slate-500 text-xs font-mono">
                        {formatDate(alert.time)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                        No recent alerts or changes detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fleet Stats */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-card p-6 flex flex-col justify-center items-center text-center">
            <div className="size-16 bg-blue-50 text-primary-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">insights</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">System Status</h3>
            <p className="text-sm text-slate-500 mb-6">
              All monitoring systems are operational. Data is sinking in real-time.
            </p>
            <div className="w-full bg-slate-50 rounded-lg border border-slate-100 p-4">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-500">Database Health</span>
                <span className="text-green-600 font-bold">Optimal</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-[98%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 mb-8 flex flex-col items-center gap-4">
          <div className="h-px w-24 bg-slate-200"></div>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.25em]">
            Admin Labs • Protocol v2.5.0 • 2026
          </p>
        </div>
      </div>
    </div>
  );
}
