"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminTenant } from "@/features/admin/tenant-context";
import {
  Modal,
  ModalActions,
  Field,
  inputCls,
} from "@/features/admin/components/modal";
import {
  CalendarDaysIcon,
  UsersIcon,
  ChevronRightIcon,
} from "@/features/admin/components/icons";
import type { Reservation, TableItem } from "@/features/admin/types";

type MesasData = { tables: TableItem[]; reservations: Reservation[] };
type MesasTab = "mesas" | "reservas";

const TABLE_STATUSES = ["libre", "ocupada", "reservada", "limpieza"];
const RESERVATION_STATUSES = ["pendiente", "confirmada", "cancelada"];

const EMPTY_TABLE = { number: "", capacity: "", zone: "", status: "libre" };
const EMPTY_RESERVA = {
  customerName: "",
  tableId: "",
  date: "",
  time: "",
  partySize: "2",
  status: "pendiente",
  notes: "",
};

const TABLE_STATUS_COLOR: Record<string, string> = {
  libre: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ocupada: "bg-red-50 text-red-700 border-red-200",
  reservada: "bg-amber-50 text-amber-700 border-amber-200",
  limpieza: "bg-blue-50 text-blue-700 border-blue-200",
};

const RESERVA_STATUS_BADGE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  confirmada: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-red-100 text-red-700",
};

