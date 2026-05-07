import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { type PoolConfig, Pool } from "pg";

function resolveConnectionString(): string {
  // En runtime usamos la URL del pooler (DATABASE_URL)
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.trim()) {
    throw new Error("Falta DATABASE_URL para Prisma");
  }
  return databaseUrl.trim();
}

function poolConfigForPostgres(connectionString: string): PoolConfig {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return { connectionString };
  }

  // node-postgres no soporta channel_binding ni pgbouncer — eliminamos parámetros no estándar
  url.searchParams.delete("channel_binding");
  url.searchParams.delete("pgbouncer");

  const isSupabase =
    /supabase\.(co|com|net)/i.test(connectionString) ||
    /pooler\.supabase/i.test(connectionString);
  const isNeon = /neon\.tech/i.test(connectionString);

  if (isSupabase || isNeon) {
    // Forzamos SSL sin verificación estricta para evitar errores de certificado
    url.searchParams.delete("sslmode");
    return {
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: false },
    };
  }

  return { connectionString: url.toString() };
}

const prismaClientSingleton = () => {
  const connectionString = resolveConnectionString();
  const pool = new Pool(poolConfigForPostgres(connectionString));
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
