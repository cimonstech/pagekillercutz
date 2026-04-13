"use client";

import { useEffect, useState } from "react";
import type { Database } from "@/lib/database.types";
import { writeAuditLog } from "@/lib/writeAuditLog";
import { useAdminToast } from "@/hooks/useAdminToast";

type PackageRow = Database["public"]["Tables"]["packages"]["Row"];

export default function PackagesTab() {
  const { showToast, ToastComponent } = useAdminToast();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PackageRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [inclusionsText, setInclusionsText] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/packages?all=true")
      .then((r) => r.json())
      .then((d: { packages?: PackageRow[] }) => {
        setPackages(d.packages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setPrice("");
    setDisplayOrder("0");
    setInclusionsText("");
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (p: PackageRow) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description ?? "");
    setPrice(String(p.price));
    setDisplayOrder(String(p.display_order));
    setInclusionsText((p.inclusions || []).join("\n"));
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const inclusions = inclusionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      display_order: Number(displayOrder) || 0,
      inclusions,
      active: editing?.active ?? true,
    };
    try {
      if (editing) {
        const res = await fetch(`/api/packages/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as { package: PackageRow };
        setPackages((prev) => prev.map((x) => (x.id === json.package.id ? json.package : x)));
        writeAuditLog("system", `Updated package ${json.package.name}`, json.package.id);
        showToast("Package saved.");
      } else {
        const res = await fetch("/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as { package: PackageRow };
        setPackages((prev) => [...prev, json.package].sort((a, b) => a.display_order - b.display_order));
        writeAuditLog("system", `Created package ${json.package.name}`, json.package.id);
        showToast("Package created.");
      }
      setOpen(false);
      resetForm();
    } catch {
      showToast("Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: PackageRow) => {
    try {
      const res = await fetch(`/api/packages/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      });
      if (!res.ok) throw new Error();
      setPackages((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)),
      );
      writeAuditLog("system", `${!p.active ? "Activated" : "Deactivated"} package ${p.name}`, p.id);
      showToast("Package updated.");
    } catch {
      showToast("Update failed.", "error");
    }
  };

  const deletePackage = async (p: PackageRow) => {
    if (!confirm(`Delete package "${p.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/packages/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPackages((prev) => prev.filter((x) => x.id !== p.id));
      writeAuditLog("system", `Deleted package ${p.name}`, p.id);
      showToast("Package deleted.");
    } catch {
      showToast("Delete failed.", "error");
    }
  };

  return (
    <div className="min-h-screen p-10 relative">
      <ToastComponent />
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-[28px] font-headline text-white leading-tight">DJ Packages</h1>
          <p className="text-on-surface-variant text-sm mt-1">Configure and manage service tiers for artist bookings.</p>
        </div>
        <button
          type="button"
          className="hardware-btn bg-primary text-on-primary px-6 py-2.5 text-sm font-bold flex items-center gap-2 rounded-sm shadow-[0_0_20px_rgba(143,214,255,0.3)]"
          onClick={openCreate}
        >
          <span className="material-symbols-outlined text-lg">add</span>Add New Package
        </button>
      </header>

      <div className="space-y-4">
        {loading ? (
          <p className="text-on-surface-variant text-sm">Loading…</p>
        ) : (
          packages.map((p) => (
            <div
              key={p.id}
              className="glass-card p-6 flex items-center gap-6 group hover:bg-white/[0.05] transition-colors border-l-2 border-transparent hover:border-primary"
            >
              <div className="cursor-grab active:cursor-grabbing text-outline-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">drag_indicator</span>
              </div>
              <div className="flex-grow grid grid-cols-12 items-center gap-8">
                <div className="col-span-3">
                  <h3 className="text-lg font-headline text-white">{p.name}</h3>
                  {p.display_order != null && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5">
                        Order: {p.display_order}
                      </span>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="text-2xl font-syne text-secondary tracking-tight">
                    GHS {(p.price || 0).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-on-surface-variant uppercase">Per Event</span>
                </div>
                <div className="col-span-4">
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {p.inclusions.map((i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-span-3 flex items-center justify-end gap-6">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${p.active ? "bg-primary-container animate-pulse shadow-[0_0_8px_#00bfff]" : "bg-outline-variant"}`}
                    />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-2 hover:bg-white/10 rounded-sm text-on-surface-variant hover:text-white transition-colors"
                      onClick={() => openEdit(p)}
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      type="button"
                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm border transition-colors ${
                        p.active
                          ? "border-red-400/40 text-red-300/90 hover:bg-red-500/10"
                          : "border-emerald-400/40 text-emerald-300/90 hover:bg-emerald-500/10"
                      }`}
                      onClick={() => void toggleActive(p)}
                    >
                      {p.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-error/10 rounded-sm text-error/60 hover:text-error transition-colors"
                      onClick={() => void deletePackage(p)}
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-[560px] glass-card border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="font-headline text-xl text-white">{editing ? "Edit Package" : "Create New Package"}</h2>
              <button type="button" className="text-on-surface-variant hover:text-white" onClick={() => setOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="p-8 space-y-6" onSubmit={submit}>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-primary uppercase mb-2">Package Name</label>
                  <input
                    required
                    className="w-full bg-surface-container border-none focus:ring-1 focus:ring-primary text-sm py-3 px-4 rounded-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-primary uppercase mb-2">Description</label>
                  <textarea
                    className="w-full bg-surface-container border-none focus:ring-1 focus:ring-primary text-sm py-3 px-4 rounded-sm min-h-[80px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-primary uppercase mb-2">Price (GHS)</label>
                  <input
                    required
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full bg-surface-container border-none focus:ring-1 focus:ring-primary text-sm py-3 px-4 rounded-sm font-syne text-secondary"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-primary uppercase mb-2">Display Order</label>
                  <input
                    type="number"
                    className="w-full bg-surface-container border-none focus:ring-1 focus:ring-primary text-sm py-3 px-4 rounded-sm font-mono"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-primary uppercase mb-2">Inclusions (one per line)</label>
                  <textarea
                    className="w-full bg-surface-container border-none focus:ring-1 focus:ring-primary text-sm py-3 px-4 rounded-sm min-h-[100px] font-body"
                    value={inclusionsText}
                    onChange={(e) => setInclusionsText(e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-6 border-t border-white/5 flex gap-4 justify-end">
                <button
                  type="button"
                  className="px-6 py-2.5 text-xs font-bold text-on-surface-variant hover:text-white transition-colors"
                  onClick={() => setOpen(false)}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="hardware-btn bg-primary text-on-primary px-8 py-2.5 text-xs font-black rounded-sm shadow-[0_0_15px_rgba(143,214,255,0.2)] disabled:opacity-50"
                >
                  {saving ? "SAVING…" : "SAVE PACKAGE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
