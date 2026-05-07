"use client";

import { useState, useEffect } from "react";

type AvailableTable = { id: string; number: number; capacity: number };
type Confirmation = {
  id: string;
  tableNumber: number;
  date: string;
  time: string;
  partySize: number;
};
type FormErrors = Partial<
  Record<"name" | "email" | "date" | "time" | "partySize" | "tableId", string>
>;

type FormData = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  tableId: string;
};

function validateForm(form: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "El nombre es requerido";
  if (!form.email.trim()) errors.email = "El email es requerido";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Email inválido";
  if (!form.date) errors.date = "La fecha es requerida";
  else if (new Date(form.date) < new Date(new Date().toDateString()))
    errors.date = "La fecha no puede ser en el pasado";
  if (!form.time) errors.time = "La hora es requerida";
  if (form.partySize < 1) errors.partySize = "Mínimo 1 persona";
  else if (form.partySize > 20) errors.partySize = "Máximo 20 personas";
  return errors;
}

export default function ReservarPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    partySize: 1,
    tableId: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [availableTables, setAvailableTables] = useState<AvailableTable[]>([]);
  const [tablesSearched, setTablesSearched] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  // Obtener restaurantId al montar
  useEffect(() => {
    fetch("/api/restaurant")
      .then((r) => r.json())
      .then((d: { restaurant?: { id: string } }) => {
        if (d.restaurant?.id) setRestaurantId(d.restaurant.id);
      })
      .catch(() => {});
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "partySize" ? Number(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSearchTables() {
    const searchErrors: FormErrors = {};
    if (!form.date) searchErrors.date = "Ingresa una fecha";
    if (!form.time) searchErrors.time = "Ingresa una hora";
    if (form.partySize < 1) searchErrors.partySize = "Mínimo 1 persona";
    if (Object.keys(searchErrors).length > 0) {
      setErrors(searchErrors);
      return;
    }
    if (!restaurantId) {
      setSubmitError("No se encontró el restaurante");
      return;
    }

    setLoadingTables(true);
    setTablesSearched(false);
    setAvailableTables([]);
    setForm((prev) => ({ ...prev, tableId: "" }));
    setSubmitError(null);

    try {
      const res = await fetch(
        `/api/reservas/mesas?restaurantId=${restaurantId}&date=${form.date}&time=${encodeURIComponent(form.time)}&partySize=${form.partySize}`,
      );
      const data = (await res.json()) as {
        tables?: AvailableTable[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Error al buscar mesas");
      setAvailableTables(data.tables ?? []);
      setTablesSearched(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingTables(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const validationErrors = validateForm(form);
    if (!form.tableId) validationErrors.tableId = "Selecciona una mesa";
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableId: form.tableId,
          date: form.date,
          time: form.time,
          partySize: form.partySize,
          name: form.name,
          email: form.email,
          phone: form.phone,
        }),
      });
      const data = (await res.json()) as {
        reservation?: Confirmation;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Error al crear la reserva");
      setConfirmation(data.reservation!);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingSubmit(false);
    }
  }

  // Confirmación
  if (confirmation) {
    return (
      <main className="mx-auto mt-16 max-w-md rounded-xl border border-green-300 bg-green-50 p-6 text-center">
        <h1 className="mb-2 text-2xl font-bold text-green-700">
          ¡Reserva confirmada! 🎉
        </h1>
        <p className="mb-4 text-gray-600">Tu número de reserva es:</p>
        <p className="mb-4 inline-block rounded-lg border border-green-300 bg-white px-6 py-3 font-mono text-3xl font-bold text-green-800">
          {confirmation.id.slice(0, 8).toUpperCase()}
        </p>
        <div className="space-y-1 text-sm text-gray-700">
          <p>
            📅 <strong>{confirmation.date}</strong> a las{" "}
            <strong>{confirmation.time}</strong>
          </p>
          <p>
            👥 <strong>{confirmation.partySize}</strong> personas
          </p>
          <p>
            🪑 Mesa número <strong>{confirmation.tableNumber}</strong>
          </p>
        </div>
        <button
          onClick={() => {
            setConfirmation(null);
            setForm({
              name: "",
              email: "",
              phone: "",
              date: "",
              time: "",
              partySize: 1,
              tableId: "",
            });
            setAvailableTables([]);
            setTablesSearched(false);
          }}
          className="mt-6 text-sm text-green-700 underline"
        >
          Hacer otra reserva
        </button>
      </main>
    );
  }

  // Formulario
  return (
    <main className="mx-auto mt-10 max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        Reservar una mesa
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre completo
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ana García"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>
        {/* Email */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="ana@email.com"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>
        {/* Teléfono */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+57 300 000 0000"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {/* Fecha / Hora / Personas */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Fecha
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.date && (
              <p className="mt-1 text-xs text-red-500">{errors.date}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Hora
            </label>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              className="w-full rounded-lg border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.time && (
              <p className="mt-1 text-xs text-red-500">{errors.time}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Personas
            </label>
            <input
              type="number"
              name="partySize"
              value={form.partySize}
              onChange={handleChange}
              min={1}
              max={20}
              className="w-full rounded-lg border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.partySize && (
              <p className="mt-1 text-xs text-red-500">{errors.partySize}</p>
            )}
          </div>
        </div>
        {/* Buscar mesas */}
        <button
          type="button"
          onClick={() => void handleSearchTables()}
          disabled={loadingTables}
          className="w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-200 disabled:opacity-50"
        >
          {loadingTables ? "Buscando mesas..." : "🔍 Ver mesas disponibles"}
        </button>
        {/* Resultados */}
        {tablesSearched && (
          <div>
            {availableTables.length === 0 ? (
              <p className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-600">
                No hay mesas disponibles para esa fecha, hora y número de
                personas.
              </p>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Selecciona una mesa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableTables.map((table) => (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, tableId: table.id }))
                      }
                      className={`rounded-lg border p-3 text-left text-sm transition ${form.tableId === table.id ? "border-blue-500 bg-blue-50 font-semibold" : "border-gray-200 hover:border-blue-300"}`}
                    >
                      🪑 Mesa #{table.number}
                      <span className="block text-xs text-gray-500">
                        Capacidad: {table.capacity} personas
                      </span>
                    </button>
                  ))}
                </div>
                {errors.tableId && (
                  <p className="mt-1 text-xs text-red-500">{errors.tableId}</p>
                )}
              </div>
            )}
          </div>
        )}
        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {submitError}
          </p>
        )}
        <button
          type="submit"
          disabled={loadingSubmit || !form.tableId}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingSubmit ? "Guardando reserva..." : "Confirmar reserva"}
        </button>
      </form>
    </main>
  );
}
