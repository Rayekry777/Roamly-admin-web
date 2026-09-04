import { http } from "./client";

interface EventTicket {
  ticket: string;
  expiresAt: string;
}
export interface AdminRealtimeEvent {
  eventId?: string;
  type: string;
  resourceId?: string;
  shopId?: string;
  requiredPermission?: string;
  occurredAt?: string;
}

export function startAdminRealtime(options: {
  onEvent: (event: AdminRealtimeEvent) => void;
  onState?: (state: "connected" | "fallback") => void;
}): () => void {
  let stopped = false;
  let source: EventSource | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let fallbackTimer: ReturnType<typeof setInterval> | undefined;
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const eventTypes = [
    "connected",
    "PAYMENT_UPDATED",
    "REFUND_UPDATED",
    "VOUCHER_REDEEMED",
    "REDEMPTION_REVERSED",
    "MERCHANT_REVIEWED",
    "SETTLEMENT_UPDATED",
  ];

  const clearFallback = () => {
    if (fallbackTimer) clearInterval(fallbackTimer);
    fallbackTimer = undefined;
  };
  const schedule = (delay = 2_000) => {
    if (stopped || retryTimer) return;
    options.onState?.("fallback");
    if (!fallbackTimer)
      fallbackTimer = setInterval(
        () => options.onEvent({ type: "FALLBACK_REFRESH" }),
        30_000,
      );
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      void connect();
    }, delay);
  };
  const connect = async () => {
    if (stopped) return;
    try {
      const ticket = await http.post<EventTicket>("/v1/admin/event-tickets");
      if (stopped) return;
      const url = `${baseUrl.replace(/\/$/, "")}/v1/admin/events?ticket=${encodeURIComponent(ticket.ticket)}`;
      source = new EventSource(url);
      const handle = (message: MessageEvent<string>) => {
        try {
          options.onEvent(JSON.parse(message.data) as AdminRealtimeEvent);
        } catch {
          /* 忽略非契约事件 */
        }
      };
      eventTypes.forEach((type) => source?.addEventListener(type, handle));
      source.onopen = () => {
        clearFallback();
        options.onState?.("connected");
      };
      source.onerror = () => {
        source?.close();
        source = undefined;
        schedule();
      };
    } catch {
      schedule();
    }
  };
  void connect();
  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    clearFallback();
    source?.close();
    source = undefined;
  };
}
