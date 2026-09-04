import { expect, type Page, type Route, test } from "@playwright/test";

type Role = "PLATFORM_ADMIN" | "MERCHANT_REVIEWER" | "FINANCE";

const hours = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
].map((dayOfWeek) => ({
  dayOfWeek,
  closed: dayOfWeek === "SUNDAY",
  periods: dayOfWeek === "SUNDAY" ? [] : [{ open: "09:00", close: "21:00" }],
}));

function ok(data: unknown) {
  return { code: "OK", message: "操作成功", data };
}

async function json(route: Route, data: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
}

function permissions(role: Role): string[] {
  if (role === "PLATFORM_ADMIN") {
    return [
      "admin:dashboard:read",
      "admin:user:manage",
      "admin:merchant-application:review",
      "admin:shop:govern",
    ];
  }
  if (role === "MERCHANT_REVIEWER") {
    return [
      "admin:dashboard:read",
      "admin:merchant-application:review",
      "admin:shop:govern",
    ];
  }
  return ["admin:dashboard:read"];
}

function roleLabel(role: Role): string {
  if (role === "PLATFORM_ADMIN") return "平台超级管理员";
  if (role === "MERCHANT_REVIEWER") return "商户审核员";
  return "财务管理员";
}

async function mockStage19Api(
  page: Page,
  options: { role?: Role; conflictFirstRejection?: boolean } = {},
) {
  let currentRole = options.role ?? "PLATFORM_ADMIN";
  let rejectionConflicted = false;
  const reviewKeys: string[] = [];
  const shopKeys: string[] = [];
  const application = {
    id: "9007199254740993",
    status: "PENDING",
    statusLabel: "审核中",
    shopName: "审核中的漫游小馆",
    licenseNumber: "91330100MA2DEMO019",
    legalRepresentative: "周小路",
    contactName: "周小路",
    contactPhone: "13900000003",
    shopTypeId: "1",
    shopTypeName: "美食",
    cityCode: "330100",
    cityName: "杭州",
    district: "拱墅区",
    address: "运河路 18 号",
    longitude: 120.1491,
    latitude: 30.316,
    businessHours: hours,
    licenseMedia: {
      id: "8001",
      purpose: "LICENSE",
      purposeLabel: "营业执照",
      originalFilename: "营业执照.png",
      mimeType: "image/png",
      byteSize: 543,
      width: 400,
      height: 400,
      contentPath:
        "/v1/admin/merchant-applications/9007199254740993/media/8001/content",
    },
    galleryMedia: [
      {
        id: "8002",
        purpose: "GALLERY",
        purposeLabel: "经营图片",
        originalFilename: "门店环境.png",
        mimeType: "image/png",
        byteSize: 612,
        width: 400,
        height: 400,
        contentPath:
          "/v1/admin/merchant-applications/9007199254740993/media/8002/content",
      },
    ],
    settlementAccountName: "杭州漫游餐饮有限公司",
    settlementBankName: "Roamly Mock 银行",
    settlementAccountSuffix: "0019",
    review: null as null | Record<string, unknown>,
    approvedShopId: null as string | null,
    version: 1,
    submittedAt: "2026-09-04T10:00:00",
    createTime: "2026-09-04T09:00:00",
    updateTime: "2026-09-04T10:00:00",
  };
  const shop = {
    id: "9007199254740995",
    name: "103 茶餐厅",
    status: "ACTIVE",
    statusLabel: "营业中",
    sourceApplicationId: "9101",
    shopTypeId: "1",
    shopTypeName: "美食",
    cityCode: "330100",
    cityName: "杭州",
    district: "拱墅区",
    address: "金华路锦昌文华苑 29 号",
    longitude: 120.149192,
    latitude: 30.316078,
    businessHours: hours,
    ownerAccountId: "1",
    ownerName: "茶餐厅店主",
    ownerPhoneMasked: "139****0001",
    ownerStatus: "ACTIVE",
    ownerStatusLabel: "已激活",
    accountTotal: 2,
    activeAccountCount: 1,
    disabledAccountCount: 1,
    activatedAt: "2026-08-01T10:00:00",
    suspendedAt: null as string | null,
    suspensionReason: null as string | null,
    statusChangedByAdminId: null as string | null,
    statusChangedByAdminName: null as string | null,
    statusCommandType: null as string | null,
    statusCommandTypeLabel: null as string | null,
    updateTime: "2026-09-04T10:00:00",
    version: 0,
  };
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );

  await page.route("**/api/v1/admin/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, "");
    const method = request.method();
    if (path === "/v1/admin/auth/me") {
      await json(
        route,
        ok({
          id: "1",
          username: currentRole.toLowerCase(),
          displayName: roleLabel(currentRole),
          role: currentRole,
          roleLabel: roleLabel(currentRole),
          status: "ACTIVE",
          statusLabel: "已启用",
          permissions: permissions(currentRole),
          forcePasswordChange: false,
        }),
      );
      return;
    }
    if (/\/merchant-applications\/[^/]+\/media\/[^/]+\/content$/.test(path)) {
      await route.fulfill({ status: 200, contentType: "image/png", body: png });
      return;
    }
    if (path === "/v1/admin/merchant-applications" && method === "GET") {
      await json(
        route,
        ok({ items: [application], page: 1, size: 20, total: 1 }),
      );
      return;
    }
    if (
      path === `/v1/admin/merchant-applications/${application.id}` &&
      method === "GET"
    ) {
      await json(route, ok(application));
      return;
    }
    if (path.endsWith("/approval") && method === "POST") {
      reviewKeys.push(request.headers()["idempotency-key"] ?? "");
      application.status = "APPROVED";
      application.statusLabel = "审核通过";
      application.version += 1;
      application.approvedShopId = shop.id;
      application.review = {
        decision: "APPROVAL",
        decisionLabel: "通过",
        reviewerAdminId: "1",
        reviewerDisplayName: "平台超级管理员",
        reviewedAt: "2026-09-04T11:00:00",
        reason: null,
      };
      await json(
        route,
        ok({
          applicationId: application.id,
          status: application.status,
          statusLabel: application.statusLabel,
          decision: "APPROVAL",
          decisionLabel: "通过",
          reviewerAdminId: "1",
          reviewerDisplayName: "平台超级管理员",
          reviewedAt: "2026-09-04T11:00:00",
          version: application.version,
          shop,
        }),
      );
      return;
    }
    if (path.endsWith("/rejection") && method === "POST") {
      reviewKeys.push(request.headers()["idempotency-key"] ?? "");
      if (options.conflictFirstRejection && !rejectionConflicted) {
        rejectionConflicted = true;
        application.version += 1;
        await json(
          route,
          {
            code: "MERCHANT_APPLICATION_REVIEW_VERSION_CONFLICT",
            message: "申请已被其他操作修改，请重新加载",
            fieldErrors: [],
          },
          409,
        );
        return;
      }
      const input = request.postDataJSON();
      application.status = "REJECTED";
      application.statusLabel = "审核未通过";
      application.version += 1;
      application.review = {
        decision: "REJECTION",
        decisionLabel: "驳回",
        reviewerAdminId: "1",
        reviewerDisplayName: "商户审核员",
        reviewedAt: "2026-09-04T11:20:00",
        reason: input.reason,
      };
      await json(
        route,
        ok({ applicationId: application.id, ...application.review }),
      );
      return;
    }
    if (path === "/v1/admin/shops" && method === "GET") {
      await json(route, ok({ items: [shop], page: 1, size: 20, total: 1 }));
      return;
    }
    if (path === `/v1/admin/shops/${shop.id}` && method === "GET") {
      await json(route, ok(shop));
      return;
    }
    if (path.endsWith("/suspension") && method === "POST") {
      shopKeys.push(request.headers()["idempotency-key"] ?? "");
      const input = request.postDataJSON();
      shop.status = "SUSPENDED";
      shop.statusLabel = "已停用";
      shop.ownerStatus = "DISABLED";
      shop.ownerStatusLabel = "已停用";
      shop.activeAccountCount = 0;
      shop.disabledAccountCount = 2;
      shop.suspendedAt = "2026-09-04T12:00:00";
      shop.suspensionReason = input.reason;
      shop.statusChangedByAdminId = "1";
      shop.statusChangedByAdminName = "平台超级管理员";
      shop.statusCommandType = "SUSPENSION";
      shop.statusCommandTypeLabel = "停用";
      shop.version += 1;
      await json(
        route,
        ok({ shopId: shop.id, ...shop, affectedAccountCount: 1 }),
      );
      return;
    }
    if (path.endsWith("/activation") && method === "POST") {
      shopKeys.push(request.headers()["idempotency-key"] ?? "");
      shop.status = "ACTIVE";
      shop.statusLabel = "营业中";
      shop.ownerStatus = "ACTIVE";
      shop.ownerStatusLabel = "已激活";
      shop.activeAccountCount = 1;
      shop.disabledAccountCount = 1;
      shop.suspendedAt = null;
      shop.suspensionReason = null;
      shop.statusCommandType = "ACTIVATION";
      shop.statusCommandTypeLabel = "恢复";
      shop.version += 1;
      await json(
        route,
        ok({ shopId: shop.id, ...shop, affectedAccountCount: 1 }),
      );
      return;
    }
    await json(
      route,
      { code: "RESOURCE_NOT_FOUND", message: "资源不存在", fieldErrors: [] },
      404,
    );
  });

  return {
    application,
    shop,
    reviewKeys,
    shopKeys,
    setRole(role: Role) {
      currentRole = role;
    },
  };
}

