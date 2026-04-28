"use client";

import { Toast, useToast } from "@/components/ui/Toast";
import type { Database, OrderItem } from "@/lib/database.types";
import Image from "next/image";
import { Clock, Search, ShoppingBag, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import PaymentDetails from "@/components/payment/PaymentDetails";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ItemWithImage = OrderItem & { image_url?: string };

const ORDERS_PER_PAGE = 5;
const BG = "#08080F";

function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatItemLine(it: OrderItem): string {
  return `${it.name} · ${it.size} · ${it.colour} × ${it.qty}`;
}

function chipLabel(it: OrderItem): string {
  return `${it.name} · ${it.size}`;
}

function paymentBadgeClass(paid: boolean): string {
  return paid
    ? "border border-[#00BFFF]/50 bg-black/40 px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#00BFFF]"
    : "border border-[#F5A623]/50 bg-black/40 px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#F5A623]";
}

function fulfillmentBadgeClass(status: OrderRow["fulfillment_status"]): string {
  if (status === "delivered")
    return "border border-emerald-500/50 bg-black/40 px-2 py-1 font-mono text-[10px] font-bold uppercase text-emerald-300";
  if (status === "shipped")
    return "border border-[#00BFFF]/50 bg-black/40 px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#00BFFF]";
  return "border border-[#F5A623]/50 bg-black/40 px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#F5A623]";
}

function fulfillmentLabel(status: OrderRow["fulfillment_status"]): string {
  if (status === "processing") return "PROCESSING";
  if (status === "shipped") return "SHIPPED";
  return "DELIVERED";
}

function buildChartData(orders: OrderRow[]): { month: string; spent: number }[] {
  const buckets = new Map<string, { spent: number; sortKey: string }>();
  orders.forEach((order) => {
    const d = new Date(order.created_at);
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GH", { month: "short", year: "numeric" });
    const prev = buckets.get(label);
    const add = Number(order.total);
    if (!prev) {
      buckets.set(label, { spent: add, sortKey });
    } else {
      buckets.set(label, { spent: prev.spent + add, sortKey: prev.sortKey });
    }
  });
  return Array.from(buckets.entries())
    .map(([month, { spent, sortKey }]) => ({ month, spent, sortKey }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ month, spent }) => ({ month, spent }));
}

function pageWindow(totalPages: number, current: number, max = 5): number[] {
  if (totalPages <= 0) return [];
  if (totalPages <= max) return Array.from({ length: totalPages }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(max / 2));
  let end = Math.min(totalPages, start + max - 1);
  if (end - start + 1 < max) start = Math.max(1, end - max + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

type ChartPoint = { month: string; spent: number };

function SpendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      className="rounded-lg border border-white/[0.08] px-3 py-2 shadow-xl"
      style={{ background: "rgba(16,16,22,0.92)", backdropFilter: "blur(12px)" }}
    >
      <p className="font-headline text-[14px] font-semibold text-white">
        GH₵{Number(p.spent).toLocaleString()}
      </p>
      <p className="mt-0.5 font-mono text-[10px] text-[#5A6080]">{p.month}</p>
    </div>
  );
}

