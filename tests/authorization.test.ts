import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";

import { permissionDirective } from "@/directives/permission";
import { visibleMenu } from "@/navigation/menu";
import { useAuthStore } from "@/stores/auth";

describe("静态菜单与按钮权限", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("只展示后端返回权限覆盖的菜单", () => {
    expect(
      visibleMenu(["admin:dashboard:read"]).map((item) => item.label),
    ).toEqual(["运营摘要"]);
    expect(
      visibleMenu(["admin:dashboard:read", "admin:user:manage"]).map(
        (item) => item.label,
      ),
    ).toEqual(["运营摘要", "管理员账号"]);
    expect(
      visibleMenu([
        "admin:dashboard:read",
        "admin:merchant-application:review",
        "admin:shop:govern",
      ]).map((item) => item.label),
    ).toEqual(["运营摘要", "商户申请", "门店治理"]);
  });

  it("权限指令移除未授权命令", () => {
    const auth = useAuthStore();
    auth.current = {
      id: "1",
      username: "finance",
      displayName: "财务管理员",
      role: "FINANCE",
      roleLabel: "财务管理员",
      status: "ACTIVE",
      statusLabel: "已启用",
      permissions: ["admin:dashboard:read"],
      forcePasswordChange: false,
    };
    const wrapper = mount(
      {
        template:
          "<button v-permission=\"'admin:user:manage'\">管理账号</button>",
      },
      { global: { directives: { permission: permissionDirective } } },
    );
    expect(wrapper.attributes()).toMatchObject({
      hidden: "",
      "aria-hidden": "true",
    });
  });
});
