/** 商户申请状态：草稿、审核中、审核通过、审核未通过。 */
export type MerchantApplicationStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

/** 审核决定：通过、驳回。 */
export type MerchantApplicationReviewDecision = "APPROVAL" | "REJECTION";

/** 门店经营状态：待激活、营业中、已停用、已关闭。 */
export type ShopStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED";

/** 商户账号状态：未入驻、审核中、已激活、审核未通过、已停用。 */
export type MerchantAccountStatus =
  | "NOT_APPLIED"
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "DISABLED";

/** 门店治理命令：停用、恢复。 */
export type ShopGovernanceCommandType = "SUSPENSION" | "ACTIVATION";

/** 经营媒体用途：营业执照、经营图片。 */
export type BusinessMediaPurpose = "LICENSE" | "GALLERY";

/** 星期：周一至周日。 */
export type BusinessDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface BusinessPeriod {
  open: string;
  close: string;
}

export interface BusinessDayHours {
  dayOfWeek: BusinessDayOfWeek;
  closed: boolean;
  periods: BusinessPeriod[];
}

export interface AdminBusinessMedia {
  id: string;
  purpose: BusinessMediaPurpose;
  purposeLabel: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  contentPath: string;
}

export interface MerchantApplicationReviewRecord {
  decision: MerchantApplicationReviewDecision;
  decisionLabel: string;
  reviewerAdminId: string;
  reviewerDisplayName: string | null;
  reviewedAt: string;
  reason: string | null;
}

export interface MerchantApplicationListItem {
  id: string;
  status: MerchantApplicationStatus;
  statusLabel: string;
  shopName: string;
  shopTypeId: string;
  shopTypeName: string | null;
  cityCode: string;
  cityName: string | null;
  contactName: string;
  contactPhoneMasked: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  version: number;
}

export interface MerchantApplicationDetail {
  id: string;
  status: MerchantApplicationStatus;
  statusLabel: string;
  shopName: string;
  licenseNumber: string;
  legalRepresentative: string;
  contactName: string;
  contactPhone: string;
  shopTypeId: string;
  shopTypeName: string | null;
  cityCode: string;
  cityName: string | null;
  district: string;
  address: string;
  longitude: number;
  latitude: number;
  businessHours: BusinessDayHours[];
  licenseMedia: AdminBusinessMedia | null;
  galleryMedia: AdminBusinessMedia[];
  settlementAccountName: string;
  settlementBankName: string;
  settlementAccountSuffix: string;
  review: MerchantApplicationReviewRecord | null;
  approvedShopId: string | null;
  version: number;
  submittedAt: string | null;
  createTime: string;
  updateTime: string;
}

export interface AdminShopSummary {
  id: string;
  name: string;
  status: ShopStatus;
  statusLabel: string;
  address: string;
}

export interface MerchantApplicationReviewResult {
  applicationId: string;
  status: MerchantApplicationStatus;
  statusLabel: string;
  decision: MerchantApplicationReviewDecision;
  decisionLabel: string;
  reviewerAdminId: string;
  reviewerDisplayName: string | null;
  reviewedAt: string;
  version: number;
  shop: AdminShopSummary | null;
}

export interface MerchantApplicationQuery {
  status?: MerchantApplicationStatus;
  cityCode?: string;
  shopTypeId?: string;
  phone?: string;
  submittedFrom?: string;
  submittedTo?: string;
  page: number;
  size: number;
}

export interface AdminShopListItem {
  id: string;
  name: string;
  status: ShopStatus;
  statusLabel: string;
  shopTypeId: string;
  shopTypeName: string | null;
  cityCode: string;
  cityName: string | null;
  tenantName: string | null;
  tenantPhoneMasked: string | null;
  accountTotal: number;
  activeAccountCount: number;
  disabledAccountCount: number;
  activatedAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  updateTime: string;
  version: number;
}

export interface AdminShopDetail {
  id: string;
  name: string;
  status: ShopStatus;
  statusLabel: string;
  sourceApplicationId: string;
  shopTypeId: string;
  shopTypeName: string | null;
  cityCode: string;
  cityName: string | null;
  district: string;
  address: string;
  longitude: number;
  latitude: number;
  businessHours: BusinessDayHours[];
  tenantAccountId: string | null;
  tenantName: string | null;
  tenantPhoneMasked: string | null;
  tenantStatus: MerchantAccountStatus | null;
  tenantStatusLabel: string | null;
  accountTotal: number;
  activeAccountCount: number;
  disabledAccountCount: number;
  activatedAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  statusChangedByAdminId: string | null;
  statusChangedByAdminName: string | null;
  statusCommandType: ShopGovernanceCommandType | null;
  statusCommandTypeLabel: string | null;
  updateTime: string;
  version: number;
}

export interface ShopQuery {
  status?: ShopStatus;
  cityCode?: string;
  shopTypeId?: string;
  keyword?: string;
  page: number;
  size: number;
}

export interface ShopGovernanceResult {
  shopId: string;
  status: ShopStatus;
  statusLabel: string;
  version: number;
  reason: string;
  operatedByAdminId: string;
  operatedByAdminName: string | null;
  operatedAt: string;
  affectedAccountCount: number;
}