export default function ClientOrdersPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { toast, showToast, dismissToast } = useToast();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingPayment: 0,
    delivered: 0,
  });
  const [chartData, setChartData] = useState<{ month: string; spent: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        router.replace("/sign-in");
        return;
      }
      const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}&limit=100`);
      const json = (await res.json()) as { orders?: OrderRow[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load orders");
      setOrders(json.orders ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("lock:") || message.includes("Lock ") || message.includes("steal")) {
        return;
      }
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (orders.length === 0) return;

    setStats({
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + Number(o.total), 0),
      pendingPayment: orders.filter((o) => o.payment_status === "unpaid").length,
      delivered: orders.filter((o) => o.fulfillment_status === "delivered").length,
    });

    setChartData(buildChartData(orders));
  }, [orders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const latestOrder = orders[0] ?? null;

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      if (o.order_number.toLowerCase().includes(q)) return true;
      return o.items.some((it) => it.name.toLowerCase().includes(q));
    });
  }, [orders, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * ORDERS_PER_PAGE,
    safePage * ORDERS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageNums = pageWindow(totalPages, safePage, 5);
  const startIdx =
    filteredOrders.length === 0 ? 0 : (safePage - 1) * ORDERS_PER_PAGE + 1;
  const endIdx =
    filteredOrders.length === 0 ? 0 : Math.min(safePage * ORDERS_PER_PAGE, filteredOrders.length);

  const glass = "border border-white/[0.08] bg-white/[0.05] backdrop-blur-[20px]";

  if (error && !loading) {
    return (
      <main className="relative z-[1] w-full px-8 pb-8 text-on-surface" style={{ background: BG }}>
        <p className="mx-auto max-w-[1200px] pt-8 font-body text-sm text-[#FF4560]">{error}</p>
      </main>
    );
  }

  return (
    <main className="relative z-[1] min-h-full w-full px-8 pb-12 text-on-surface" style={{ background: BG }}>
      {toast ? <Toast message={toast.message} type={toast.type} onClose={dismissToast} /> : null}

      <div className="mx-auto max-w-[1200px] pt-8">
        <header className="mb-8">
          <h1 className="font-headline text-[32px] font-semibold leading-tight text-white">My Orders</h1>
          <p className="mt-1 font-body text-[14px] text-[#A0A8C0]">Your Page KillerCutz merch purchases.</p>
        </header>

        {loading ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-2xl border border-white/[0.06] p-5 ${glass}`}
                >
                  <div className="kc-shimmer h-20 w-full rounded-xl" />
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
              <div className={`min-h-[420px] rounded-[20px] p-6 ${glass}`}>
                <div className="kc-shimmer h-full min-h-[360px] w-full rounded-xl" />
              </div>
              <div className={`rounded-[20px] p-6 ${glass}`}>
                <div className="kc-shimmer mb-6 h-8 w-48 rounded-lg" />
                {[1, 2, 3, 4, 5].map((r) => (
                  <div key={r} className="border-b border-white/[0.05] py-4">
                    <div className="kc-shimmer h-12 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="size-14 text-[rgba(255,255,255,0.22)]" strokeWidth={1.25} aria-hidden />
            <h2 className="mt-6 font-headline text-[22px] font-semibold text-white">No orders yet.</h2>
            <p className="mt-2 max-w-md font-body text-[14px] text-[#A0A8C0]">
              Browse the merch drop and grab something.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/merch")}
                className="rounded-full bg-[#00BFFF] px-8 py-2.5 font-headline text-[14px] font-semibold text-black transition-all hover:brightness-110"
              >
                Browse Merch →
              </button>
              <button
                type="button"
                onClick={() => router.push("/client/dashboard")}
                className="rounded-full border border-white/[0.14] bg-transparent px-8 py-2.5 font-headline text-[14px] font-medium text-[#A0A8C0] transition-colors hover:bg-white/[0.04]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div
                className={`flex min-h-[88px] flex-1 items-center justify-between gap-4 rounded-2xl p-5 ${glass}`}
                style={{ borderLeftWidth: 3, borderLeftColor: "#00BFFF" }}
              >
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(0,191,255,0.12)" }}
                >
                  <ShoppingBag className="size-8 text-[#00BFFF]" strokeWidth={1.75} aria-hidden />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#5A6080]">Total Orders</p>
                  <p className="font-syne text-[36px] font-bold leading-none text-white">{stats.totalOrders}</p>
                </div>
              </div>

              <div
                className={`flex min-h-[88px] flex-1 items-center justify-between gap-4 rounded-2xl p-5 ${glass}`}
                style={{ borderLeftWidth: 3, borderLeftColor: "#F5A623" }}
              >
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(245,166,35,0.12)" }}
                >
                  <Wallet className="size-8 text-[#F5A623]" strokeWidth={1.75} aria-hidden />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#5A6080]">Total Spent</p>
                  <p className="font-syne text-[32px] font-bold leading-none text-[#F5A623]">
                    GH₵{stats.totalSpent.toLocaleString()}
                  </p>
                </div>
              </div>

              <div
                className={`flex min-h-[88px] flex-1 items-center justify-between gap-4 rounded-2xl p-5 ${glass}`}
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: stats.pendingPayment > 0 ? "#FF4560" : "#22c55e",
                }}
              >
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background:
                      stats.pendingPayment > 0 ? "rgba(255,69,96,0.12)" : "rgba(34,197,94,0.12)",
                  }}
                >
                  <Clock
                    className="size-8"
                    style={{ color: stats.pendingPayment > 0 ? "#FF4560" : "#22c55e" }}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#5A6080]">Pending Payment</p>
                  <p
                    className="font-syne text-[36px] font-bold leading-none"
                    style={{ color: stats.pendingPayment > 0 ? "#FF4560" : "#22c55e" }}
                  >
                    {stats.pendingPayment}
                  </p>
                  {stats.pendingPayment === 0 ? (
                    <p className="mt-1 font-body text-[12px] text-[#5A6080]">All paid!</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Two columns */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr] lg:gap-6">
              {/* Latest order */}
              <div className={`flex min-h-0 flex-col overflow-hidden rounded-[20px] ${glass}`}>
                <div className="flex items-start justify-between gap-3 px-5 pt-5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5A6080]">Latest Order</span>
                  {latestOrder ? (
                    <span className="font-body text-[12px] text-[#A0A8C0]">
                      {formatOrderDate(latestOrder.created_at)}
                    </span>
                  ) : null}
                </div>

                {latestOrder ? (
                  <>
                    <div className="relative mx-5 mt-3 h-[220px] w-[calc(100%-2.5rem)] overflow-hidden rounded-xl">
                      {(() => {
                        const first = latestOrder.items[0] as ItemWithImage;
                        const src = first?.image_url;
                        return src ? (
                          <Image
                            src={src}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 480px"
                            unoptimized={src.startsWith("http")}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center rounded-xl"
                            style={{
                              background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(8,8,15,0.9) 100%)",
                            }}
                          >
                            <ShoppingBag className="size-12 text-white/20" strokeWidth={1} aria-hidden />
                          </div>
                        );
                      })()}
                      <div className="absolute bottom-0 left-0 right-0 flex flex-wrap gap-2 bg-black/45 p-3 backdrop-blur-sm">
                        <span className={paymentBadgeClass(latestOrder.payment_status === "paid")}>
                          {latestOrder.payment_status === "paid" ? "PAID" : "UNPAID"}
                        </span>
                        <span className={fulfillmentBadgeClass(latestOrder.fulfillment_status)}>
                          {fulfillmentLabel(latestOrder.fulfillment_status)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <p className="font-mono text-[14px] text-[#00BFFF]">{latestOrder.order_number}</p>

                      <ul className="mt-4 space-y-1.5">
                        {latestOrder.items.slice(0, 2).map((it, idx) => (
                          <li key={`${latestOrder.id}-li-${idx}`} className="font-body text-[13px] text-white">
                            {formatItemLine(it)}
                          </li>
                        ))}
                      </ul>
                      {latestOrder.items.length > 2 ? (
                        <p className="mt-2 font-body text-[12px] text-[#5A6080]">
                          +{latestOrder.items.length - 2} more items
                        </p>
                      ) : null}

                      <div className="my-5 h-px bg-white/[0.08]" />

                      <p className="font-syne text-[24px] font-bold text-white">
                        GH₵{Number(latestOrder.total).toLocaleString()}
                      </p>

                      {latestOrder.payment_status === "unpaid" ? (
                        <div
                          className="mt-3 rounded-[10px] border border-white/[0.06] p-3"
                          style={{ borderLeftWidth: 2, borderLeftColor: "#00BFFF" }}
                        >
                          <PaymentDetails
                            reference={latestOrder.order_number}
                            amount={Number(latestOrder.total)}
                            amountLabel="Amount to Pay"
                            compact
                          />
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/track-order?id=${encodeURIComponent(latestOrder.order_number)}`)
                        }
                        className="mt-4 w-full rounded-full bg-[#00BFFF] py-3 font-headline text-[14px] font-semibold text-black transition-all hover:brightness-110"
                      >
                        Track Order →
                      </button>

                      {latestOrder.payment_status === "unpaid" ? (
                        <button
                          type="button"
                          onClick={() =>
                            showToast(
                              "Note sent to Page KillerCutz. Your payment will be verified shortly.",
                              "info",
                            )
                          }
                          className="mt-3 w-full rounded-full border border-white/[0.12] bg-transparent py-3 font-headline text-[14px] font-medium text-[#A0A8C0] transition-colors hover:bg-white/[0.04]"
                        >
                          Mark as Paid?
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>

              {/* All orders list */}
              <div className={`rounded-[20px] p-6 ${glass}`}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-headline text-[16px] font-semibold text-white">All Orders</h2>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-[#5A6080]">
                      {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <label className="relative block w-full sm:w-[200px]">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5A6080]"
                      aria-hidden
                    />
                    <input
                      type="search"
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] py-2.5 pl-10 pr-3 font-body text-[13px] text-white placeholder:text-[#5A6080] outline-none ring-primary/20 focus:ring-2"
                    />
                  </label>
                </div>

                <div className="border-b border-white/[0.08] pb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-[#5A6080]">
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: "2fr 3fr 1fr 2fr" }}
                  >
                    <span>Order</span>
                    <span>Items</span>
                    <span>Total</span>
                    <span className="text-right">Status</span>
                  </div>
                </div>

                <div className="min-h-[200px]">
                  {paginatedOrders.length === 0 ? (
                    <p className="py-10 text-center font-body text-[13px] text-[#5A6080]">No orders match your search.</p>
                  ) : (
                    paginatedOrders.map((order) => {
                      const isLatest = latestOrder && order.id === latestOrder.id;
                      return (
                        <div
                          key={order.id}
                          className="grid gap-3 border-b border-white/[0.05] py-3.5 pl-1 transition-colors hover:bg-white/[0.03]"
                          style={{
                            gridTemplateColumns: "2fr 3fr 1fr 2fr",
                            alignItems: "center",
                            ...(isLatest ? { borderLeft: "2px solid #00BFFF", paddingLeft: 10 } : {}),
                          }}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {isLatest ? (
                                <span className="font-mono text-[9px] uppercase tracking-wide text-[#00BFFF]">
                                  Latest
                                </span>
                              ) : null}
                              <p className="font-mono text-[13px] text-[#00BFFF]">{order.order_number}</p>
                            </div>
                            <p className="mt-0.5 font-body text-[11px] text-[#5A6080]">
                              {formatOrderDate(order.created_at)}
                            </p>
                          </div>
                          <div className="flex min-w-0 flex-wrap gap-1">
                            {order.items.slice(0, 2).map((it, idx) => (
                              <span
                                key={`${order.id}-c-${idx}`}
                                className="max-w-full truncate rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[#A0A8C0]"
                              >
                                {chipLabel(it)}
                              </span>
                            ))}
                            {order.items.length > 2 ? (
                              <span className="rounded-full border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-[#5A6080]">
                                +{order.items.length - 2}
                              </span>
                            ) : null}
                          </div>
                          <div>
                            <span className="font-headline text-[14px] font-semibold text-white">
                              GH₵{Number(order.total).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={paymentBadgeClass(order.payment_status === "paid")}>
                              {order.payment_status === "paid" ? "PAID" : "UNPAID"}
                            </span>
                            <span className={fulfillmentBadgeClass(order.fulfillment_status)}>
                              {fulfillmentLabel(order.fulfillment_status)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/track-order?id=${encodeURIComponent(order.order_number)}`)
                              }
                              className="font-headline text-[11px] font-medium text-[#00BFFF] hover:underline"
                            >
                              Track →
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {filteredOrders.length > 0 ? (
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={safePage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="rounded-full border border-white/[0.12] px-4 py-2 font-headline text-[12px] text-[#A0A8C0] transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ← Prev
                      </button>
                      {pageNums.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCurrentPage(n)}
                          className={[
                            "min-w-[36px] rounded-full px-3 py-2 font-mono text-[12px]",
                            n === safePage
                              ? "bg-[#00BFFF] font-semibold text-black"
                              : "border border-white/[0.08] bg-white/[0.04] text-[#A0A8C0] hover:bg-white/[0.07]",
                          ].join(" ")}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={safePage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="rounded-full border border-white/[0.12] px-4 py-2 font-headline text-[12px] text-[#A0A8C0] transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-[#5A6080]">
                      Showing {startIdx}–{endIdx} of {filteredOrders.length}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Chart */}
            {orders.length >= 2 && chartData.length >= 1 ? (
              <div className={`mt-6 rounded-[20px] p-6 ${glass}`}>
                <h3 className="font-headline text-[16px] font-semibold text-white">Spending Over Time</h3>
                <p className="mt-1 font-body text-[13px] text-[#A0A8C0]">GH₵ spent per month</p>
                <div className="mt-4 h-[200px] w-full">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00BFFF" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#00BFFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid horizontal={false} vertical={false} stroke="transparent" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#5A6080", fontSize: 10, fontFamily: "var(--font-mono), monospace" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip content={<SpendTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="spent"
                        stroke="#00BFFF"
                        strokeWidth={2}
                        fill="url(#spendGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
