export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api-cbt.vercel.app";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

function decodeJwtRole(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload?.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function getValidStudentToken(): string | null {
  if (typeof window === "undefined") return null;
  const studentTok = localStorage.getItem("cbt_student_token");
  if (studentTok && decodeJwtRole(studentTok) === "SISWA") {
    return studentTok;
  }

  // Fallback & migrasi otomatis hanya jika token legacy ber-role SISWA (blokir token ADMIN/GURU)
  const legacyTok = localStorage.getItem("cbt_token");
  if (legacyTok && decodeJwtRole(legacyTok) === "SISWA") {
    localStorage.setItem("cbt_student_token", legacyTok);
    const legacyUser = localStorage.getItem("cbt_user");
    if (legacyUser && !localStorage.getItem("cbt_student_user")) {
      localStorage.setItem("cbt_student_user", legacyUser);
    }
    return legacyTok;
  }
  return null;
}

export function getValidAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  const adminTok = localStorage.getItem("cbt_admin_token");
  const adminRole = decodeJwtRole(adminTok);
  if (adminTok && (adminRole === "ADMIN" || adminRole === "GURU")) {
    return adminTok;
  }

  const legacyTok = localStorage.getItem("cbt_token");
  const legacyRole = decodeJwtRole(legacyTok);
  if (legacyTok && (legacyRole === "ADMIN" || legacyRole === "GURU")) {
    localStorage.setItem("cbt_admin_token", legacyTok);
    const legacyUser = localStorage.getItem("cbt_user");
    if (legacyUser && !localStorage.getItem("cbt_admin_user")) {
      localStorage.setItem("cbt_admin_user", legacyUser);
    }
    return legacyTok;
  }
  return null;
}

function resolveAuthToken(normalizedPath: string): string | null {
  if (typeof window === "undefined") return null;

  // Endpoint login publik tidak boleh melampirkan Authorization token sesi sebelumnya
  if (
    normalizedPath === "/api/auth/login" ||
    normalizedPath === "/api/auth/student-enter"
  ) {
    return null;
  }

  const isStudentEndpoint =
    normalizedPath.startsWith("/api/exam") ||
    normalizedPath.startsWith("/api/auth/student");

  if (isStudentEndpoint || window.location.pathname.startsWith("/ujian")) {
    return getValidStudentToken();
  }

  const isAdminRoute = window.location.pathname.startsWith("/admin");
  const isAdminEndpoint =
    normalizedPath.startsWith("/api/ujian") ||
    normalizedPath.startsWith("/api/bank-soal") ||
    normalizedPath.startsWith("/api/proctoring") ||
    normalizedPath.startsWith("/api/nilai") ||
    normalizedPath.startsWith("/api/siswa");

  if (isAdminRoute || isAdminEndpoint) {
    return getValidAdminToken();
  }

  return getValidStudentToken() || getValidAdminToken();
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const token = resolveAuthToken(normalizedPath);

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${normalizedPath}`;
  const method = (options.method || "GET").toUpperCase();
  const maxAttempts = method === "GET" ? 3 : 1;

  let res: Response | null = null;
  let lastNetworkError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      res = await fetch(url, {
        ...options,
        headers,
      });
      lastNetworkError = null;
      break;
    } catch (err) {
      lastNetworkError = err;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 350));
      }
    }
  }

  if (!res) {
    const detail =
      lastNetworkError instanceof Error ? lastNetworkError.message : "Network error";
    throw new Error(
      `Gagal terhubung ke server API (${detail}). Periksa koneksi internet Anda atau coba muat ulang.`
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return json as T;
}

