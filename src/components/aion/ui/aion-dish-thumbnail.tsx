import { categoryEmoji } from "@/lib/aion/category-emoji";

type Props = {
  label: string;
  category?: string;
  className?: string;
  bgColor?: string;
  textColor?: string;
};

export function AionDishThumbnail({
  label,
  category,
  className = "size-20",
  bgColor,
  textColor,
}: Props) {
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl ${!bgColor ? "bg-gradient-to-br from-stone-200/90 to-amber-100/80" : ""} ${className}`}
      style={
        bgColor
          ? { background: bgColor, color: textColor ?? "#ffffff" }
          : undefined
      }
      title={label}
    >
      {category ? (
        <>
          <span className="text-3xl leading-none" role="img" aria-hidden>
            {categoryEmoji(category)}
          </span>
          <span className="line-clamp-2 px-1.5 text-center text-[10px] font-medium leading-tight text-stone-500">
            {label}
          </span>
        </>
      ) : (
        <span className="line-clamp-2 px-1.5 text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}
