export type TenantKey = "ilcafeto" | "cazuela";

type TenantRouteConfig = {
  key: TenantKey;
  aliases: string[];
  appBasePath: string;
};

const TENANT_ROUTES: TenantRouteConfig[] = [
  {
    key: "ilcafeto",
    aliases: ["ilcafeto", "il-cafeto", "cafeto"],
    appBasePath: "/aion",
  },
  {
    key: "cazuela",
    aliases: ["cazuela", "la-cazuela"],
    appBasePath: "/cazuela",
  },
];

export function resolveTenantRoute(slug: string): TenantRouteConfig | null {
  const normalized = slug.trim().toLowerCase();
  return (
    TENANT_ROUTES.find(
      (tenant) =>
        tenant.key === normalized || tenant.aliases.includes(normalized),
    ) ?? null
  );
}

export function buildTenantClientPath(
  tenantSlug: string,
  segments: string[] = [],
): string | null {
  const tenant = resolveTenantRoute(tenantSlug);
  if (!tenant) return null;
  if (segments.length === 0) return `${tenant.appBasePath}/cliente/menu`;
  return `${tenant.appBasePath}/cliente/${segments.join("/")}`;
}
