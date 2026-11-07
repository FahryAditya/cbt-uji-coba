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
} from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const { activeTab, setActiveTab } = useCBTAdminStore();

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
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Logo / Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
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

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-slate-800 truncate">
              Admin Sekolah
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              admin@sekolah.sch.id
            </div>
          </div>
          <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-500" />
        </div>
      </div>
    </aside>
  );
}

