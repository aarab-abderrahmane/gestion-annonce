"use client";

type SpinnerProps = {
  size?: number;
  className?: string;
  label?: string;
};

export default function Spinner({
  size = 18,
  className,
  label = "جاري التحميل",
}: SpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`.trim()} role="status" aria-label={label}>
      <span
        className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
        style={{ width: size, height: size }}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
