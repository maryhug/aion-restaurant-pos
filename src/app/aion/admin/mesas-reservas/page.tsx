"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminTenant } from "@/features/admin/tenant-context";
import { DataTable } from "@/features/admin/components/data-table";
import {
  Modal,
  ModalActions,
  Field,
  inputCls,
} from "@/features/admin/components/modal";
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
      const payload = {
        entity: "table",
        number: tableForm.number,
        capacity: tableForm.capacity,
        zone: tableForm.zone,
        status: tableForm.status,
        branchId,
      };
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
      <div className="flex h-64 items-center justify-center text-sm text-stone-400">
        Cargando mesas y reservas…
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
      {/* Tabs */}
      <div className="flex gap-2">
        {(["mesas", "reservas"] as MesasTab[]).map((t) => (
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
      </div>

      {/* Tab: Mesas */}
      {tab === "mesas" && (
        <article className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-white p-4 space-y-4">
          {/* Resumen visual */}
          {data.tables.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {data.tables.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border p-2 text-center text-xs"
                >
                  Mesa {t.number}
                  <p className="font-semibold capitalize">{t.status}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabla de gestión */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Gestión de mesas</h3>
              <button
                onClick={openTableCreate}
                className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                + Nueva mesa
              </button>
            </div>
            <DataTable
              rows={data.tables}
              rowKey={(r) => String(r.id)}
              pageSize={5}
              columns={[
                { key: "number", label: "Mesa" },
                { key: "capacity", label: "Cap." },
                { key: "zone", label: "Zona" },
                { key: "status", label: "Estado" },
                {
                  key: "acciones",
                  label: "Acciones",
                  render: (r) => (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openTableEdit(r as unknown as TableItem)}
                        className="rounded border px-2 py-0.5 text-xs hover:bg-stone-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteTable(r as unknown as TableItem)}
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
        </article>
      )}

      {/* Tab: Reservas */}
      {tab === "reservas" && (
        <article className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-white p-4 space-y-4">
          {/* Reservas próximas */}
          {data.reservations.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-bold">Reservas próximas</h3>
              <ul className="space-y-1 text-sm">
                {data.reservations.slice(0, 5).map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-[var(--admin-border,#f1cfd4)] px-3 py-2"
                  >
                    {r.customer} · {r.date} {r.time} · {r.table}
                  </li>
                ))}
                {data.reservations.length > 5 && (
                  <li className="text-xs text-stone-400">
                    +{data.reservations.length - 5} más en la tabla
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Tabla de gestión */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Gestión de reservas</h3>
              <button
                onClick={openReservaCreate}
                className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                + Nueva reserva
              </button>
            </div>
            <DataTable
              rows={data.reservations}
              rowKey={(r) => String(r.id)}
              pageSize={10}
              columns={[
                { key: "customer", label: "Cliente" },
                { key: "date", label: "Fecha" },
                { key: "time", label: "Hora" },
                { key: "people", label: "Pers." },
                { key: "table", label: "Mesa" },
                { key: "status", label: "Estado" },
                {
                  key: "acciones",
                  label: "Acciones",
                  render: (r) => (
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          openReservaEdit(r as unknown as Reservation)
                        }
                        className="rounded border px-2 py-0.5 text-xs hover:bg-stone-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          deleteReserva(r as unknown as Reservation)
                        }
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
        </article>
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
