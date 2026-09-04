import type {
  BusinessDayOfWeek,
  MerchantApplicationQuery,
  MerchantApplicationStatus,
  ShopQuery,
  ShopStatus,
} from "@/types/governance";

export const merchantApplicationStatusOptions: Array<{
  value: MerchantApplicationStatus;
  label: string;
}> = [
  { value: "DRAFT", label: "草稿" },
  { value: "PENDING", label: "审核中" },
  { value: "APPROVED", label: "审核通过" },
  { value: "REJECTED", label: "审核未通过" },
];

export const shopStatusOptions: Array<{ value: ShopStatus; label: string }> = [
  { value: "PENDING", label: "待激活" },
  { value: "ACTIVE", label: "营业中" },
  { value: "SUSPENDED", label: "已停用" },
  { value: "CLOSED", label: "已关闭" },
];

const dayLabels: Record<BusinessDayOfWeek, string> = {
  MONDAY: "周一",
  TUESDAY: "周二",
  WEDNESDAY: "周三",
  THURSDAY: "周四",
  FRIDAY: "周五",
  SATURDAY: "周六",
  SUNDAY: "周日",
};

export interface CommandKeyState {
  signature: string;
  key: string;
}

function clean(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function positiveInteger(value: number, maximum?: number): number {
  const normalized = Math.max(1, Math.trunc(value) || 1);
  return maximum ? Math.min(maximum, normalized) : normalized;
}

export function normalizeMerchantApplicationQuery(
  query: MerchantApplicationQuery,
): MerchantApplicationQuery {
  return {
    status: query.status,
    cityCode: clean(query.cityCode),
    shopTypeId: clean(query.shopTypeId),
    phone: clean(query.phone),
    submittedFrom: clean(query.submittedFrom),
    submittedTo: clean(query.submittedTo),
    page: positiveInteger(query.page),
    size: positiveInteger(query.size, 100),
  };
}

export function normalizeShopQuery(query: ShopQuery): ShopQuery {
  return {
    status: query.status,
    cityCode: clean(query.cityCode),
    shopTypeId: clean(query.shopTypeId),
    keyword: clean(query.keyword),
    page: positiveInteger(query.page),
    size: positiveInteger(query.size, 100),
  };
}

export function nextCommandKey(
  current: CommandKeyState | null,
  signature: string,
  prefix: string,
): CommandKeyState {
  if (current?.signature === signature) return current;
  const entropy =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { signature, key: `${prefix}-${entropy}` };
}

export function dayLabel(day: BusinessDayOfWeek): string {
  return dayLabels[day];
}

export function formatDateTime(value?: string | null): string {
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

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
