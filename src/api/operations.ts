import { http } from "./client";
import type { PageResult } from "@/types/http";
import type {
  AdminAuditLog,
  AdminOrder,
  AdminOrderDetail,
  AdminRedemption,
  AdminRefund,
  AdminSettlement,
  OrderStatus,
} from "@/types/operations";

const commandHeaders = () => ({
  headers: { "Idempotency-Key": crypto.randomUUID() },
});

export function listAdminOrders(
  status?: OrderStatus,
  page = 1,
  size = 20,
): Promise<PageResult<AdminOrder>> {
  return http.get("/v1/admin/orders", { params: { status, page, size } });
}

export function getAdminOrder(id: string): Promise<AdminOrderDetail> {
  return http.get(`/v1/admin/orders/${id}`);
}

export function listAdminRefunds(
  status?: string,
  page = 1,
  size = 20,
): Promise<PageResult<AdminRefund>> {
  return http.get("/v1/admin/refunds", { params: { status, page, size } });
}

export function approveAdminRefund(id: string): Promise<AdminRefund> {
  return http.post(
    `/v1/admin/refunds/${id}/approval`,
    undefined,
    commandHeaders(),
  );
}

export function rejectAdminRefund(
  id: string,
  reason: string,
): Promise<AdminRefund> {
  return http.post(`/v1/admin/refunds/${id}/rejection`, undefined, {
    ...commandHeaders(),
    params: { reason },
  });
}

export function retryAdminRefund(id: string): Promise<AdminRefund> {
  return http.post(
    `/v1/admin/refunds/${id}/retry`,
    undefined,
    commandHeaders(),
  );
}

export function listAdminRedemptions(
  page = 1,
  size = 20,
): Promise<PageResult<AdminRedemption>> {
  return http.get("/v1/admin/redemptions", { params: { page, size } });
}

export function listAdminSettlements(
  page = 1,
  size = 20,
): Promise<PageResult<AdminSettlement>> {
  return http.get("/v1/admin/settlements", { params: { page, size } });
}

export function retryAdminSettlement(id: string): Promise<AdminSettlement> {
  return http.post(
    `/v1/admin/settlements/${id}/retry`,
    undefined,
    commandHeaders(),
  );
}

export function listAdminAuditLogs(
  page = 1,
  size = 20,
): Promise<PageResult<AdminAuditLog>> {
  return http.get("/v1/admin/audit-logs", { params: { page, size } });
}
