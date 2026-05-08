"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { aion } from "@/lib/aion/tokens";
import { useAionOrder } from "@/lib/aion/order-context";
import Chat from "@/components/ChatComponent";
import type { MenuItem } from "@/types/database";
import type { TokenShape } from "@/lib/aion/token-types";

type Props = { menuItems: MenuItem[]; basePath?: string; tokens?: TokenShape };

type AnswerKey =
  | "moodWord"
  | "flavorPersona"
  | "riskMode"
  | "intent"
  | "movieGenre";

const questions: {
  key: AnswerKey;
  title: string;
  options: string[];
}[] = [
  {
    key: "moodWord",
    title: "¿Cómo describe tu estado de ánimo hoy en una palabra?",
    options: [
      "Aventurero / Explorador",
      "Tranquilo / Relajado",
      "Energético / Eufórico",
      "Nostálgico / Cómodo",
      "Retador / Audaz",
    ],
  },
  {
    key: "flavorPersona",
    title: "Si fueras un sabor, ¿cuál serías?",
    options: ["Dulce", "Salado", "Amargo", "Umami", "Ácido"],
  },
  {
    key: "riskMode",
    title: "¿Prefieres jugar seguro o sorprenderte hoy?",
    options: [
      "Zona de confort",
      "Algo nuevo pero reconocible",
      "Totalmente sorprendente",
      "Depende de mi hambre",
    ],
  },
  {
    key: "intent",
    title: "¿Vienes a comer o a experimentar?",
    options: [
      "Llenar el estómago",
      "Un momento agradable",
      "Una experiencia memorable",
      "Probar algo del que todo el mundo habla",
    ],
  },
  {
    key: "movieGenre",
    title: "Si el plato fuera una película, ¿qué género sería?",
    options: [
      "Comedia ligera",
      "Drama clásico",
      "Thriller",
      "Documental",
      "Animación infantil",
    ],
  },
];

function parseDishDescription(raw?: string | null): string {
  if (!raw)
    return "Una propuesta pensada para tu perfil: una mezcla de sabor, textura y sorpresa en una sola experiencia.";
  try {
    const parsed = JSON.parse(raw);
    if (parsed.ingredientes) return `Ingredientes: ${parsed.ingredientes}`;
    const first = Object.values(parsed)[0];
    if (typeof first === "string") return first;
  } catch {
    // not JSON
  }
  return raw;
}

function categoryEmoji(category?: string | null): string {
  switch (category?.toLowerCase()) {
    case "carnes":
      return "🥩";
    case "platos fuertes":
      return "🍖";
    case "sándwiches":
      return "🥪";
    case "sopas":
      return "🍲";
    case "ensaladas":
      return "🥗";
    case "entradas":
      return "🥗";
    case "adiciones":
      return "🍽️";
    case "postres":
      return "🍮";
    case "bebidas":
      return "🥤";
    case "smoothies":
      return "🥤";
    case "cafés":
      return "☕";
    case "vino":
      return "🍷";
    case "sangría":
      return "🍷";
    case "cócteles":
      return "🍹";
    case "cervezas":
      return "🍺";
    default:
      return "🍽️";
  }
}

