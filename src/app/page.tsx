"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  User,
  Key,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  BookOpen,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useCBTExamStore } from "@/stores/cbt-exam";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState<"siswa" | "admin">("siswa");

  // Student entry fields (Nama, Kelas, Jurusan, Token)
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentMajor, setStudentMajor] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  // Admin / Guru login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { startExamWithToken } = useCBTExamStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (role === "admin") {
        const res = await apiRequest<{
          success: boolean;
          message?: string;
          data?: {
            token: string;
            user: {
              id: string;
              username: string;
              nama: string;
              role: "ADMIN" | "GURU" | "SISWA";
            };
          };
        }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
          }),
        });

        if (!res.data?.token) {
          throw new Error(res.message || "Gagal melakukan autentikasi");
        }
        if (res.data.user.role === "SISWA") {
          throw new Error("Akun siswa tidak memiliki hak akses Guru/Admin.");
        }

        localStorage.setItem("cbt_token", res.data.token);
        localStorage.setItem("cbt_user", JSON.stringify(res.data.user));
        router.push("/admin");
      } else {
        // Peserta Siswa: Nama Lengkap (persis DB), Kelas, Jurusan, Token Ujian
        if (!studentName.trim() || !studentClass.trim() || !studentMajor.trim() || !tokenInput.trim()) {
          throw new Error("Nama Lengkap, Kelas, Jurusan, dan Token Ujian wajib diisi.");
        }

        const res = await apiRequest<{
          success: boolean;
          message?: string;
          data?: {
            token: string;
            ujianId: string;
            user: {
              id: string;
              username: string;
              nama: string;
              role: "SISWA";
              kelas?: string;
              jurusan?: string;
              siswaProfile?: {
                nisn?: string;
                kelas?: { nama: string; jurusan?: string };
              };
            };
          };
        }>("/api/auth/student-enter", {
          method: "POST",
          body: JSON.stringify({
            nama: studentName, // dikirim persis sesuai ketikan user (exact match case-sensitive)
            kelas: studentClass.trim(),
            jurusan: studentMajor.trim(),
            tokenUjian: tokenInput.trim().toUpperCase(),
          }),
        });

        if (!res.data?.token) {
          throw new Error(res.message || "Gagal memverifikasi peserta ujian");
        }

        localStorage.setItem("cbt_token", res.data.token);
        localStorage.setItem("cbt_user", JSON.stringify(res.data.user));

        const examStart = await startExamWithToken(
          tokenInput.trim().toUpperCase(),
          res.data.ujianId
        );
        if (!examStart.success) {
          throw new Error(examStart.message || "Token ujian tidak valid atau sesi belum aktif.");
        }
        router.push("/ujian");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan saat masuk.");
    } finally {
      setIsLoading(false);
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
            Ujian Pendidikan Pancasila
          </h1>
          <p className="text-xs text-sky-200/70 mt-1">
            Sistem Ujian Berbasis Komputer & Live Proctoring
          </p>
        </div>

        {/* Card Login */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/20">
          {/* Switch Role Tab */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setRole("siswa");
                setErrorMessage(null);
              }}
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
              onClick={() => {
                setRole("admin");
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                role === "admin"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Guru & Admin
            </button>
          </div>

          {/* Alert Error */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {role === "siswa" ? (
              <>
                {/* Nama Lengkap Siswa */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Ketik nama lengkap persis sesuai data..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Harus sesuai dan sama persis dengan nama di database (termasuk huruf besar/kecil).
                  </p>
                </div>

                {/* Kelas & Jurusan */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600">
                      Kelas
                    </label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        placeholder="Contoh: XII"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600">
                      Jurusan
                    </label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={studentMajor}
                        onChange={(e) => setStudentMajor(e.target.value)}
                        placeholder="Contoh: MIPA / RPL"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Token Sesi Ujian */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 flex items-center justify-between">
                    <span>Token Ujian (Dari Pengawas)</span>
                    <span className="text-[10px] font-medium text-sky-600">
                      Berubah tiap 10 menit
                    </span>
                  </label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: CBT-4821"
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
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: admin atau guru"
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
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password admin..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      title={showPassword ? "Sembunyikan password" : "Lihat password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Tombol Masuk */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-70 text-white font-extrabold text-xs transition shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>
                    {role === "siswa"
                      ? "Mulai Pengerjaan Ujian"
                      : "Masuk ke Dashboard Guru"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
