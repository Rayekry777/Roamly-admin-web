import type {
  VoucherProductType,
  VoucherReviewStatus,
  VoucherSaleStatus,
} from "@/types/voucher-review";

export const voucherReviewStatusOptions: Array<{
  value: VoucherReviewStatus;
  label: string;
}> = [
  { value: "PENDING", label: "审核中" },
  { value: "APPROVED", label: "审核通过" },
  { value: "REJECTED", label: "审核未通过" },
];

export const voucherProductTypeOptions: Array<{
  value: VoucherProductType;
  label: string;
}> = [
  { value: "PACKAGE", label: "套餐券" },
  { value: "CASH", label: "代金券" },
  { value: "DISCOUNT", label: "折扣券" },
  { value: "MULTI_USE", label: "次卡" },
];

export const voucherSaleStatusLabels: Record<VoucherSaleStatus, string> = {
  SCHEDULED: "待开售",
  ON_SALE: "销售中",
  OFF_SALE: "已下架",
  SOLD_OUT: "已售罄",
  ENDED: "已结束",
};

export function formatFen(value: number | null | undefined): string {
  return value == null ? "-" : `¥${(value / 100).toFixed(2)}`;
}

export function formatReviewTime(value?: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function reviewTagType(
  status: VoucherReviewStatus,
): "success" | "warning" | "danger" | "info" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return status === "PENDING" ? "warning" : "info";
}

export function saleTagType(
  status?: VoucherSaleStatus | null,
): "success" | "warning" | "danger" | "info" {
  if (status === "ON_SALE") return "success";
  if (status === "OFF_SALE" || status === "ENDED") return "info";
  if (status === "SOLD_OUT") return "danger";
  return "warning";
}

export function newReviewKey(
  prefix: string,
  productId: string,
  version: number,
  reason = "",
): string {
  const entropy =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${productId}-${version}-${reason.length}-${entropy}`;
}
