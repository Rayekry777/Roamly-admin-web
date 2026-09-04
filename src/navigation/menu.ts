import {
  DataAnalysis,
  DocumentChecked,
  Files,
  Shop,
  User,
  Money,
} from "@element-plus/icons-vue";
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
  {
    path: "/merchant-applications",
    label: "商户申请",
    permission: "admin:merchant-application:review",
    icon: DocumentChecked,
  },
  {
    path: "/shops",
    label: "门店治理",
    permission: "admin:shop:govern",
    icon: Shop,
  },
  {
    path: "/voucher-reviews",
    label: "团购券审核",
    permission: "admin:voucher:review",
    icon: Files,
  },
  {
    path: "/finance",
    label: "资金账本",
    permission: "admin:commission:manage",
    icon: Money,
  },
];

export function visibleMenu(permissions: readonly string[]): MenuItem[] {
  const allowed = new Set(permissions);
  return adminMenu.filter((item) => allowed.has(item.permission));
}
