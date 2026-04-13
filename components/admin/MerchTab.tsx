"use client";

import Image from "next/image";
import {
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Toast, useToast } from "@/components/ui/Toast";
import type { Database } from "@/lib/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const CATEGORIES = ["Apparel", "Headwear", "Accessories", "Vinyl"] as const;
const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "2XL", "One Size"] as const;
const QUICK_COLOURS = ["Black", "White", "Navy", "Grey", "Red", "Blue"] as const;
const BADGE_OPTIONS = [
  { value: "", label: "None" },
  { value: "New Drop", label: "New Drop" },
  { value: "Limited", label: "Limited" },
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[1]![0]).toUpperCase();
}

function badgeCornerLabel(badge: string | null): string | null {
  if (!badge) return null;
  if (/limited/i.test(badge)) return "Limited";
  return "New Drop";
}

type FormState = {
  name: string;
  category: string;
  price: string;
  description: string;
  badge: string;
  sizes: string[];
  colours: string[];
  stock: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  category: "Apparel",
  price: "",
  description: "",
  badge: "",
  sizes: [],
  colours: [],
  stock: "",
  active: true,
});

function productToForm(p: ProductRow): FormState {
  return {
    name: p.name,
    category: p.category,
    price: String(p.price),
    description: p.description ?? "",
    badge: p.badge ?? "",
    sizes: [...p.sizes],
    colours: [...p.colours],
    stock: String(p.stock),
    active: p.active,
  };
}

