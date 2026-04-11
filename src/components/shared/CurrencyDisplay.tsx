import { cn, formatCurrency, formatCurrencyShort } from "@/lib/utils"

interface CurrencyDisplayProps {
  amount: number
  size?: "sm" | "md" | "lg"
  showSign?: boolean
  compact?: boolean
  className?: string
}

const sizeClasses = {
  sm: "text-sm text-foreground",
  md: "text-base text-foreground",
  lg: "text-xl font-semibold text-foreground",
}

export function CurrencyDisplay({
  amount,
  size = "md",
  showSign = false,
  compact = false,
  className,
}: CurrencyDisplayProps) {
  const formatted = compact ? formatCurrencyShort(amount) : formatCurrency(amount)
  const isNegative = amount < 0
  const isPositive = amount > 0

  let prefix = ""
  if (showSign && isPositive) prefix = "+"
  if (showSign && isNegative) prefix = "" // negative sign is already in the formatted value

  return (
    <span
      className={cn(
        sizeClasses[size],
        showSign && isPositive && "text-emerald-600",
        showSign && isNegative && "text-red-600",
        className,
      )}
    >
      {prefix}{formatted}
    </span>
  )
}
