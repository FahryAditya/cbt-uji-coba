"use client";

import React from "react";
import { useCBTAdminStore } from "@/stores/cbt-admin";
import {
  Activity,
  Layers,
  Calendar,
  Award,
  Settings,
  GraduationCap,
  LogOut,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { activeTab, setActiveTab } = useCBTAdminStore();
  const [userName, setUserName] = React.useState("Admin CBT");
  const [userRole, setUserRole] = React.useState("ADMIN");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cbt_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserName(parsed.nama || parsed.username || "Admin CBT");
          setUserRole(parsed.role || "ADMIN");
        } catch {}
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cbt_token");
      localStorage.removeItem("cbt_user");
      window.location.href = "/";
    }
  };

  interface NavItem {
    id: "proctoring" | "bank-soal" | "jadwal" | "nilai" | "settings";
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const navItems: NavItem[] = [
    { id: "proctoring", label: "Live Proctoring", icon: Activity, badge: "LIVE" },
    { id: "bank-soal", label: "Bank Soal", icon: Layers },
    { id: "jadwal", label: "Jadwal & Ujian", icon: Calendar },
    { id: "nilai", label: "Rekap Nilai", icon: Award },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <>
      {/* Backdrop overlay pada layar mobile/tablet */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-slate-800 text-sm tracking-tight leading-none">
                  CBT Sekolah
                </h1>
                <span className="text-[11px] font-semibold text-slate-400">
                  Admin & Proctor Portal
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Tutup menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose?.();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? "bg-sky-50 text-sky-600 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-sky-500" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bagian Bawah: Switch ke Halaman Siswa & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            href="/ujian"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition"
          >
            <span>Buka Layar Ujian Siswa</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <div
            onClick={handleLogout}
            title="Klik untuk keluar (Logout)"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50/70 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-slate-800 truncate">
                {userName}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Role: {userRole}
              </div>
            </div>
            <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-500" />
          </div>
        </div>
      </aside>
    </>
  );
}

