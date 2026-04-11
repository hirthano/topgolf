import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change?: number
  icon?: LucideIcon
  iconColor?: string
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-primary",
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div
      className={cn(
        "surface-elevated p-4 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 rounded-lg border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        {Icon && (
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center bg-secondary",
            iconColor,
          )}>
            <Icon size={16} className="text-muted-foreground" />
          </div>
        )}
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp size={14} className="text-success" />
            ) : (
              <TrendingDown size={14} className="text-danger" />
            )}
            <span className={cn(
              "text-[11px] font-semibold",
              isPositive ? "text-success" : "text-danger",
            )}>
              {isPositive ? "+" : ""}{change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{title}</div>
    </div>
  )
}
