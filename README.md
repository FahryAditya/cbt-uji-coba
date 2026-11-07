# CBT Sekolah (Computer-Based Test)

Aplikasi Ujian Berbasis Komputer (CBT) modern untuk sekolah yang terdiri dari Frontend (Next.js) dan Backend (Express.js + Prisma ORM).

---

## 🏗 Arsitektur Proyek

```text
cbt-sekolah/
├── Backend/                 # REST API Server (Express.js + TypeScript + Prisma)
│   ├── prisma/              # Schema & migrasi database PostgreSQL
│   ├── src/                 # Controllers, routes, middlewares, services
│   └── package.json
├── src/                     # Client Web App (Next.js 16 + React 19)
│   ├── app/                 # Next.js App Router
│   ├── components/          # Reusable UI components & providers
│   └── stores/              # State management (Zustand)
├── public/                  # Static assets
└── package.json
```

---

## 🛠 Tech Stack

### Frontend (Root)
- **Framework:** Next.js 16 (App Router) & React 19
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand & TanStack React Query v5
- **Icons & Animation:** Lucide React & Motion

### Backend (`/Backend`)
- **Runtime & Framework:** Node.js, Express.js & TypeScript
- **ORM & Database:** Prisma 7 + PostgreSQL (`@prisma/adapter-pg`)
- **Keamanan & Validasi:** Argon2 (password hashing), Zod (schema validation)

---

## 🚀 Memulai Pengembangan

### 1. Backend API
```bash
cd Backend
npm install
# Buat file .env dan atur koneksi DATABASE_URL
npm run prisma:generate
npm run dev
```
Backend berjalan di: `http://localhost:5000`

### 2. Frontend Web App
```bash
# Dari root cbt-sekolah
npm install
npm run dev
```
Frontend berjalan di: `http://localhost:3000`