async function authenticate(page: Page): Promise<void> {
  await page.addInitScript(() =>
    localStorage.setItem("roamly.admin.token", "admin-token"),
  );
}

test("平台管理员查看私有证照并通过申请", async ({ page }) => {
  await authenticate(page);
  const state = await mockStage19Api(page);
  await page.goto("/merchant-applications");
  await page.getByRole("button", { name: "查看" }).first().click();
  const drawer = page.locator(".governance-drawer");
  await expect(drawer.getByText("13900000003")).toBeVisible();
  await expect(drawer.getByRole("img", { name: /营业执照/ })).toBeVisible();
  await drawer.getByRole("button", { name: "通过并激活" }).click();
  const confirmation = page.getByRole("dialog", { name: "通过商户申请" });
  await expect(confirmation.getByText("立即创建并激活门店")).toBeVisible();
  await confirmation.getByRole("button", { name: "确认通过" }).click();
  await expect(drawer.getByText("审核通过").first()).toBeVisible();
  expect(state.application.status).toBe("APPROVED");
  expect(state.reviewKeys).toHaveLength(1);
  expect(state.reviewKeys[0]).toMatch(/^admin-merchant-approval-/);
});

test("审核并发冲突保留驳回原因并按新版本换键重试", async ({ page }) => {
  await authenticate(page);
  const state = await mockStage19Api(page, { conflictFirstRejection: true });
  await page.goto("/merchant-applications");
  await page.getByRole("button", { name: "查看" }).first().click();
  await page.getByRole("button", { name: "驳回", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "驳回商户申请" });
  const reason = dialog.getByLabel("驳回原因");
  await reason.fill("营业执照信息不清晰，请重新提交");
  await dialog.getByRole("button", { name: "确认驳回" }).click();
  await expect(
    page.getByText("服务端状态已变化，请按最新版本重新核对后提交"),
  ).toBeVisible();
  await expect(reason).toHaveValue("营业执照信息不清晰，请重新提交");
  await dialog.getByRole("button", { name: "确认驳回" }).click();
  await expect(dialog).toBeHidden();
  expect(state.application.status).toBe("REJECTED");
  expect(state.reviewKeys).toHaveLength(2);
  expect(state.reviewKeys[0]).not.toBe(state.reviewKeys[1]);
});

