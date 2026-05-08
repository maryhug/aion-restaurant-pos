"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Chat from "@/components/ChatComponent";
import { useRouter } from "next/navigation";
import { aion as defaultTokens } from "@/lib/aion/tokens";
import type { TokenShape } from "@/lib/aion/token-types";
import { categoryEmoji } from "@/lib/aion/category-emoji";
import { useAionOrder } from "@/lib/aion/order-context";
import type { MenuItem } from "@/types/database";

type Props = { menuItems: MenuItem[]; basePath?: string; tokens?: TokenShape };

type AnswerKey =
  | "moodWord"
  | "flavorPersona"
  | "riskMode"
  | "intent"
  | "movieGenre";

const questions: { key: AnswerKey; title: string; options: string[] }[] = [
  {
    key: "moodWord",
    title: "¿Cómo describes tu estado de ánimo hoy?",
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
    title: "¿Prefieres jugar seguro o sorprenderte?",
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

function getSuggestedMenu(
  menuItems: MenuItem[],
  answers: Record<AnswerKey, string>,
  seed: number,
) {
  const allText = Object.values(answers).join(" ").toLowerCase();
  const byCategoryAll = {
    entrada: menuItems.filter((i) =>
      ["entradas", "ensaladas", "sopas"].includes(i.category.toLowerCase()),
    ),
    principal: menuItems.filter((i) =>
      [
        "carnes",
        "sándwiches",
        "adiciones",
        "ensaladas",
        "platos fuertes",
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
  tokens: tokensProp,
}: Props) {
  const t = tokensProp ?? defaultTokens;
  const router = useRouter();
  const { setItemsFromMenu } = useAionOrder();

  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  const [chatOpen, setChatOpen] = useState(false);

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
      className="flex min-h-dvh w-full flex-col"
      style={{ background: t.colors.pageBg }}
    >
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 pt-5 pb-4">
          <Link
            href={basePath}
            className="grid size-9 place-items-center rounded-full bg-white text-sm font-bold shadow-sm ring-1 ring-black/5"
            style={{ color: t.colors.primary }}
            aria-label="Volver"
          >
            ←
          </Link>

          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {questions.map((q, i) => (
              <span
                key={q.key}
                className="inline-block rounded-full transition-all duration-300 ease-in-out"
                style={{
                  width:
                    i === Math.min(step, questions.length - 1) ? "24px" : "8px",
                  height: "8px",
                  background:
                    i < step
                      ? t.colors.primary
                      : i === step
                        ? t.colors.primary
                        : t.colors.border,
                  opacity: i < step ? 0.45 : 1,
                }}
              />
            ))}
          </div>

          <span
            className="w-10 text-right text-xs font-semibold"
            style={{ color: t.colors.muted }}
          >
            {Math.min(step + 1, questions.length)}/{questions.length}
          </span>
        </header>

        {/* Content */}
        <div className="flex flex-1 flex-col px-4 pb-8">
          {!finished ? (
            isTransitioning ? (
              /* Transition animation */
              <div
                className="flex flex-1 flex-col items-center justify-center rounded-3xl"
                style={{
                  background: `radial-gradient(circle at 50% 40%, ${t.colors.pageBgAlt} 0%, ${t.colors.pageBg} 65%)`,
                }}
              >
                <div className="relative mb-6">
                  <span
                    className="absolute rounded-full"
                    style={{
                      inset: "-20px",
                      background: `${t.colors.primary}18`,
                      borderRadius: "9999px",
                    }}
                  />
                  <span
                    className="absolute rounded-full"
                    style={{
                      inset: "-8px",
                      background: `${t.colors.primary}22`,
                      borderRadius: "9999px",
                    }}
                  />
                  <span
                    className="relative block size-28 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 32% 28%, ${t.colors.tagBg} 0%, ${t.colors.primary} 72%)`,
                      animation: "xpBallMove 1.15s ease-in-out infinite",
                    }}
                  />
                </div>
                <p
                  className="text-center font-black leading-tight"
                  style={{
                    color: t.colors.primary,
                    fontSize: "clamp(1.4rem, 4vw, 1.9rem)",
                  }}
                >
                  Descubriendo tu experiencia
                </p>
                <div className="mt-3 flex gap-2">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <span
                      key={i}
                      className="size-2.5 rounded-full"
                      style={{
                        background: t.colors.primary,
                        animation: `xpDot 0.8s ease-in-out ${delay}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Quiz question */
              <div className="flex flex-1 flex-col">
                <p
                  className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: t.colors.muted }}
                >
                  Pregunta {step + 1} de {questions.length}
                </p>

                <h2
                  className="font-extrabold leading-tight"
                  style={{
                    color: t.colors.text,
                    fontSize: "clamp(1.5rem, 5vw, 2rem)",
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
                                background: "#E8B9C3",
                                color: aion.colors.primary,
                                boxShadow: `0 0 0 2px ${aion.colors.primary}22`,
                              }
                            : { background: "#F4CDD5", color: aion.colors.text }
                        }
                      >
                        <span>{option}</span>
                        <span
                          className="grid size-5 place-items-center rounded-full border text-[10px]"
                          style={{
                            borderColor: active
                              ? aion.colors.primary
                              : "#C9A5AD",
                            color: active ? aion.colors.primary : "#C9A5AD",
                            background: active ? "#FBEFF2" : "transparent",
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
                      background: aion.colors.primary,
                    }}
                  />
                </div>
              </div>
            )
          ) : (
            <section className="mx-auto w-full max-w-sm rounded-3xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-in-out">
              <p
                className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: aion.colors.muted }}
              >
                Tu plato
              </p>

              <div className="relative mt-1 h-64 overflow-hidden rounded-2xl bg-[#f5dbe0]">
                {finalDish?.image_url ? (
                  <Image
                    src={finalDish.image_url}
                    alt={finalDish.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 90vw, 400px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="px-1 pb-1 pt-3">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: aion.colors.muted }}
                >
                  {finalDish?.category ?? "Especial"} · CAP. 1
                </p>
                <h2
                  className="mt-1 text-4xl font-black"
                  style={{
                    color: aion.colors.primary,
                    fontSize: "clamp(1.7rem,4.3vw,2.2rem)",
                  }}
                >
                  {finalDish?.name ?? "Plato recomendado"}
                </h2>
                <p
                  className="mt-2 text-xs italic leading-relaxed"
                  style={{ color: aion.colors.muted }}
                >
                  &ldquo;
                  {finalDish?.description ??
                    "Una propuesta pensada para tu perfil: una mezcla de sabor, textura y sorpresa en una sola experiencia."}
                  &rdquo;
                </p>
                <p
                  className="mt-2 text-right text-sm font-extrabold"
                  style={{ color: aion.colors.primary }}
                >
                  ${total.toLocaleString("es-CO")}
                </p>
              </div>

              {/* Description */}
              {finalDish?.description ? (
                <p className="px-4 pt-3 text-xs italic leading-relaxed text-stone-500">
                  &ldquo;{finalDish.description}&rdquo;
                </p>
              ) : (
                <p className="px-4 pt-3 text-xs italic leading-relaxed text-stone-500">
                  &ldquo;Una propuesta pensada para tu perfil: una mezcla de
                  sabor, textura y sorpresa en una sola experiencia.&rdquo;
                </p>
              )}

              {/* Option rows */}
              <div className="mt-3 space-y-2 px-4">
                <OptionRow
                  title="Plato"
                  item={suggestion.principal}
                  fixed
                  tokens={t}
                />
                <OptionRow
                  title="Entrada"
                  item={suggestion.entrada}
                  included={canIncludeEntrada && includeEntrada}
                  onToggle={() =>
                    canIncludeEntrada && setIncludeEntrada((v) => !v)
                  }
                  tokens={t}
                />
                <OptionRow
                  title="Postre"
                  item={suggestion.postre}
                  included={canIncludePostre && includePostre}
                  onToggle={() =>
                    canIncludePostre && setIncludePostre((v) => !v)
                  }
                  tokens={t}
                />
                <OptionRow
                  title="Bebida"
                  item={suggestion.bebida}
                  included={canIncludeBebida && includeBebida}
                  onToggle={() =>
                    canIncludeBebida && setIncludeBebida((v) => !v)
                  }
                  includeLabel="Agregar"
                  tokens={t}
                />
              </div>

              <div className="mt-1 space-y-2 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setItemsFromMenu(pickedItems);
                    router.push("/aion/cliente/pre-orden");
                  }}
                  className="w-full rounded-full py-2.5 text-sm font-bold text-white transition-all duration-300 ease-in-out"
                  style={{ background: aion.colors.primary }}
                >
                  Lo quiero
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
                    borderColor: aion.colors.border,
                    color: aion.colors.text,
                  }}
                >
                  Otra opción
                </button>
                <Link
                  href="/aion/cliente/menu"
                  className="block text-center text-xs font-semibold"
                  style={{ color: aion.colors.primary }}
                >
                  Ver menú completo
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function OptionRow({
  title,
  item,
  included,
  onToggle,
  fixed = false,
  includeLabel = "Incluir",
  tokens: t,
}: {
  title: string;
  item: MenuItem | null;
  included?: boolean;
  onToggle?: () => void;
  fixed?: boolean;
  includeLabel?: string;
  tokens: TokenShape;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-3 py-2.5"
      style={{ background: t.colors.pageBg }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: t.colors.muted }}
        >
          {title}
        </p>
        <p
          className="truncate text-sm font-bold"
          style={{ color: t.colors.text }}
        >
          {item?.name ?? "No disponible"}
        </p>
      </div>
      {fixed ? (
        <span
          className="ml-3 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ background: t.colors.tagBg, color: t.colors.primary }}
        >
          Incluido
        </span>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          disabled={!item}
          className="ml-3 shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors disabled:opacity-40"
          style={
            included
              ? {
                  borderColor: t.colors.primary,
                  color: t.colors.primary,
                  background: t.colors.tagBg,
                }
              : { borderColor: t.colors.border, color: t.colors.muted }
          }
        >
          {included ? "Omitir" : includeLabel}
        </button>
      )}
    </div>
  );
}
