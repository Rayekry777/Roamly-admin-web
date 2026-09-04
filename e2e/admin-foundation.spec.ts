import { expect, type Page, type Route, test } from "@playwright/test";

interface AdminRow {
  id: string;
  username: string;
  displayName: string;
  role: "PLATFORM_ADMIN" | "MERCHANT_REVIEWER" | "FINANCE";
  roleLabel: string;
  status: "ACTIVE" | "DISABLED";
  statusLabel: string;
  forcePasswordChange: boolean;
  lastLoginTime?: string;
  version: number;
  createTime: string;
  updateTime: string;
}

const profile = {
  id: "1",
  username: "admin",
  displayName: "Roamly 管理员",
  role: "PLATFORM_ADMIN",
  roleLabel: "平台超级管理员",
  status: "ACTIVE",
  statusLabel: "已启用",
  permissions: ["admin:dashboard:read", "admin:user:manage"],
  forcePasswordChange: false,
};

function ok(data: unknown) {
  return { code: "OK", message: "操作成功", data };
}

async function fulfillJson(
  route: Route,
  data: unknown,
  status = 200,
): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
}

async function mockAdminApi(
  page: Page,
  options: { forcePasswordChange?: boolean; rows?: AdminRow[] } = {},
) {
  const rows = options.rows ?? [];
  await page.route("**/api/v1/admin/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, "");
    const method = request.method();
    if (path === "/v1/admin/auth/login" && method === "POST") {
      await fulfillJson(
        route,
        ok({
          token: "admin-token",
          expiresInSeconds: 3600,
          forcePasswordChange: false,
        }),
      );
      return;
    }
    if (path === "/v1/admin/auth/me" && method === "GET") {
      await fulfillJson(
        route,
        ok({
          ...profile,
          forcePasswordChange: options.forcePasswordChange ?? false,
        }),
      );
      return;
    }
    if (path === "/v1/admin/auth/password" && method === "PUT") {
      options.forcePasswordChange = false;
      await route.fulfill({ status: 204 });
      return;
    }
    if (path === "/v1/admin/auth/logout" && method === "POST") {
      await route.fulfill({ status: 204 });
      return;
    }
    if (path === "/v1/admin/users" && method === "GET") {
      await fulfillJson(
        route,
        ok({ items: rows, page: 1, size: 20, total: rows.length }),
      );
      return;
    }
    if (path === "/v1/admin/users" && method === "POST") {
      const input = request.postDataJSON();
      const row: AdminRow = {
        id: String(rows.length + 2),
        username: input.username,
        displayName: input.displayName,
        role: input.role,
        roleLabel: input.role === "FINANCE" ? "财务管理员" : "商户审核员",
        status: "ACTIVE",
        statusLabel: "已启用",
        forcePasswordChange: true,
        version: 0,
        createTime: "2026-09-04T10:00:00",
        updateTime: "2026-09-04T10:00:00",
      };
      rows.push(row);
      await fulfillJson(route, ok(row), 201);
      return;
    }
    const match = path.match(
      /^\/v1\/admin\/users\/([^/]+)(?:\/(activation|disablement|password-reset))?$/,
    );
    if (match) {
      const row = rows.find((item) => item.id === match[1]);
      if (!row) {
        await fulfillJson(
          route,
          {
            code: "ADMIN_USER_NOT_FOUND",
            message: "管理员账号不存在",
            fieldErrors: [],
          },
          404,
        );
        return;
      }
      if (method === "PUT") {
        const input = request.postDataJSON();
        row.displayName = input.displayName;
        row.role = input.role;
        row.roleLabel =
          input.role === "PLATFORM_ADMIN" ? "平台超级管理员" : "商户审核员";
        row.version += 1;
        await fulfillJson(route, ok(row));
        return;
      }
      if (match[2] === "disablement") {
        row.status = "DISABLED";
        row.statusLabel = "已停用";
        row.version += 1;
      } else if (match[2] === "activation") {
        row.status = "ACTIVE";
        row.statusLabel = "已启用";
        row.version += 1;
      } else if (match[2] === "password-reset") {
        row.forcePasswordChange = true;
        row.version += 1;
      }
      await route.fulfill({ status: 204 });
      return;
    }
    await fulfillJson(
      route,
      { code: "RESOURCE_NOT_FOUND", message: "资源不存在", fieldErrors: [] },
      404,
    );
  });
  return rows;
}

