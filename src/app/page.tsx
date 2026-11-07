"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  User,
  Key,
  ArrowRight,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState<"siswa" | "admin">("siswa");
  const [tokenInput, setTokenInput] = useState("MAT-8492");
  const [username, setUsername] = useState("210401889");
  const [password, setPassword] = useState("••••••••");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/ujian");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Decorative Blur Ambient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-sky-500/30 mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            CBT SEKOLAH
          </h1>
          <p className="text-xs text-sky-200/70 mt-1">
            Sistem Ujian Berbasis Komputer & Live Proctoring
          </p>
        </div>

        {/* Card Login */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-7 shadow-2xl border border-white/20">
          {/* Switch Role Tab */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setRole("siswa")}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                role === "siswa"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Peserta Siswa
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                role === "admin"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Guru & Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {role === "siswa" ? (
              <>
                {/* NISN Siswa */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Nomor Induk Siswa Nasional (NISN)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan 10 digit NISN..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                {/* Password / PIN Ujian */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Password / PIN Siswa
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                {/* Token Sesi Ujian */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 flex items-center justify-between">
                    <span>Token Ujian (Dari Pengawas)</span>
                    <span className="text-[10px] text-sky-600 font-semibold">
                      Contoh: MAT-8492
                    </span>
                  </label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                    placeholder="MAT-XXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-extrabold text-sky-600 tracking-wider uppercase focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                {/* Email / Username Guru */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Username / Email Pengajar
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      defaultValue="admin@sekolah.sch.id"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                {/* Password Guru */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      defaultValue="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Tombol Masuk */}
            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-xs transition shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              <span>{role === "siswa" ? "Mulai Pengerjaan Ujian" : "Masuk ke Dashboard Guru"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Links Demo */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <Link href="/admin" className="hover:text-sky-600 transition">
              Langsung Dashboard Admin →
            </Link>
            <Link href="/ujian" className="hover:text-sky-600 transition">
              Langsung Layar Siswa →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
