export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api-cbt.vercel.app";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

function resolveAuthToken(normalizedPath: string): string | null {
  if (typeof window === "undefined") return null;

  const isStudentEndpoint =
    normalizedPath.startsWith("/api/exam") ||
    normalizedPath.startsWith("/api/auth/student");

  if (isStudentEndpoint) {
    return (
      localStorage.getItem("cbt_student_token") ||
      localStorage.getItem("cbt_token")
    );
  }

  const isAdminRoute = window.location.pathname.startsWith("/admin");
  const isAdminEndpoint =
    normalizedPath.startsWith("/api/ujian") ||
    normalizedPath.startsWith("/api/bank-soal") ||
    normalizedPath.startsWith("/api/proctoring") ||
    normalizedPath.startsWith("/api/nilai") ||
    normalizedPath.startsWith("/api/siswa");

  if (isAdminRoute || isAdminEndpoint) {
    return (
      localStorage.getItem("cbt_admin_token") ||
      localStorage.getItem("cbt_token")
    );
  }

  return (
    localStorage.getItem("cbt_student_token") ||
    localStorage.getItem("cbt_admin_token") ||
    localStorage.getItem("cbt_token")
  );
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

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return json as T;
}

