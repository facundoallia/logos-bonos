'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { EnrichedBond } from '@/lib/types';

interface Props {
  bonds: EnrichedBond[];
  subTab?: string;
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
}

function fmtDate(s: string): string {
  return s.slice(0, 4);
}

interface ChartPoint {
  ticker: string;
  year: string;
  tir: number | null;
  series?: string;
}

export function YieldCurve({ bonds, subTab, selectedTicker, onSelect }: Props) {
  const hasTir = bonds.some((b) => b.tirPct !== null);

  if (!hasTir) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 200, color: '#8ba5bf', fontSize: 13,
      }}>
        Cargando curva de rendimientos...
      </div>
    );
  }

  if (subTab === 'gd' || subTab === 'al') {
    // Hard dollar — two lines: GD series and AL series
    const gdBonds = bonds.filter((b) => b.categoria === 'hard-dollar-gd' && b.tirPct !== null);
    const alBonds = bonds.filter((b) => b.categoria === 'hard-dollar-al' && b.tirPct !== null);

    const allTickers = [...new Set([...gdBonds.map((b) => b.ticker), ...alBonds.map((b) => b.ticker)])];
    const gdMap = new Map(gdBonds.map((b) => [b.ticker, b]));
    const alMap = new Map(alBonds.map((b) => [b.ticker, b]));

    const gdPoints = gdBonds
      .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento))
      .map((b) => ({ ticker: b.ticker, year: fmtDate(b.vencimiento), tir: b.tirPct }));

    const alPoints = alBonds
      .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento))
      .map((b) => ({ ticker: b.ticker, year: fmtDate(b.vencimiento), tir: b.tirPct }));

    const CustomDot = (props: { cx?: number; cy?: number; payload?: ChartPoint }) => {
      const { cx, cy, payload } = props;
      if (!cx || !cy || !payload) return null;
      const isSelected = payload.ticker === selectedTicker;
      return (
        <circle
          cx={cx} cy={cy} r={isSelected ? 6 : 4}
          fill={isSelected ? '#D97706' : '#1F4E79'}
          stroke="#fff" strokeWidth={isSelected ? 2 : 1}
          style={{ cursor: 'pointer' }}
          onClick={() => onSelect(payload.ticker)}
        />
      );
    };

    const CustomDotAL = (props: { cx?: number; cy?: number; payload?: ChartPoint }) => {
      const { cx, cy, payload } = props;
      if (!cx || !cy || !payload) return null;
      const isSelected = payload.ticker === selectedTicker;
      return (
        <circle
          cx={cx} cy={cy} r={isSelected ? 6 : 4}
          fill={isSelected ? '#1F4E79' : '#D97706'}
          stroke="#fff" strokeWidth={isSelected ? 2 : 1}
          style={{ cursor: 'pointer' }}
          onClick={() => onSelect(payload.ticker)}
        />
      );
    };

    return (
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
            <XAxis dataKey="year" type="category" allowDuplicatedCategory={false}
              tick={{ fontSize: 11, fill: '#8ba5bf' }} />
            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#8ba5bf' }}
              domain={['auto', 'auto']} />
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(2)}%`, 'TIR']}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.ticker || label}
              contentStyle={{ background: '#fff', border: '1px solid #DDE6EF', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              data={gdPoints} dataKey="tir" name="Globales GD (NY)"
              stroke="#1F4E79" strokeWidth={2} dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#1F4E79' }}
            />
            <Line
              data={alPoints} dataKey="tir" name="Bonares AL (ARG)"
              stroke="#D97706" strokeWidth={2} dot={<CustomDotAL />}
              activeDot={{ r: 6, fill: '#D97706' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Generic single-line curve
  const sorted = [...bonds]
    .filter((b) => b.tirPct !== null)
    .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento))
    .map((b) => ({ ticker: b.ticker, year: fmtDate(b.vencimiento), tir: b.tirPct }));

  const CustomDot = (props: { cx?: number; cy?: number; payload?: ChartPoint }) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return null;
    const isSelected = payload.ticker === selectedTicker;
    return (
      <circle
        cx={cx} cy={cy} r={isSelected ? 6 : 4}
        fill={isSelected ? '#D97706' : '#1F4E79'}
        stroke="#fff" strokeWidth={isSelected ? 2 : 1}
        style={{ cursor: 'pointer' }}
        onClick={() => onSelect(payload.ticker)}
      />
    );
  };

  return (
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sorted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#8ba5bf' }} />
          <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#8ba5bf' }}
            domain={['auto', 'auto']} />
          <Tooltip
            formatter={(v) => [`${Number(v).toFixed(2)}%`, 'TIR']}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.ticker || label}
            contentStyle={{ background: '#fff', border: '1px solid #DDE6EF', fontSize: 12 }}
          />
          <Line
            dataKey="tir" name="TIR" stroke="#1F4E79" strokeWidth={2}
            dot={<CustomDot />} activeDot={{ r: 6, fill: '#1F4E79' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
