"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/features/admin/components/data-table";
import { EmployeePaymentTable } from "@/features/admin/components/domain";
import {
  Modal,
  ModalActions,
  Field,
  inputCls,
} from "@/features/admin/components/modal";
import { StatsCard } from "@/features/admin/components/stats-card";
import { formatCOP } from "@/features/admin/helpers";
import { useAdminTenant } from "@/features/admin/tenant-context";
import type { Employee } from "@/features/admin/types";

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

export default function AdminEmployeesPage() {
  const { branchId } = useAdminTenant();
  const [data, setData] = useState<EmpleadosData | null>(null);
  const [loading, setLoading] = useState(true);
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
      <div className="flex h-64 items-center justify-center text-sm text-stone-400">
        Cargando empleados…
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
        <StatsCard title="Total empleados" value={String(data.total)} />
        <StatsCard
          title="Nómina estimada del mes"
          value={formatCOP(data.payroll)}
        />
        <StatsCard title="Empleados activos" value={String(data.active)} />
        <StatsCard
          title="Inactivos / suspendidos"
          value={String(data.total - data.active)}
        />
      </section>

      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-2 text-sm font-semibold text-white"
        >
          + Agregar empleado
        </button>
      </div>

      <DataTable
        rows={data.employees}
        rowKey={(r) => String(r.id)}
        columns={[
          { key: "name", label: "Nombre" },
          { key: "document", label: "Documento" },
          { key: "role", label: "Cargo" },
          { key: "contractType", label: "Contrato" },
          {
            key: "salary",
            label: "Salario",
            render: (r) => formatCOP(Number(r.salary)),
          },
          { key: "status", label: "Estado" },
          { key: "joinedAt", label: "Ingreso" },
          {
            key: "lastPaymentAt",
            label: "Último pago",
            render: (r) => String(r.lastPaymentAt ?? "-"),
          },
          {
            key: "acciones",
            label: "Acciones",
            render: (r) => {
              const emp = r as unknown as Employee;
              const isActive = emp.status === "activo";
              return (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(emp)}
                    className="rounded border px-2 py-0.5 text-xs hover:bg-stone-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => openPay(emp)}
                    className="rounded border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    Pagar
                  </button>
                  <button
                    onClick={() => toggleActive(emp)}
                    className={`rounded border px-2 py-0.5 text-xs ${
                      isActive
                        ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                        : "border-green-300 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {isActive ? "Desactivar" : "Activar"}
                  </button>
                </div>
              );
            },
          },
        ]}
      />

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
