import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post, put } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));
vi.mock("@/api/client", () => ({
  http: { get, post, put },
  getBinary: vi.fn(),
  postBinary: vi.fn(),
}));

import {
  listAdminRefunds,
  listCustomerServiceMessages,
  listCustomerServiceTickets,
  updateCustomerServiceStatus,
} from "@/api/operations";

describe("阶段 41 管理工作台", () => {
  beforeEach(() => {
    get.mockReset().mockResolvedValue({ items: [], total: 0 });
    post.mockReset();
    put.mockReset();
  });

  it("退款与客服队列由服务端筛选而不是连接状态推断", async () => {
    await listAdminRefunds("PENDING_REVIEW", 1, 20);
    expect(get).toHaveBeenCalledWith("/v1/admin/refunds", {
      params: { queue: "PENDING_REVIEW", page: 1, size: 20 },
    });
    await listCustomerServiceTickets({ queue: "MINE" }, 1, 50);
    expect(get).toHaveBeenCalledWith("/v1/admin/customer-service/tickets", {
      params: { queue: "MINE", page: 1, size: 50 },
    });
  });

  it("消息使用游标，状态变更调用受控入口", async () => {
    await listCustomerServiceMessages(
      "9007199254740993",
      { before_message_id: "9007199254740000" },
      30,
    );
    expect(get).toHaveBeenCalledWith(
      "/v1/admin/customer-service/tickets/9007199254740993/messages",
      {
        params: {
          before_message_id: "9007199254740000",
          limit: 30,
        },
      },
    );
    await updateCustomerServiceStatus("9007199254740993", "RESOLVED");
    expect(put).toHaveBeenCalledWith(
      "/v1/admin/customer-service/tickets/9007199254740993/status",
      { status: "RESOLVED" },
    );
  });

  it("页面包含退款双状态与客服三栏闭环", () => {
    const refunds = readFileSync("src/views/RefundsView.vue", "utf8");
    const service = readFileSync("src/views/CustomerServiceView.vue", "utf8");
    expect(refunds).toContain("decisionStatus");
    expect(refunds).toContain("executionStatus");
    expect(refunds).toContain("退款时间线");
    expect(service).toContain("service-queue");
    expect(service).toContain("service-conversation");
    expect(service).toContain("service-context");
    expect(service).toContain("内部备注");
  });
});
