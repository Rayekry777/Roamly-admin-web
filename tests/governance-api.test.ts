import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post, getBinary } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  getBinary: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  http: { get, post },
  getBinary,
}));

import {
  getMerchantApplicationMedia,
  listMerchantApplications,
  rejectMerchantApplication,
  suspendShop,
} from "@/api/governance";

describe("阶段 19 管理 API", () => {
  beforeEach(() => {
    get
      .mockReset()
      .mockResolvedValue({ items: [], page: 1, size: 20, total: 0 });
    post.mockReset().mockResolvedValue({});
    getBinary.mockReset().mockResolvedValue(new Blob());
  });

  it("列表只发送规范化查询且保留字符串大 ID", async () => {
    await listMerchantApplications({
      status: "PENDING",
      cityCode: " 330100 ",
      shopTypeId: "9007199254740993",
      phone: " ",
      page: 1,
      size: 20,
    });
    expect(get).toHaveBeenCalledWith("/v1/admin/merchant-applications", {
      params: expect.objectContaining({
        cityCode: "330100",
        shopTypeId: "9007199254740993",
        phone: undefined,
      }),
    });
  });

  it("审核和治理命令修剪原因并发送幂等头", async () => {
    await rejectMerchantApplication(
      "9007199254740993",
      7,
      "  证照不清晰  ",
      "review-command-1",
    );
    expect(post).toHaveBeenCalledWith(
      "/v1/admin/merchant-applications/9007199254740993/rejection",
      { version: 7, reason: "证照不清晰" },
      { headers: { "Idempotency-Key": "review-command-1" } },
    );

    await suspendShop("9007199254740995", 3, "  安全检查  ", "shop-command-1");
    expect(post).toHaveBeenCalledWith(
      "/v1/admin/shops/9007199254740995/suspension",
      { version: 3, reason: "安全检查" },
      { headers: { "Idempotency-Key": "shop-command-1" } },
    );
  });

  it("私有图片只通过鉴权二进制客户端读取", async () => {
    await getMerchantApplicationMedia(
      "/v1/admin/merchant-applications/9001/media/8001/content",
    );
    expect(getBinary).toHaveBeenCalledWith(
      "/v1/admin/merchant-applications/9001/media/8001/content",
    );
  });
});
