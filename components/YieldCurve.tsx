'use client';
import {
  ComposedChart, Scatter, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { EnrichedBond } from '@/lib/types';
import { fitYieldCurve, generateCurveLine, calcSpreadBps, BondPoint } from '@/lib/yieldCurve';

interface Props {
  bonds: EnrichedBond[];
  onSelect: (ticker: string) => void;
  selectedTicker: string | null;
  title?: string;
}

interface ScatterPoint {
  duration: number;
  tir: number;
  ticker: string;
  nombre: string;
  spreadBps: number;
  isSelected: boolean;
}

function CustomDot(props: {
  cx?: number;
  cy?: number;
  payload?: ScatterPoint;
  onSelect: (t: string) => void;
}) {
  const { cx, cy, payload, onSelect } = props;
  if (!cx || !cy || !payload?.ticker) return null;
  const { spreadBps, isSelected } = payload;
  const color =
    spreadBps > 10 ? '#16A34A' : spreadBps < -10 ? '#DC2626' : '#D97706';
  const r = isSelected ? 9 : 6;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={color}
      stroke={isSelected ? '#0D1B2A' : '#fff'}
      strokeWidth={isSelected ? 2 : 1.5}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(payload.ticker)}
    />
  );
}

export function YieldCurve({ bonds, onSelect, selectedTicker, title }: Props) {
  const points: BondPoint[] = bonds
    .filter((b) => b.md != null && b.tir != null && b.md > 0)
    .map((b) => ({
      ticker: b.ticker,
      nombre: b.nombre,
      duration: b.md!,
      tir: b.tir! / 100,
    }));

  if (points.length < 2) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#8ba5bf', fontSize: 13,
      }}>
        Datos insuficientes para graficar curva
      </div>
    );
  }

  const fit = fitYieldCurve(points);
  const minD = Math.max(0, Math.min(...points.map((p) => p.duration)) - 0.3);
  const maxD = Math.max(...points.map((p) => p.duration)) + 0.4;
  const curveLine = generateCurveLine(fit, minD, maxD);

  const scatterData: ScatterPoint[] = points.map((p) => ({
    duration: +p.duration.toFixed(3),
    tir: +(p.tir * 100).toFixed(2),
    ticker: p.ticker,
    nombre: p.nombre,
    spreadBps: calcSpreadBps(p, fit),
    isSelected: p.ticker === selectedTicker,
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title && (
        <div style={{ fontSize: 12, color: '#4a6880', marginBottom: 6, fontWeight: 500 }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: 11, color: '#4a6880', marginBottom: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ color: '#16A34A' }}>&#9679; Barato (sobre curva)</span>
        <span style={{ color: '#DC2626' }}>&#9679; Caro (bajo curva)</span>
        <span style={{ color: '#D97706' }}>&#9679; En linea</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 16, bottom: 28, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
            <XAxis
              dataKey="duration"
              type="number"
              name="Duration"
              domain={[minD, maxD]}
              tickFormatter={(v) => v.toFixed(1)}
              label={{
                value: 'Duration (anos)',
                position: 'insideBottom',
                offset: -14,
                fontSize: 10,
                fill: '#8ba5bf',
              }}
              tick={{ fontSize: 10, fill: '#8ba5bf' }}
            />
            <YAxis
              dataKey="tir"
              type="number"
              name="TIR"
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fontSize: 10, fill: '#8ba5bf' }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as ScatterPoint | undefined;
                if (!d?.ticker) {
                  // curve point
                  const cp = payload[0]?.payload as { duration: number; curvaTir: number };
                  if (!cp?.curvaTir) return null;
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #DDE6EF',
                      padding: '6px 10px', borderRadius: 4, fontSize: 11,
                    }}>
                      <div style={{ color: '#4a6880' }}>Curva ajustada</div>
                      <div>Duration: {cp.duration?.toFixed(2)}</div>
                      <div>TIR: {cp.curvaTir?.toFixed(2)}%</div>
                    </div>
                  );
                }
                const spreadColor =
                  d.spreadBps > 10 ? '#16A34A' : d.spreadBps < -10 ? '#DC2626' : '#D97706';
                return (
                  <div style={{
                    background: '#fff', border: '1px solid #DDE6EF',
                    padding: '8px 12px', borderRadius: 4, fontSize: 12,
                  }}>
                    <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 3 }}>
                      {d.ticker}
                    </div>
                    <div>TIR: {d.tir?.toFixed(2)}%</div>
                    <div>Duration: {d.duration?.toFixed(2)} anos</div>
                    <div style={{ color: spreadColor, marginTop: 3 }}>
                      {d.spreadBps > 0 ? '+' : ''}{d.spreadBps} bps vs curva
                      {d.spreadBps > 10 ? ' (barato)' : d.spreadBps < -10 ? ' (caro)' : ' (en linea)'}
                    </div>
                  </div>
                );
              }}
            />
            <Line
              data={curveLine}
              dataKey="curvaTir"
              dot={false}
              strokeWidth={2}
              stroke="#1F4E79"
              name="Curva ajustada"
              type="monotone"
            />
            <Scatter
              data={scatterData}
              name="Bonos"
              shape={(p: object) => (
                <CustomDot
                  {...(p as { cx?: number; cy?: number; payload?: ScatterPoint })}
                  onSelect={onSelect}
                />
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
