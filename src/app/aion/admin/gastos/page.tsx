"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminTenant } from "@/features/admin/tenant-context";
import { ExpenseChart } from "@/features/admin/components/domain";
import {
  Modal,
  ModalActions,
  Field,
  inputCls,
} from "@/features/admin/components/modal";
import { formatCOP } from "@/features/admin/helpers";
import {
  ReceiptIcon,
  ChevronRightIcon,
  BanknotesIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CalendarDaysIcon,
} from "@/features/admin/components/icons";

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

const CAT_COLORS: Record<string, string> = {
  ingredientes: "bg-amber-50 text-amber-600",
  servicios: "bg-blue-50 text-blue-600",
  nomina: "bg-purple-50 text-purple-600",
  equipos: "bg-teal-50 text-teal-600",
  otros: "bg-stone-50 text-stone-600",
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

/* ─── Stat chip ─────────────────────────────────────────────── */

function StatChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="flex items-center gap-2.5 rounded-xl bg-white p-3 shadow-sm">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--admin-primary,#581c22) 10%, transparent)",
          color: "var(--admin-primary,#581c22)",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-stone-400">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-stone-900">{value}</p>
      </div>
    </article>
  );
}

/* ─── Expense card ───────────────────────────────────────────── */

function ExpenseCard({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
}) {
  const color = CAT_COLORS[expense.category] ?? "bg-stone-50 text-stone-600";

  return (
    <article className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}
      >
        <ReceiptIcon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-stone-900">
            {expense.description}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${color}`}
          >
            {expense.category}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <CalendarDaysIcon className="h-3 w-3 text-stone-300" />
            {expense.date}
          </span>
          {expense.responsible && (
            <span className="capitalize">{expense.responsible}</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-bold tabular-nums text-stone-900">
          {formatCOP(expense.amount)}
        </span>
        <button
          onClick={() => onEdit(expense)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--admin-primary,#581c22)] text-white transition-opacity hover:opacity-80"
          title="Editar"
        >
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(expense)}
          className="rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-100"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

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
    await api("DELETE", { id: e.id }).catch((err: Error) => alert(err.message));
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
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-stone-100"
          />
        ))}
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
    <div className="space-y-4">
      {/* Stats */}
      <section className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <StatChip
          label="Total del periodo"
          value={formatCOP(data.totalPeriod)}
          icon={<BanknotesIcon />}
        />
        <StatChip
          label="Categoría principal"
          value={data.topCategory || "—"}
          icon={<AlertTriangleIcon />}
        />
        <StatChip
          label="Gasto promedio"
          value={formatCOP(data.avgExpense)}
          icon={<TrendingUpIcon />}
        />
        <StatChip
          label="Último gasto"
          value={data.lastExpense || "—"}
          icon={<ReceiptIcon />}
        />
      </section>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-100 bg-white px-3 py-2.5 shadow-sm">
        <span className="text-sm font-medium text-stone-400">Filtrar por:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter("")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              categoryFilter === ""
                ? "bg-[var(--admin-primary,#581c22)] text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Todos
          </button>
          {data.byCategory
            .map((c) => c.label)
            .map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  categoryFilter === cat
                    ? "bg-[var(--admin-primary,#581c22)] text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat}
              </button>
            ))}
        </div>
        <div className="ml-auto">
          <button
            onClick={openCreate}
            className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            + Agregar gasto
          </button>
        </div>
      </div>

      {/* Content: cards + chart */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          {filteredExpenses.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-stone-200 text-sm text-stone-400">
              No hay gastos registrados
            </div>
          ) : (
            filteredExpenses.map((e) => (
              <ExpenseCard
                key={e.id}
                expense={e}
                onEdit={openEdit}
                onDelete={remove}
              />
            ))
          )}
        </div>
        <ExpenseChart points={data.byCategory} />
      </div>

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
