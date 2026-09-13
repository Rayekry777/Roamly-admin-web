import { http, postBinary } from "./client";
export type FinanceSummary = {
  frozenAmount: number;
  recognizedAmount: number;
  commissionAmount: number;
  netAmount: number;
  refundedAmount: number;
  pendingSettlementAmount: number;
  settledAmount: number;
};
export const getFinanceSummary = () =>
  http.get<FinanceSummary>("/v1/admin/finance/summary");
export type LedgerPage = {
  items: Array<{
    id: string;
    shopId: string;
    orderId: string;
    entryType: string;
    accountSide: string;
    amount: number;
    occurredTime: string;
  }>;
  page: number;
  size: number;
  total: number;
};
export const listLedger = (page = 1, size = 20) =>
  http.get<LedgerPage>("/v1/admin/ledger-entries", { params: { page, size } });
export const exportLedger = () => postBinary("/v1/admin/ledger/export");
