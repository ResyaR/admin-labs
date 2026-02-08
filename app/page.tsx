"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, assetUrl } from "@/lib/paths";

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
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Kredensial tidak valid");
        setLoading(false);
        return;
      }

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-[55%] relative">
        <img
          src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070"
          alt="Computer Lab"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/40"></div>

        {/* Content on Image */}
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          {/* Top Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-2">
              <img src={assetUrl("/logo.png")} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Admin Lab</span>
          </div>

          {/* Bottom Text - Simple */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Sistem Manajemen Lab
            </h1>
            <p className="text-slate-400 text-sm">
              Pantau dan kelola perangkat komputer lab
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 shadow-lg shadow-indigo-500/30">
              <img src={assetUrl("/logo.png")} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-slate-900 font-bold text-xl">Admin Lab</span>
          </div>

          {/* Welcome Text */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Masuk ke Akun</h2>
            <p className="text-slate-500">Silakan masuk untuk mengakses dashboard</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2.5" htmlFor="username">
                Nama Pengguna
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </span>
                <input
                  autoComplete="username"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-4 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-[15px] font-medium"
                  id="username"
                  name="username"
                  placeholder="Masukkan username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2.5" htmlFor="password">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-[22px]">lock</span>
                </span>
                <input
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-14 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-[15px] font-medium"
                  id="password"
                  name="password"
                  placeholder="Masukkan password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-100 text-red-600 text-sm px-4 py-3.5 rounded-xl flex items-center gap-3 font-medium">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400 font-medium">INFORMASI</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Sistem Berjalan Normal</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2026 Admin Lab • Semua Hak Dilindungi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
