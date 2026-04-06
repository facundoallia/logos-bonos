'use client';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { EnrichedBond } from '@/lib/types';

interface Props {
  bonds: EnrichedBond[];
  isUSD: boolean;
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
}

function n(v: number | null, dec = 2): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtVol(v: number | null): string {
  if (v === null || v === undefined) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function VarCell({ v }: { v: number | null }) {
  if (v === null || v === undefined) return <span style={{ color: '#8ba5bf' }}>—</span>;
  const color = v > 0 ? '#16A34A' : v < 0 ? '#DC2626' : '#D97706';
  return <span style={{ color, fontWeight: 600 }}>{v > 0 ? '+' : ''}{n(v)}%</span>;
}

function TirBadge({ v }: { v: number | null }) {
  if (v === null || v === undefined) return <span style={{ color: '#8ba5bf' }}>—</span>;
  return (
    <span style={{
      background: '#EBF5FB', color: '#1F4E79',
      border: '1px solid #BDD0E0', borderRadius: 4,
      padding: '2px 6px', fontSize: 11, fontWeight: 600,
    }}>
      {n(v)}%
    </span>
  );
}

function LegBadge({ leg }: { leg: string | null }) {
  if (!leg) return null;
  const isNY = leg.includes('York');
  return (
    <span style={{
      background: isNY ? '#EBF5FB' : '#F8FAFC',
      color: isNY ? '#1F4E79' : '#4a6880',
      border: `1px solid ${isNY ? '#BDD0E0' : '#DDE6EF'}`,
      borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 500,
    }}>
      {isNY ? 'NY' : 'ARG'}
    </span>
  );
}

const TH_STYLE: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'left', fontWeight: 600,
  color: '#0D1B2A', fontSize: 11, cursor: 'pointer',
  userSelect: 'none', whiteSpace: 'nowrap',
  borderBottom: '2px solid #BDD0E0',
  position: 'sticky', top: 0, zIndex: 2,
  background: '#EBF5FB',
};

export function BondsTable({ bonds, isUSD, selectedTicker, onSelect }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const usdColumns: ColumnDef<EnrichedBond>[] = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Bono',
      size: 130,
      cell: ({ row }) => (
        <div style={{ lineHeight: 1.3 }}>
          <span style={{ fontWeight: 700, color: '#0D1B2A', fontSize: 12 }}>
            {row.original.ticker}
          </span>
          <br />
          <span style={{ fontSize: 10, color: '#8ba5bf' }}>
            {fmtDate(row.original.vencimiento)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'precioUSD',
      header: 'USD',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return v != null
          ? <span style={{ fontWeight: 600 }}>${n(v)}</span>
          : <span style={{ color: '#8ba5bf' }}>—</span>;
      },
    },
    {
      accessorKey: 'precioMEP',
      header: 'MEP',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return <span style={{ color: '#4a6880', fontSize: 12 }}>${n(v)}</span>;
      },
    },
    {
      accessorKey: 'precioARS',
      header: 'ARS',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        if (!v) return <span style={{ color: '#8ba5bf' }}>—</span>;
        return (
          <span style={{ color: '#4a6880', fontSize: 11 }}>
            {v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        );
      },
    },
    {
      accessorKey: 'tir',
      header: 'TIR',
      cell: ({ getValue }) => <TirBadge v={getValue() as number | null} />,
    },
    {
      accessorKey: 'tem',
      header: 'TEM',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return v != null
          ? <span style={{ fontSize: 11, color: '#0D1B2A' }}>{n(v, 4)}%</span>
          : <span style={{ color: '#8ba5bf' }}>—</span>;
      },
    },
    {
      accessorKey: 'tna',
      header: 'TNA',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return v != null
          ? <span style={{ fontSize: 11, color: '#4a6880' }}>{n(v)}%</span>
          : <span style={{ color: '#8ba5bf' }}>—</span>;
      },
    },
    {
      accessorKey: 'md',
      header: 'MD',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return v != null
          ? <span style={{ fontSize: 11, color: '#4a6880' }}>{n(v)}</span>
          : <span style={{ color: '#8ba5bf' }}>—</span>;
      },
    },
    {
      accessorKey: 'varDia',
      header: 'Var%',
      cell: ({ getValue }) => <VarCell v={getValue() as number | null} />,
    },
    {
      accessorKey: 'volumenBYMA',
      header: 'Vol',
      cell: ({ getValue }) => (
        <span style={{ color: '#8ba5bf', fontSize: 11 }}>{fmtVol(getValue() as number | null)}</span>
      ),
    },
  ], []);

  const arsColumns: ColumnDef<EnrichedBond>[] = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Bono',
      size: 140,
      cell: ({ row }) => (
        <div style={{ lineHeight: 1.3 }}>
          <span style={{ fontWeight: 700, color: '#0D1B2A', fontSize: 12 }}>
            {row.original.ticker}
          </span>
          <br />
          <span style={{ fontSize: 10, color: '#8ba5bf' }}>
            {fmtDate(row.original.vencimiento)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'precioARS',
      header: 'Precio',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        if (!v) return <span style={{ color: '#8ba5bf' }}>—</span>;
        return (
          <span style={{ fontWeight: 600 }}>
            {v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        );
      },
    },
    {
      accessorKey: 'tir',
      header: 'TIR',
      cell: ({ getValue }) => <TirBadge v={getValue() as number | null} />,
    },
    {
      accessorKey: 'tem',
      header: 'TEM',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return v != null
          ? <span style={{ fontSize: 11, color: '#0D1B2A' }}>{n(v, 4)}%</span>
          : <span style={{ color: '#8ba5bf' }}>—</span>;
      },
    },
    {
      accessorKey: 'tna',
      header: 'TNA',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return v != null
          ? <span style={{ fontSize: 11, color: '#4a6880' }}>{n(v)}%</span>
          : <span style={{ color: '#8ba5bf' }}>—</span>;
      },
    },
    {
      accessorKey: 'md',
      header: 'MD',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return v != null
          ? <span style={{ fontSize: 11, color: '#4a6880' }}>{n(v)}</span>
          : <span style={{ color: '#8ba5bf' }}>—</span>;
      },
    },
    {
      accessorKey: 'varDia',
      header: 'Var%',
      cell: ({ getValue }) => <VarCell v={getValue() as number | null} />,
    },
    {
      accessorKey: 'volumenBYMA',
      header: 'Vol',
      cell: ({ getValue }) => (
        <span style={{ color: '#8ba5bf', fontSize: 11 }}>{fmtVol(getValue() as number | null)}</span>
      ),
    },
  ], []);

  const table = useReactTable({
    data: bonds,
    columns: isUSD ? usdColumns : arsColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div style={{
      height: 320, overflowY: 'auto', overflowX: 'auto',
      border: '1px solid #DDE6EF', borderRadius: 6, fontSize: 12,
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  style={TH_STYLE}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {h.column.getIsSorted() === 'asc'
                    ? ' \u2191'
                    : h.column.getIsSorted() === 'desc'
                    ? ' \u2193'
                    : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ padding: 24, textAlign: 'center', color: '#8ba5bf' }}>
                Cargando datos...
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, i) => {
              const isSelected = row.original.ticker === selectedTicker;
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row.original.ticker)}
                  style={{
                    background: isSelected ? '#EBF5FB' : i % 2 === 0 ? '#fff' : '#F8FAFC',
                    borderLeft: isSelected ? '3px solid #1F4E79' : '3px solid transparent',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background = '#F1F7FF';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background =
                        i % 2 === 0 ? '#fff' : '#F8FAFC';
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '7px 10px',
                        borderBottom: '1px solid #DDE6EF',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
