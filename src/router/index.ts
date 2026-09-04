import type { Pinia } from "pinia";
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

import { useAuthStore } from "@/stores/auth";

declare module "vue-router" {
  interface RouteMeta {
    public?: boolean;
    permission?: string;
    title?: string;
  }
}

export const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: { public: true, title: "登录" },
  },
  {
    path: "/force-password",
    name: "force-password",
    component: () => import("@/views/ForcePasswordView.vue"),
    meta: { title: "修改密码" },
  },
  {
    path: "/",
    component: () => import("@/layouts/AdminLayout.vue"),
    children: [
      { path: "", redirect: "/dashboard" },
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("@/views/DashboardView.vue"),
        meta: { title: "运营摘要", permission: "admin:dashboard:read" },
      },
      {
        path: "admin-users",
        name: "admin-users",
        component: () => import("@/views/AdminUsersView.vue"),
        meta: { title: "管理员账号", permission: "admin:user:manage" },
      },
      {
        path: "merchant-applications",
        name: "merchant-applications",
        component: () => import("@/views/MerchantApplicationsView.vue"),
        meta: {
          title: "商户申请",
          permission: "admin:merchant-application:review",
        },
      },
      {
        path: "shops",
        name: "shops",
        component: () => import("@/views/ShopsView.vue"),
        meta: { title: "门店治理", permission: "admin:shop:govern" },
      },
      {
        path: "voucher-reviews",
        name: "voucher-reviews",
        component: () => import("@/views/VoucherReviewsView.vue"),
        meta: { title: "团购券审核", permission: "admin:voucher:review" },
      },
      {
        path: "finance",
        name: "finance",
        component: () => import("@/views/FinanceView.vue"),
        meta: { title: "资金账本", permission: "admin:commission:manage" },
      },
      {
        path: "orders",
        name: "orders",
        component: () => import("@/views/OrdersView.vue"),
        meta: { title: "订单查询", permission: "admin:trade:read" },
      },
      {
        path: "refunds",
        name: "refunds",
        component: () => import("@/views/RefundsView.vue"),
        meta: { title: "退款处理", permission: "admin:refund:manage" },
      },
      {
        path: "redemptions",
        name: "redemptions",
        component: () => import("@/views/RedemptionsView.vue"),
        meta: { title: "核销审计", permission: "admin:trade:read" },
      },
      {
        path: "settlements",
        name: "settlements",
        component: () => import("@/views/SettlementsView.vue"),
        meta: { title: "结算批次", permission: "admin:settlement:manage" },
      },
      {
        path: "audit-logs",
        name: "audit-logs",
        component: () => import("@/views/AuditLogsView.vue"),
        meta: { title: "操作审计", permission: "admin:audit:read" },
      },
      {
        path: "forbidden",
        name: "forbidden",
        component: () => import("@/views/ForbiddenView.vue"),
        meta: { title: "无权访问" },
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
];

export function createAppRouter(pinia: Pinia) {
  const router = createRouter({ history: createWebHistory(), routes });
  router.beforeEach(async (to) => {
    const auth = useAuthStore(pinia);
    if (to.meta.public) {
      if (!auth.isAuthenticated) return true;
      try {
        await auth.loadCurrent();
        return auth.forcePasswordChange ? "/force-password" : "/dashboard";
      } catch {
        auth.clearSession();
        return true;
      }
    }
    if (!auth.isAuthenticated)
      return { path: "/login", query: { redirect: to.fullPath } };
    try {
      await auth.loadCurrent();
    } catch {
      auth.clearSession();
      return { path: "/login", query: { redirect: to.fullPath } };
    }
    if (auth.forcePasswordChange && to.name !== "force-password")
      return "/force-password";
    if (!auth.forcePasswordChange && to.name === "force-password")
      return "/dashboard";
    if (!auth.hasPermission(to.meta.permission)) return "/forbidden";
    return true;
  });
  router.afterEach((to) => {
    document.title = `${to.meta.title ?? "运营工作台"} | Roamly`;
  });
  return router;
}
