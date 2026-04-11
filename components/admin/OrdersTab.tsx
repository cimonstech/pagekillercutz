"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { mockOrders } from "@/lib/mockData";

export default function OrdersTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [orders, setOrders] = useState(mockOrders);
  const [selected, setSelected] = useState(mockOrders[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/orders");
        const json = (await res.json()) as { orders?: typeof mockOrders };
        if (json.orders && json.orders.length > 0) {
          setOrders(json.orders);
          setSelected(json.orders[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline font-semibold text-[28px] text-on-surface leading-none">Merch Orders</h2>
          <p className="text-on-surface-variant text-sm">Manage physical product sales and fulfillment</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span><input className="bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm pl-10 pr-4 py-2 w-64 rounded-sm placeholder:text-outline" placeholder="Search orders..." type="text" /></div>
          <select className="bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm px-4 py-2 rounded-sm text-on-surface"><option>All Statuses</option><option>Processing</option><option>Shipped</option><option>Delivered</option></select>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-surface-container-low flex flex-col justify-between h-32 relative overflow-hidden"><span className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Total Orders</span><div className="flex items-baseline gap-2"><span className="text-4xl font-headline text-white">1,284</span><span className="text-xs text-primary">+12%</span></div></div>
        <div className="p-6 bg-surface-container-low flex flex-col justify-between h-32 border-l-2 border-secondary"><span className="text-xs font-label text-secondary uppercase tracking-widest">Processing</span><span className="text-4xl font-headline text-white">42</span></div>
        <div className="p-6 bg-surface-container-low flex flex-col justify-between h-32 border-l-2 border-primary"><span className="text-xs font-label text-primary uppercase tracking-widest">Shipped</span><span className="text-4xl font-headline text-white">156</span></div>
        <div className="p-6 bg-surface-container-low flex flex-col justify-between h-32 border-l-2 border-green-500"><span className="text-xs font-label text-green-500 uppercase tracking-widest">Delivered</span><span className="text-4xl font-headline text-white">1,086</span></div>
      </section>

      <section className="space-y-4">
        {(loading ? [] : orders).map((o) => (
          <div key={o.id} className="glass rounded-2xl p-6 flex flex-col lg:flex-row gap-8 items-start hover:bg-white/[0.08] transition-all duration-300">
            <div className="w-full lg:w-1/4 space-y-2">
              <div className="flex items-center gap-2 mb-1"><span className="font-label text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">#{o.id}</span></div>
              <h3 className="font-headline font-semibold text-lg">{o.customer}</h3>
              <div className="text-xs text-on-surface-variant">customer@example.com</div>
            </div>
            <div className="w-full lg:flex-1 border-y lg:border-y-0 lg:border-x border-white/5 py-4 lg:py-0 lg:px-8">
              <div className="flex items-center justify-between"><span className="text-on-surface">{o.item}</span><span className="font-mono text-on-surface-variant">1 x ${o.amount.toFixed(2)}</span></div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-3"><span className="text-[10px] uppercase text-on-surface-variant font-label">Total Amount</span><span className="text-xl font-bold font-headline text-on-surface">${o.amount.toFixed(2)}</span></div>
            </div>
            <div className="w-full lg:w-auto flex flex-col gap-4 justify-between self-stretch">
              <div className="flex flex-wrap gap-2 justify-end"><span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full">{o.status}</span></div>
              <div className="flex gap-2 justify-end"><button className="p-2 bg-surface-container-highest text-white hover:text-primary transition-colors rounded-sm"><span className="material-symbols-outlined text-sm">local_shipping</span></button><button className="px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase rounded-sm hover:opacity-90" onClick={() => { setSelected(o); setModalOpen(true); }}>Details</button></div>
            </div>
          </div>
        ))}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-[600px] glass p-8 border border-white/10 relative">
            <button className="absolute top-6 right-6 text-on-surface-variant hover:text-white transition-colors" onClick={() => setModalOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="mb-8"><span className="font-label text-xs text-primary font-bold tracking-widest uppercase">Order Details</span><h2 className="text-3xl font-headline text-white mt-1">#{selected.id}</h2></div>
            <div className="space-y-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-surface-container-highest flex-shrink-0 relative">
                  <Image src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjouPw2ApsW_wqa-lmAhQ5lYHVh4ffWl3330rn0Pbsw-ep8hzY3Fm9GsEF5G6fI_h5cgti-17rim4BYdm0669s8r522CEBfsPaESG2jDE0HWwZzyus07ecuDTSr6Ph9BplksW4Yu2SX2STVNwVTCYG0HRM7X6gI2CNuRnylr9vlIvTiWrvcj9qkqRiIygTfj1kxdDGVDdvvHLF_8Bfhl3U3-z-Nt05yhWZj6EHZOfoKzBQLn6dJDi6goNsvSheR9IzHOZkiNUTz-NU" alt="" fill className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" unoptimized />
                </div>
                <div className="flex-1"><h4 className="text-white font-medium">Electric Pulse Hoodie</h4><p className="text-xs text-on-surface-variant">XL / Black</p></div>
                <div className="text-right"><p className="text-white font-label">$65.00</p><p className="text-[10px] text-on-surface-variant">Qty: 1</p></div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-label uppercase text-on-surface-variant mb-6 tracking-widest">Fulfillment Timeline</h3>
              <div className="space-y-0">
                <div className="flex gap-6 pb-8 border-l border-white/10 ml-2 relative"><div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-secondary border-2 border-surface" /><div className="flex-1 -mt-1 pl-4"><p className="font-bold text-sm text-secondary">Processing Order</p><p className="text-xs text-on-surface-variant">In warehouse queue</p></div></div>
                <div className="flex gap-6 pb-8 border-l border-white/10 ml-2 relative opacity-30"><div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-white/20 border-2 border-surface" /><div className="flex-1 -mt-1 pl-4"><p className="font-bold text-sm">Shipped</p></div></div>
                <div className="flex gap-6 ml-2 relative opacity-30"><div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-white/20 border-2 border-surface" /><div className="flex-1 -mt-1 pl-4"><p className="font-bold text-sm">Delivered</p></div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
