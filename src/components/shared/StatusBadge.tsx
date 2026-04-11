import { cn, getStatusColor } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClasses = getStatusColor(status)
  const label = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colorClasses,
        className,
      )}
    >
      {label}
    </span>
  )
}
