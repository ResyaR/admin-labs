"use client";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Total PCs Overview
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Real-time status of computer lab infrastructure.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
              System Online
            </span>
            <button className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Provision New PC
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Fleet */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-primary-600"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Fleet
                </p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                  1,240
                </h3>
              </div>
              <div className="p-2 bg-primary-50 rounded-md">
                <span className="material-symbols-outlined text-primary-600">
                  computer
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                1.2%
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </div>

          {/* Online & Active */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1 bg-green-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Online & Active
                </p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                  1,100
                </h3>
              </div>
              <div className="p-2 bg-green-50 rounded-md">
                <span className="material-symbols-outlined text-green-600">
                  wifi
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">
                88.7% Utilization rate
              </span>
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1 bg-warning"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Maintenance
                </p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                  40
                </h3>
              </div>
              <div className="p-2 bg-orange-50 rounded-md">
                <span className="material-symbols-outlined text-orange-500">build_circle</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-warning h-1.5 rounded-full" style={{ width: "15%" }}></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">2 critical repairs needed</p>
          </div>

          {/* Warranty Expiring */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1 bg-danger"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Warranty Expiring
                </p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                  15
                </h3>
              </div>
              <div className="p-2 bg-red-50 rounded-md">
                <span className="material-symbols-outlined text-danger">verified_user</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-danger font-medium bg-red-50 px-1.5 py-0.5 rounded">
                Action required
              </span>
              <span className="text-slate-400">within 30 days</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribution by Location */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-card flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Distribution by Location
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Asset allocation across campus facilities
                </p>
              </div>
              <button className="text-primary-600 hover:text-primary-700 text-xs font-medium border border-primary-100 bg-primary-50 px-3 py-1.5 rounded-md transition-colors">
                Full Report
              </button>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="space-y-5">
                {[
                  { name: "Main Library", units: 320, width: 65, color: "bg-primary-600" },
                  {
                    name: "Computer Lab A (Science)",
                    units: 450,
                    width: 85,
                    color: "bg-indigo-500",
                  },
                  {
                    name: "Computer Lab B (Arts)",
                    units: 280,
                    width: 55,
                    color: "bg-sky-500",
                  },
                  {
                    name: "Staff & Admin Offices",
                    units: 190,
                    width: 35,
                    color: "bg-slate-500",
                  },
                ].map((location, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                      <span className="text-slate-700">
                        {location.name}
                      </span>
                      <span>{location.units} Units</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-sm h-3 overflow-hidden">
                      <div
                        className={`${location.color} h-full rounded-sm transition-all duration-500 group-hover:opacity-80`}
                        style={{ width: `${location.width}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OS Breakdown */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-card flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                OS Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Operating System versions
              </p>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center justify-center">
              <div className="relative size-40 mb-6">
                <div
                  className="size-full rounded-full"
                  style={{
                    background:
                      "conic-gradient(#3b82f6 0% 80%, #a855f7 80% 95%, #f97316 95% 100%)",
                  }}
                ></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-slate-900">80%</span>
                  <span className="text-[10px] uppercase text-slate-400 font-semibold">
                    Win 11
                  </span>
                </div>
              </div>
              <div className="w-full space-y-3">
                {[
                  { name: "Windows 11", count: 992, color: "bg-blue-500" },
                  { name: "Windows 10", count: 186, color: "bg-purple-500" },
                  { name: "Linux / Other", count: 62, color: "bg-orange-500" },
                ].map((os, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`size-3 rounded-full ${os.color}`}></span>
                      <span className="text-slate-700">{os.name}</span>
                    </div>
                    <span className="font-medium text-slate-900">
                      {os.count}
                    </span>
                  </div>
                ))}
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
                Recent System Alerts
              </h3>
              <button className="text-slate-500 hover:text-slate-700 text-xs font-medium">
                Clear All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 border-b border-slate-200">
                    <th className="px-6 py-3 bg-slate-50">Severity</th>
                    <th className="px-6 py-3 bg-slate-50">Alert Message</th>
                    <th className="px-6 py-3 bg-slate-50">Location</th>
                    <th className="px-6 py-3 bg-slate-50 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {[
                    {
                      severity: "Critical",
                      severityClass: "bg-red-100 text-red-800",
                      message: "Low Memory Warning",
                      subMessage: "PC-LAB-04 running at 95% RAM",
                      location: "Lab B (Arts)",
                      time: "10:42 AM",
                    },
                    {
                      severity: "Warning",
                      severityClass:
                        "bg-amber-100 text-amber-800",
                      message: "OS Update Pending",
                      subMessage: "15 machines waiting for KB5034441",
                      location: "Main Library",
                      time: "09:15 AM",
                    },
                    {
                      severity: "Info",
                      severityClass:
                        "bg-blue-100 text-blue-800",
                      message: "New Hardware Registered",
                      subMessage: "Dell Optiplex 7090 (x5) added",
                      location: "Staff Room",
                      time: "Yesterday",
                    },
                  ].map((alert, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${alert.severityClass}`}
                        >
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
                        {alert.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fleet Growth */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-card p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Fleet Growth
              </h3>
              <select className="bg-slate-50 border-none text-xs rounded px-2 py-1 text-slate-600 focus:ring-0 cursor-pointer">
                <option>2023</option>
                <option>2022</option>
              </select>
            </div>
            <div className="flex-1 relative min-h-[150px]">
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 300 100"
              >
                <line
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  x1="0"
                  x2="300"
                  y1="100"
                  y2="100"
                ></line>
                <line
                  stroke="#e2e8f0"
                  strokeDasharray="4"
                  strokeWidth="1"
                  x1="0"
                  x2="300"
                  y1="50"
                  y2="50"
                ></line>
                <defs>
                  <linearGradient id="growthGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"></stop>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path
                  d="M0,80 C50,75 80,90 120,60 S200,40 300,20"
                  fill="url(#growthGradient)"
                  stroke="none"
                ></path>
                <path
                  d="M0,80 C50,75 80,90 120,60 S200,40 300,20"
                  fill="none"
                  stroke="#3b82f6"
                  strokeLinecap="round"
                  strokeWidth="2"
                ></path>
                <circle cx="0" cy="80" fill="#3b82f6" r="3"></circle>
                <circle cx="120" cy="60" fill="#3b82f6" r="3"></circle>
                <circle cx="300" cy="20" fill="#fff" r="4" stroke="#3b82f6" strokeWidth="2"></circle>
              </svg>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-wide text-slate-400 mt-2">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>
            <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-900">Note:</span> Budget
                approved for 50 new workstations in Q3.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 mb-4 text-center">
          <p className="text-xs text-slate-400">
            © 2024 School IT Administration System. v2.4.1
          </p>
        </div>
      </div>
    </div>
  );
}
