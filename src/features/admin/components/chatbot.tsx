"use client";

export function ChatbotLauncher({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-[var(--admin-primary,#581c22)] text-xl text-white shadow-xl"
      aria-label="Abrir chatbot"
    >
      ✦
    </button>
  );
}

export function ChatbotDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Cerrar chatbot"
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-black/10 bg-white p-4 shadow-2xl">
        <h3 className="text-lg font-black text-[var(--admin-primary,#581c22)]">
          Chatbot administrativo
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          Consulta indicadores, recomendaciones y anomalías operativas.
        </p>
        <div className="mt-6 rounded-xl border border-dashed border-stone-300 p-4 text-center">
          <p className="font-bold">Próximamente</p>
          <p className="mt-1 text-xs text-stone-500">
            El asistente estará disponible en una siguiente iteración.
          </p>
        </div>
        <input
          disabled
          className="mt-4 w-full rounded-xl border bg-stone-100 px-3 py-2 text-sm"
          placeholder="Escribe una pregunta..."
        />
      </aside>
    </div>
  );
}
