export function StatsCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-[var(--admin-surface,#fff)] p-4 shadow-sm">
      <p className="text-xs font-semibold text-[var(--admin-secondary,#7b4b52)]">
        {title}
      </p>
      <p className="mt-1 text-2xl font-black text-[var(--admin-primary,#581c22)]">
        {value}
      </p>
      {subtitle ? (
        <p className="text-xs text-[var(--admin-secondary,#7b4b52)]">
          {subtitle}
        </p>
      ) : null}
    </article>
  );
}
