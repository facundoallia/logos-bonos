'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { EnrichedBond } from '@/lib/types';
import { generateCashflows, calculateDuration, getNextCouponDate } from '@/lib/cashflows';
import { BondSelector } from './BondSelector';

interface Props {
  selectedBond: EnrichedBond | null;
  allBonds: EnrichedBond[];
}

const ARS_CATS = ['cer', 'tasa-fija', 'tamar', 'dollar-linked', 'badlar'];
const USD_CATS = ['hard-dollar-gd', 'hard-dollar-al', 'bopreal'];

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: '#F8FAFC', border: '1px solid #DDE6EF', borderRadius: 6,
      padding: '12px 14px', flex: 1, minWidth: 90, textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, color: '#8ba5bf', marginBottom: 2, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#0D1B2A' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#4a6880', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function CashflowCalculator({ selectedBond, allBonds }: Props) {
  const [selectedTicker, setSelectedTicker] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [montoInvertido, setMontoInvertido] = useState('10000');
  const [inflacionProyectada, setInflacionProyectada] = useState(50);

  useEffect(() => {
    if (selectedBond) {
      setSelectedTicker(selectedBond.ticker);
      const price = selectedBond.precioUSD ?? selectedBond.precioARS;
      if (price) setPrecioCompra(price.toFixed(2));
    }
  }, [selectedBond]);

  const handleTickerChange = (t: string) => {
    setSelectedTicker(t);
    const b = allBonds.find((x) => x.ticker === t);
    if (b) {
      const price = b.precioUSD ?? b.precioARS;
      if (price) setPrecioCompra(price.toFixed(2));
    }
  };

  const bond = allBonds.find((b) => b.ticker === selectedTicker) ?? selectedBond;
  const isUSD = bond ? USD_CATS.includes(bond.categoria) : false;
  const isCER = bond?.categoria === 'cer';
  const isTasaFija = bond?.categoria === 'tasa-fija';
  const isARS = bond ? ARS_CATS.includes(bond.categoria) : false;

  const precioNum = parseFloat(precioCompra) || (bond?.precioUSD ?? bond?.precioARS ?? 0);
  const montoNum = parseFloat(montoInvertido.replace(/\./g, '').replace(',', '.')) || 10000;

  // Build a minimal BondConfig for the cashflow generator
  const bondConfig = useMemo(() => {
    if (!bond) return null;
    return {
      ticker: bond.ticker,
      nombre: bond.nombre,
      categoria: bond.categoria,
      sufijoPrecioUSD: bond.sufijoPrecioUSD,
      vencimiento: bond.vencimiento ?? '',
      amortizacion: bond.amortizacion ?? 'Bullet',
      cuponAnualPct: bond.tir ? bond.tir / 100 : 0,
      frecuenciaCupon: bond.frecuenciaCupon ?? 'Zero coupon',
      monedaCupon: bond.monedaCupon ?? 'ARS',
      monedaCapital: isUSD ? 'USD' : 'ARS',
      legislacion: '',
      familia: '',
    };
  }, [bond, isUSD]);

  const cashflows = useMemo(() => {
    if (!bondConfig || isARS) return [];
    return generateCashflows(bondConfig as Parameters<typeof generateCashflows>[0], precioNum, montoNum);
  }, [bondConfig, precioNum, montoNum, isARS]);

  // Tasa fija: exact calculation
  const tasaFijaResult = useMemo(() => {
    if (!isTasaFija || !bond?.tem || !bond.vencimiento) return null;
    const hoy = new Date();
    const vto = new Date(bond.vencimiento);
    const meses = Math.max(
      0,
      (vto.getFullYear() - hoy.getFullYear()) * 12 + vto.getMonth() - hoy.getMonth()
    );
    const temFrac = bond.tem / 100;
    const vnComprado = montoNum / (precioNum / 100);
    const cfFinal = vnComprado * Math.pow(1 + temFrac, meses);
    return {
      cfFinal: +cfFinal.toFixed(2),
      ganancia: +(cfFinal - montoNum).toFixed(2),
      retornoPct: +((cfFinal / montoNum - 1) * 100).toFixed(2),
      meses,
      tem: bond.tem,
    };
  }, [isTasaFija, bond, precioNum, montoNum]);

  const duration = useMemo(() => {
    if (!cashflows.length || !bond?.tir) return null;
    return calculateDuration(cashflows, precioNum, bond.tir);
  }, [cashflows, precioNum, bond]);

  const nextCF = getNextCouponDate(cashflows);
  const totalRetorno = cashflows.reduce((s, cf) => s + cf.totalInv, 0);

  const priceSubtext = isUSD
    ? 'Precio en USD (por cada 100 VN)'
    : 'Precio en ARS (por cada 100 VN)';

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
        <div style={{ flex: 2, minWidth: 200 }}>
          <label style={{ fontSize: 12, color: '#4a6880', fontWeight: 500, display: 'block', marginBottom: 4 }}>
            Bono
          </label>
          <BondSelector bonds={allBonds} value={selectedTicker} onChange={handleTickerChange} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ fontSize: 12, color: '#4a6880', fontWeight: 500, display: 'block', marginBottom: 4 }}>
            Precio de compra
          </label>
          <input
            type="number"
            value={precioCompra}
            onChange={(e) => setPrecioCompra(e.target.value)}
            placeholder="62.91"
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 4,
              border: '1px solid #DDE6EF', background: '#F8FAFC',
              fontSize: 13, color: '#0D1B2A',
            }}
          />
          {bond && (
            <div style={{ fontSize: 10, color: '#8ba5bf', marginTop: 2 }}>{priceSubtext}</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 130 }}>
          <label style={{ fontSize: 12, color: '#4a6880', fontWeight: 500, display: 'block', marginBottom: 4 }}>
            Monto a invertir
          </label>
          <input
            type="text"
            value={montoInvertido}
            onChange={(e) => setMontoInvertido(e.target.value)}
            placeholder="10000"
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 4,
              border: '1px solid #DDE6EF', background: '#F8FAFC',
              fontSize: 13, color: '#0D1B2A',
            }}
          />
          {bond && (
            <div style={{ fontSize: 10, color: '#8ba5bf', marginTop: 2 }}>
              {isUSD ? 'USD' : 'ARS'}
            </div>
          )}
        </div>
      </div>

      {/* Tasa Fija: exact calculation */}
      {isTasaFija && tasaFijaResult && (
        <div style={{
          background: '#F8FAFC', border: '1px solid #DDE6EF',
          borderRadius: 6, padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <MetricCard
              label="TIR"
              value={bond?.tir ? `${bond.tir.toFixed(2)}%` : '—'}
            />
            <MetricCard
              label="TEM"
              value={bond?.tem ? `${bond.tem.toFixed(4)}%` : '—'}
              sub="mensual"
            />
            <MetricCard
              label="TNA"
              value={bond?.tna ? `${bond.tna.toFixed(2)}%` : '—'}
            />
            <MetricCard
              label="MD"
              value={bond?.md ? `${bond.md.toFixed(2)}` : '—'}
              sub="anos"
            />
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 8, fontSize: 13,
          }}>
            <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
              <span style={{ color: '#8ba5bf', fontSize: 11 }}>Monto invertido</span>
              <div style={{ fontWeight: 700, color: '#0D1B2A', fontSize: 16, marginTop: 2 }}>
                ${montoNum.toLocaleString('es-AR')} ARS
              </div>
            </div>
            <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
              <span style={{ color: '#8ba5bf', fontSize: 11 }}>Meses restantes</span>
              <div style={{ fontWeight: 700, color: '#0D1B2A', fontSize: 16, marginTop: 2 }}>
                {tasaFijaResult.meses}
              </div>
            </div>
            <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
              <span style={{ color: '#8ba5bf', fontSize: 11 }}>Cobro al vencimiento</span>
              <div style={{ fontWeight: 700, color: '#16A34A', fontSize: 16, marginTop: 2 }}>
                ${tasaFijaResult.cfFinal.toLocaleString('es-AR')} ARS
              </div>
            </div>
            <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
              <span style={{ color: '#8ba5bf', fontSize: 11 }}>Ganancia</span>
              <div style={{ fontWeight: 700, color: '#16A34A', fontSize: 16, marginTop: 2 }}>
                ${tasaFijaResult.ganancia.toLocaleString('es-AR')}
                {' '}
                <span style={{ fontSize: 12 }}>(+{tasaFijaResult.retornoPct.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#8ba5bf', marginTop: 8 }}>
            TEM aplicada: {tasaFijaResult.tem.toFixed(4)}% mensual |
            Vencimiento: {fmtDate(bond?.vencimiento ?? null)}
          </div>
        </div>
      )}

      {/* CER: inflation input */}
      {isCER && bond && (
        <div style={{
          background: '#EBF5FB', border: '1px solid #BDD0E0',
          borderRadius: 6, padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontWeight: 600, color: '#0D1B2A', marginBottom: 8, fontSize: 14 }}>
            Retorno estimado (CER)
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <MetricCard
              label="TIR real (ex CER)"
              value={bond.tir ? `${bond.tir.toFixed(2)}%` : '—'}
            />
            <MetricCard
              label="MD"
              value={bond.md ? `${bond.md.toFixed(2)}` : '—'}
              sub="anos"
            />
          </div>
          <div style={{ color: '#4a6880', fontSize: 13, marginBottom: 8 }}>
            TIR real: <strong>{bond.tir?.toFixed(2)}%</strong> anual (sobre la inflacion)
          </div>
          <label style={{ fontSize: 13, color: '#4a6880' }}>
            Tu proyeccion de inflacion anual:
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input
              type="number"
              value={inflacionProyectada}
              onChange={(e) => setInflacionProyectada(+e.target.value)}
              style={{
                width: 80, border: '1px solid #DDE6EF', borderRadius: 4,
                padding: '6px 8px', fontSize: 13,
              }}
            />
            <span style={{ alignSelf: 'center', color: '#4a6880', fontSize: 13 }}>% anual</span>
          </div>
          {inflacionProyectada > 0 && bond.tir != null && (
            <div style={{ marginTop: 10, fontWeight: 600, color: '#0D1B2A', fontSize: 15 }}>
              Retorno nominal estimado: ~{(bond.tir + inflacionProyectada).toFixed(1)}% anual
            </div>
          )}
          <div style={{ fontSize: 11, color: '#8ba5bf', marginTop: 8 }}>
            El ajuste CER se aplica diariamente sobre el capital.
            El retorno real esta garantizado por la TIR del bono.
          </div>
        </div>
      )}

      {/* Hard Dollar / BOPREAL cashflows */}
      {isUSD && !isCER && (
        <>
          {bond && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <MetricCard
                label="TIR"
                value={bond.tir ? `${bond.tir.toFixed(2)}%` : '—'}
              />
              <MetricCard
                label="TEM"
                value={bond.tem ? `${bond.tem.toFixed(4)}%` : '—'}
              />
              <MetricCard
                label="TNA"
                value={bond.tna ? `${bond.tna.toFixed(2)}%` : '—'}
              />
              <MetricCard
                label="Duration"
                value={duration !== null ? `${duration} a` : '—'}
              />
              <MetricCard
                label="Paridad"
                value={bond.precioUSD ? `${bond.precioUSD.toFixed(2)}%` : '—'}
              />
              <MetricCard
                label="Prox. CF"
                value={nextCF || '—'}
              />
            </div>
          )}

          {cashflows.length > 0 && (
            <>
              <div style={{ height: 180, marginBottom: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cashflows} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#8ba5bf' }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10, fill: '#8ba5bf' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10, fill: '#8ba5bf' }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      formatter={(v, name) => [
                        name === 'VN Residual'
                          ? Number(v).toFixed(2)
                          : `$${Number(v).toFixed(4)}`,
                        String(name),
                      ]}
                      contentStyle={{ background: '#fff', border: '1px solid #DDE6EF', fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="cupon" name="Cupon" stackId="a" fill="#1F4E79" />
                    <Bar yAxisId="left" dataKey="amort" name="Amort." stackId="a" fill="#D97706" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="vnResidual"
                      name="VN Residual"
                      stroke="#4a6880"
                      dot={false}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                overflowX: 'auto', borderRadius: 6,
                border: '1px solid #DDE6EF', marginBottom: 14,
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#EBF5FB' }}>
                      {['Fecha', 'Cupon', 'Amort.', 'Total', `Total (inv $${Math.round(montoNum).toLocaleString()})`, 'VN Residual'].map((h) => (
                        <th key={h} style={{
                          padding: '7px 10px', textAlign: 'left', fontWeight: 600,
                          color: '#0D1B2A', fontSize: 10, borderBottom: '2px solid #BDD0E0',
                          whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cashflows.map((cf, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', fontWeight: 600 }}>{cf.fecha}</td>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', color: '#1F4E79' }}>${cf.cupon.toFixed(4)}</td>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', color: '#D97706' }}>${cf.amort.toFixed(4)}</td>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', fontWeight: 600 }}>${cf.total.toFixed(4)}</td>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', color: '#16A34A' }}>
                          ${cf.totalInv.toLocaleString('es-AR')}
                        </td>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', color: '#4a6880' }}>{cf.vnResidual.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalRetorno > 0 && (
                <div style={{ fontSize: 12, color: '#4a6880', marginBottom: 8 }}>
                  Total retorno estimado sobre inversion:
                  {' '}<strong style={{ color: '#16A34A' }}>${Math.round(totalRetorno).toLocaleString('es-AR')}</strong>
                  {' '}({((totalRetorno / montoNum - 1) * 100).toFixed(1)}%)
                </div>
              )}
            </>
          )}

          {!bond && (
            <div style={{
              textAlign: 'center', padding: 24, color: '#8ba5bf',
              fontSize: 13, background: '#F8FAFC', borderRadius: 6,
            }}>
              Selecciona un bono para ver los cashflows
            </div>
          )}
        </>
      )}

      {/* Other ARS (TAMAR, DL, BADLAR): basic metrics only */}
      {isARS && !isCER && !isTasaFija && bond && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <MetricCard label="TIR" value={bond.tir ? `${bond.tir.toFixed(2)}%` : '—'} />
          <MetricCard label="TEM" value={bond.tem ? `${bond.tem.toFixed(4)}%` : '—'} />
          <MetricCard label="TNA" value={bond.tna ? `${bond.tna.toFixed(2)}%` : '—'} />
          <MetricCard label="MD" value={bond.md ? `${bond.md.toFixed(2)}` : '—'} />
          {bond.precioARS && (
            <MetricCard
              label="Precio ARS"
              value={bond.precioARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            />
          )}
        </div>
      )}
    </div>
  );
}
