import { http } from "@/api/client";
import type { PageResult } from "@/types/http";
import type {
  AdminVoucherReviewDetail,
  AdminVoucherReviewListItem,
  AdminVoucherReviewResult,
  VoucherReviewQuery,
} from "@/types/voucher-review";

export function listVoucherReviews(
  query: VoucherReviewQuery,
): Promise<PageResult<AdminVoucherReviewListItem>> {
  return http.get("/v1/admin/voucher-reviews", { params: query });
}

export function getVoucherReview(
  productId: string,
): Promise<AdminVoucherReviewDetail> {
  return http.get(`/v1/admin/voucher-reviews/${productId}`);
}

export function approveVoucherReview(
  productId: string,
  version: number,
  idempotencyKey: string,
): Promise<AdminVoucherReviewResult> {
  return http.post(
    `/v1/admin/voucher-reviews/${productId}/approval`,
    { version },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
}

export function rejectVoucherReview(
  productId: string,
  version: number,
  reason: string,
  idempotencyKey: string,
): Promise<AdminVoucherReviewResult> {
  return http.post(
    `/v1/admin/voucher-reviews/${productId}/rejection`,
    { version, reason: reason.trim() },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
}
