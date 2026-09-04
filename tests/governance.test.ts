import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  nextCommandKey,
  normalizeMerchantApplicationQuery,
  normalizeShopQuery,
} from "@/utils/governance";
import { ObjectUrlRegistry } from "@/utils/object-urls";

describe("阶段 19 客户端状态", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce("first-command-id")
        .mockReturnValueOnce("second-command-id"),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("清洗查询条件并限制分页范围", () => {
    expect(
      normalizeMerchantApplicationQuery({
        status: "PENDING",
        cityCode: " 330100 ",
        shopTypeId: " 9007199254740993 ",
        phone: "   ",
        submittedFrom: "2026-09-01T00:00:00",
        submittedTo: "",
        page: 0,
        size: 300,
      }),
    ).toEqual({
      status: "PENDING",
      cityCode: "330100",
      shopTypeId: "9007199254740993",
      phone: undefined,
      submittedFrom: "2026-09-01T00:00:00",
      submittedTo: undefined,
      page: 1,
      size: 100,
    });
    expect(
      normalizeShopQuery({
        status: "ACTIVE",
        cityCode: " ",
        shopTypeId: "1",
        keyword: " 漫游咖啡 ",
        page: 2,
        size: 20,
      }),
    ).toMatchObject({
      status: "ACTIVE",
      cityCode: undefined,
      shopTypeId: "1",
      keyword: "漫游咖啡",
      page: 2,
      size: 20,
    });
  });

  it("相同命令复用幂等键，参数变化后换键", () => {
    const first = nextCommandKey(null, "approval|9001|1", "review");
    const replay = nextCommandKey(first, "approval|9001|1", "review");
    const changed = nextCommandKey(first, "approval|9001|2", "review");
    expect(first.key).toBe("review-first-command-id");
    expect(replay).toBe(first);
    expect(changed).not.toBe(first);
    expect(changed.key).toBe("review-second-command-id");
    expect(changed.signature).toBe("approval|9001|2");
  });

  it("切换资源与卸载时释放所有 Blob URL，并拒绝过期加载", () => {
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:stale");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const registry = new ObjectUrlRegistry();
    const firstGeneration = registry.begin();
    expect(registry.add(firstGeneration, "8001", new Blob(["first"]))).toBe(
      "blob:first",
    );
    registry.clear();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(
      registry.add(firstGeneration, "8002", new Blob(["late"])),
    ).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:stale");
  });
});
