"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Database, OrderItem } from "@/lib/database.types";
import { writeAuditLog } from "@/lib/writeAuditLog";
import { useAdminToast } from "@/hooks/useAdminToast";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];


function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** DB `numeric` / JSON may arrive as string; avoid calling number methods on undefined. */
function safeMoney(value: unknown): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatMoney(value: unknown): string {
  return safeMoney(value).toLocaleString("en-GH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function normalizeItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (!entry || typeof entry !== "object") {
      return {
        product_id: "",
        name: "Item",
        size: "—",
        colour: "—",
        qty: 0,
        price: 0,
      };
    }
    const o = entry as Record<string, unknown>;
    const rawQty = o.qty ?? o.quantity;
    return {
      product_id: String(o.product_id ?? ""),
      name: String(o.name ?? "Item"),
      size: String(o.size ?? "—"),
      colour: String(o.colour ?? "—"),
      qty: Math.max(0, Math.floor(safeMoney(rawQty))),
      price: safeMoney(o.price),
    };
  });
}

export default function OrdersTab() {
  const { showToast, ToastComponent } = useAdminToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>("all");
  const [actionKey, setActionKey] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/orders?limit=200");
        const json = (await res.json()) as { orders?: OrderRow[] };
        if (json.orders?.length) {
          setOrders(json.orders);
          setSelected(json.orders[0]!);
        } else {
          setOrders([]);
          setSelected(null);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (o.order_number ?? "").toLowerCase().includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        (o.customer_email ?? "").toLowerCase().includes(q);
      const matchesFul =
        fulfillmentFilter === "all" || o.fulfillment_status === fulfillmentFilter;
      return matchesSearch && matchesFul;
    });
  }, [orders, search, fulfillmentFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const processing = orders.filter((o) => o.fulfillment_status === "processing").length;
    const shipped = orders.filter((o) => o.fulfillment_status === "shipped").length;
    const delivered = orders.filter((o) => o.fulfillment_status === "delivered").length;
    return { total, processing, shipped, delivered };
  }, [orders]);

  const runAction = async (order: OrderRow, key: string, patch: Partial<OrderRow>, after?: () => void) => {
    setActionKey(key);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        showToast("Update failed.", "error");
        return;
      }
      const json = (await res.json()) as { order?: OrderRow };
      const next = json.order ?? { ...order, ...patch };
      setOrders((prev) => prev.map((o) => (o.id === order.id ? (next as OrderRow) : o)));
      setSelected((s) => (s?.id === order.id ? (next as OrderRow) : s));
      after?.();
    } catch {
      showToast("Update failed.", "error");
    } finally {
      setActionKey(null);
    }
  };

  const handleMarkPaid = async (order: OrderRow) => {
    await runAction(order, `${order.id}-paid`, { payment_status: "paid" }, () => {
      fetch("/api/notify/order-payment-confirmed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      }).catch(console.error);
      writeAuditLog(
        "payment",
        `Payment confirmed for order ${order.order_number} — ${order.customer_name}`,
        order.order_number,
      );
      showToast("Payment confirmed. Customer notified.");
    });
  };

  const handleMarkShipped = async (order: OrderRow) => {
    await runAction(order, `${order.id}-ship`, { fulfillment_status: "shipped" }, () => {
      fetch("/api/notify/order-shipped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      }).catch(console.error);
      writeAuditLog("order", `Marked order ${order.order_number} as shipped`, order.order_number);
      showToast("Order marked as shipped.");
    });
  };

  const handleMarkDelivered = async (order: OrderRow) => {
    await runAction(order, `${order.id}-del`, { fulfillment_status: "delivered" }, () => {
      fetch("/api/notify/order-delivered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      }).catch(console.error);
      writeAuditLog("order", `Marked order ${order.order_number} as delivered`, order.order_number);
      showToast("Order marked as delivered.");
    });
  };

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      <ToastComponent />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline font-semibold text-[28px] text-on-surface leading-none">Merch Orders</h2>
          <p className="text-on-surface-variant text-sm">Manage physical product sales and fulfillment</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm pl-10 pr-4 py-2 w-64 rounded-sm placeholder:text-outline"
              placeholder="Search orders..."
              type="text"
            />
          </div>
          <select
            value={fulfillmentFilter}
            onChange={(e) => setFulfillmentFilter(e.target.value)}
            className="bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm px-4 py-2 rounded-sm text-on-surface"
          >
            <option value="all">All Statuses</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-surface-container-low flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Total Orders</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-headline text-white">{stats.total}</span>
          </div>
        </div>
        <div className="p-6 bg-surface-container-low flex flex-col justify-between h-32 border-l-2 border-secondary">
          <span className="text-xs font-label text-secondary uppercase tracking-widest">Processing</span>
          <span className="text-4xl font-headline text-white">{stats.processing}</span>
        </div>
        <div className="p-6 bg-surface-container-low flex flex-col justify-between h-32 border-l-2 border-primary">
          <span className="text-xs font-label text-primary uppercase tracking-widest">Shipped</span>
          <span className="text-4xl font-headline text-white">{stats.shipped}</span>
        </div>
        <div className="p-6 bg-surface-container-low flex flex-col justify-between h-32 border-l-2 border-green-500">
          <span className="text-xs font-label text-green-500 uppercase tracking-widest">Delivered</span>
          <span className="text-4xl font-headline text-white">{stats.delivered}</span>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <p className="text-on-surface-variant text-sm">Loading orders…</p>
        ) : (
          filtered.map((o) => {
            const busy = actionKey?.startsWith(o.id) ?? false;
            return (
              <div
                key={o.id}
                className="glass rounded-2xl p-6 flex flex-col lg:flex-row gap-8 items-start hover:bg-white/[0.08] transition-all duration-300"
              >
                <div className="w-full lg:w-1/4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label text-xs text-primary bg-primary/10 px-2 py-0.5 rounded font-mono">
                      {o.order_number}
                    </span>
                  </div>
                  <h3 className="font-headline font-semibold text-lg">{o.customer_name}</h3>
                  <div className="text-xs text-on-surface-variant space-y-0.5">
                    <div>{o.customer_email}</div>
                    <div>{o.customer_phone}</div>
                    <div className="line-clamp-2">{o.delivery_address}</div>
                  </div>
                </div>
                <div className="w-full lg:flex-1 border-y lg:border-y-0 lg:border-x border-white/5 py-4 lg:py-0 lg:px-8">
                  <div className="flex flex-col gap-1.5">
                    {normalizeItems(o.items).map((item, idx: number) => (
                      <div key={`${item.product_id}-${idx}`} className="text-on-surface text-sm leading-snug">
                        <span className="text-white/90">{item.name}</span>
                        <span className="text-on-surface-variant">
                          {" "}
                          ({item.size} · {item.colour}) — {item.qty} × GH₵{formatMoney(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-3">
                    <span className="text-[10px] uppercase text-on-surface-variant font-label">Total Amount</span>
                    <span className="text-xl font-bold font-headline text-on-surface">
                      GHS {formatMoney(o.total)}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-2">{formatDate(o.created_at)}</p>
                </div>
                <div className="w-full lg:w-auto flex flex-col gap-4 justify-between self-stretch">
                  <div className="flex flex-wrap gap-2 justify-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full">
                      {o.payment_status}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full">
                      {o.fulfillment_status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {o.payment_status === "unpaid" && (
                      <button
                        type="button"
                        disabled={busy}
                        className="px-3 py-2 bg-secondary text-black text-xs font-bold uppercase rounded-sm disabled:opacity-40"
                        onClick={() => void handleMarkPaid(o)}
                      >
                        Mark paid
                      </button>
                    )}
                    {o.fulfillment_status === "processing" && o.payment_status === "paid" && (
                      <button
                        type="button"
                        disabled={busy}
                        className="p-2 bg-surface-container-highest text-white hover:text-primary transition-colors rounded-sm"
                        title="Ship"
                        onClick={() => void handleMarkShipped(o)}
                      >
                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                      </button>
                    )}
                    {o.fulfillment_status === "shipped" && (
                      <button
                        type="button"
                        disabled={busy}
                        className="px-3 py-2 bg-green-600/20 text-green-400 text-xs font-bold uppercase rounded-sm"
                        onClick={() => void handleMarkDelivered(o)}
                      >
                        Delivered
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase rounded-sm hover:opacity-90"
                      onClick={() => {
                        setSelected(o);
                        setModalOpen(true);
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {modalOpen && selected && (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-[600px] glass p-8 border border-white/10 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              className="absolute top-6 right-6 text-on-surface-variant hover:text-white transition-colors"
              onClick={() => setModalOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="mb-8">
              <span className="font-label text-xs text-primary font-bold tracking-widest uppercase">Order Details</span>
              <h2 className="text-3xl font-headline text-white mt-1 font-mono">{selected.order_number}</h2>
              <p className="text-sm text-on-surface-variant mt-2">
                {selected.customer_name} · {selected.customer_email}
              </p>
            </div>
            <div className="space-y-6 mb-10">
              {normalizeItems(selected.items).map((item, idx: number) => (
                <div key={`${item.product_id}-${idx}`} className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="w-16 h-16 bg-surface-container-highest flex-shrink-0 relative overflow-hidden rounded-sm">
                    <Image
                      src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=128&h=128&fit=crop"
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{item.name}</h4>
                    <p className="text-xs text-on-surface-variant">
                      {item.size} · {item.colour}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-label">
                      {item.qty} × GH₵{formatMoney(item.price)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">
                      Subtotal GH₵{formatMoney(item.price * item.qty)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-xs font-label uppercase text-on-surface-variant mb-6 tracking-widest">
                Fulfillment Timeline
              </h3>
              <div className="space-y-0">
                <TimelineStep
                  title="Order Placed"
                  subtitle={formatDate(selected.created_at)}
                  active
                  done
                />
                <TimelineStep
                  title="Payment Confirmed"
                  subtitle={selected.payment_status === "paid" ? "Paid" : "Awaiting payment"}
                  done={selected.payment_status === "paid"}
                  active={selected.payment_status === "paid"}
                />
                <TimelineStep
                  title="Shipped"
                  subtitle={
                    selected.fulfillment_status === "shipped" || selected.fulfillment_status === "delivered"
                      ? "Dispatched"
                      : "Pending"
                  }
                  done={
                    selected.fulfillment_status === "shipped" || selected.fulfillment_status === "delivered"
                  }
                  active={selected.fulfillment_status === "shipped"}
                />
                <TimelineStep
                  title="Delivered"
                  subtitle={selected.fulfillment_status === "delivered" ? "Completed" : "Pending"}
                  done={selected.fulfillment_status === "delivered"}
                  active={selected.fulfillment_status === "delivered"}
                  last
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineStep({
  title,
  subtitle,
  done,
  active,
  last,
}: {
  title: string;
  subtitle: string;
  done?: boolean;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex gap-6 ${last ? "" : "pb-8 border-l border-white/10 ml-2"} relative`}
    >
      <div
        className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-surface ${
          done ? "bg-secondary" : "bg-white/20"
        }`}
      />
      <div className={`flex-1 -mt-1 pl-4 ${done ? "" : "opacity-40"}`}>
        <p className={`font-bold text-sm ${active ? "text-secondary" : "text-white"}`}>{title}</p>
        <p className="text-xs text-on-surface-variant">{subtitle}</p>
      </div>
    </div>
  );
}
