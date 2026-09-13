import { describe, expect, it } from "vitest";

import { routes } from "@/router";

describe("Roamly 管理端工程基线", () => {
  it("注册阶段 16 与阶段 19 管理页面", () => {
    const names = routes.flatMap((route) => [
      route.name,
      ...(route.children?.map((child) => child.name) ?? []),
    ]);
    expect(names).toEqual(
      expect.arrayContaining([
        "login",
        "force-password",
        "dashboard",
        "admin-users",
        "merchant-applications",
        "shops",
        "voucher-reviews",
        "forbidden",
      ]),
    );
  });
});
