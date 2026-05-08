import { fetchAionMenuDishes } from "@/lib/aion/menu-items";

export async function POST(req: Request) {
  const {
    message,
    history = [],
    contextData,
  } = (await req.json()) as {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
    contextData?: Record<string, string>;
  };

  // ── 1. Cargar el menú completo ─────────────────────────────────────────────
  // Se envía todo el menú directamente a Llama 3 para que tenga contexto total
  // y pueda asociar correctamente (Ej: Arepa -> Sándwich) sin el filtro ciego del RAG.
  let menuContext = "";

  try {
    const dishes = await fetchAionMenuDishes();

    if (dishes.length === 0) {
      console.warn("[chat] No hay platos en DB");
    } else {
      menuContext = dishes
        .map((d) => {
          let desc = d.description ?? "";
          try {
            if (desc.trim().startsWith("{")) {
              const parsed = JSON.parse(desc);
              desc = Object.entries(parsed)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ");
            }
          } catch (e) {}
          return `- ${d.name} (${d.category}): ${desc}. Precio: $${d.price}`;
        })
        .join("\n");
    }
  } catch (error) {
    console.error("[chat] Error al cargar menú:", error);
  }

  let extraContext = "";
  if (contextData && Object.keys(contextData).length > 0) {
    const validEntries = Object.entries(contextData).filter(
      ([k, v]) => v && v.trim() !== "",
    );
    if (validEntries.length > 0) {
      extraContext = `\n[PERFIL DEL CLIENTE BASADO EN TEST DE PERSONALIDAD]\n${validEntries
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n")}\n[FIN DEL PERFIL]\n`;
    }
  }

  console.log("=== DEBUG CONTEXT DATA ===");
  console.log(contextData);
  console.log("=== FIN DEBUG ===");

  const assistantMode = contextData?.assistantMode;

  if (assistantMode === "admin") {
    const adminContext = Object.entries(contextData ?? {})
      .filter(([key]) => key !== "assistantMode")
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const adminSystemPrompt = `Eres el asistente administrativo de un restaurante.
Tu objetivo es ayudar al administrador con decisiones operativas y financieras.

INSTRUCCIONES:
1. Responde en español claro, breve y accionable.
2. Usa el CONTEXTO ADMINISTRATIVO para dar recomendaciones concretas.
3. Si falta información para concluir algo, dilo explícitamente y sugiere qué revisar.
4. No inventes datos; trabaja solo con el contexto recibido.
5. Máximo 5 oraciones por respuesta.

CONTEXTO ADMINISTRATIVO:
${adminContext || "- Sin contexto disponible"}`;

    const ollamaUrl = `${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}/api/chat`;
    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1:8b",
        messages: [
          { role: "system", content: adminSystemPrompt },
          ...history.slice(-10),
          { role: "user", content: message },
        ],
        stream: true,
        options: {
          temperature: 0.2,
          num_predict: 220,
          stop: [
            "Usuario:",
            "User:",
            "<|end|>",
            "<|user|>",
            "<|assistant|>",
            "<|system|>",
          ],
        },
      }),
    });

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n").filter((line) => line.trim() !== "");
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              controller.enqueue(
                new TextEncoder().encode(json.message.content),
              );
            }
          } catch (e) {
            console.error("[chat-admin] Error parsing JSON chunk:", e);
          }
        }
      },
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // ── 2. System prompt estricto ────────────────────────────────────────────
  const systemPrompt = menuContext
    ? `Eres el experto chef de Ilcafeto.
${extraContext}
INSTRUCCIONES OBLIGATORIAS:
1. Recomienda SOLO platos del "NUESTRO MENÚ" que verás abajo.
2. NUNCA inventes platos que no estén en la lista.
3. Lee el bloque [PERFIL DEL CLIENTE] que está arriba. Ahí dice exactamente cómo se siente el cliente y qué quiere. Asume esa información como un hecho.
4. Tienes ESTRICTAMENTE PROHIBIDO preguntarle al cliente sobre su estado de ánimo o qué desea pedir. ¡No hagas preguntas!
5. Tu única tarea es saludar y darle tu recomendación de plato inmediatamente basándote en su perfil, explicando brevemente por qué hace match con su estado actual (ej: "Veo que tienes ganas de algo dulce, así que te recomiendo...").
6. NUNCA respondas con código ni formato JSON. Háblale al cliente en lenguaje natural, cálido y fluido.
7. Sé extremadamente breve (máximo 3 oraciones).

NUESTRO MENÚ:
${menuContext}`
    : `Eres el chef y asistente virtual de Ilcafeto, un café-restaurante.
En este momento no tenemos información de platos disponibles. Responde brevemente que estamos actualizando el menú y disculpa el inconveniente.`;

  // ── 3. Llamar a Ollama con stream ────────────────────────────────────────
  const ollamaUrl = `${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}/api/chat`;

  const response = await fetch(ollamaUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.1:8b",
      messages: [
        { role: "system", content: systemPrompt },
        // Historial de la conversación (máx. últimos 10 mensajes)
        ...history.slice(-10),
        { role: "user", content: message },
      ],
      stream: true,
      options: {
        temperature: 0.1, // Casi determinístico: menos alucinaciones
        num_predict: 200, // Limitar longitud de respuesta
        stop: [
          "Usuario:",
          "User:",
          "<|end|>",
          "<|user|>",
          "<|assistant|>",
          "<|system|>",
          "\n\n\n", // Cortar si empieza a escribir párrafos largos
        ],
      },
    }),
  });

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      const lines = text.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            controller.enqueue(new TextEncoder().encode(json.message.content));
          }
        } catch (e) {
          console.error("[chat] Error parsing JSON chunk:", e);
        }
      }
    },
  });

  return new Response(response.body?.pipeThrough(transformStream), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
