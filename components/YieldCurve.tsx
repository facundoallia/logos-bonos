'use client';
import { useState } from 'react';
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
  isExcluded: boolean;
}

function CustomDot(props: {
  cx?: number; cy?: number; payload?: ScatterPoint;
  onSelect: (t: string) => void;
}) {
  const { cx, cy, payload, onSelect } = props;
  if (!cx || !cy || !payload?.ticker) return null;
  const { spreadBps, isSelected, isExcluded } = payload;

  if (isExcluded) {
    return (
      <circle
        cx={cx} cy={cy} r={5}
        fill="#CBD5E1" stroke="#94A3B8"
        strokeWidth={1} strokeDasharray="3 2"
        style={{ cursor: 'pointer' }}
        onClick={() => onSelect(payload.ticker)}
      />
    );
  }

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
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const toggleExclude = (ticker: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const allPoints: BondPoint[] = bonds
    .filter((b) => b.md != null && b.tir != null && b.md > 0 && b.tir > 0)
    .map((b) => ({
      ticker: b.ticker,
      nombre: b.nombre,
      duration: b.md!,
      tir: b.tir! / 100,
    }));

  // Only active (non-excluded) points are used for curve fitting
  const activePoints = allPoints.filter((p) => !excluded.has(p.ticker));

  if (allPoints.length === 0) {
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

  if (allPoints.length === 1) {
    const p = allPoints[0];
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
          <strong>{p.ticker}</strong> | TIR: {(p.tir * 100).toFixed(2)}% | MD: {p.duration.toFixed(2)} años
        </div>
      </div>
    );
  }

  const fit = activePoints.length >= 2 ? fitYieldCurve(activePoints) : null;

  const minD = activePoints.length >= 2 ? Math.min(...activePoints.map((p) => p.duration)) : 0;
  const maxD = activePoints.length >= 2 ? Math.max(...activePoints.map((p) => p.duration)) : 1;
  const curveMin = Math.max(0, minD - 0.2);
  const curveMax = maxD + 0.2;
  const curveLine = fit ? generateCurveLine(fit, curveMin, curveMax) : [];

  // Scatter uses ALL points (active + excluded), colour-coded differently
  const scatterData: ScatterPoint[] = allPoints.map((p) => {
    const isExcl = excluded.has(p.ticker);
    const spreadBps = fit && !isExcl ? calcSpreadBps(p, fit) : 0;
    return {
      duration: +p.duration.toFixed(3),
      tir: +(p.tir * 100).toFixed(2),
      ticker: p.ticker,
      nombre: p.nombre,
      spreadBps,
      isSelected: p.ticker === selectedTicker,
      isExcluded: isExcl,
    };
  });

  // Axes scale to ACTIVE (non-excluded) points only — excluded dots go out of view
  const visiblePoints = activePoints.length >= 1 ? activePoints : allPoints;
  const visibleTirs = visiblePoints.map((p) => p.tir * 100);
  const yMin = Math.max(0, Math.min(...visibleTirs) - 2);
  const yMax = Math.max(...visibleTirs) + 2;
  const visibleDurs = visiblePoints.map((p) => p.duration);
  const xMin = Math.max(0, Math.min(...visibleDurs) * 0.9);
  const xMax = Math.max(...visibleDurs) * 1.1;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title && (
        <div style={{ fontSize: 11, color: '#4a6880', marginBottom: 4, fontWeight: 500 }}>
          {title}
        </div>
      )}

      {/* Colour legend */}
      <div style={{ fontSize: 10, color: '#4a6880', marginBottom: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: '#16A34A' }}>&#9679; Barato (+bps)</span>
        <span style={{ color: '#DC2626' }}>&#9679; Caro (-bps)</span>
        <span style={{ color: '#D97706' }}>&#9679; En linea</span>
        <span style={{ color: '#94A3B8' }}>&#9702; Excluido</span>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 20, bottom: 28, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
            <XAxis
              dataKey="duration" type="number" name="Duration"
              domain={[xMin, xMax]}
              tickFormatter={(v) => v.toFixed(1)}
              label={{ value: 'Duration (años)', position: 'insideBottom', offset: -14, fontSize: 10, fill: '#8ba5bf' }}
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
                if (d.isExcluded) {
                  return (
                    <div style={{ background: '#fff', border: '1px solid #DDE6EF', padding: '8px 12px', borderRadius: 4, fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: '#94A3B8' }}>{d.ticker} (excluido)</div>
                      <div>TIR: {d.tir?.toFixed(2)}%</div>
                      <div>Duration: {d.duration?.toFixed(2)} años</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>
                        Clic en leyenda para re-incluir
                      </div>
                    </div>
                  );
                }
                const sc = d.spreadBps > 10 ? '#16A34A' : d.spreadBps < -10 ? '#DC2626' : '#D97706';
                return (
                  <div style={{ background: '#fff', border: '1px solid #DDE6EF', padding: '8px 12px', borderRadius: 4, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 3 }}>{d.ticker}</div>
                    <div>TIR: {d.tir?.toFixed(2)}%</div>
                    <div>Duration: {d.duration?.toFixed(2)} años</div>
                    <div style={{ color: sc, marginTop: 3 }}>
                      {d.spreadBps > 0 ? '+' : ''}{d.spreadBps} bps vs curva
                      {d.spreadBps > 10 ? ' (barato)' : d.spreadBps < -10 ? ' (caro)' : ''}
                    </div>
                  </div>
                );
              }}
            />
            {curveLine.length > 0 && (
              <Line
                data={curveLine} dataKey="curvaTir" dot={false}
                strokeWidth={2} stroke="#1F4E79" name="Curva ajustada" type="monotone"
              />
            )}
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

      {/* Interactive toggle legend — click to include/exclude from curve */}
      {allPoints.length > 1 && (
        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {allPoints.map((p) => {
            const isExcl = excluded.has(p.ticker);
            return (
              <button
                key={p.ticker}
                onClick={() => toggleExclude(p.ticker)}
                title={isExcl ? 'Clic para re-incluir en la curva' : 'Clic para excluir de la curva'}
                style={{
                  padding: '2px 7px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
                  border: `1px solid ${isExcl ? '#CBD5E1' : '#BDD0E0'}`,
                  background: isExcl ? '#F1F5F9' : '#EBF5FB',
                  color: isExcl ? '#94A3B8' : '#1F4E79',
                  textDecoration: isExcl ? 'line-through' : 'none',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {p.ticker}
              </button>
            );
          })}
          {excluded.size > 0 && (
            <button
              onClick={() => setExcluded(new Set())}
              style={{
                padding: '2px 7px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
                border: '1px solid #DC2626', background: 'transparent',
                color: '#DC2626', fontWeight: 500,
              }}
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
