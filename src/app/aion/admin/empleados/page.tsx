"use client";

import { useCallback, useEffect, useState } from "react";
import { EmployeePaymentTable } from "@/features/admin/components/domain";
import {
  Modal,
  ModalActions,
  Field,
  inputCls,
} from "@/features/admin/components/modal";
import { formatCOP } from "@/features/admin/helpers";
import { useAdminTenant } from "@/features/admin/tenant-context";
import type { Employee } from "@/features/admin/types";
import {
  UsersIcon,
  BanknotesIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  UserCircleIcon,
} from "@/features/admin/components/icons";

type EmpleadosData = {
  employees: Employee[];
  total: number;
  payroll: number;
  active: number;
};

const CONTRACT_TYPES = ["fijo", "indefinido", "prestacion", "temporal"];
const STATUSES = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "suspended", label: "Suspendido" },
];
const PREDEFINED_ROLES = [
  "Mesero/a",
  "Cocinero/a",
  "Chef",
  "Sous Chef",
  "Bartender",
  "Cajero/a",
  "Administrador/a",
  "Gerente",
  "Auxiliar de cocina",
  "Repartidor/a",
  "Supervisor/a",
  "Aseador/a",
  "Vigilante",
];
const PAYMENT_METHODS = ["efectivo", "transferencia", "cheque"];

const EMPTY_FORM = {
  fullName: "",
  documentNumber: "",
  roleTitle: "",
  contractType: "indefinido",
  salary: "",
  status: "active",
  hiredAt: "",
};

const EMPTY_PAY_FORM = {
  grossAmount: "",
  deductionsAmount: "0",
  paymentMethod: "efectivo",
  paymentDate: "",
  note: "",
};

const ROLE_COLORS: Record<string, string> = {
  "Mesero/a": "bg-blue-50 text-blue-600",
  "Cocinero/a": "bg-amber-50 text-amber-600",
  Chef: "bg-orange-50 text-orange-600",
  "Sous Chef": "bg-red-50 text-red-600",
  Bartender: "bg-purple-50 text-purple-600",
  "Cajero/a": "bg-teal-50 text-teal-600",
  "Administrador/a": "bg-indigo-50 text-indigo-600",
  Gerente: "bg-rose-50 text-rose-600",
};

function roleColor(role: string) {
  return ROLE_COLORS[role] ?? "bg-stone-50 text-stone-600";
}

