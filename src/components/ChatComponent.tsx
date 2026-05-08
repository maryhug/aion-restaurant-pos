"use client";
import { useEffect, useState } from "react";

type Message = {
  role: "user" | "assistant" | "error";
  content: string;
};

type Props = {
  defaultOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
  contextData?: Record<string, string>;
  title?: string;
  welcomeMessage?: string;
  inlinePlacement?: "center" | "right";
};

export default function Chat({
  defaultOpen = false,
  onClose,
  inline = false,
  contextData,
  title = "Asistente de Comida",
  welcomeMessage = "¡Hola! Soy el Chef virtual de Ilcafeto. ¿Qué se te antoja pedir hoy?",
  inlinePlacement = "center",
}: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Sincronizar si el padre cambia defaultOpen
  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    // Hacemos un snapshot del historial actual filtrando los errores
    const historySnapshot = messages
      .filter((m) => m.role !== "error")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Llamamos a fetchResponse por fuera del setter
    fetchResponse(userMessage, historySnapshot);
  };

  const fetchResponse = async (
    userMessage: string,
    history: { role: "user" | "assistant"; content: string }[],
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history, contextData }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setIsLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = assistantMessage;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "No se pudo conectar con la IA." },
      ]);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Botón flotante (solo si NO es inline) */}
      {!inline && (
        <button
          onClick={() => {
            const next = !isOpen;
            setIsOpen(next);
            if (!next) onClose?.();
          }}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-all z-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Ventana del Chat */}
      <div
        className={
          inline
            ? inlinePlacement === "right"
              ? "fixed bottom-24 right-5 z-50 flex h-[72vh] min-h-[420px] w-[min(92vw,420px)] max-h-[760px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
              : "fixed inset-x-0 bottom-5 z-50 mx-auto flex h-[72vh] min-h-[420px] w-[min(92vw,420px)] max-h-[760px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
            : "fixed bottom-24 right-6 w-96 max-w-[90vw] h-[500px] bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
        }
        style={
          inline
            ? {
                transformOrigin:
                  inlinePlacement === "right"
                    ? "bottom right"
                    : "bottom center",
                animation:
                  inlinePlacement === "right"
                    ? "aionChatRightPopIn 520ms cubic-bezier(0.18, 0.9, 0.2, 1), aionChatFloat 4.1s ease-in-out 560ms infinite, aionChatGlow 3.2s ease-in-out 560ms infinite"
                    : "aionChatPopIn 460ms cubic-bezier(0.22, 1, 0.36, 1), aionChatFloat 3.8s ease-in-out 520ms infinite, aionChatGlow 3.2s ease-in-out 520ms infinite",
              }
            : undefined
        }
      >
        {/* Botón X para cerrar en modo inline */}
        {inline && (
          <button
            onClick={() => onClose?.()}
            className="absolute right-3 top-3 z-50 rounded-full bg-stone-100 p-2 text-zinc-500 transition-colors hover:bg-stone-200 hover:text-zinc-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Cabecera */}
        {!inline ? (
          <div className="flex items-center justify-between bg-blue-600 p-4 font-bold text-white">
            <span>{title}</span>
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3">
            <span className="text-sm font-bold text-zinc-800">{title}</span>
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>
        )}

        {/* Mensajes */}
        <div
          className={`flex flex-1 flex-col gap-3 overflow-y-auto p-4 ${inline ? "pt-3" : ""}`}
        >
          {messages.length === 0 && (
            <p className="text-center text-zinc-700 font-bold mt-6 text-sm px-4 drop-shadow-sm">
              {welcomeMessage}
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white self-end rounded-tr-none"
                  : m.role === "error"
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : inline
                      ? "bg-white text-zinc-800 self-start rounded-tl-none shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 self-start rounded-tl-none"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          {isLoading && (
            <div
              className={`p-3 rounded-2xl self-start rounded-tl-none animate-pulse ${inline ? "bg-white shadow-sm" : "bg-zinc-100 dark:bg-zinc-800"}`}
            >
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input y Botón Cerrar */}
        <div
          className={`p-4 ${inline ? "pb-6" : "border-t dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"}`}
        >
          <div className="flex gap-2">
            <input
              className={`flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                inline
                  ? "bg-white border-pink-200 text-zinc-800 shadow-sm"
                  : "dark:border-zinc-600 text-black dark:text-white dark:bg-zinc-900"
              }`}
              value={input}
              placeholder="Escribe un mensaje..."
              onKeyDown={(e) =>
                e.key === "Enter" && !isLoading && sendMessage()
              }
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

if (
  typeof window !== "undefined" &&
  !document.getElementById("aion-chat-animations")
) {
  const style = document.createElement("style");
  style.id = "aion-chat-animations";
  style.textContent = `
    @keyframes aionChatPopIn {
      0% { opacity: 0; transform: translateY(18px) scale(0.9); }
      65% { opacity: 1; transform: translateY(-3px) scale(1.02); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes aionChatRightPopIn {
      0% { opacity: 0; transform: translate(14px, 26px) scale(0.86) rotate(-1.2deg); }
      58% { opacity: 1; transform: translate(-2px, -4px) scale(1.02) rotate(0.4deg); }
      100% { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
    }

    @keyframes aionChatFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @keyframes aionChatGlow {
      0%, 100% { box-shadow: 0 22px 45px rgba(0,0,0,0.16); }
      50% { box-shadow: 0 26px 52px rgba(168, 85, 247, 0.18); }
    }
  `;
  document.head.appendChild(style);
}
