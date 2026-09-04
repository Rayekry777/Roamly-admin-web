export type AdminRole = "PLATFORM_ADMIN" | "MERCHANT_REVIEWER" | "FINANCE";
export type AdminStatus = "ACTIVE" | "DISABLED";

export interface AdminAuthToken {
  token: string;
  expiresInSeconds: number;
  forcePasswordChange: boolean;
}

export interface CurrentAdmin {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
  roleLabel: string;
  status: AdminStatus;
  statusLabel: string;
  permissions: string[];
  forcePasswordChange: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
  roleLabel: string;
  status: AdminStatus;
  statusLabel: string;
  forcePasswordChange: boolean;
  lastLoginTime?: string;
  version: number;
  createTime: string;
  updateTime: string;
}

export interface AdminUserQuery {
  keyword?: string;
  role?: AdminRole;
  status?: AdminStatus;
  page: number;
  size: number;
}

export interface AdminUserCreateInput {
  username: string;
  displayName: string;
  role: AdminRole;
  initialPassword: string;
}

export interface AdminUserUpdateInput {
  displayName: string;
  role: AdminRole;
  version: number;
}
