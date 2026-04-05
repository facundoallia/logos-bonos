'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useState, useEffect } from 'react';
import { HistoricalPoint, RangeId } from '@/lib/types';

interface Props {
  ticker: string | null;
  isUSD: boolean;
}

const RANGES: RangeId[] = ['1M', '3M', '6M', '1Y', 'MAX'];

function fmtAxisDate(d: string): string {
  const dt = new Date(d);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`;
}

export function PriceChart({ ticker, isUSD }: Props) {
  const [range, setRange] = useState<RangeId>('1Y');
  const [data, setData] = useState<HistoricalPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    const suffix = isUSD ? 'D' : '';
    setLoading(true);
    fetch(`/api/historical/${ticker}${suffix}?range=${range}`)
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker, range, isUSD]);

  const priceLabel = isUSD ? 'Precio USD' : 'Precio ARS';

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #DDE6EF',
      borderRadius: 6, padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0D1B2A' }}>
          Histórico de Precio {ticker ? `— ${ticker}${isUSD ? 'D' : ''}` : ''}
        </h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '4px 10px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
                border: '1px solid #DDE6EF',
                background: range === r ? '#1F4E79' : 'transparent',
                color: range === r ? '#fff' : '#4a6880',
                fontWeight: range === r ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!ticker ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8ba5bf', fontSize: 13 }}>
          Seleccioná un bono para ver el histórico
        </div>
      ) : loading ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8ba5bf', fontSize: 13 }}>
          Cargando...
        </div>
      ) : data.length === 0 ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8ba5bf', fontSize: 13 }}>
          Sin datos disponibles
        </div>
      ) : (
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EBF5FB" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#EBF5FB" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtAxisDate}
                tick={{ fontSize: 10, fill: '#8ba5bf' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v) => isUSD ? `$${v}` : v.toLocaleString('es-AR')}
                tick={{ fontSize: 10, fill: '#8ba5bf' }}
                width={55}
              />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleDateString('es-AR')}
                formatter={(v) => [isUSD ? `$${Number(v).toFixed(2)}` : Number(v).toLocaleString('es-AR'), priceLabel]}
                contentStyle={{ background: '#fff', border: '1px solid #DDE6EF', fontSize: 12 }}
              />
              <Area
                type="monotone" dataKey="c" name={priceLabel}
                stroke="#1F4E79" strokeWidth={2}
                fill="url(#priceGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