export default function MerchTab() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toast, showToast, dismissToast } = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?all=true&limit=200");
      const data = (await res.json()) as { products?: ProductRow[] };
      setProducts(data.products ?? []);
    } catch {
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.active).length;
    const inactive = products.filter((p) => !p.active).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
    return { total, active, inactive, lowStock };
  }, [products]);

  const openNew = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditingProduct(p);
    setShowForm(true);
  };

  const onSaved = () => {
    void loadProducts();
    setShowForm(false);
    setEditingProduct(null);
    showToast("Product saved successfully.");
  };

  const onDeleted = () => {
    void loadProducts();
    setDeleteConfirm(null);
    showToast("Product deleted.", "success");
  };

  return (
    <div className="min-h-screen px-6 pb-12 pt-24 lg:px-10">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-[28px] font-semibold leading-none text-white">Merch Products</h1>
          <p className="mt-2 font-body text-[13px] text-[#A0A8C0]">Manage products shown in the merch store.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#00BFFF] px-5 font-headline text-[14px] font-bold text-black transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Add New Product
        </button>
      </header>

      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPill label="Total" value={stats.total} accent="muted" />
        <StatPill label="Active" value={stats.active} accent="cyan" />
        <StatPill label="Inactive" value={stats.inactive} accent="muted" />
        <StatPill label="Low Stock" value={stats.lowStock} accent="gold" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-10 animate-spin text-[#00BFFF]" aria-hidden />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={() => openEdit(p)}
              onToggleActive={async () => {
                const res = await fetch(`/api/products/${p.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ active: !p.active }),
                });
                if (res.ok) void loadProducts();
                else showToast("Update failed", "error");
              }}
              onRequestDelete={() => setDeleteConfirm(p.id)}
              deleteConfirm={deleteConfirm === p.id}
              onCancelDelete={() => setDeleteConfirm(null)}
              onConfirmDelete={async () => {
                const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
                if (res.ok) onDeleted();
                else showToast("Delete failed", "error");
              }}
            />
          ))}
        </div>
      )}

      {!loading && products.length === 0 ? (
        <p className="font-body text-sm text-[#A0A8C0]">No products yet. Add your first product.</p>
      ) : null}

      {showForm ? (
        <ProductFormModal
          editing={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSaved={onSaved}
          showToast={showToast}
        />
      ) : null}

      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
      ) : null}
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "cyan" | "gold" | "muted";
}) {
  const text =
    accent === "cyan"
      ? "text-[#00BFFF]"
      : accent === "gold"
        ? "text-[#F5A623]"
        : "text-white/70";
  return (
    <div
      className="rounded-2xl border border-white/[0.08] px-4 py-4"
      style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
    >
      <p className="font-label text-[10px] uppercase tracking-widest text-[#5A6080]">{label}</p>
      <p className={`mt-1 font-headline text-2xl font-semibold ${text}`}>{value}</p>
    </div>
  );
}

function ProductCard({
  product: p,
  onEdit,
  onToggleActive,
  onRequestDelete,
  deleteConfirm,
  onCancelDelete,
  onConfirmDelete,
}: {
  product: ProductRow;
  onEdit: () => void;
  onToggleActive: () => void | Promise<void>;
  onRequestDelete: () => void;
  deleteConfirm: boolean;
  onCancelDelete: () => void;
  onConfirmDelete: () => void | Promise<void>;
}) {
  const corner = badgeCornerLabel(p.badge);
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(n);
  const sizes = p.sizes;
  const shown = sizes.slice(0, 4);
  const more = sizes.length > 4 ? sizes.length - 4 : 0;

  return (
    <article
      className="overflow-hidden rounded-2xl border border-white/[0.08]"
      style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)" }}
    >
      <div className="relative h-[160px] w-full overflow-hidden bg-white/[0.04]">
        {p.image_url ? (
          <Image
            src={p.image_url}
            alt={p.name}
            fill
            className="object-cover"
            style={{ borderRadius: "12px 12px 0 0" }}
            sizes="(max-width:768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1a24] to-[#08080f] font-headline text-2xl font-semibold text-white/25">
            {initials(p.name)}
          </div>
        )}
        {corner ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 font-label text-[9px] uppercase text-white/90">
            {corner}
          </span>
        ) : null}
        <span
          className={[
            "absolute right-2 top-2 rounded-full px-2 py-0.5 font-label text-[9px] font-bold uppercase",
            p.active ? "bg-[#00BFFF]/25 text-[#00BFFF]" : "bg-white/10 text-white/50",
          ].join(" ")}
        >
          {p.active ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-headline text-[15px] font-semibold text-white">{p.name}</h3>
        <p className="mt-0.5 font-label text-[10px] uppercase tracking-wide text-[#5A6080]">{p.category}</p>

        <div className="mt-3 flex items-start justify-between gap-2">
          <p className="font-syne text-[18px] font-bold text-[#00BFFF]">
            GH₵ {fmt(p.price)}
          </p>
          <p
            className={[
              "font-label text-[11px]",
              p.stock === 0
                ? "text-[#FF4560]"
                : p.stock <= 10
                  ? "text-[#F5A623]"
                  : "text-[#5A6080]",
            ].join(" ")}
          >
            {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {shown.map((s) => (
            <span
              key={s}
              className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-label text-[9px] text-white/55"
            >
              {s}
            </span>
          ))}
          {more > 0 ? (
            <span className="rounded-full border border-white/10 px-1.5 py-0.5 font-label text-[9px] text-white/40">
              +{more} more
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#00BFFF]/40 bg-[#00BFFF]/10 px-3 py-2 font-headline text-[12px] font-semibold text-[#00BFFF] min-[400px]:flex-none"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => void onToggleActive()}
            className={[
              "inline-flex flex-1 items-center justify-center rounded-full border px-3 py-2 font-headline text-[12px] font-semibold min-[400px]:flex-none",
              p.active
                ? "border-[#FF4560]/35 bg-[#FF4560]/10 text-[#FF4560]"
                : "border-emerald-500/35 bg-emerald-500/10 text-emerald-400",
            ].join(" ")}
          >
            {p.active ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            onClick={onRequestDelete}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-[#FF4560]/35 bg-[#FF4560]/10 px-3 py-2 font-headline text-[12px] font-semibold text-[#FF4560]"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>

        {deleteConfirm ? (
          <div className="mt-4 rounded-xl border border-[#FF4560]/40 bg-[#FF4560]/08 p-3">
            <p className="font-body text-[13px] text-[#FF4560]">
              Delete this product? This cannot be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void onConfirmDelete()}
                className="rounded-lg bg-[#FF4560] px-4 py-2 font-headline text-[12px] font-bold text-white"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 font-headline text-[12px] text-white/80"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ProductFormModal({
  editing,
  onClose,
  onSaved,
  showToast,
}: {
  editing: ProductRow | null;
  onClose: () => void;
  onSaved: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    editing ? productToForm(editing) : emptyForm(),
  );
  const [colourInput, setColourInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "form", string>>>({});

  useEffect(() => {
    setForm(editing ? productToForm(editing) : emptyForm());
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
    setColourInput("");
  }, [editing]);

  const toggleSize = (s: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s],
    }));
    setErrors((e) => ({ ...e, sizes: undefined }));
  };

  const addColour = (c: string) => {
    const t = c.trim();
    if (!t) return;
    setForm((f) => (f.colours.includes(t) ? f : { ...f, colours: [...f.colours, t] }));
    setColourInput("");
  };

  const removeColour = (c: string) => {
    setForm((f) => ({ ...f, colours: f.colours.filter((x) => x !== c) }));
  };

  const onFile = (file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Use JPG, PNG, or WebP", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Max 5MB", "error");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState | "form" | "sizes", string>> = {};
    if (!form.name.trim()) next.name = "Required";
    if (!form.category) next.category = "Required";
    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price < 1) next.price = "Min 1 GHS";
    const stock = Number(form.stock);
    if (form.stock === "" || Number.isNaN(stock) || stock < 0) next.stock = "Required";
    if (form.sizes.length === 0) next.sizes = "Select at least one size";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const uploadImage = async (productId: string) => {
    if (!imageFile) return null;
    const fd = new FormData();
    fd.append("file", imageFile);
    fd.append("productId", productId);
    const res = await fetch("/api/upload/merch-image", { method: "POST", body: fd });
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok) throw new Error(json.error || "Upload failed");
    return json.url ?? null;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const price = Number(form.price);
      const stock = Number(form.stock);
      const payload = {
        name: form.name.trim(),
        category: form.category,
        price,
        description: form.description.trim() || null,
        badge: form.badge.trim() || null,
        sizes: form.sizes,
        colours: form.colours,
        stock,
        active: form.active,
        image_url: editing?.image_url ?? null,
      };

      if (editing) {
        let imageUrl = editing.image_url;
        if (imageFile) {
          const url = await uploadImage(editing.id);
          if (url) imageUrl = url;
        }
        const res = await fetch(`/api/products/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, image_url: imageUrl }),
        });
        if (!res.ok) throw new Error("Save failed");
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, image_url: null }),
        });
        const json = (await res.json()) as { product?: ProductRow; error?: string };
        if (!res.ok) throw new Error(json.error || "Create failed");
        const created = json.product;
        if (imageFile && created?.id) {
          const url = await uploadImage(created.id);
          if (url) {
            await fetch(`/api/products/${created.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image_url: url }),
            });
          }
        }
      }
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-[10px] border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-[#00BFFF] focus:shadow-[0_0_0_3px_rgba(0,191,255,0.10)]";
  const err = (k: keyof FormState | "sizes") => errors[k];

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto overscroll-y-contain bg-black/75 p-4 py-10 backdrop-blur-sm">
      <div
        className="relative my-auto w-full max-w-[600px] rounded-[20px] border border-white/[0.1] p-6 shadow-2xl"
        style={{ background: "rgba(14,14,20,0.97)", backdropFilter: "blur(20px)" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-white/50 hover:bg-white/[0.08] hover:text-white"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <h2 className="pr-10 font-headline text-[20px] font-semibold text-white">
          {editing ? "Edit Product" : "Add New Product"}
        </h2>

        <div className="mt-6 max-h-[min(70vh,calc(100dvh-8rem))] space-y-5 overflow-y-auto pr-1">
          <div>
            <label className="mb-1.5 block font-body text-[12px] text-white/80">Product Name *</label>
            <input
              className={`${inputClass} ${err("name") ? "border-[#FF4560]" : ""}`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. KillerCutz Logo Tee"
            />
            {err("name") ? <p className="mt-1 font-body text-[12px] text-[#FF4560]">{err("name")}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block font-body text-[12px] text-white/80">Category *</label>
            <select
              className={`${inputClass} ${err("category") ? "border-[#FF4560]" : ""}`}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#13131a]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block font-body text-[12px] text-white/80">Price (GHS) *</label>
            <input
              type="number"
              min={1}
              step={0.01}
              className={`${inputClass} ${err("price") ? "border-[#FF4560]" : ""}`}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="e.g. 120"
            />
            {err("price") ? <p className="mt-1 font-body text-[12px] text-[#FF4560]">{err("price")}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block font-body text-[12px] text-white/80">Description</label>
            <textarea
              rows={3}
              className={`${inputClass} min-h-[88px] resize-y`}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the product..."
            />
          </div>

          <div>
            <label className="mb-1.5 block font-body text-[12px] text-white/80">Badge</label>
            <select
              className={inputClass}
              value={form.badge}
              onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
            >
              {BADGE_OPTIONS.map((o) => (
                <option key={o.value || "none"} value={o.value} className="bg-[#13131a]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 font-body text-[12px] text-white/80">Available Sizes *</p>
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={[
                    "rounded-full border px-3 py-1.5 font-label text-[11px] transition-colors",
                    form.sizes.includes(s)
                      ? "border-[#00BFFF] bg-[#00BFFF] text-black"
                      : "border-white/12 bg-white/[0.06] text-white/70 hover:bg-white/10",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>
            {form.sizes.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.sizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.08] px-2 py-0.5 font-label text-[10px] text-white/80"
                  >
                    {s}
                    <button type="button" onClick={() => toggleSize(s)} className="text-white/50 hover:text-white">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            {err("sizes") ? <p className="mt-1 font-body text-[12px] text-[#FF4560]">{err("sizes")}</p> : null}
          </div>

          <div>
            <p className="mb-2 font-body text-[12px] text-white/80">Available Colours</p>
            <div className="flex gap-2">
              <input
                className={`${inputClass} flex-1`}
                value={colourInput}
                onChange={(e) => setColourInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addColour(colourInput);
                  }
                }}
                placeholder="Colour name"
              />
              <button
                type="button"
                onClick={() => addColour(colourInput)}
                className="shrink-0 rounded-[10px] border border-[#00BFFF]/40 bg-[#00BFFF]/15 px-4 font-headline text-[13px] font-semibold text-[#00BFFF]"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => addColour(c)}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 font-label text-[10px] text-white/60 hover:border-[#00BFFF]/40 hover:text-[#00BFFF]"
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.colours.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.06] px-2 py-0.5 font-label text-[10px] text-white/85"
                >
                  {c}
                  <button type="button" onClick={() => removeColour(c)} className="text-white/45 hover:text-white">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-body text-[12px] text-white/80">Stock *</label>
            <input
              type="number"
              min={0}
              step={1}
              className={`${inputClass} ${err("stock") ? "border-[#FF4560]" : ""}`}
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              placeholder="e.g. 50"
            />
            {err("stock") ? <p className="mt-1 font-body text-[12px] text-[#FF4560]">{err("stock")}</p> : null}
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-4 rounded border-white/20 bg-white/10 text-[#00BFFF] focus:ring-[#00BFFF]"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            <span className="font-body text-[13px] text-white/85">List this product in the store</span>
          </label>

          <div>
            <p className="mb-2 font-body text-[12px] text-white/80">Product Image</p>
            {editing?.image_url && !imagePreview ? (
              <div className="mb-3">
                <div className="relative h-[100px] w-[100px] overflow-hidden rounded-xl border border-white/10">
                  <Image src={editing.image_url} alt="" fill className="object-cover" unoptimized />
                </div>
                <p className="mt-2 font-body text-[12px] text-[#A0A8C0]">Change image below</p>
              </div>
            ) : null}
            {imagePreview ? (
              <div className="mb-3 flex items-center gap-3">
                <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl border border-white/10">
                  <Image src={imagePreview} alt="" width={100} height={100} className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate font-body text-[12px] text-white/90">{imageFile?.name}</p>
                  <p className="font-label text-[11px] text-[#5A6080]">
                    {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="mt-1 font-body text-[12px] text-[#FF4560] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : null}
            <label className="flex h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] transition-colors hover:border-[#00BFFF]/40">
              <ImagePlus className="size-6 text-white/35" aria-hidden />
              <span className="font-body text-[13px] text-white/70">Drop product image here</span>
              <span className="font-body text-[11px] text-[#5A6080]">JPG, PNG, WebP · Max 5MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#00BFFF] font-headline text-[14px] font-bold text-black disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Product"
          )}
        </button>
      </div>
    </div>
  );
}
