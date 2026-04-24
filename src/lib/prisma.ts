import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { type PoolConfig, Pool } from "pg";

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  try {
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveConnectionString(): string {
  const direct = process.env.DIRECT_URL;
  if (direct && direct.trim()) return direct.trim();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.trim()) {
    throw new Error("Falta DATABASE_URL o DIRECT_URL para Prisma");
  }

  const trimmed = databaseUrl.trim();
  if (
    trimmed.startsWith("postgres://") ||
    trimmed.startsWith("postgresql://")
  ) {
    return trimmed;
  }

  // Soporte para prisma+postgres://...?...api_key=<jwt>
  if (trimmed.startsWith("prisma+postgres://")) {
    const url = new URL(trimmed);
    const apiKey = url.searchParams.get("api_key");
    if (apiKey) {
      const payload = decodeJwtPayload(apiKey);
      const maybeDirect = payload?.["databaseUrl"];
      if (typeof maybeDirect === "string" && maybeDirect.length > 0) {
        return maybeDirect;
      }
    }
  }

  return trimmed;
}

function poolConfigForPostgres(connectionString: string): PoolConfig {
  const isSupabase =
    /supabase\.(co|com|net)/i.test(connectionString) ||
    /pooler\.supabase/i.test(connectionString);
  // node-pg + pooler: con ?sslmode=require en la URL a veces se fuerza verificación estricta
  // y aparece P1011 ("self-signed certificate in certificate chain"). Quitamos sslmode de
  // la URL y fijamos ssl en el Pool (patrón habitual con Supabase + node-postgres).
  if (isSupabase) {
    let url: URL;
    try {
      url = new URL(connectionString);
    } catch {
      return { connectionString };
    }
    url.searchParams.delete("sslmode");
    return {
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: false },
    };
  }
  return { connectionString };
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
