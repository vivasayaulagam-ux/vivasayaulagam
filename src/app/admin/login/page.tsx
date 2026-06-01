"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, User, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter username and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        router.replace("/admin");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fdf4] via-[#f8fafc] to-[#e8f5e9] px-4">
      {/* Background decorative circles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#1F6B3B]/8 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#1F6B3B]/6 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_32px_80px_-20px_rgba(31,107,59,0.22),0_8px_24px_-12px_rgba(0,0,0,0.1)] border border-white p-8">
          
          {/* Logo & Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-[#1F6B3B]/15 shadow-lg flex items-center justify-center mb-4 overflow-hidden">
              <img
                src="/logo.png"
                alt="Vivasaya Ulagam"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-[#1F6B3B]" strokeWidth={2} />
              <span className="text-xs font-bold text-[#1F6B3B] uppercase tracking-[0.16em]">
                Admin Portal
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 text-center leading-tight">
              Vivasaya Ulagam
            </h1>
            <p className="text-xs text-gray-400 mt-1">Sign in to manage your store</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-semibold text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                />
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none transition-all focus:border-[#1F6B3B] focus:ring-2 focus:ring-[#1F6B3B]/10 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                />
                <input
                  id="admin-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none transition-all focus:border-[#1F6B3B] focus:ring-2 focus:ring-[#1F6B3B]/10 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0 border-0 bg-transparent cursor-pointer"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-[#1F6B3B] hover:bg-[#185430] text-white py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_8px_24px_-8px_rgba(31,107,59,0.55)] hover:shadow-[0_12px_28px_-8px_rgba(31,107,59,0.7)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-2 border-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" strokeWidth={2.5} />
                  Signing in…
                </>
              ) : (
                <>
                  <ShieldCheck size={16} strokeWidth={2.5} />
                  Sign In to Admin
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-[11px] text-gray-400 font-medium">
            This portal is restricted to administrators only.
          </p>
        </div>

        {/* Bottom brand */}
        <p className="text-center text-xs text-gray-400 mt-5 font-medium">
          © {new Date().getFullYear()} Vivasaya Ulagam · Agri Products
        </p>
      </div>
    </div>
  );
}
