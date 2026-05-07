export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <p className="text-sm font-bold text-stone-700">{title}</p>
      <p className="mt-1 text-sm text-stone-500">{description}</p>
    </div>
  );
}
