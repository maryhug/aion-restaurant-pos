import { notFound, redirect } from "next/navigation";
import { resolveTenantRoute } from "@/lib/tenant-routing";

export default async function TenantEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tenant } = await params;
  const query = await searchParams;
  const tenantRoute = resolveTenantRoute(tenant);
  if (!tenantRoute) notFound();

  const qs = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "string") qs.set(key, value);
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
  });
  const suffix = qs.toString();

  redirect(
    suffix ? `${tenantRoute.appBasePath}?${suffix}` : tenantRoute.appBasePath,
  );
}