test("门店停用与选择性恢复提示形成治理闭环", async ({ page }) => {
  await authenticate(page);
  const state = await mockStage19Api(page);
  await page.goto("/shops");
  await page.getByRole("button", { name: "查看" }).first().click();
  const drawer = page.locator(".governance-drawer");
  await drawer.getByRole("button", { name: "停用门店" }).click();
  const suspension = page.getByRole("dialog", { name: "停用门店" });
  await suspension.getByLabel("停用原因").fill("例行安全检查");
  await suspension.getByRole("button", { name: "确认停用" }).click();
  await expect(drawer.getByRole("button", { name: "恢复营业" })).toBeVisible();
  await drawer.getByRole("button", { name: "恢复营业" }).click();
  const activation = page.getByRole("dialog", { name: "恢复门店" });
  await expect(
    activation.getByText("只会重新启用因门店停用联动而停用的账号"),
  ).toBeVisible();
  await activation.getByLabel("恢复原因").fill("检查完成");
  await activation.getByRole("button", { name: "确认恢复" }).click();
  await expect(drawer.getByRole("button", { name: "停用门店" })).toBeVisible();
  expect(state.shop.status).toBe("ACTIVE");
  expect(state.shop.disabledAccountCount).toBe(1);
  expect(state.shopKeys).toHaveLength(2);
  expect(state.shopKeys[0]).toMatch(/^admin-shop-suspension-/);
  expect(state.shopKeys[1]).toMatch(/^admin-shop-activation-/);
});

