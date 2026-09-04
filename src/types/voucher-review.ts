/** 平台券审核状态：审核中、通过、未通过。 */
export type VoucherReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

/** 四类券：套餐券、代金券、折扣券、次卡。 */
export type VoucherProductType = "PACKAGE" | "CASH" | "DISCOUNT" | "MULTI_USE";

/** 销售状态：待开售、销售中、已下架、已售罄、已结束。 */
export type VoucherSaleStatus =
  | "SCHEDULED"
  | "ON_SALE"
  | "OFF_SALE"
  | "SOLD_OUT"
  | "ENDED";

export interface AdminVoucherReviewListItem {
  id: string;
  shopId: string;
  shopName: string | null;
  merchantAccountId: string | null;
  merchantName: string | null;
  productType: VoucherProductType;
  productTypeLabel: string;
  title: string | null;
  priceAmount: number | null;
  marketAmount: number | null;
  reviewStatus: VoucherReviewStatus;
  reviewStatusLabel: string;
  saleStatus: VoucherSaleStatus | null;
  saleStatusLabel: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  version: number;
}

export interface VoucherPackageItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPriceAmount: number | null;
  sortOrder: number;
}

export interface VoucherMedia {
  id: string;
  purposeLabel: string;
  originalFilename: string;
  contentPath: string;
}

export interface AdminVoucherProduct {
  id: string;
  shopId: string;
  productType: VoucherProductType;
  productTypeLabel: string;
  title: string | null;
  subTitle: string | null;
  coverMedia: VoucherMedia | null;
  detailMedia: VoucherMedia[];
  priceAmount: number | null;
  marketAmount: number | null;
  faceValueAmount: number | null;
  minimumSpendAmount: number | null;
  discountRateBps: number | null;
  maximumDiscountAmount: number | null;
  totalUseCount: number | null;
  totalStock: number;
  availableStock: number;
  soldCount: number;
  purchaseLimit: number;
  saleBeginTime: string | null;
  saleEndTime: string | null;
  validityTypeLabel: string | null;
  validBeginTime: string | null;
  validEndTime: string | null;
  validDays: number | null;
  usageRules: Array<{
    dayOfWeek: string;
    closed: boolean;
    periods: Array<{ open: string; close: string }>;
  }>;
  excludedDates: string[];
  reservationRequired: boolean;
  reservationNotice: string | null;
  stackable: boolean;
  refundAnytime: boolean;
  refundExpired: boolean;
  packageItems: VoucherPackageItem[];
  reviewStatus: VoucherReviewStatus;
  reviewStatusLabel: string;
  saleStatus: VoucherSaleStatus | null;
  saleStatusLabel: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  version: number;
  createTime: string;
  updateTime: string;
}

export interface AdminVoucherReviewDetail {
  product: AdminVoucherProduct;
  shop: {
    id: string;
    name: string;
    address: string;
    score: number;
  } | null;
  merchantAccountId: string | null;
  merchantName: string | null;
}

export interface AdminVoucherReviewResult {
  productId: string;
  reviewStatus: VoucherReviewStatus;
  reviewStatusLabel: string;
  saleStatus: VoucherSaleStatus | null;
  saleStatusLabel: string | null;
  reviewerAdminId: string | null;
  reviewerDisplayName: string | null;
  reviewedAt: string | null;
  version: number;
}

export interface VoucherReviewQuery {
  status?: VoucherReviewStatus;
  productType?: VoucherProductType;
  shopId?: string;
  keyword?: string;
  page: number;
  size: number;
}
