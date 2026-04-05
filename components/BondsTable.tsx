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

function fmt(n: number | null, decimals = 2): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtVol(n: number | null): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(s: string): string {
  const [year, month] = s.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function VarBadge({ v }: { v: number | null }) {
  if (v === null || v === undefined) return <span style={{ color: '#8ba5bf' }}>—</span>;
  const color = v > 0 ? '#16A34A' : v < 0 ? '#DC2626' : '#D97706';
  return <span style={{ color, fontWeight: 600 }}>{v > 0 ? '+' : ''}{fmt(v)}%</span>;
}

function TirBadge({ v }: { v: number | null }) {
  if (v === null || v === undefined) return <span style={{ color: '#8ba5bf' }}>—</span>;
  return (
    <span style={{
      background: '#EBF5FB', color: '#1F4E79', border: '1px solid #BDD0E0',
      borderRadius: 4, padding: '2px 7px', fontSize: 12, fontWeight: 600,
    }}>
      {fmt(v)}%
    </span>
  );
}

function LegBadge({ leg }: { leg: string }) {
  const isNY = leg.includes('York') || leg === 'NY';
  return (
    <span style={{
      background: isNY ? '#EBF5FB' : '#F8FAFC',
      color: isNY ? '#1F4E79' : '#4a6880',
      border: `1px solid ${isNY ? '#BDD0E0' : '#DDE6EF'}`,
      borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 500,
    }}>
      {isNY ? 'NY' : 'ARG'}
    </span>
  );
}

function FamBadge({ fam }: { fam: string }) {
  const isLetra = fam.startsWith('LETRA') || fam.startsWith('LETRAS');
  return (
    <span style={{
      background: isLetra ? '#FFF7ED' : '#EBF5FB',
      color: isLetra ? '#D97706' : '#1F4E79',
      border: `1px solid ${isLetra ? '#FED7AA' : '#BDD0E0'}`,
      borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 500,
    }}>
      {isLetra ? 'LETRA' : 'BONO'}
    </span>
  );
}

export function BondsTable({ bonds, isUSD, selectedTicker, onSelect }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const usdColumns: ColumnDef<EnrichedBond>[] = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Bono',
      cell: ({ row }) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0D1B2A', fontSize: 13 }}>{row.original.ticker}</span>
          <br />
          <span style={{ fontSize: 11, color: '#4a6880' }}>{fmtDate(row.original.vencimiento)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'precioUSD',
      header: 'USD',
      cell: ({ getValue }) => <span style={{ fontWeight: 600 }}>${fmt(getValue() as number | null)}</span>,
    },
    {
      accessorKey: 'precioARS',
      header: 'ARS',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        if (!v) return <span style={{ color: '#8ba5bf' }}>—</span>;
        return <span style={{ color: '#4a6880' }}>{v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>;
      },
    },
    {
      accessorKey: 'precioMEP',
      header: 'MEP',
      cell: ({ getValue }) => <span style={{ color: '#4a6880' }}>${fmt(getValue() as number | null)}</span>,
    },
    {
      accessorKey: 'tirPct',
      header: 'TIR',
      cell: ({ getValue }) => <TirBadge v={getValue() as number | null} />,
    },
    {
      accessorKey: 'varDia',
      header: 'Var. Día',
      cell: ({ getValue }) => <VarBadge v={getValue() as number | null} />,
    },
    {
      accessorKey: 'legislacion',
      header: 'Leg.',
      cell: ({ getValue }) => <LegBadge leg={getValue() as string} />,
    },
    {
      accessorKey: 'volumen',
      header: 'Volumen',
      cell: ({ getValue }) => <span style={{ color: '#8ba5bf', fontSize: 12 }}>{fmtVol(getValue() as number | null)}</span>,
    },
  ], []);

  const arsColumns: ColumnDef<EnrichedBond>[] = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Bono',
      cell: ({ row }) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0D1B2A', fontSize: 13 }}>{row.original.ticker}</span>
          <br />
          <span style={{ fontSize: 11, color: '#4a6880' }}>{fmtDate(row.original.vencimiento)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'precioARS',
      header: 'Precio ARS',
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        if (!v) return <span style={{ color: '#8ba5bf' }}>—</span>;
        return <span style={{ fontWeight: 600 }}>{v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>;
      },
    },
    {
      accessorKey: 'tirPct',
      header: 'TIR / TNA',
      cell: ({ getValue }) => <TirBadge v={getValue() as number | null} />,
    },
    {
      accessorKey: 'varDia',
      header: 'Var. Día',
      cell: ({ getValue }) => <VarBadge v={getValue() as number | null} />,
    },
    {
      accessorKey: 'vencimiento',
      header: 'Vencimiento',
      cell: ({ getValue }) => <span style={{ color: '#4a6880', fontSize: 12 }}>{fmtDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'familia',
      header: 'Tipo',
      cell: ({ getValue }) => <FamBadge fam={getValue() as string} />,
    },
    {
      accessorKey: 'volumen',
      header: 'Volumen',
      cell: ({ getValue }) => <span style={{ color: '#8ba5bf', fontSize: 12 }}>{fmtVol(getValue() as number | null)}</span>,
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
    <div style={{ overflowX: 'auto', borderRadius: 6, border: '1px solid #DDE6EF' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} style={{ background: '#EBF5FB' }}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{
                    padding: '10px 12px', textAlign: 'left', fontWeight: 600,
                    color: '#0D1B2A', fontSize: 12, cursor: 'pointer',
                    userSelect: 'none', whiteSpace: 'nowrap',
                    borderBottom: '2px solid #BDD0E0',
                  }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => {
            const isSelected = row.original.ticker === selectedTicker;
            return (
              <tr
                key={row.id}
                onClick={() => onSelect(row.original.ticker)}
                style={{
                  background: isSelected ? '#EBF5FB' : i % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                  cursor: 'pointer',
                  borderLeft: isSelected ? '3px solid #1F4E79' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#EBF5FB'; }}
                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'; }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ padding: '9px 12px', borderBottom: '1px solid #DDE6EF' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {bonds.length === 0 && (
            <tr>
              <td colSpan={10} style={{ padding: 24, textAlign: 'center', color: '#8ba5bf' }}>
                Cargando datos...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