test("三类管理员只看到自身权限菜单", async ({ page }, testInfo) => {
  await authenticate(page);
  const state = await mockStage19Api(page, { role: "PLATFORM_ADMIN" });
  await page.goto("/dashboard");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "打开导航" }).click();
  }
  let nav = page.getByRole("navigation", { name: "管理导航" });
  await expect(nav.getByRole("button", { name: "管理员账号" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "商户申请" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "门店治理" })).toBeVisible();

  state.setRole("MERCHANT_REVIEWER");
  await page.reload();
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "打开导航" }).click();
  }
  nav = page.getByRole("navigation", { name: "管理导航" });
  await expect(nav.getByRole("button", { name: "管理员账号" })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "商户申请" })).toBeVisible();
  await expect(nav.getByRole("button", { name: "门店治理" })).toBeVisible();

  state.setRole("FINANCE");
  await page.reload();
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "打开导航" }).click();
  }
  nav = page.getByRole("navigation", { name: "管理导航" });
  await expect(nav.getByRole("button", { name: "商户申请" })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "门店治理" })).toHaveCount(0);
});

test("阶段 19 冻结视口无页面溢出且移动端抽屉全屏", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "桌面项目统一覆盖冻结尺寸");
  await authenticate(page);
  await mockStage19Api(page);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ["merchant-applications", "shops"]) {
      await page.goto(`/${route}`);
      await expect(page.locator(".governance-table")).toBeVisible();
      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
      await page.getByRole("button", { name: "查看" }).first().click();
      const drawer = page.locator(".governance-drawer");
      await expect(drawer).toBeVisible();
      await page.waitForTimeout(350);
      const drawerBox = await drawer.boundingBox();
      expect(drawerBox).not.toBeNull();
      expect(drawerBox!.width).toBeLessThanOrEqual(
        Math.min(760, viewport.width),
      );
      expect(drawerBox!.x).toBeGreaterThanOrEqual(-1);
      expect(drawerBox!.x + drawerBox!.width).toBeLessThanOrEqual(
        viewport.width + 1,
      );
      if (viewport.width <= 760) {
        expect(drawerBox!.x).toBeLessThanOrEqual(1);
        expect(Math.abs(drawerBox!.width - viewport.width)).toBeLessThanOrEqual(
          1,
        );
      }
      await page.screenshot({
        path: testInfo.outputPath(
          `${route}-${viewport.width}x${viewport.height}.png`,
        ),
        fullPage: true,
      });
      await drawer.getByRole("button", { name: "关闭" }).click();
    }
  }
});
