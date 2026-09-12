interface ThiBadgeProps {
  thi: number;
  size?: "sm" | "md" | "lg";
}

export default function ThiBadge({ thi, size = "md" }: ThiBadgeProps) {
  const color =
    thi >= 75
      ? "bg-green-100 text-green-800 border-green-200"
      : thi >= 50
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-red-100 text-red-800 border-red-200";

  const dot =
    thi >= 75 ? "bg-green-500" : thi >= 50 ? "bg-yellow-500" : "bg-red-500";

  const sizes = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  return (
    <span
      className={`inline-flex items-center border rounded-full font-mono font-medium ${color} ${sizes[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      THI {thi}
    </span>
  );
}
