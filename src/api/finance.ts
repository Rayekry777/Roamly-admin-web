import { http, postBinary } from "./client";
export type CommissionRule={id:string|null;shopId:string|null;rateBps:number;effectiveFrom:string;effectiveTo?:string;version:number};
export type LedgerPage={items:Array<{id:string;shopId:string;orderId:string;entryType:string;accountSide:string;amount:number;occurredTime:string}>;page:number;size:number;total:number};
export const getCommissionRule=(shopId?:string)=>http.get<CommissionRule>("/v1/admin/commission-rules",{params:{shopId}});
export const listLedger=(page=1,size=20)=>http.get<LedgerPage>("/v1/admin/ledger-entries",{params:{page,size}});
export const exportLedger=()=>postBinary("/v1/admin/ledger/export");
