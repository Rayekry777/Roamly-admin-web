import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  approveVoucherReview,
  getVoucherReview,
  listVoucherReviews,
  rejectVoucherReview,
  updatePlatformSubsidy,
} from "@/api/voucher-review";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));
const { get, post } = mocks;
vi.mock("@/api/client", () => ({
  http: { get: mocks.get, post: mocks.post, put: mocks.put },
}));

describe("团购券审核请求契约", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    mocks.put.mockReset();
  });

  it("平台补贴独立设置，携带版本和整数分，支持取消", async () => {
    await updatePlatformSubsidy("7", 3, 500);
    await updatePlatformSubsidy("7", 4, 0);
    expect(mocks.put).toHaveBeenNthCalledWith(
      1,
      "/v1/admin/voucher-reviews/7/platform-subsidy",
      { version: 3, platformDiscountAmount: 500 },
    );
    expect(mocks.put).toHaveBeenNthCalledWith(
      2,
      "/v1/admin/voucher-reviews/7/platform-subsidy",
      { version: 4, platformDiscountAmount: 0 },
    );
  });

  it("使用管理端审核路径和筛选参数", async () => {
    get.mockResolvedValue({ items: [], page: 1, size: 20, total: 0 });
    await listVoucherReviews({
      status: "PENDING",
      productType: "PACKAGE",
      page: 1,
      size: 20,
    });
    expect(get).toHaveBeenCalledWith("/v1/admin/voucher-reviews", {
      params: { status: "PENDING", productType: "PACKAGE", page: 1, size: 20 },
    });
    await getVoucherReview("9007199254740993");
    expect(get).toHaveBeenCalledWith(
      "/v1/admin/voucher-reviews/9007199254740993",
    );
  });

  it("审核通过与驳回都携带版本和幂等键", async () => {
    post.mockResolvedValue({});
    await approveVoucherReview("7", 3, "review-key");
    await rejectVoucherReview("7", 4, "内容不完整", "reject-key");
    expect(post).toHaveBeenNthCalledWith(
      1,
      "/v1/admin/voucher-reviews/7/approval",
      { version: 3 },
      { headers: { "Idempotency-Key": "review-key" } },
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/v1/admin/voucher-reviews/7/rejection",
      { version: 4, reason: "内容不完整" },
      { headers: { "Idempotency-Key": "reject-key" } },
    );
  });
});
