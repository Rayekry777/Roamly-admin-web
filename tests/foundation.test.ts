import { describe, expect, it } from "vitest";

import { routes } from "@/router";
import { roamlyTheme } from "@/theme/tokens";

describe("Roamly 管理端工程基线", () => {
  it("使用冻结的 Roamly 视觉令牌", () => {
    expect(roamlyTheme).toMatchObject({
      primary: "#ff5f57",
      accent: "#8275ff",
      text: "#242331",
      muted: "#8f8d99",
      background: "#f4f5fb",
      surface: "#ffffff",
      border: "#ececf3",
      controlRadius: "6px",
      contentRadius: "8px",
    });
  });

  it("注册阶段 16 管理页面", () => {
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
        "forbidden",
      ]),
    );
  });
});
