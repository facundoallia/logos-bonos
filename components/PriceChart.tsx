'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useState, useEffect } from 'react';
import { HistoricalPoint, RangeId, EnrichedBond } from '@/lib/types';
import { getPaymentDatesInRange } from '@/lib/paymentDates';

interface Props {
  selectedBond: EnrichedBond | null;
}

const RANGES: RangeId[] = ['1M', '3M', '6M', '1Y', 'MAX'];
const PAYMENT_COLORS = { C: '#1F4E79', A: '#D97706', 'C+A': '#16A34A' } as const;
const RANGE_DAYS: Record<RangeId, number> = {
  '1M': 30, '3M': 90, '6M': 180, '1Y': 365, MAX: 99999,
};

function fmtAxis(d: string): string {
  const dt = new Date(d);
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`;
}

export function PriceChart({ selectedBond }: Props) {
  const [range, setRange] = useState<RangeId>('1Y');
  const [data, setData] = useState<HistoricalPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const isUSD = selectedBond?.sufijoPrecioUSD === 'D';
  const histTicker = selectedBond?.histTicker ?? null;
  const hasHistorical = selectedBond?.hasHistorical ?? false;
  const ticker = selectedBond?.ticker ?? null;

  useEffect(() => {
    if (!ticker || !hasHistorical || !histTicker) {
      setData([]);
      return;
    }
    setLoading(true);
    fetch(`/api/historical/${histTicker}?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => { setData([]); setLoading(false); });
  }, [ticker, range, histTicker, hasHistorical]);

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - RANGE_DAYS[range]);
  const rangeEnd = new Date();

  const payments = selectedBond
    ? getPaymentDatesInRange(selectedBond, rangeStart, rangeEnd)
    : [];

  const priceLabel = isUSD ? 'Precio USD' : 'Precio ARS';

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #DDE6EF',
      borderRadius: 6, padding: 16,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8,
      }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0D1B2A' }}>
          Historico de Precio
          {ticker ? ` - ${histTicker}` : ''}
        </h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                border: '1px solid #DDE6EF',
                background: range === r ? '#1F4E79' : 'transparent',
                color: range === r ? '#fff' : '#4a6880',
                fontWeight: range === r ? 600 : 400,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!ticker ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8ba5bf', fontSize: 13 }}>
          Selecciona un bono para ver el historico
        </div>
      ) : !hasHistorical ? (
        <div style={{
          height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#8ba5bf', fontSize: 13, background: '#F8FAFC',
          borderRadius: 4, border: '1px dashed #DDE6EF',
        }}>
          Historico no disponible para este instrumento
        </div>
      ) : loading ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8ba5bf', fontSize: 13 }}>
          Cargando...
        </div>
      ) : data.length === 0 ? (
        <div style={{
          height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#8ba5bf', fontSize: 13, background: '#F8FAFC',
          borderRadius: 4, border: '1px dashed #DDE6EF',
        }}>
          Sin datos disponibles para el rango seleccionado
        </div>
      ) : (
        <>
          <div style={{ height: 195 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EBF5FB" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#EBF5FB" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
                <XAxis
                  dataKey="date" tickFormatter={fmtAxis}
                  tick={{ fontSize: 10, fill: '#8ba5bf' }} interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => isUSD
                    ? `$${v}`
                    : v.toLocaleString('es-AR', { maximumFractionDigits: 0 })
                  }
                  tick={{ fontSize: 10, fill: '#8ba5bf' }}
                  width={isUSD ? 46 : 62}
                />
                <Tooltip
                  labelFormatter={(label) => new Date(label).toLocaleDateString('es-AR')}
                  formatter={(v) => [
                    isUSD
                      ? `$${Number(v).toFixed(2)}`
                      : Number(v).toLocaleString('es-AR', { maximumFractionDigits: 0 }),
                    priceLabel,
                  ]}
                  contentStyle={{ background: '#fff', border: '1px solid #DDE6EF', fontSize: 11 }}
                />
                {payments.map((p) => (
                  <ReferenceLine
                    key={p.fecha}
                    x={p.fecha}
                    stroke={PAYMENT_COLORS[p.tipo]}
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{ value: p.tipo, position: 'top', fontSize: 9, fill: PAYMENT_COLORS[p.tipo] }}
                  />
                ))}
                <Area
                  type="monotone" dataKey="c" name={priceLabel}
                  stroke="#1F4E79" strokeWidth={2} fill="url(#priceGrad)" dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {payments.length > 0 && (
            <div style={{ fontSize: 10, color: '#4a6880', marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ color: '#1F4E79' }}>| C = Cupon</span>
              <span style={{ color: '#D97706' }}>| A = Amortizacion</span>
              <span style={{ color: '#16A34A' }}>| C+A = Cupon y Amortizacion</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
