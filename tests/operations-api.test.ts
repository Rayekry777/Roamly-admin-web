import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("@/api/client", () => ({ http: { get, post } }));

import {
  approveAdminRefund,
  listAdminAuditLogs,
  listAdminOrders,
  retryAdminSettlement,
} from "@/api/operations";

describe("阶段 24-30 管理端查询 API", () => {
  beforeEach(() => {
    get
      .mockReset()
      .mockResolvedValue({ items: [], page: 1, size: 20, total: 0 });
    post.mockReset().mockResolvedValue({});
  });

  it("订单和审计查询使用管理端路径与分页参数", async () => {
    await listAdminOrders("PAID", 2, 50);
    expect(get).toHaveBeenCalledWith("/v1/admin/orders", {
      params: { status: "PAID", page: 2, size: 50 },
    });
    await listAdminAuditLogs(1, 20);
    expect(get).toHaveBeenCalledWith("/v1/admin/audit-logs", {
      params: { page: 1, size: 20 },
    });
  });

  it("退款和结算命令自动携带幂等键", async () => {
    await approveAdminRefund("9007199254740993");
    expect(post).toHaveBeenCalledWith(
      "/v1/admin/refunds/9007199254740993/approval",
      undefined,
      { headers: { "Idempotency-Key": expect.any(String) } },
    );
    await retryAdminSettlement("9007199254740995");
    expect(post).toHaveBeenCalledWith(
      "/v1/admin/settlements/9007199254740995/retry",
      undefined,
      { headers: { "Idempotency-Key": expect.any(String) } },
    );
  });
});
