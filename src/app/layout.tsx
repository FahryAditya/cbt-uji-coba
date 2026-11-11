import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ujian Pendidikan Pancasila - CBT",
  description: "Platform Ujian Berbasis Komputer Pendidikan Pancasila (Admin, Guru, dan Siswa)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-800 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
