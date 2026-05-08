"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/features/admin/components/data-table";
import { ExportButton } from "@/features/admin/components/export-button";
import {
  Modal,
  ModalActions,
  Field,
  inputCls,
} from "@/features/admin/components/modal";
import { exportRowsAsCSV, formatCOP } from "@/features/admin/helpers";

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

function ProductTable({
  items,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: {
  items: Product[];
  onEdit: (p: Product) => void;
  onActivate: (p: Product) => void;
  onDeactivate: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <DataTable
      rows={items}
      rowKey={(r) => String(r.id)}
      pageSize={10}
      columns={[
        { key: "name", label: "Nombre" },
        { key: "category", label: "Categoría" },
        {
          key: "stock",
          label: "Stock",
          render: (r) => {
            const stock = r.stock as number | null;
            const min = r.minStock as number | null;
            const low = stock !== null && min !== null && stock <= min;
            return (
              <span className={low ? "font-bold text-red-600" : ""}>
                {stock ?? "-"}
                {low ? " ⚠" : ""}
              </span>
            );
          },
        },
        {
          key: "minStock",
          label: "Stock mín.",
          render: (r) => String(r.minStock ?? "-"),
        },
        {
          key: "unitCost",
          label: "Costo",
          render: (r) =>
            r.unitCost != null ? formatCOP(Number(r.unitCost)) : "-",
        },
        {
          key: "price",
          label: "Precio venta",
          render: (r) => formatCOP(Number(r.price)),
        },
        { key: "state", label: "Estado" },
        {
          key: "acciones",
          label: "Acciones",
          render: (r) => {
            const p = r as unknown as Product;
            return (
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(p)}
                  className="rounded border px-2 py-0.5 text-xs hover:bg-stone-50"
                >
                  Editar
                </button>
                {p.available ? (
                  <button
                    onClick={() => onDeactivate(p)}
                    className="rounded border border-amber-300 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-50"
                  >
                    Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => onActivate(p)}
                    className="rounded border border-green-300 px-2 py-0.5 text-xs text-green-700 hover:bg-green-50"
                  >
                    Activar
                  </button>
                )}
                <button
                  onClick={() => onDelete(p)}
                  className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            );
          },
        },
      ]}
    />
  );
}

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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["productos", "servicios", "movimientos"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-3 py-2 text-sm capitalize ${
              tab === t ? "bg-black text-white" : "border bg-white"
            }`}
          >
            {t}
          </button>
        ))}

        {tab === "productos" && (
          <>
            <button
              onClick={() => openCreate(false)}
              className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-2 text-sm font-semibold text-white"
            >
              + Agregar producto
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
            className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-2 text-sm font-semibold text-white"
          >
            + Agregar servicio
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-stone-400">
          Cargando…
        </div>
      ) : tab === "productos" ? (
        <ProductTable
          items={productItems}
          onEdit={openEdit}
          onActivate={activate}
          onDeactivate={deactivate}
          onDelete={remove}
        />
      ) : tab === "servicios" ? (
        <ProductTable
          items={serviceItems}
          onEdit={openEdit}
          onActivate={activate}
          onDeactivate={deactivate}
          onDelete={remove}
        />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-stone-300 text-sm text-stone-400">
          Módulo de movimientos en desarrollo.
        </div>
      )}

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