async function api(method: string, body: unknown) {
  const r = await fetch("/api/admin/mesas-reservas", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok)
    throw new Error((await r.json().catch(() => ({}))).error ?? "Error");
  return r.json();
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function AdminTablesReservationsPage() {
  const { branchId } = useAdminTenant();
  const [tab, setTab] = useState<MesasTab>("mesas");
  const [data, setData] = useState<MesasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableModal, setTableModal] = useState<"create" | "edit" | null>(null);
  const [reservaModal, setReservaModal] = useState<"create" | "edit" | null>(
    null,
  );
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Reservation | null>(
    null,
  );
  const [tableForm, setTableForm] = useState(EMPTY_TABLE);
  const [reservaForm, setReservaForm] = useState(EMPTY_RESERVA);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    fetch("/api/admin/mesas-reservas")
      .then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      })
      .then((d: MesasData) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function openTableCreate() {
    setTableForm(EMPTY_TABLE);
    setSelectedTable(null);
    setTableModal("create");
  }
  function openTableEdit(t: TableItem) {
    setSelectedTable(t);
    setTableForm({
      number: String(t.number),
      capacity: String(t.capacity),
      zone: t.zone ?? "",
      status: t.status,
    });
    setTableModal("edit");
  }
  async function handleTableSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { entity: "table", ...tableForm, branchId };
      if (tableModal === "create") await api("POST", payload);
      else await api("PUT", { ...payload, id: selectedTable!.id });
      setTableModal(null);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }
  async function deleteTable(t: TableItem) {
    if (!confirm(`¿Eliminar mesa ${t.number}?`)) return;
    await api("DELETE", { entity: "table", id: t.id }).catch((e) =>
      alert(e.message),
    );
    reload();
  }

  function openReservaCreate() {
    setReservaForm({
      ...EMPTY_RESERVA,
      date: new Date().toISOString().split("T")[0],
      tableId: data?.tables[0]?.id ?? "",
    });
    setSelectedReserva(null);
    setReservaModal("create");
  }
  function openReservaEdit(r: Reservation) {
    setSelectedReserva(r);
    setReservaForm({
      customerName: r.customer === "-" ? "" : r.customer,
      tableId:
        (r as unknown as { tableId: string | null }).tableId ??
        data?.tables[0]?.id ??
        "",
      date: r.date,
      time: r.time,
      partySize: String(r.people),
      status: r.status,
      notes: (r as unknown as { notes: string }).notes ?? "",
    });
    setReservaModal("edit");
  }
  async function handleReservaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        entity: "reservation",
        ...reservaForm,
        partySize: Number(reservaForm.partySize),
        branchId,
      };
      if (reservaModal === "create") await api("POST", payload);
      else await api("PUT", { ...payload, id: selectedReserva!.id });
      setReservaModal(null);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }
  async function deleteReserva(r: Reservation) {
    if (!confirm(`¿Eliminar reserva de ${r.customer}?`)) return;
    await api("DELETE", { entity: "reservation", id: r.id }).catch((e) =>
      alert(e.message),
    );
    reload();
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
        <div className="flex gap-1.5">
          {(["mesas", "reservas"] as MesasTab[]).map((t) => (
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
        <div className="ml-auto">
          {tab === "mesas" ? (
            <button
              onClick={openTableCreate}
              className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + Nueva mesa
            </button>
          ) : (
            <button
              onClick={openReservaCreate}
              className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + Nueva reserva
            </button>
          )}
        </div>
      </div>

      {/* Mesas tab */}
      {tab === "mesas" && (
        <>
          {/* Visual grid */}
          {data.tables.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {data.tables.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-2xl border p-3 text-center ${TABLE_STATUS_COLOR[t.status] ?? "bg-stone-50 border-stone-200"}`}
                >
                  <p className="text-lg font-bold">Mesa {t.number}</p>
                  <p className="text-xs font-medium capitalize">{t.status}</p>
                  <p className="text-[10px] opacity-70">{t.capacity} pers.</p>
                </div>
              ))}
            </div>
          )}

          {/* Management cards */}
          {data.tables.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-stone-200 text-sm text-stone-400">
              No hay mesas registradas
            </div>
          ) : (
            <div className="space-y-3">
              {data.tables.map((t) => (
                <article
                  key={t.id}
                  className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold border ${TABLE_STATUS_COLOR[t.status] ?? "bg-stone-50 border-stone-200"}`}
                  >
                    {t.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-stone-900">Mesa {t.number}</p>
                    <p className="text-sm text-stone-500">
                      {t.capacity} personas{t.zone ? ` · ${t.zone}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TABLE_STATUS_COLOR[t.status] ?? ""}`}
                  >
                    {t.status}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openTableEdit(t)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--admin-primary,#581c22)] text-white hover:opacity-80"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTable(t)}
                      className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reservas tab */}
      {tab === "reservas" && (
        <>
          {data.reservations.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-stone-200 text-sm text-stone-400">
              No hay reservas registradas
            </div>
          ) : (
            <div className="space-y-3">
              {data.reservations.map((r) => (
                <article
                  key={r.id}
                  className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--admin-primary,#581c22) 10%, transparent)",
                      color: "var(--admin-primary,#581c22)",
                    }}
                  >
                    <CalendarDaysIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-900">
                        {r.customer}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${RESERVA_STATUS_BADGE[r.status] ?? "bg-stone-100 text-stone-600"}`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-3 w-3 text-stone-300" />
                        {r.date} {r.time}
                      </span>
                      <span>{r.table}</span>
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-3 w-3 text-stone-300" />
                        {r.people} pers.
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openReservaEdit(r)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--admin-primary,#581c22)] text-white hover:opacity-80"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteReserva(r)}
                      className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Mesa */}
      <Modal
        open={tableModal !== null}
        onClose={() => setTableModal(null)}
        title={tableModal === "create" ? "Nueva mesa" : "Editar mesa"}
      >
        <form onSubmit={handleTableSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número *">
              <input
                type="number"
                min="1"
                className={inputCls}
                required
                value={tableForm.number}
                onChange={(e) =>
                  setTableForm({ ...tableForm, number: e.target.value })
                }
              />
            </Field>
            <Field label="Capacidad *">
              <input
                type="number"
                min="1"
                className={inputCls}
                required
                value={tableForm.capacity}
                onChange={(e) =>
                  setTableForm({ ...tableForm, capacity: e.target.value })
                }
              />
            </Field>
            <Field label="Zona">
              <input
                className={inputCls}
                value={tableForm.zone}
                onChange={(e) =>
                  setTableForm({ ...tableForm, zone: e.target.value })
                }
              />
            </Field>
            <Field label="Estado">
              <select
                className={inputCls}
                value={tableForm.status}
                onChange={(e) =>
                  setTableForm({ ...tableForm, status: e.target.value })
                }
              >
                {TABLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <ModalActions onCancel={() => setTableModal(null)} saving={saving} />
        </form>
      </Modal>

      {/* Modal Reserva */}
      <Modal
        open={reservaModal !== null}
        onClose={() => setReservaModal(null)}
        title={reservaModal === "create" ? "Nueva reserva" : "Editar reserva"}
      >
        <form onSubmit={handleReservaSubmit} className="space-y-3">
          <Field label="Nombre del cliente *">
            <input
              className={inputCls}
              required
              value={reservaForm.customerName}
              onChange={(e) =>
                setReservaForm({ ...reservaForm, customerName: e.target.value })
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mesa *">
              <select
                className={inputCls}
                required
                value={reservaForm.tableId}
                onChange={(e) =>
                  setReservaForm({ ...reservaForm, tableId: e.target.value })
                }
              >
                {data.tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Mesa {t.number} ({t.capacity} pers.)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Personas">
              <input
                type="number"
                min="1"
                className={inputCls}
                value={reservaForm.partySize}
                onChange={(e) =>
                  setReservaForm({ ...reservaForm, partySize: e.target.value })
                }
              />
            </Field>
            <Field label="Fecha *">
              <input
                type="date"
                className={inputCls}
                required
                value={reservaForm.date}
                onChange={(e) =>
                  setReservaForm({ ...reservaForm, date: e.target.value })
                }
              />
            </Field>
            <Field label="Hora *">
              <input
                type="time"
                className={inputCls}
                required
                value={reservaForm.time}
                onChange={(e) =>
                  setReservaForm({ ...reservaForm, time: e.target.value })
                }
              />
            </Field>
            <Field label="Estado">
              <select
                className={inputCls}
                value={reservaForm.status}
                onChange={(e) =>
                  setReservaForm({ ...reservaForm, status: e.target.value })
                }
              >
                {RESERVATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notas">
            <input
              className={inputCls}
              value={reservaForm.notes}
              onChange={(e) =>
                setReservaForm({ ...reservaForm, notes: e.target.value })
              }
            />
          </Field>
          <ModalActions
            onCancel={() => setReservaModal(null)}
            saving={saving}
          />
        </form>
      </Modal>
    </div>
  );
}
