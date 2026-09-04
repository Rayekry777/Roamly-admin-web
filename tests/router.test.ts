import { createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentAdmin } from "@/api/admin";
import { createAppRouter } from "@/router";
import type { CurrentAdmin } from "@/types/admin";
import { TOKEN_KEY } from "@/utils/session";

vi.mock("@/api/admin", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/api/admin")>();
  return { ...original, getCurrentAdmin: vi.fn() };
});

const platformAdmin: CurrentAdmin = {
  id: "1",
  username: "admin",
  displayName: "平台管理员",
  role: "PLATFORM_ADMIN",
  roleLabel: "平台超级管理员",
  status: "ACTIVE",
  statusLabel: "已启用",
  permissions: ["admin:dashboard:read", "admin:user:manage"],
  forcePasswordChange: false,
};

describe("管理端路由守卫", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.mocked(getCurrentAdmin).mockReset();
  });

  it("未登录时跳转登录并保留目标地址", async () => {
    const router = createAppRouter(createPinia());
    await router.push("/admin-users");
    await router.isReady();
    expect(router.currentRoute.value.path).toBe("/login");
    expect(router.currentRoute.value.query.redirect).toBe("/admin-users");
  });

  it("强制改密账号不能进入业务页面", async () => {
    localStorage.setItem(TOKEN_KEY, "admin-token");
    vi.mocked(getCurrentAdmin).mockResolvedValue({
      ...platformAdmin,
      forcePasswordChange: true,
    });
    const router = createAppRouter(createPinia());
    await router.push("/dashboard");
    await router.isReady();
    expect(router.currentRoute.value.path).toBe("/force-password");
  });

  it("无页面权限时进入无权访问页", async () => {
    localStorage.setItem(TOKEN_KEY, "finance-token");
    vi.mocked(getCurrentAdmin).mockResolvedValue({
      ...platformAdmin,
      role: "FINANCE",
      roleLabel: "财务管理员",
      permissions: ["admin:dashboard:read"],
    });
    const router = createAppRouter(createPinia());
    await router.push("/admin-users");
    await router.isReady();
    expect(router.currentRoute.value.path).toBe("/forbidden");
  });

  it("商户审核员可以进入申请和门店治理页面", async () => {
    localStorage.setItem(TOKEN_KEY, "reviewer-token");
    vi.mocked(getCurrentAdmin).mockResolvedValue({
      ...platformAdmin,
      role: "MERCHANT_REVIEWER",
      roleLabel: "商户审核员",
      permissions: [
        "admin:dashboard:read",
        "admin:merchant-application:review",
        "admin:shop:govern",
      ],
    });
    const router = createAppRouter(createPinia());
    await router.push("/merchant-applications");
    await router.isReady();
    expect(router.currentRoute.value.path).toBe("/merchant-applications");
    await router.push("/shops");
    expect(router.currentRoute.value.path).toBe("/shops");
  });
});