function getSuggestedMenu(
  menuItems: MenuItem[],
  answers: Record<AnswerKey, string>,
  seed: number,
) {
  const allText = Object.values(answers).join(" ").toLowerCase();
  const byCategoryAll = {
    entrada: menuItems.filter((i) =>
      ["entradas", "ensaladas"].includes(i.category.toLowerCase()),
    ),
    principal: menuItems.filter((i) =>
      [
        "carnes",
        "sándwiches",
        "adiciones",
        "ensaladas",
        "platos fuertes",
        "sopas",
      ].includes(i.category.toLowerCase()),
    ),
    postre: menuItems.filter((i) => i.category.toLowerCase() === "postres"),
    bebida: menuItems.filter((i) =>
      [
        "bebidas",
        "cafés",
        "cócteles",
        "vino",
        "smoothies",
        "sangría",
        "cervezas",
      ].includes(i.category.toLowerCase()),
    ),
  };

  function scoreItem(item: MenuItem) {
    const text =
      `${item.name} ${item.description ?? ""} ${item.category}`.toLowerCase();
    let score = 0;
    if (allText.includes("dulce") || allText.includes("animación")) {
      if (/(postre|fruta|chocolate|vainilla|smoothie|dulce)/.test(text))
        score += 3;
    }
    if (allText.includes("amargo") || allText.includes("drama")) {
      if (/(café|vino|asado|salsa|fuerte)/.test(text)) score += 3;
    }
    if (allText.includes("ácido") || allText.includes("thriller")) {
      if (/(cítrico|limón|fresco|picante|jengibre)/.test(text)) score += 3;
    }
    if (allText.includes("zona de confort") || allText.includes("clásico")) {
      if (/(tradicional|clásico|casero)/.test(text)) score += 2;
    }
    if (
      allText.includes("totalmente sorprendente") ||
      allText.includes("aventurero")
    ) {
      if (/(especial|fusión|autor|sorpresa)/.test(text)) score += 2;
    }
    return score;
  }

  function pick(list: MenuItem[], fallback: MenuItem[], offset: number) {
    const base = list.length > 0 ? list : fallback;
    if (base.length === 0) return null;
    const sorted = [...base].sort((a, b) => scoreItem(b) - scoreItem(a));
    return sorted[(seed + offset) % sorted.length];
  }

  return {
    entrada: pick(
      byCategoryAll.entrada.filter((i) => scoreItem(i) > 0),
      byCategoryAll.entrada,
      0,
    ),
    principal: pick(
      byCategoryAll.principal.filter((i) => scoreItem(i) > 0),
      byCategoryAll.principal,
      2,
    ),
    postre: pick(
      byCategoryAll.postre.filter((i) => scoreItem(i) > 0),
      byCategoryAll.postre,
      4,
    ),
    bebida: pick(
      byCategoryAll.bebida.filter((i) => scoreItem(i) > 0),
      byCategoryAll.bebida,
      6,
    ),
  };
}

