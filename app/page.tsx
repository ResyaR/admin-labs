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
    <div className="bg-dark-base text-slate-300 font-body min-h-screen flex items-center justify-center selection:bg-brand selection:text-white overflow-hidden relative">
      <div className="absolute inset-0 noise-bg pointer-events-none opacity-20"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4"></div>
      <div className="w-full max-w-[460px] relative z-10 px-4">
        <div className="bg-dark-surface/60 backdrop-blur-xl border border-dark-border rounded-3xl p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute inset-0 noise-bg pointer-events-none opacity-10"></div>
          <div className="relative z-10 flex flex-col items-center justify-center text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)] mb-6 animate-float">
              <span className="material-symbols-outlined text-brand text-3xl">science</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">Admin Labs</h1>
            <p className="text-slate-500 text-sm">Specs Management Protocol</p>
          </div>
          <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
            <div className="group space-y-2">
              <label className="block text-xs font-mono font-medium text-slate-500 uppercase tracking-widest group-focus-within:text-brand transition-colors" htmlFor="username">
                Admin ID
              </label>
              <div className="relative">
                <input
                  autoComplete="username"
                  className="peer block w-full bg-dark-base/50 border border-dark-border rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all duration-300 font-mono text-sm"
                  id="username"
                  name="username"
                  placeholder="admin@labs.edu"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 peer-focus:text-brand transition-colors text-[20px] pointer-events-none">
                  badge
                </span>
              </div>
            </div>
            <div className="group space-y-2">
              <label className="block text-xs font-mono font-medium text-slate-500 uppercase tracking-widest group-focus-within:text-brand transition-colors" htmlFor="password">
                Passkey
              </label>
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className="peer block w-full bg-dark-base/50 border border-dark-border rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all duration-300 font-mono text-sm pr-12"
                  id="password"
                  name="password"
                  placeholder="••••••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors outline-none"
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
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <button
              className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transform active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 mt-4 group overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              <span className="relative z-10 font-display tracking-wide">
                {loading ? "Authenticating..." : "Authenticate"}
              </span>
              {!loading && (
                <span className="material-symbols-outlined relative z-10 text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              )}
              {loading && (
                <span className="material-symbols-outlined relative z-10 text-lg animate-spin">
                  sync
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            </button>
          </form>
          <div className="mt-10 relative z-10">
            <div className="flex flex-col items-center gap-4 text-center border-t border-dark-border/50 pt-6">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-dark-base/50 border border-dark-border text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                System Operational
              </div>
              <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                Restricted Access • Authorized Personnel Only
          </p>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
