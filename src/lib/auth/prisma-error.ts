type MaybeError = {
  code?: string;
  message?: string;
};

export function mapAuthDbError(error: unknown): {
  status: number;
  error: string;
  details: string;
} {
  const e = error as MaybeError;
  const details =
    error instanceof Error ? error.message : "Error desconocido de base de datos";

  if (e?.code === "ECONNREFUSED") {
    return {
      status: 503,
      error: "Base de datos no disponible",
      details:
        "No se pudo conectar con PostgreSQL. Configura DIRECT_URL (Supabase Postgres) o inicia prisma dev.",
    };
  }

  return {
    status: 500,
    error: "Error interno del servidor",
    details,
  };
}
