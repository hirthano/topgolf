import { useState, useMemo } from "react"
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Download, Loader2,
} from "lucide-react"

import { cn, downloadCSV } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ReactNode } from "react"

export interface ColumnDef<T> {
  header: string
  accessor: keyof T | ((row: T) => unknown)
  render?: (value: unknown, row: T) => ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
  exportFilename?: string
  loading?: boolean
  pageSize?: number
}

type SortDir = "asc" | "desc" | null

function getValue<T>(row: T, accessor: ColumnDef<T>["accessor"]): unknown {
  if (typeof accessor === "function") return accessor(row)
  return row[accessor]
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchPlaceholder = "Search...",
  onRowClick,
  exportFilename,
  loading = false,
  pageSize: defaultPageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row =>
      columns.some(col => {
        const v = getValue(row, col.accessor)
        return String(v ?? "").toLowerCase().includes(q)
      })
    )
  }, [data, search, columns])

  // Sort
  const sorted = useMemo(() => {
    if (sortCol === null || sortDir === null) return filtered
    const col = columns[sortCol]
    return [...filtered].sort((a, b) => {
      const va = getValue(a, col.accessor)
      const vb = getValue(b, col.accessor)
      const sa = String(va ?? "")
      const sb = String(vb ?? "")
      const numA = Number(va)
      const numB = Number(vb)
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === "asc" ? numA - numB : numB - numA
      }
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }, [filtered, sortCol, sortDir, columns])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (idx: number) => {
    if (!columns[idx].sortable) return
    if (sortCol === idx) {
      if (sortDir === "asc") setSortDir("desc")
      else if (sortDir === "desc") { setSortCol(null); setSortDir(null) }
      else setSortDir("asc")
    } else {
      setSortCol(idx)
      setSortDir("asc")
    }
    setPage(0)
  }

  const handleExport = () => {
    if (!exportFilename) return
    const exportData = sorted.map(row => {
      const obj: Record<string, unknown> = {}
      columns.forEach(col => {
        obj[col.header] = getValue(row, col.accessor)
      })
      return obj
    })
    downloadCSV(exportData, exportFilename)
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder={searchPlaceholder}
            className="pl-9 h-8 text-[13px]"
          />
        </div>
        <div className="flex items-center gap-2">
          {exportFilename && (
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <Download size={14} />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                    col.className,
                  )}
                  onClick={() => handleSort(i)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-muted-foreground">
                        {sortCol === i && sortDir === "asc" ? (
                          <ChevronUp size={13} />
                        ) : sortCol === i && sortDir === "desc" ? (
                          <ChevronDown size={13} />
                        ) : (
                          <ChevronsUpDown size={13} />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  No data found
                </td>
              </tr>
            ) : (
              paged.map((row, ri) => (
                <tr
                  key={ri}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-secondary/50",
                  )}
                >
                  {columns.map((col, ci) => {
                    const val = getValue(row, col.accessor)
                    return (
                      <td key={ci} className={cn("px-4 py-3 text-foreground", col.className)}>
                        {col.render ? col.render(val, row) : String(val ?? "")}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-muted-foreground ml-2">
            {sorted.length === 0 ? "0" : `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, sorted.length)}`} of {sorted.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i
            } else if (page < 3) {
              pageNum = i
            } else if (page > totalPages - 4) {
              pageNum = totalPages - 5 + i
            } else {
              pageNum = page - 2 + i
            }
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 text-xs"
                onClick={() => setPage(pageNum)}
              >
                {pageNum + 1}
              </Button>
            )
          })}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
