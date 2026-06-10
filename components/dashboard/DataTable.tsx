"use client";

import { useState, useMemo } from "react";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render: (row: T) => React.ReactNode;
  searchValue?: (row: T) => string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  rowKey: (row: T) => string;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDesc?: string;
  emptyAction?: React.ReactNode;
  pageSize?: number;
  searchPlaceholder?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  rowKey,
  emptyIcon,
  emptyTitle = "No records found",
  emptyDesc = "Nothing to show here yet.",
  emptyAction,
  pageSize = 8,
  searchPlaceholder = "Search...",
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.searchValue ? col.searchValue(row) : "";
        return val.toLowerCase().includes(q);
      })
    );
  }, [data, q, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.searchValue) return filtered;
    return [...filtered].sort((a, b) => {
      const av = col.searchValue!(a);
      const bv = col.searchValue!(b);
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleSearch(v: string) {
    setQuery(v);
    setPage(1);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Search + count bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 text-[13px] text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none
              placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
          {query && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-[12px] text-slate-400 flex-shrink-0">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
          {q ? ` for "${query}"` : ""}
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.searchValue && handleSort(col.key)}
                  className={`px-5 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none
                    ${col.searchValue ? "cursor-pointer hover:text-slate-600 transition-colors" : ""}
                    ${col.width ?? ""}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.searchValue && sortKey === col.key && (
                      <svg className={`w-3 h-3 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                    {col.searchValue && sortKey !== col.key && (
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5">
                      <div className="h-4 bg-slate-100 rounded-md animate-pulse" style={{ width: `${60 + (i * 7 + col.key.length * 3) % 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState icon={emptyIcon} title={q ? "No matching records" : emptyTitle} desc={q ? `No results found for "${query}"` : emptyDesc} action={!q ? emptyAction : undefined} />
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-50/60 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-slate-50">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-4 space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-3">
                  <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${40 + (i * 9 + col.key.length * 5) % 30}%` }} />
                </div>
              ))}
            </div>
          ))
        ) : paged.length === 0 ? (
          <EmptyState icon={emptyIcon} title={q ? "No matching records" : emptyTitle} desc={q ? `No results for "${query}"` : emptyDesc} action={!q ? emptyAction : undefined} />
        ) : (
          paged.map((row) => (
            <div key={rowKey(row)} className="px-4 py-4 space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 w-28">
                    {col.header}
                  </span>
                  <div className="text-right text-[13px]">{col.render(row)}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[12px] text-slate-400">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <PagBtn onClick={() => setPage(1)} disabled={safePage === 1} label="«" />
            <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} label="‹" />
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-md text-[12px] font-semibold transition-colors
                    ${p === safePage ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  {p}
                </button>
              );
            })}
            <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} label="›" />
            <PagBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages} label="»" />
          </div>
        </div>
      )}
    </div>
  );
}

function PagBtn({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 rounded-md text-[13px] font-bold text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}

function EmptyState({
  icon, title, desc, action,
}: {
  icon?: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-12 flex flex-col items-center text-center px-6">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
          {icon}
        </div>
      )}
      <p className="text-[14px] font-semibold text-slate-500">{title}</p>
      <p className="text-[13px] text-slate-400 mt-1">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
