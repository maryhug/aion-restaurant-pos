type Props = { label: string; className?: string };

/**
 * Placeholder for dish photo — matches card layout without new image assets.
 */
export function AionDishThumbnail({ label, className = "size-20" }: Props) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-stone-200/90 to-amber-100/80 text-[10px] font-medium text-stone-500 ${className}`}
      title={label}
    >
      <span className="line-clamp-2 px-1.5 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