export function AionExperienceQuizClient({
  menuItems,
  basePath = "/aion",
  tokens,
}: Props) {
  const colors = tokens?.colors ?? aion.colors;
  const router = useRouter();
  const { setItemsFromMenu } = useAionOrder();
  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [includeEntrada, setIncludeEntrada] = useState(true);
  const [includePostre, setIncludePostre] = useState(true);
  const [includeBebida, setIncludeBebida] = useState(false);
  const [answers, setAnswers] = useState<Record<AnswerKey, string>>({
    moodWord: "",
    flavorPersona: "",
    riskMode: "",
    intent: "",
    movieGenre: "",
  });

  const finished = step >= questions.length;

  const suggestion = useMemo(
    () => getSuggestedMenu(menuItems, answers, seed),
    [menuItems, answers, seed],
  );

  const currentQuestion = questions[Math.min(step, questions.length - 1)];
  const canIncludeEntrada = Boolean(suggestion.entrada);
  const canIncludePostre = Boolean(suggestion.postre);
  const canIncludeBebida = Boolean(suggestion.bebida);

  const pickedItems = [
    suggestion.principal,
    canIncludeEntrada && includeEntrada ? suggestion.entrada : null,
    canIncludePostre && includePostre ? suggestion.postre : null,
    canIncludeBebida && includeBebida ? suggestion.bebida : null,
  ].filter(Boolean) as MenuItem[];

  const progress = Math.round(
    (Math.min(step + 1, questions.length) / questions.length) * 100,
  );

  const total = pickedItems.reduce((sum, item) => sum + Number(item.price), 0);
  const finalDish =
    suggestion.principal ??
    suggestion.entrada ??
    suggestion.postre ??
    suggestion.bebida;

  function onSelect(value: string) {
    if (isTransitioning) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }));
    setIsTransitioning(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setIsTransitioning(false);
    }, 950);
  }

  return (
    <div
      className="mx-auto min-h-dvh w-full max-w-xl px-4 py-6"
      style={{ background: colors.pageBg }}
    >
      <header className="mb-5 flex items-center justify-between">
        <Link
          href={basePath}
          className="grid size-8 place-items-center rounded-full bg-white text-sm font-bold shadow-sm ring-1 ring-black/5"
          style={{ color: colors.primary }}
          aria-label="Volver"
        >
          ←
        </Link>
        <div className="mx-auto flex items-center gap-1.5">
          <span
            className="h-1.5 w-6 rounded-full transition-all duration-300 ease-in-out"
            style={{ background: colors.primary }}
          />
          {questions.map((q, i) => (
            <span
              key={q.key}
              className="inline-block size-1.5 rounded-full transition-all duration-300 ease-in-out"
              style={{
                background: i <= step ? colors.primaryAlt : colors.border,
              }}
            />
          ))}
        </div>
        <span
          className="w-10 text-right text-xs font-semibold"
          style={{ color: colors.muted }}
        >
          {Math.min(step + 1, questions.length)}/{questions.length}
        </span>
      </header>

      {!finished ? (
        isTransitioning ? (
          <section
            className="grid min-h-[70vh] place-items-center rounded-3xl transition-all duration-300 ease-in-out"
            style={{ background: colors.pageBg }}
          >
            <div className="grid justify-items-center">
              <div className="relative mb-4">
                <span
                  className="absolute -inset-5 rounded-full"
                  style={{ background: `${colors.primary}1f` }}
                />
                <span
                  className="absolute -inset-2 rounded-full"
                  style={{ background: `${colors.primary}29` }}
                />
                <span
                  className="relative block size-32 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 32% 28%, ${colors.primaryAlt} 0%, ${colors.primary} 72%)`,
                    animation: "aionBallMove 1.15s ease-in-out infinite",
                  }}
                />
              </div>
              <p
                className="text-[2rem] font-black leading-tight"
                style={{
                  color: colors.primary,
                  fontSize: "clamp(1.6rem,3.2vw,2.1rem)",
                }}
              >
                Descubriendo tu experiencia
              </p>
              <div className="mt-2 flex gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    background: colors.primary,
                    animation: "aionDot 0.8s ease-in-out infinite",
                  }}
                />
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    background: colors.primary,
                    animation: "aionDot 0.8s ease-in-out 0.15s infinite",
                  }}
                />
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    background: colors.primary,
                    animation: "aionDot 0.8s ease-in-out 0.3s infinite",
                  }}
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="transition-all duration-300 ease-in-out">
            <div className="mb-3">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: colors.muted }}
              >
                Pregunta {step + 1}
              </p>
            </div>

            <h2
              className="text-4 font-extrabold leading-tight transition-all duration-300 ease-in-out sm:text-[36px]"
              style={{
                color: colors.text,
                fontSize: "clamp(1.6rem,4vw,2.15rem)",
              }}
            >
              {currentQuestion.title}
            </h2>

            <div className="mt-5 space-y-3">
              {currentQuestion.options.map((option) => {
                const active = answers[currentQuestion.key] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onSelect(option)}
                    className="flex w-full items-center justify-between rounded-full px-4 py-3 text-left text-sm font-semibold transition-all duration-300 ease-in-out"
                    style={
                      active
                        ? {
                            background: colors.tagBg,
                            color: colors.primary,
                            boxShadow: `0 0 0 2px ${colors.primary}22`,
                          }
                        : {
                            background: colors.pillInactive,
                            color: colors.text,
                          }
                    }
                  >
                    <span>{option}</span>
                    <span
                      className="grid size-5 place-items-center rounded-full border text-[10px]"
                      style={{
                        borderColor: active ? colors.primary : colors.border,
                        color: active ? colors.primary : colors.border,
                        background: active ? colors.pageBg : "transparent",
                      }}
                    >
                      {active ? "●" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width: `${progress}%`,
                  background: colors.primary,
                }}
              />
            </div>
          </section>
        )
      ) : (
        <section className="mx-auto w-full max-w-sm rounded-3xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-in-out">
          <p
            className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: colors.muted }}
          >
            Tu plato
          </p>

          <div
            className="mt-1 flex h-64 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: colors.tagBg }}
          >
            <span className="text-8xl">
              {categoryEmoji(finalDish?.category)}
            </span>
          </div>

          <div className="px-1 pb-1 pt-3">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: colors.muted }}
            >
              {finalDish?.category ?? "Especial"} · CAP. 1
            </p>
            <h2
              className="mt-1 text-4xl font-black"
              style={{
                color: colors.primary,
                fontSize: "clamp(1.7rem,4.3vw,2.2rem)",
              }}
            >
              {finalDish?.name ?? "Plato recomendado"}
            </h2>
            <p
              className="mt-2 text-xs italic leading-relaxed"
              style={{ color: colors.muted }}
            >
              &ldquo;
              {parseDishDescription(finalDish?.description)}
              &rdquo;
            </p>
            <p
              className="mt-2 text-right text-sm font-extrabold"
              style={{ color: colors.primary }}
            >
              ${total.toLocaleString("es-CO")}
            </p>
          </div>

          <div className="space-y-2 px-1">
            <OptionRow
              title="Plato (obligatorio)"
              item={suggestion.principal}
              fixed
            />
            <OptionRow
              title="Entrada"
              item={suggestion.entrada}
              included={canIncludeEntrada && includeEntrada}
              onToggle={() =>
                canIncludeEntrada && setIncludeEntrada((value) => !value)
              }
            />
            <OptionRow
              title="Postre"
              item={suggestion.postre}
              included={canIncludePostre && includePostre}
              onToggle={() =>
                canIncludePostre && setIncludePostre((value) => !value)
              }
            />
            <OptionRow
              title="Bebida (opcional)"
              item={suggestion.bebida}
              included={canIncludeBebida && includeBebida}
              onToggle={() =>
                canIncludeBebida && setIncludeBebida((value) => !value)
              }
              includeLabel="Agregar"
            />
          </div>

          <div className="mt-1 space-y-2 pb-1">
            <button
              type="button"
              onClick={() => {
                setItemsFromMenu(pickedItems);
                router.push(`${basePath}/cliente/pre-orden`);
              }}
              className="w-full rounded-full py-2.5 text-sm font-bold text-white transition-all duration-300 ease-in-out"
              style={{ background: colors.primary }}
            >
              Lo quiero
            </button>
            <button
              type="button"
              onClick={() => setShowChat((open) => !open)}
              className="w-full rounded-full border py-2.5 text-sm font-bold transition-all duration-300 ease-in-out"
              style={{
                borderColor: aion.colors.primary,
                color: aion.colors.primary,
              }}
            >
              {showChat
                ? "Cerrar Cheff Virtual"
                : "Hablar con el Cheff Virtual"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIncludeEntrada(true);
                setIncludePostre(true);
                setIncludeBebida(false);
                setSeed((s) => s + 1);
              }}
              className="w-full rounded-full border py-2.5 text-sm font-bold transition-all duration-300 ease-in-out"
              style={{
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              Otra opción
            </button>
            <Link
              href={`${basePath}/cliente/menu`}
              className="block text-center text-xs font-semibold"
              style={{ color: colors.primary }}
            >
              Ver menú completo
            </Link>
          </div>

          {showChat && (
            <div className="fixed inset-0 z-50">
              <Chat
                inline
                defaultOpen
                onClose={() => setShowChat(false)}
                contextData={answers}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

if (
  typeof window !== "undefined" &&
  !document.getElementById("aion-experience-animations")
) {
  const style = document.createElement("style");
  style.id = "aion-experience-animations";
  style.textContent = `
    @keyframes aionBallMove {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-9px) scale(1.05); }
    }
    @keyframes aionDot {
      0%, 100% { opacity: 0.25; transform: translateY(0); }
      50% { opacity: 1; transform: translateY(-2px); }
    }
  `;
  document.head.appendChild(style);
}

function OptionRow({
  title,
  item,
  included,
  onToggle,
  fixed = false,
  includeLabel = "Incluir",
}: {
  title: string;
  item: MenuItem | null;
  included?: boolean;
  onToggle?: () => void;
  fixed?: boolean;
  includeLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-stone-50 px-2.5 py-2">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          {title}
        </p>
        <p className="truncate text-sm font-bold text-stone-800">
          {item?.name ?? "No disponible"}
        </p>
      </div>
      {fixed ? (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
          Incluido
        </span>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          disabled={!item}
          className="rounded-full border px-2.5 py-1 text-[11px] font-bold disabled:opacity-45"
        >
          {included ? "Omitir" : includeLabel}
        </button>
      )}
    </div>
  );
}
