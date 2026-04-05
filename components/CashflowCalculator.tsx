'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Line, LineChart, ComposedChart,
} from 'recharts';
import { EnrichedBond } from '@/lib/types';
import { generateCashflows, calculateDuration, getNextCouponDate } from '@/lib/cashflows';

interface Props {
  selectedBond: EnrichedBond | null;
  allBonds: EnrichedBond[];
}

const ARS_CATS = ['cer', 'tasa-fija', 'tamar', 'dollar-linked', 'badlar'];

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: '#F8FAFC', border: '1px solid #DDE6EF', borderRadius: 6,
      padding: '14px 16px', flex: 1, minWidth: 100, textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: '#8ba5bf', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#0D1B2A' }}>{value}</div>
    </div>
  );
}

export function CashflowCalculator({ selectedBond, allBonds }: Props) {
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [precioCompra, setPrecioCompra] = useState<string>('');
  const [montoInvertido, setMontoInvertido] = useState<string>('10000');

  // Sync with selected bond from table
  useEffect(() => {
    if (selectedBond) {
      setSelectedTicker(selectedBond.ticker);
      const price = selectedBond.precioUSD ?? selectedBond.precioARS;
      if (price) setPrecioCompra(price.toFixed(2));
    }
  }, [selectedBond]);

  const bond = allBonds.find((b) => b.ticker === selectedTicker) || selectedBond;
  const isARS = bond ? ARS_CATS.includes(bond.categoria) : false;

  const precioNum = parseFloat(precioCompra) || (bond?.precioUSD ?? bond?.precioARS ?? 0);
  const montoNum = parseFloat(montoInvertido.replace(/\./g, '')) || 10000;

  const cashflows = useMemo(() => {
    if (!bond || isARS) return [];
    return generateCashflows(bond, precioNum, montoNum);
  }, [bond, precioNum, montoNum, isARS]);

  const duration = useMemo(() => {
    if (!cashflows.length || !bond?.tirPct) return null;
    return calculateDuration(cashflows, precioNum, bond.tirPct);
  }, [cashflows, precioNum, bond]);

  const nextCF = getNextCouponDate(cashflows);
  const paridad = bond?.precioUSD ? `${bond.precioUSD.toFixed(2)}%` : '—';

  const totalRetorno = cashflows.reduce((s, cf) => s + cf.totalInv, 0);

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #DDE6EF',
      borderRadius: 6, padding: '20px 24px',
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0D1B2A' }}>
        Calculadora de Cashflows
      </h3>

      {/* Inputs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={{ fontSize: 12, color: '#4a6880', fontWeight: 500, display: 'block', marginBottom: 4 }}>
            Bono
          </label>
          <select
            value={selectedTicker}
            onChange={(e) => {
              setSelectedTicker(e.target.value);
              const b = allBonds.find((x) => x.ticker === e.target.value);
              if (b) {
                const price = b.precioUSD ?? b.precioARS;
                if (price) setPrecioCompra(price.toFixed(2));
              }
            }}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 4,
              border: '1px solid #DDE6EF', background: '#F8FAFC',
              fontSize: 13, color: '#0D1B2A',
            }}
          >
            <option value="">— Seleccionar bono —</option>
            {allBonds.map((b) => (
              <option key={b.ticker} value={b.ticker}>
                {b.ticker} — {b.nombre.split('—')[0].trim()}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ fontSize: 12, color: '#4a6880', fontWeight: 500, display: 'block', marginBottom: 4 }}>
            Precio compra (USD)
          </label>
          <input
            type="number" value={precioCompra}
            onChange={(e) => setPrecioCompra(e.target.value)}
            placeholder="62.91"
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 4,
              border: '1px solid #DDE6EF', background: '#F8FAFC',
              fontSize: 13, color: '#0D1B2A',
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: '#4a6880', fontWeight: 500, display: 'block', marginBottom: 4 }}>
            Monto a invertir (USD)
          </label>
          <input
            type="text" value={montoInvertido}
            onChange={(e) => setMontoInvertido(e.target.value)}
            placeholder="10000"
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 4,
              border: '1px solid #DDE6EF', background: '#F8FAFC',
              fontSize: 13, color: '#0D1B2A',
            }}
          />
        </div>
      </div>

      {isARS ? (
        <div style={{
          background: '#EBF5FB', border: '1px solid #BDD0E0', borderRadius: 6,
          padding: 16, marginBottom: 16, fontSize: 13, color: '#4a6880',
        }}>
          <strong style={{ color: '#1F4E79' }}>Nota:</strong> Los cashflows en pesos dependen de la evolución del índice{' '}
          {bond?.monedaCupon?.includes('CER') ? 'CER (inflación)' :
           bond?.monedaCupon?.includes('TAMAR') ? 'TAMAR' :
           bond?.monedaCupon?.includes('BADLAR') ? 'BADLAR' :
           bond?.monedaCupon?.includes('DL') ? 'tipo de cambio oficial (Dollar Linked)' : 'de referencia'}.
          {' '}Mostramos solo métricas de precio.
          {bond?.tirPct && (
            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              <MetricCard label="TIR / TNA" value={`${bond.tirPct.toFixed(2)}%`} />
              {bond.precioARS && (
                <MetricCard label="Precio" value={bond.precioARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })} />
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Metric cards */}
          {bond && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <MetricCard label="TIR" value={bond.tirPct !== null ? `${bond.tirPct.toFixed(2)}%` : '—'} />
              <MetricCard label="Duration" value={duration !== null ? `${duration} años` : '—'} />
              <MetricCard label="Paridad" value={bond.precioUSD ? `${bond.precioUSD.toFixed(2)}%` : '—'} />
              <MetricCard label="Próx. CF" value={nextCF || '—'} />
              {totalRetorno > 0 && (
                <MetricCard label="Total retorno" value={`$${Math.round(totalRetorno).toLocaleString('es-AR')}`} />
              )}
            </div>
          )}

          {cashflows.length > 0 && (
            <>
              {/* Bar chart */}
              <div style={{ height: 180, marginBottom: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cashflows} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#8ba5bf' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#8ba5bf' }}
                      tickFormatter={(v) => `$${v}`} />
                    <YAxis yAxisId="right" orientation="right"
                      tick={{ fontSize: 10, fill: '#8ba5bf' }}
                      tickFormatter={(v) => `${v}`} domain={[0, 100]} />
                    <Tooltip
                      formatter={(v, name) => [
                        name === 'VN Residual' ? Number(v).toFixed(2) : `$${Number(v).toFixed(4)}`, String(name)
                      ]}
                      contentStyle={{ background: '#fff', border: '1px solid #DDE6EF', fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="cupon" name="Cupón" stackId="a" fill="#1F4E79" />
                    <Bar yAxisId="left" dataKey="amort" name="Amort." stackId="a" fill="#D97706" />
                    <Line yAxisId="right" type="monotone" dataKey="vnResidual"
                      name="VN Residual" stroke="#4a6880" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Cashflow table */}
              <div style={{ overflowX: 'auto', borderRadius: 6, border: '1px solid #DDE6EF', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#EBF5FB' }}>
                      {['Fecha', 'Cupón', 'Amort.', 'Total', `Total (inv $${Math.round(montoNum).toLocaleString()})`, 'VN Residual'].map((h) => (
                        <th key={h} style={{
                          padding: '8px 12px', textAlign: 'left', fontWeight: 600,
                          color: '#0D1B2A', fontSize: 11, borderBottom: '2px solid #BDD0E0',
                          whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cashflows.map((cf, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #DDE6EF', fontWeight: 600 }}>{cf.fecha}</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #DDE6EF', color: '#1F4E79' }}>${cf.cupon.toFixed(4)}</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #DDE6EF', color: '#D97706' }}>${cf.amort.toFixed(4)}</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #DDE6EF', fontWeight: 600 }}>${cf.total.toFixed(4)}</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #DDE6EF', color: '#16A34A' }}>
                          ${cf.totalInv.toLocaleString('es-AR')}
                        </td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #DDE6EF', color: '#4a6880' }}>{cf.vnResidual.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!bond && (
            <div style={{
              textAlign: 'center', padding: 24, color: '#8ba5bf', fontSize: 13,
              background: '#F8FAFC', borderRadius: 6, border: '1px solid #DDE6EF',
            }}>
              Seleccioná un bono de la tabla para ver los cashflows
            </div>
          )}
        </>
      )}

      {/* Inline CTA */}
      <div style={{
        background: '#EBF5FB', border: '1px solid #BDD0E0', borderRadius: 6,
        padding: '14px 18px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 8,
      }}>
        <p style={{ margin: 0, fontSize: 13, color: '#4a6880' }}>
          ¿Querés armar una cartera de bonos personalizada?
        </p>
        <a
          href="https://wa.me/5493517414245?text=Hola!%20Quiero%20consultar%20sobre%20bonos%20argentinos."
          target="_blank" rel="noopener noreferrer"
          style={{
            background: '#1E4B78', color: '#fff', padding: '8px 16px',
            borderRadius: 4, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          Contactar a Logos →
        </a>
      </div>
    </div>
  );
}