function nameInitials(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

async function api(method: string, body: unknown) {
  const r = await fetch("/api/admin/empleados", {
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
    <article className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--admin-primary,#581c22) 10%, transparent)",
          color: "var(--admin-primary,#581c22)",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-stone-400">
          {label}
        </p>
        <p className="truncate text-base font-bold text-stone-900">{value}</p>
      </div>
    </article>
  );
}

/* ─── Employee card ──────────────────────────────────────────── */

function EmployeeCard({
  employee,
  onEdit,
  onPay,
  onToggle,
}: {
  employee: Employee;
  onEdit: (e: Employee) => void;
  onPay: (e: Employee) => void;
  onToggle: (e: Employee) => void;
}) {
  const isActive = employee.status === "activo";
  const color = roleColor(employee.role);

  const statusCls = isActive
    ? "bg-emerald-100 text-emerald-700"
    : "bg-stone-100 text-stone-500";
  const statusLabel = isActive ? "Activo" : "Inactivo";

  return (
    <article className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${color}`}
        >
          {nameInitials(employee.name)}
        </div>
        {isActive && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-stone-900">
            {employee.name}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusCls}`}
          >
            {statusLabel}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500">
          <span
            className="capitalize font-medium"
            style={{ color: "var(--admin-primary,#581c22)" }}
          >
            {employee.role}
          </span>
          {employee.contractType && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 capitalize text-stone-500">
              {employee.contractType}
            </span>
          )}
          {employee.document && (
            <span className="text-stone-400">Doc: {employee.document}</span>
          )}
        </div>
        {employee.lastPaymentAt && (
          <p className="mt-1 text-xs text-stone-400">
            Último pago: {employee.lastPaymentAt}
          </p>
        )}
      </div>

      {/* Salary */}
      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
          Salario
        </span>
        <span className="text-base font-bold tabular-nums text-stone-900">
          {formatCOP(Number(employee.salary))}
        </span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        <button
          onClick={() => onEdit(employee)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--admin-primary,#581c22)] text-white transition-opacity hover:opacity-80"
          title="Editar empleado"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPay(employee)}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          Pagar
        </button>
        <button
          onClick={() => onToggle(employee)}
          className={`rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors ${
            isActive
              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          {isActive ? "Desactivar" : "Activar"}
        </button>
      </div>
    </article>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function AdminEmployeesPage() {
  const { branchId } = useAdminTenant();
  const [data, setData] = useState<EmpleadosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "activo" | "inactivo"
  >("all");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [payEmployee, setPayEmployee] = useState<Employee | null>(null);
  const [payForm, setPayForm] = useState(EMPTY_PAY_FORM);
  const [savingPay, setSavingPay] = useState(false);

  const reload = useCallback(() => {
    fetch("/api/admin/empleados")
      .then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      })
      .then((d: EmpleadosData) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function openCreate() {
    setForm({ ...EMPTY_FORM, hiredAt: new Date().toISOString().split("T")[0] });
    setSelected(null);
    setModal("create");
  }

  function openEdit(e: Employee) {
    setSelected(e);
    setForm({
      fullName: e.name,
      documentNumber: e.document,
      roleTitle: e.role,
      contractType: e.contractType,
      salary: String(e.salary),
      status: e.status === "activo" ? "active" : "inactive",
      hiredAt: e.joinedAt,
    });
    setModal("edit");
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName,
        documentNumber: form.documentNumber,
        roleTitle: form.roleTitle,
        contractType: form.contractType,
        salary: form.salary !== "" ? Number(form.salary) : null,
        status: form.status,
        hiredAt: form.hiredAt || null,
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

  function openPay(e: Employee) {
    setPayEmployee(e);
    setPayForm({
      ...EMPTY_PAY_FORM,
      grossAmount: String(e.salary),
      paymentDate: new Date().toISOString().split("T")[0],
    });
  }

  async function handlePaySubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!payEmployee) return;
    setSavingPay(true);
    try {
      const r = await fetch("/api/admin/empleados", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: payEmployee.id,
          grossAmount: Number(payForm.grossAmount),
          deductionsAmount: Number(payForm.deductionsAmount),
          paymentMethod: payForm.paymentMethod,
          paymentDate: payForm.paymentDate || null,
          note: payForm.note || null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Error");
      setPayEmployee(null);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al registrar pago");
    } finally {
      setSavingPay(false);
    }
  }

  async function toggleActive(e: Employee) {
    const isActive = e.status === "activo";
    const msg = isActive
      ? `¿Desactivar a "${e.name}"?`
      : `¿Activar a "${e.name}"?`;
    if (!confirm(msg)) return;
    await api("DELETE", { id: e.id, activate: !isActive }).catch((err) =>
      alert(err.message),
    );
    reload();
  }

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

  const filtered =
    statusFilter === "all"
      ? data.employees
      : data.employees.filter((e) =>
          statusFilter === "activo"
            ? e.status === "activo"
            : e.status !== "activo",
        );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatChip
          label="Total empleados"
          value={String(data.total)}
          icon={<UsersIcon />}
        />
        <StatChip
          label="Nómina estimada"
          value={formatCOP(data.payroll)}
          icon={<BanknotesIcon />}
        />
        <StatChip
          label="Activos"
          value={String(data.active)}
          icon={<CheckCircleIcon />}
        />
        <StatChip
          label="Inactivos / suspendidos"
          value={String(data.total - data.active)}
          icon={<AlertCircleIcon />}
        />
      </section>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-stone-400">Filtrar por:</span>
        <div className="flex gap-1.5">
          {(
            [
              { value: "all", label: "Todos" },
              { value: "activo", label: "Activos" },
              { value: "inactivo", label: "Inactivos" },
            ] as const
          ).map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === f.value
                  ? "bg-[var(--admin-primary,#581c22)] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <button
            onClick={openCreate}
            className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            + Agregar empleado
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-stone-400">
        {filtered.length} empleado{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <UserCircleIcon className="h-12 w-12 text-stone-200" />
          <p className="font-medium text-stone-500">No hay empleados</p>
          <p className="text-xs text-stone-400">
            Agrega empleados con el botón de arriba
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <EmployeeCard
              key={e.id}
              employee={e}
              onEdit={openEdit}
              onPay={openPay}
              onToggle={toggleActive}
            />
          ))}
        </div>
      )}

      {/* Payment history */}
      <EmployeePaymentTable employees={data.employees} />

      {/* Modal Pago */}
      <Modal
        open={payEmployee !== null}
        onClose={() => setPayEmployee(null)}
        title={`Registrar pago — ${payEmployee?.name ?? ""}`}
      >
        <form onSubmit={handlePaySubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto bruto *">
              <input
                type="number"
                min="0"
                step="1000"
                className={inputCls}
                required
                value={payForm.grossAmount}
                onChange={(e) =>
                  setPayForm({ ...payForm, grossAmount: e.target.value })
                }
              />
            </Field>
            <Field label="Deducciones">
              <input
                type="number"
                min="0"
                step="1000"
                className={inputCls}
                value={payForm.deductionsAmount}
                onChange={(e) =>
                  setPayForm({ ...payForm, deductionsAmount: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm">
            <span className="text-stone-500">Neto a pagar: </span>
            <span className="font-bold text-emerald-700">
              {formatCOP(
                Math.max(
                  0,
                  Number(payForm.grossAmount || 0) -
                    Number(payForm.deductionsAmount || 0),
                ),
              )}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Método de pago">
              <select
                className={inputCls}
                value={payForm.paymentMethod}
                onChange={(e) =>
                  setPayForm({ ...payForm, paymentMethod: e.target.value })
                }
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha de pago *">
              <input
                type="date"
                className={inputCls}
                required
                value={payForm.paymentDate}
                onChange={(e) =>
                  setPayForm({ ...payForm, paymentDate: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Nota">
            <input
              className={inputCls}
              value={payForm.note}
              onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
              placeholder="Ej: Quincena mayo, bonificación…"
            />
          </Field>
          <ModalActions
            onCancel={() => setPayEmployee(null)}
            saving={savingPay}
          />
        </form>
      </Modal>

      {/* Modal Crear / Editar */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Agregar empleado" : "Editar empleado"}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nombre completo *">
            <input
              className={inputCls}
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Documento">
              <input
                className={inputCls}
                value={form.documentNumber}
                onChange={(e) =>
                  setForm({ ...form, documentNumber: e.target.value })
                }
              />
            </Field>
            <Field label="Cargo *">
              <input
                className={inputCls}
                required
                list="roles-list"
                value={form.roleTitle}
                onChange={(e) =>
                  setForm({ ...form, roleTitle: e.target.value })
                }
                placeholder="Seleccionar o escribir..."
              />
              <datalist id="roles-list">
                {PREDEFINED_ROLES.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </Field>
            <Field label="Tipo contrato">
              <select
                className={inputCls}
                value={form.contractType}
                onChange={(e) =>
                  setForm({ ...form, contractType: e.target.value })
                }
              >
                {CONTRACT_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Salario">
              <input
                type="number"
                min="0"
                step="1000"
                className={inputCls}
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
            </Field>
            <Field label="Estado">
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha ingreso">
              <input
                type="date"
                className={inputCls}
                value={form.hiredAt}
                onChange={(e) => setForm({ ...form, hiredAt: e.target.value })}
              />
            </Field>
          </div>
          <ModalActions onCancel={() => setModal(null)} saving={saving} />
        </form>
      </Modal>
    </div>
  );
}
