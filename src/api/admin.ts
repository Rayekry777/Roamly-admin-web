import { http } from "@/api/client";
import type {
  AdminAuthToken,
  AdminUser,
  AdminUserCreateInput,
  AdminUserQuery,
  AdminUserUpdateInput,
  CurrentAdmin,
} from "@/types/admin";
import type { PageResult } from "@/types/http";

export function loginAdmin(
  username: string,
  password: string,
): Promise<AdminAuthToken> {
  return http.post("/v1/admin/auth/login", { username, password });
}

export function getCurrentAdmin(): Promise<CurrentAdmin> {
  return http.get("/v1/admin/auth/me");
}

export function logoutAdmin(): Promise<void> {
  return http.post("/v1/admin/auth/logout");
}

export function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return http.put("/v1/admin/auth/password", { currentPassword, newPassword });
}

export function listAdminUsers(
  query: AdminUserQuery,
): Promise<PageResult<AdminUser>> {
  return http.get("/v1/admin/users", { params: query });
}

export function createAdminUser(
  input: AdminUserCreateInput,
): Promise<AdminUser> {
  return http.post("/v1/admin/users", input);
}

export function updateAdminUser(
  id: string,
  input: AdminUserUpdateInput,
): Promise<AdminUser> {
  return http.put(`/v1/admin/users/${id}`, input);
}

export function activateAdminUser(id: string, version: number): Promise<void> {
  return http.post(`/v1/admin/users/${id}/activation`, { version });
}

export function disableAdminUser(id: string, version: number): Promise<void> {
  return http.post(`/v1/admin/users/${id}/disablement`, { version });
}

export function resetAdminUserPassword(
  id: string,
  newPassword: string,
  version: number,
): Promise<void> {
  return http.post(`/v1/admin/users/${id}/password-reset`, {
    newPassword,
    version,
  });
}
