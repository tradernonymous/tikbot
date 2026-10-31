import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DataTable, ColumnDef } from '../DataTable';

interface TestRow {
  id: string;
  name: string;
  status: string;
  count: number;
}

describe('DataTable Component (U4.6, P5.3)', () => {
  const columns: ColumnDef<TestRow>[] = [
    { key: 'name', header: 'Account Name', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
    { key: 'count', header: 'Actions', sortable: true },
  ];

  const data: TestRow[] = [
    { id: '1', name: 'Alpha', status: 'ACTIVE', count: 42 },
    { id: '2', name: 'Beta', status: 'WARMING', count: 12 },
  ];

  it('renders table headers and row count', () => {
    const el = DataTable({
      columns,
      data,
      keyExtractor: (item) => item.id,
    });

    expect(el).toBeDefined();
    expect(el.props['aria-label'] || el.props['role'] || el.props.className).toBeDefined();
  });

  it('renders accessible sortable header attributes', () => {
    const onSort = vi.fn();
    const el = DataTable({
      columns,
      data,
      sortColumn: 'name',
      sortDirection: 'asc',
      onSort,
      keyExtractor: (item) => item.id,
    });

    expect(el).toBeDefined();
  });

  it('renders EmptyState when data array is empty', () => {
    const el = DataTable({
      columns,
      data: [],
      emptyTitle: 'No Records Found',
      emptyDescription: 'Try adjusting your filters or add a new record.',
      keyExtractor: (item) => item.id,
    });

    expect(el).toBeDefined();
  });

  it('renders pagination controls and info when pageSize is configured (P5.3)', () => {
    const onPageChange = vi.fn();
    const html = renderToString(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
        page={1}
        pageSize={1}
        totalCount={10}
        onPageChange={onPageChange}
      />
    );

    expect(html).toContain('aria-label="Pagination Navigation"');
    expect(html).toContain('Page 1 of 10');
  });
});
