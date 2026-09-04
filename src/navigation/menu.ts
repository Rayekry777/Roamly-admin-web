import { DataAnalysis, User } from "@element-plus/icons-vue";
import type { Component } from "vue";

export interface MenuItem {
  path: string;
  label: string;
  permission: string;
  icon: Component;
}

export const adminMenu: MenuItem[] = [
  {
    path: "/dashboard",
    label: "运营摘要",
    permission: "admin:dashboard:read",
    icon: DataAnalysis,
  },
  {
    path: "/admin-users",
    label: "管理员账号",
    permission: "admin:user:manage",
    icon: User,
  },
];

export function visibleMenu(permissions: readonly string[]): MenuItem[] {
  const allowed = new Set(permissions);
  return adminMenu.filter((item) => allowed.has(item.permission));
}
