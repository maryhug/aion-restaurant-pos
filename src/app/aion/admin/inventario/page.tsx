"use client";

import { useCallback, useEffect, useState } from "react";
import { ExportButton } from "@/features/admin/components/export-button";
import {
  Modal,
  ModalActions,
  Field,
  inputCls,
} from "@/features/admin/components/modal";
import { exportRowsAsCSV, formatCOP } from "@/features/admin/helpers";
import {
  PackageIcon,
  ReceiptIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@/features/admin/components/icons";

type Product = {
  id: string;
  name: string;
  category: string;
  stock: number | null;
  minStock: number | null;
  unitCost: number | null;
  price: number;
  available: boolean;
  state: string;
};

type Tab = "productos" | "servicios" | "movimientos";

const EMPTY_FORM = {
  name: "",
  category: "",
  price: "",
  unitCost: "",
  stock: "",
  minStock: "",
};

/* ─── Deterministic category color ─────────────────────────── */

const CAT_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200" },
  { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-200" },
  { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-200" },
  { bg: "bg-teal-50", text: "text-teal-600", ring: "ring-teal-200" },
  { bg: "bg-pink-50", text: "text-pink-600", ring: "ring-pink-200" },
  { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-200" },
];

function catColor(cat: string) {
  let h = 0;
  for (let i = 0; i < cat.length; i++)
    h = (h * 31 + cat.charCodeAt(i)) & 0xffffff;
  return CAT_COLORS[Math.abs(h) % CAT_COLORS.length];
}

/* ─── API helper ─────────────────────────────────────────────── */

async function api(method: string, body: unknown) {
  const r = await fetch("/api/admin/inventario", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok)
    throw new Error((await r.json().catch(() => ({}))).error ?? "Error");
  return r.json();
}

/* ─── Product card ───────────────────────────────────────────── */

function ProductCard({
  item,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: {
  item: Product;
  onEdit: (p: Product) => void;
  onActivate: (p: Product) => void;
  onDeactivate: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  const color = catColor(item.category);
  const isService = item.category === "servicio";
  const lowStock =
    !isService &&
    item.stock !== null &&
    item.minStock !== null &&
    item.stock <= item.minStock;

  return (
    <article className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Category icon */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color.bg} ${color.text}`}
      >
        {isService ? (
          <ReceiptIcon className="h-6 w-6" />
        ) : (
          <PackageIcon className="h-6 w-6" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-2">
          <span className="text-base font-bold text-stone-900">
            {item.name}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${color.bg} ${color.text} ${color.ring}`}
          >
            {item.category}
          </span>
          {!item.available && (
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-500">
              Inactivo
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-stone-600">
          <span className="font-semibold text-stone-800">
            {formatCOP(item.price)}
          </span>
          {item.unitCost != null && (
            <span className="text-xs text-stone-400">
              Costo: {formatCOP(item.unitCost)}
            </span>
          )}
          {!isService && item.stock !== null && (
            <span
              className={`flex items-center gap-1 text-xs font-medium ${lowStock ? "text-red-600" : "text-stone-500"}`}
            >
              {lowStock && <AlertTriangleIcon className="h-3.5 w-3.5" />}
              Stock: {item.stock}
              {item.minStock !== null && ` / mín ${item.minStock}`}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        <button
          onClick={() => onEdit(item)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--admin-primary,#581c22)] text-white transition-opacity hover:opacity-80"
          title="Editar"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>

        <div className="flex gap-1.5">
          {item.available ? (
            <button
              onClick={() => onDeactivate(item)}
              className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              Desactivar
            </button>
          ) : (
            <button
              onClick={() => onActivate(item)}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Activar
            </button>
          )}
          <button
            onClick={() => onDelete(item)}
            className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function AdminInventoryPage() {
  const [tab, setTab] = useState<Tab>("productos");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    mode: "create" | "edit";
    forService: boolean;
  } | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/inventario")
      .then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      })
      .then((d: { products: Product[] }) => setProducts(d.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const productItems = products.filter((p) => p.category !== "servicio");
  const serviceItems = products.filter((p) => p.category === "servicio");
  const categories = [...new Set(productItems.map((p) => p.category))].sort();

  function openCreate(forService = false) {
    setForm({ ...EMPTY_FORM, category: forService ? "servicio" : "" });
    setSelected(null);
    setModal({ mode: "create", forService });
  }

  function openEdit(p: Product) {
    setSelected(p);
    setForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      unitCost: p.unitCost != null ? String(p.unitCost) : "",
      stock: p.stock != null ? String(p.stock) : "",
      minStock: p.minStock != null ? String(p.minStock) : "",
    });
    setModal({ mode: "edit", forService: p.category === "servicio" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        unitCost: form.unitCost !== "" ? Number(form.unitCost) : null,
        stock: form.stock !== "" ? Number(form.stock) : null,
        minStock: form.minStock !== "" ? Number(form.minStock) : null,
      };
      if (modal?.mode === "create") {
        await api("POST", payload);
      } else {
        await api("PUT", { ...payload, id: selected!.id });
      }
      setModal(null);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function activate(p: Product) {
    await api("PUT", {
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      unitCost: p.unitCost,
      stock: p.stock,
      minStock: p.minStock,
      available: true,
    }).catch((e: Error) => alert(e.message));
    reload();
  }

  async function deactivate(p: Product) {
    if (!confirm(`¿Desactivar "${p.name}"?`)) return;
    await api("DELETE", { id: p.id, soft: true }).catch((e: Error) =>
      alert(e.message),
    );
    reload();
  }

  async function remove(p: Product) {
    if (!confirm(`¿Eliminar permanentemente "${p.name}"?`)) return;
    await api("DELETE", { id: p.id }).catch((e: Error) => alert(e.message));
    reload();
  }

  const isService = modal?.forService ?? false;
  const currentItems = tab === "productos" ? productItems : serviceItems;
  const lowStockCount = productItems.filter(
    (p) => p.stock !== null && p.minStock !== null && p.stock <= p.minStock,
  ).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
        {/* Tabs */}
        <div className="flex gap-1.5">
          {(["productos", "servicios", "movimientos"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                tab === t
                  ? "bg-[var(--admin-primary,#581c22)] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-1 justify-end gap-2">
          {tab === "productos" && (
            <>
              {lowStockCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                  {lowStockCount} bajo stock
                </span>
              )}
              <button
                onClick={() => openCreate(false)}
                className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                + Producto
              </button>
              <ExportButton
                onClick={() =>
                  exportRowsAsCSV(
                    "inventario.csv",
                    productItems.map((p) => ({
                      nombre: p.name,
                      categoria: p.category,
                      stock: p.stock ?? "-",
                      stock_minimo: p.minStock ?? "-",
                      costo_unitario: p.unitCost ?? "-",
                      precio_venta: p.price,
                      estado: p.state,
                    })),
                  )
                }
              />
            </>
          )}
          {tab === "servicios" && (
            <button
              onClick={() => openCreate(true)}
              className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              + Servicio
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-stone-100"
            />
          ))}
        </div>
      ) : tab === "movimientos" ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-stone-300 text-sm text-stone-400">
          Módulo de movimientos en desarrollo.
        </div>
      ) : currentItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-200 py-16 text-center">
          <CheckCircleIcon className="h-10 w-10 text-stone-200" />
          <p className="text-sm text-stone-400">
            No hay {tab} registrados aún.
          </p>
          <button
            onClick={() => openCreate(tab === "servicios")}
            className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white"
          >
            + Agregar {tab === "servicios" ? "servicio" : "producto"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentItems.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onActivate={activate}
              onDeactivate={deactivate}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={
          modal?.mode === "create"
            ? isService
              ? "Agregar servicio"
              : "Agregar producto"
            : isService
              ? "Editar servicio"
              : "Editar producto"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nombre *">
            <input
              className={inputCls}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          {!isService && (
            <Field label="Categoría *">
              <input
                className={inputCls}
                required
                list="cats"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <datalist id="cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio venta *">
              <input
                type="number"
                min="0"
                step="100"
                className={inputCls}
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Costo unitario">
              <input
                type="number"
                min="0"
                step="100"
                className={inputCls}
                value={form.unitCost}
                onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              />
            </Field>
            {!isService && (
              <>
                <Field label="Stock actual">
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                  />
                </Field>
                <Field label="Stock mínimo">
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={form.minStock}
                    onChange={(e) =>
                      setForm({ ...form, minStock: e.target.value })
                    }
                  />
                </Field>
              </>
            )}
          </div>
          <ModalActions onCancel={() => setModal(null)} saving={saving} />
        </form>
      </Modal>
    </div>
  );
}