test("管理员登录进入 Roamly 运营摘要", async ({ page }, testInfo) => {
  await mockAdminApi(page);
  await page.goto("/login");
  await page.getByLabel("用户名").fill("admin");
  await page.getByLabel("密码").fill("Roamly123");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Roamly 管理员，欢迎回来" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".metric-item")
      .filter({ hasText: "当前角色" })
      .getByText("平台超级管理员"),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "面包屑" }).getByText("运营摘要"),
  ).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "打开导航" }).click();
  }
  await page
    .getByRole("navigation", { name: "管理导航" })
    .getByRole("button", { name: "管理员账号" })
    .click();
  await expect(page.getByRole("heading", { name: "管理员账号" })).toBeVisible();
  const tabNavigation = page.getByRole("navigation", { name: "页面标签" });
  if (testInfo.project.name === "mobile") {
    await expect(tabNavigation).toBeHidden();
  } else {
    await expect(
      tabNavigation.getByRole("button", {
        name: "管理员账号",
        exact: true,
      }),
    ).toBeVisible();
  }
});

test("首次登录强制改密后清理会话", async ({ page }) => {
  await mockAdminApi(page, { forcePasswordChange: true });
  await page.goto("/login");
  await page.getByLabel("用户名").fill("admin");
  await page.getByLabel("密码").fill("Roamly123");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "请先修改密码" }),
  ).toBeVisible();
  await page.getByLabel("当前密码").fill("Roamly123");
  await page.getByLabel("新密码", { exact: true }).fill("NewPassword8");
  await page.getByLabel("确认新密码").fill("NewPassword8");
  await page.getByRole("button", { name: "确认修改" }).click();
  await expect(
    page.getByRole("heading", { name: "登录运营工作台" }),
  ).toBeVisible();
  await expect(
    page.evaluate(() => localStorage.getItem("roamly.admin.token")),
  ).resolves.toBeNull();
});

test("平台管理员完成账号创建编辑停用和密码重置", async ({ page }) => {
  const rows: AdminRow[] = [
    {
      id: "1",
      username: "admin",
      displayName: "Roamly 管理员",
      role: "PLATFORM_ADMIN",
      roleLabel: "平台超级管理员",
      status: "ACTIVE",
      statusLabel: "已启用",
      forcePasswordChange: false,
      lastLoginTime: "2026-09-04T09:00:00",
      version: 0,
      createTime: "2026-09-01T09:00:00",
      updateTime: "2026-09-04T09:00:00",
    },
  ];
  await page.addInitScript(() =>
    localStorage.setItem("roamly.admin.token", "admin-token"),
  );
  await mockAdminApi(page, { rows });
  await page.goto("/admin-users");
  await expect(page.getByRole("heading", { name: "管理员账号" })).toBeVisible();

  await page.getByRole("button", { name: "新增管理员" }).click();
  const createDialog = page.getByRole("dialog", { name: "新增管理员" });
  await createDialog.getByLabel("用户名").fill("reviewer.one");
  await createDialog.getByLabel("显示名").fill("审核同学");
  await createDialog.getByLabel("初始密码").fill("Password8");
  await createDialog.getByRole("button", { name: "保存" }).click();
  await expect(page.getByRole("cell", { name: "reviewer.one" })).toBeVisible();

  let row = page.getByRole("row", { name: /reviewer.one/ });
  await row.getByRole("button", { name: "编辑" }).click();
  const editDialog = page.getByRole("dialog", { name: "编辑管理员" });
  await editDialog.getByLabel("显示名").fill("高级审核员");
  await editDialog.getByRole("button", { name: "保存" }).click();
  await expect(page.getByRole("cell", { name: "高级审核员" })).toBeVisible();

  row = page.getByRole("row", { name: /reviewer.one/ });
  await row.getByRole("button", { name: "停用" }).click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(page.getByRole("cell", { name: "已停用" })).toBeVisible();

  row = page.getByRole("row", { name: /reviewer.one/ });
  await row.getByRole("button", { name: "重置密码" }).click();
  const resetDialog = page.getByRole("dialog", { name: "重置管理员密码" });
  await resetDialog.getByLabel("临时新密码").fill("ResetPass8");
  await resetDialog.getByRole("button", { name: "确认重置" }).click();
  await expect(
    page.getByText("密码已重置，目标账号需重新登录并修改密码"),
  ).toBeVisible();
});

test("冻结视口下工作台无页面溢出或内容遮挡", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "由桌面项目统一覆盖全部冻结尺寸",
  );
  await page.addInitScript(() =>
    localStorage.setItem("roamly.admin.token", "admin-token"),
  );
  await mockAdminApi(page);
  await page.goto("/admin-users");

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(250);
    await expect(
      page.getByRole("heading", { name: "管理员账号" }),
    ).toBeVisible();
    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);

    const topbar = await page.locator(".admin-topbar").boundingBox();
    const heading = await page.locator(".page-heading").boundingBox();
    expect(topbar).not.toBeNull();
    expect(heading).not.toBeNull();
    expect(heading!.y).toBeGreaterThanOrEqual(topbar!.y + topbar!.height);

    await page.screenshot({
      path: testInfo.outputPath(
        `admin-users-${viewport.width}x${viewport.height}.png`,
      ),
      fullPage: true,
    });
  }
});
