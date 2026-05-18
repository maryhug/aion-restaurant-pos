import type { ReactNode } from "react";

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-stone-100 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          {title}
        </p>
        {icon && (
          <div
            className="shrink-0 rounded-xl p-2 [&>svg]:h-4 [&>svg]:w-4"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--admin-primary, #581c22) 10%, transparent)",
              color: "var(--admin-primary, #581c22)",
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold tabular-nums text-stone-900">{value}</p>

      {(subtitle ?? trend) && (
        <div className="flex items-center justify-between gap-2">
          {subtitle && (
            <span className="text-xs text-stone-500">{subtitle}</span>
          )}
          {trend && (
            <span
              className={`text-xs font-medium ${
                trend.positive ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}%
            </span>
          )}
        </div>
      )}
    </article>
  );
}
