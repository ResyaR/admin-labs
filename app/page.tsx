"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      if (data.success) {
        // Store user data in localStorage or session
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-white">
      {/* Custom Animations & Styles */}
      <style jsx global>{`
        @keyframes mesh-gradient {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(25px, -35px) scale(1.1); }
          66% { transform: translate(-15px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .mesh-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: mesh-gradient 15s infinite ease-in-out;
        }
      `}</style>

      {/* Dynamic Mesh Gradient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="mesh-circle w-[600px] h-[600px] bg-indigo-500 top-[-20%] left-[-10%] blur-[120px]"></div>
        <div className="mesh-circle w-[500px] h-[500px] bg-blue-400 bottom-[-10%] right-[-5%] delay-700 blur-[100px]"></div>
        <div className="mesh-circle w-[400px] h-[400px] bg-brand bottom-1/4 left-1/4 delay-1000 blur-[90px]"></div>
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute inset-0 z-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#6366f1 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}></div>
      </div>

      <div className="w-full max-w-[460px] relative z-10">
        <div className="bg-white/80 backdrop-blur-3xl border border-white rounded-[2.5rem] p-10 sm:p-12 shadow-[0_30px_100px_rgba(99,102,241,0.1)] relative group shadow-brand/5 border-slate-100">

          <div className="flex flex-col items-center mb-10 text-center animate-in fade-in zoom-in duration-700">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-brand/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-24 h-24 rounded-[1.75rem] bg-white border border-slate-100 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.04)] flex items-center justify-center relative z-10 transform group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                <img src="/logo.png" alt="Admin Labs Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-display font-semibold text-slate-900 tracking-tight mb-2">Management Console</h1>
            <p className="text-slate-500 text-sm font-light max-w-[200px]">Secure Terminal for Hardware Telemetry</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-500 delay-100">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em] ml-1" htmlFor="username">
                Identification Tag
              </label>
              <div className="relative">
                <input
                  autoComplete="username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-950 placeholder-slate-300 focus:outline-none focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all duration-300 text-sm shadow-sm"
                  id="username"
                  name="username"
                  placeholder="Terminal Access ID"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors text-xl pointer-events-none">
                  alternate_email
                </span>
              </div>
            </div>

            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-500 delay-200">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em] ml-1" htmlFor="password">
                Security Passkey
              </label>
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-950 placeholder-slate-300 focus:outline-none focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all duration-300 text-sm shadow-sm pr-14"
                  id="password"
                  name="password"
                  placeholder="Authorization Passphrase"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors rounded-xl hover:bg-white shadow-sm hover:shadow-md border border-transparent hover:border-slate-100"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50/50 backdrop-blur-md border border-red-100 text-red-500 text-xs px-5 py-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                </div>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              className="group w-full bg-slate-900 hover:bg-slate-950 active:scale-[0.98] text-white font-semibold py-4.5 rounded-2xl shadow-xl shadow-slate-200 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale mt-4 relative overflow-hidden"
              type="submit"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out -translate-x-full"></div>
              <span className="font-display tracking-wider relative z-10 transition-transform group-hover:-translate-x-1 duration-300">
                {loading ? "Verifying..." : "Initialize Dashboard Session"}
              </span>
              {!loading && (
                <span className="material-symbols-outlined text-lg opacity-60 group-hover:translate-x-1 transition-transform duration-300 relative z-10">lock_open</span>
              )}
              {loading && (
                <span className="material-symbols-outlined text-lg animate-spin relative z-10 font-light">sync</span>
              )}
            </button>
          </form>

          <footer className="mt-12 flex flex-col items-center gap-6 border-t border-slate-100 pt-10 animate-in fade-in duration-1000 delay-500">
            <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-20"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Status: Active
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[9px] text-slate-300 font-mono text-center leading-loose tracking-[0.4em] uppercase">
                Internal Ops • Secure Connection Established
              </p>
              <div className="flex items-center gap-4 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
                <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
