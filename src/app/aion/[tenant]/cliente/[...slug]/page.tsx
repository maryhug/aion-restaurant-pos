import { notFound, redirect } from "next/navigation";
import { buildTenantClientPath } from "@/lib/tenant-routing";

export default async function TenantClientAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string; slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tenant, slug } = await params;
  const query = await searchParams;
  const target = buildTenantClientPath(tenant, slug);
  if (!target) notFound();

  const qs = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "string") qs.set(key, value);
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
  });
  const suffix = qs.toString();

  redirect(suffix ? `${target}?${suffix}` : target);
}
