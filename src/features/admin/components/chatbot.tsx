"use client";

import Chat from "@/components/ChatComponent";

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
  contextData,
}: {
  open: boolean;
  onClose: () => void;
  contextData?: Record<string, string>;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <Chat
        inline
        defaultOpen
        onClose={onClose}
        contextData={{ assistantMode: "admin", ...contextData }}
        title="Asistente Administrativo"
        welcomeMessage="Hola, soy tu asistente administrativo. Puedo ayudarte a interpretar ventas, pedidos, costos y alertas operativas."
        inlinePlacement="right"
      />
    </div>
  );
}
