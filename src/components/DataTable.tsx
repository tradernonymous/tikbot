'use client';

import React, { ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  selectedIds?: Set<string>;
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  sortColumn,
  sortDirection,
  onSort,
  selectedIds,
  onSelectRow,
  onSelectAll,
  page = 1,
  pageSize,
  totalCount,
  onPageChange,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching the criteria.',
  className = '',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  const allSelected = selectedIds && data.length > 0 && data.every((item, i) => selectedIds.has(keyExtractor(item, i)));
  const totalItems = totalCount ?? data.length;
  const totalPages = pageSize ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;

  return (
    <div
      role="region"
      aria-label="Data Table"
      className={`overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 text-xs text-slate-400">
        <span>Showing {pageSize ? `${Math.min((page - 1) * pageSize + 1, totalItems)}-${Math.min(page * pageSize, totalItems)} of ${totalItems}` : `${data.length} records`}</span>
        {selectedIds && selectedIds.size > 0 && (
          <span className="font-medium text-cyan-400">{selectedIds.size} selected</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              {onSelectAll && (
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    aria-label="Select all rows"
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-cyan-500"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                const ariaSort = isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined;

                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`px-4 py-3 ${col.className || ''}`}
                  >
                    {col.sortable && onSort ? (
                      <button
                        onClick={() => onSort(col.key)}
                        type="button"
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 focus:outline-none focus:text-cyan-400"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/20 text-slate-300">
            {data.map((item, index) => {
              const id = keyExtractor(item, index);
              const isSelected = selectedIds?.has(id);

              return (
                <tr
                  key={id}
                  className={`transition-colors hover:bg-slate-900/40 ${isSelected ? 'bg-cyan-950/20' : ''}`}
                >
                  {onSelectRow && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectRow(id, e.target.checked)}
                        aria-label={`Select row ${id}`}
                        className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-cyan-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                      {col.render ? col.render(item, index) : String(item[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageSize && totalPages > 1 && (
        <nav
          aria-label="Pagination Navigation"
          className="flex items-center justify-between border-t border-slate-800/80 px-4 py-3 text-xs"
        >
          <span className="text-slate-400">
            {`Page ${page} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
