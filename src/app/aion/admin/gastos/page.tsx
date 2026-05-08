"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminTenant } from "@/features/admin/tenant-context";
import { DataTable } from "@/features/admin/components/data-table";
import { ExpenseChart } from "@/features/admin/components/domain";
import { FilterBar } from "@/features/admin/components/filter-bar";
import {
  Modal,
  ModalActions,
  Field,
  inputCls,
} from "@/features/admin/components/modal";
import { StatsCard } from "@/features/admin/components/stats-card";
import { formatCOP } from "@/features/admin/helpers";

type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  responsible: string;
};

type GastosData = {
  expenses: Expense[];
  totalPeriod: number;
  topCategory: string;
  avgExpense: number;
  lastExpense: string;
  byCategory: { label: string; value: number }[];
};

const CATEGORIES = ["ingredientes", "servicios", "nomina", "equipos", "otros"];

const EMPTY_FORM = {
  description: "",
  category: "ingredientes",
  amount: "",
  date: "",
};

async function api(method: string, body: unknown) {
  const r = await fetch("/api/admin/gastos", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok)
    throw new Error((await r.json().catch(() => ({}))).error ?? "Error");
  return r.json();
}

export default function AdminExpensesPage() {
  const { branchId } = useAdminTenant();
  const [data, setData] = useState<GastosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    fetch("/api/admin/gastos")
      .then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      })
      .then((d: GastosData) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function openCreate() {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setSelected(null);
    setModal("create");
  }

  function openEdit(e: Expense) {
    setSelected(e);
    setForm({
      description: e.description,
      category: e.category,
      amount: String(e.amount),
      date: e.date,
    });
    setModal("edit");
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = {
        description: form.description,
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        branchId,
      };
      if (modal === "create") await api("POST", payload);
      else await api("PUT", { ...payload, id: selected!.id });
      setModal(null);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(e: Expense) {
    if (!confirm(`¿Eliminar "${e.description}"?`)) return;
    await api("DELETE", { id: e.id }).catch((err) => alert(err.message));
    reload();
  }

  const filteredExpenses = useMemo(
    () =>
      categoryFilter
        ? (data?.expenses ?? []).filter((e) => e.category === categoryFilter)
        : (data?.expenses ?? []),
    [data, categoryFilter],
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-stone-400">
        Cargando gastos…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-red-500">
        Error al cargar datos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Gasto total del periodo"
          value={formatCOP(data.totalPeriod)}
        />
        <StatsCard title="Categoría con más gasto" value={data.topCategory} />
        <StatsCard title="Gasto promedio" value={formatCOP(data.avgExpense)} />
        <StatsCard title="Último gasto registrado" value={data.lastExpense} />
      </section>

      <FilterBar>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {data.byCategory.map((c) => (
            <option key={c.label} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          onClick={openCreate}
          className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-2 text-sm font-semibold text-white"
        >
          + Agregar gasto
        </button>
      </FilterBar>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            rows={filteredExpenses}
            rowKey={(r) => String(r.id)}
            columns={[
              { key: "description", label: "Descripción" },
              { key: "category", label: "Categoría" },
              {
                key: "amount",
                label: "Monto",
                render: (r) => formatCOP(Number(r.amount)),
              },
              { key: "date", label: "Fecha" },
              { key: "responsible", label: "Responsable" },
              {
                key: "acciones",
                label: "Acciones",
                render: (r) => (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(r as unknown as Expense)}
                      className="rounded border px-2 py-0.5 text-xs hover:bg-stone-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(r as unknown as Expense)}
                      className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
        <ExpenseChart points={data.byCategory} />
      </section>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Agregar gasto" : "Editar gasto"}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Descripción *">
            <input
              className={inputCls}
              required
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <Field label="Categoría *">
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto *">
              <input
                type="number"
                min="0"
                step="100"
                className={inputCls}
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Fecha *">
              <input
                type="date"
                className={inputCls}
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
          </div>
          <ModalActions onCancel={() => setModal(null)} saving={saving} />
        </form>
      </Modal>
    </div>
  );
}
