import { getBinary, http } from "@/api/client";
import type {
  AdminShopDetail,
  AdminShopListItem,
  MerchantApplicationDetail,
  MerchantApplicationListItem,
  MerchantApplicationQuery,
  MerchantApplicationReviewResult,
  ShopGovernanceResult,
  ShopQuery,
} from "@/types/governance";
import type { PageResult } from "@/types/http";
import {
  normalizeMerchantApplicationQuery,
  normalizeShopQuery,
} from "@/utils/governance";

export function listMerchantApplications(
  query: MerchantApplicationQuery,
): Promise<PageResult<MerchantApplicationListItem>> {
  return http.get("/v1/admin/merchant-applications", {
    params: normalizeMerchantApplicationQuery(query),
  });
}

export function getMerchantApplication(
  applicationId: string,
): Promise<MerchantApplicationDetail> {
  return http.get(`/v1/admin/merchant-applications/${applicationId}`);
}

export function getMerchantApplicationMedia(
  contentPath: string,
): Promise<Blob> {
  return getBinary(contentPath);
}

export function approveMerchantApplication(
  applicationId: string,
  version: number,
  idempotencyKey: string,
): Promise<MerchantApplicationReviewResult> {
  return http.post(
    `/v1/admin/merchant-applications/${applicationId}/approval`,
    { version },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
}

export function rejectMerchantApplication(
  applicationId: string,
  version: number,
  reason: string,
  idempotencyKey: string,
): Promise<MerchantApplicationReviewResult> {
  return http.post(
    `/v1/admin/merchant-applications/${applicationId}/rejection`,
    { version, reason: reason.trim() },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
}

export function listShops(
  query: ShopQuery,
): Promise<PageResult<AdminShopListItem>> {
  return http.get("/v1/admin/shops", { params: normalizeShopQuery(query) });
}

export function getShop(shopId: string): Promise<AdminShopDetail> {
  return http.get(`/v1/admin/shops/${shopId}`);
}

export function suspendShop(
  shopId: string,
  version: number,
  reason: string,
  idempotencyKey: string,
): Promise<ShopGovernanceResult> {
  return http.post(
    `/v1/admin/shops/${shopId}/suspension`,
    { version, reason: reason.trim() },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
}

export function activateShop(
  shopId: string,
  version: number,
  reason: string,
  idempotencyKey: string,
): Promise<ShopGovernanceResult> {
  return http.post(
    `/v1/admin/shops/${shopId}/activation`,
    { version, reason: reason.trim() },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
}
