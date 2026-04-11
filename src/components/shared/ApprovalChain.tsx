import { Check, X, Clock, RotateCcw, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import type { ApprovalStep } from "@/types"

interface ApprovalChainProps {
  steps: ApprovalStep[]
  currentStep: number
  className?: string
  compact?: boolean
}

const stepIcon = (status: ApprovalStep["status"]) => {
  switch (status) {
    case "approved":
      return <Check size={14} strokeWidth={2.5} />
    case "rejected":
      return <X size={14} strokeWidth={2.5} />
    case "revision":
      return <RotateCcw size={14} strokeWidth={2} />
    default:
      return <Clock size={14} strokeWidth={2} />
  }
}

const stepColor = (status: ApprovalStep["status"], isCurrent: boolean) => {
  if (status === "approved") return "bg-emerald-500 text-white border-emerald-500"
  if (status === "rejected") return "bg-red-500 text-white border-red-500"
  if (status === "revision") return "bg-orange-500 text-white border-orange-500"
  if (isCurrent) return "bg-primary text-primary-foreground border-primary animate-pulse-subtle"
  return "bg-secondary text-muted-foreground border-border"
}

const lineColor = (status: ApprovalStep["status"]) => {
  if (status === "approved") return "bg-emerald-500"
  if (status === "rejected") return "bg-red-500"
  return "bg-border"
}

export function ApprovalChain({ steps, currentStep, className, compact = false }: ApprovalChainProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center justify-center h-6 w-6 rounded-full border-2 shrink-0",
                stepColor(step.status, i === currentStep && step.status === "pending"),
              )}
              title={`${step.approver} (${step.role}) - ${step.status}`}
            >
              {stepIcon(step.status)}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={12} className="text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-0", className)}>
      {steps.map((step, i) => {
        const isCurrent = i === currentStep && step.status === "pending"
        return (
          <div key={i} className="flex gap-3">
            {/* Vertical line + circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full border-2 shrink-0 z-10",
                  stepColor(step.status, isCurrent),
                )}
              >
                {stepIcon(step.status)}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("w-0.5 flex-1 min-h-[24px]", lineColor(step.status))} />
              )}
            </div>

            {/* Content */}
            <div className="pb-5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{step.approver}</span>
                <span className="text-xs text-muted-foreground">({step.role})</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "text-xs font-medium capitalize",
                  step.status === "approved" && "text-emerald-600",
                  step.status === "rejected" && "text-red-600",
                  step.status === "revision" && "text-orange-600",
                  step.status === "pending" && "text-muted-foreground",
                )}>
                  {step.status === "pending" ? (isCurrent ? "Awaiting Review" : "Pending") : step.status}
                </span>
                {step.date && (
                  <span className="text-xs text-muted-foreground">{formatDate(step.date)}</span>
                )}
              </div>
              {step.comment && (
                <p className="mt-1 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2 italic">
                  &ldquo;{step.comment}&rdquo;
                </p>
              )}
              {step.status === "approved" && step.date && (
                <p className="mt-1 text-[10px] text-muted-foreground font-mono">
                  {step.approver} &bull; {step.date} &bull; Digitally Approved
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
