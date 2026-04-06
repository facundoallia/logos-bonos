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
  cx?: number; cy?: number; payload?: ScatterPoint;
  onSelect: (t: string) => void;
}) {
  const { cx, cy, payload, onSelect } = props;
  if (!cx || !cy || !payload?.ticker) return null;
  const { spreadBps, isSelected } = payload;
  const color = spreadBps > 10 ? '#16A34A' : spreadBps < -10 ? '#DC2626' : '#D97706';
  return (
    <circle
      cx={cx} cy={cy} r={isSelected ? 9 : 6}
      fill={color} stroke={isSelected ? '#0D1B2A' : '#fff'}
      strokeWidth={isSelected ? 2 : 1.5}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(payload.ticker)}
    />
  );
}

export function YieldCurve({ bonds, onSelect, selectedTicker, title }: Props) {
  const points: BondPoint[] = bonds
    .filter((b) => b.md != null && b.tir != null && b.md > 0 && b.tir > 0)
    .map((b) => ({
      ticker: b.ticker,
      nombre: b.nombre,
      duration: b.md!,
      tir: b.tir! / 100,
    }));

  if (points.length === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#8ba5bf', fontSize: 13,
        background: '#F8FAFC', borderRadius: 4, border: '1px dashed #DDE6EF',
      }}>
        Cargando datos de curva...
      </div>
    );
  }

  if (points.length === 1) {
    const p = points[0];
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        background: '#F8FAFC', borderRadius: 4, border: '1px dashed #DDE6EF',
      }}>
        <div style={{ fontSize: 13, color: '#4a6880' }}>Un solo instrumento — no se grafica curva</div>
        <div style={{
          background: '#EBF5FB', border: '1px solid #BDD0E0',
          borderRadius: 4, padding: '8px 16px', fontSize: 13,
        }}>
          <strong>{p.ticker}</strong> | TIR: {(p.tir * 100).toFixed(2)}% | MD: {p.duration.toFixed(2)} anos
        </div>
      </div>
    );
  }

  const fit = fitYieldCurve(points);
  // Curve only within the data range (no extrapolation that causes axis overflow)
  const minD = Math.min(...points.map((p) => p.duration));
  const maxD = Math.max(...points.map((p) => p.duration));
  // Small padding but restricted to real data range
  const curveMin = Math.max(0, minD - 0.2);
  const curveMax = maxD + 0.2;
  const curveLine = generateCurveLine(fit, curveMin, curveMax);

  const scatterData: ScatterPoint[] = points.map((p) => ({
    duration: +p.duration.toFixed(3),
    tir: +(p.tir * 100).toFixed(2),
    ticker: p.ticker,
    nombre: p.nombre,
    spreadBps: calcSpreadBps(p, fit),
    isSelected: p.ticker === selectedTicker,
  }));

  // Y axis domain: use actual data + small padding, never below 0
  const allTirs = points.map((p) => p.tir * 100);
  const yMin = Math.max(0, Math.min(...allTirs) - 2);
  const yMax = Math.max(...allTirs) + 2;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title && (
        <div style={{ fontSize: 11, color: '#4a6880', marginBottom: 4, fontWeight: 500 }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: 10, color: '#4a6880', marginBottom: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: '#16A34A' }}>&#9679; Barato (+bps)</span>
        <span style={{ color: '#DC2626' }}>&#9679; Caro (-bps)</span>
        <span style={{ color: '#D97706' }}>&#9679; En linea</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 20, bottom: 28, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
            <XAxis
              dataKey="duration" type="number" name="Duration"
              domain={[Math.max(0, curveMin - 0.1), curveMax + 0.1]}
              tickFormatter={(v) => v.toFixed(1)}
              label={{ value: 'Duration (anos)', position: 'insideBottom', offset: -14, fontSize: 10, fill: '#8ba5bf' }}
              tick={{ fontSize: 10, fill: '#8ba5bf' }}
            />
            <YAxis
              dataKey="tir" type="number" name="TIR"
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fontSize: 10, fill: '#8ba5bf' }}
              domain={[yMin, yMax]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as ScatterPoint | undefined;
                if (!d?.ticker) {
                  const cp = payload[0]?.payload as { duration: number; curvaTir: number };
                  if (!cp?.curvaTir) return null;
                  return (
                    <div style={{ background: '#fff', border: '1px solid #DDE6EF', padding: '6px 10px', borderRadius: 4, fontSize: 11 }}>
                      <div style={{ color: '#4a6880' }}>Curva ajustada</div>
                      <div>MD: {cp.duration?.toFixed(2)}</div>
                      <div>TIR: {cp.curvaTir?.toFixed(2)}%</div>
                    </div>
                  );
                }
                const sc = d.spreadBps > 10 ? '#16A34A' : d.spreadBps < -10 ? '#DC2626' : '#D97706';
                return (
                  <div style={{ background: '#fff', border: '1px solid #DDE6EF', padding: '8px 12px', borderRadius: 4, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 3 }}>{d.ticker}</div>
                    <div>TIR: {d.tir?.toFixed(2)}%</div>
                    <div>Duration: {d.duration?.toFixed(2)} anos</div>
                    <div style={{ color: sc, marginTop: 3 }}>
                      {d.spreadBps > 0 ? '+' : ''}{d.spreadBps} bps vs curva
                      {d.spreadBps > 10 ? ' (barato)' : d.spreadBps < -10 ? ' (caro)' : ''}
                    </div>
                  </div>
                );
              }}
            />
            <Line
              data={curveLine} dataKey="curvaTir" dot={false}
              strokeWidth={2} stroke="#1F4E79" name="Curva ajustada" type="monotone"
            />
            <Scatter
              data={scatterData} name="Bonos"
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
