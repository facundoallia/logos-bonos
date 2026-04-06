'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart,
} from 'recharts';
import { EnrichedBond } from '@/lib/types';
import { generateCashflows, calculateDuration, getNextCouponDate } from '@/lib/cashflows';
import { BondSelector } from './BondSelector';

interface Props {
  selectedBond: EnrichedBond | null;
  allBonds: EnrichedBond[];
}

const USD_CATS = ['hard-dollar-gd', 'hard-dollar-al', 'bopreal'];

function MetricCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div style={{
      background: '#F8FAFC', border: '1px solid #DDE6EF', borderRadius: 6,
      padding: '10px 12px', flex: 1, minWidth: 85, textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, color: '#8ba5bf', marginBottom: 2, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: color ?? '#0D1B2A' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#4a6880', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#EBF5FB', border: '1px solid #BDD0E0', borderRadius: 6,
      padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#4a6880',
    }}>
      {children}
    </div>
  );
}

function fmtARS(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  // Parse as local date to avoid UTC-offset month drift
  const [y, m, d] = s.split('-').map(Number);
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[(m ?? 1) - 1]} ${y}`;
}

function monthsUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const hoy = new Date();
  const [y, m] = dateStr.split('-').map(Number);
  return Math.max(0, (y - hoy.getFullYear()) * 12 + (m - 1) - hoy.getMonth());
}

export function CashflowCalculator({ selectedBond, allBonds }: Props) {
  const [selectedTicker, setSelectedTicker] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [montoInvertido, setMontoInvertido] = useState('10000');
  const [inflacionAnual, setInflacionAnual] = useState(35);

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

  const precioNum = parseFloat(precioCompra) || (bond?.precioUSD ?? bond?.precioARS ?? 0);
  const montoNum = parseFloat(montoInvertido.replace(/\./g, '').replace(',', '.')) || 10000;
  const priceSubtext = isUSD ? 'USD por cada 100 VN' : 'ARS por cada 100 VN';

  // ─── TASA FIJA ─────────────────────────────────────────────────────────────
  const tasaFijaResult = useMemo(() => {
    if (!isTasaFija || !bond?.tem || !bond.vencimiento) return null;
    const meses = monthsUntil(bond.vencimiento);
    const temFrac = bond.tem / 100;
    const cfFinal = montoNum * Math.pow(1 + temFrac, meses);
    const ganancia = cfFinal - montoNum;
    const retornoPct = (cfFinal / montoNum - 1) * 100;
    return { cfFinal: +cfFinal.toFixed(2), ganancia: +ganancia.toFixed(2), retornoPct: +retornoPct.toFixed(2), meses };
  }, [isTasaFija, bond, montoNum]);

  // Cashflow config for Tasa Fija ARS
  const tasaFijaBondConfig = useMemo(() => {
    if (!isTasaFija || !bond) return null;
    const isZeroCoupon =
      !bond.couponPct ||
      bond.couponPct === 0 ||
      bond.frecuenciaCupon === 'Zero coupon' ||
      bond.ticker.startsWith('S'); // Letras always zero coupon
    return {
      ticker: bond.ticker,
      nombre: bond.nombre,
      categoria: bond.categoria,
      sufijoPrecioUSD: bond.sufijoPrecioUSD,
      vencimiento: bond.vencimiento ?? '',
      amortizacion: 'Bullet',
      cuponAnualPct: isZeroCoupon ? 0 : (bond.couponPct ?? 0) / 100,
      frecuenciaCupon: isZeroCoupon ? 'Zero coupon' : (bond.frecuenciaCupon ?? 'Semi-annual'),
      monedaCupon: 'ARS',
      monedaCapital: 'ARS',
    };
  }, [isTasaFija, bond]);

  const tasaFijaCashflows = useMemo(() => {
    if (!tasaFijaBondConfig) return [];
    return generateCashflows(
      tasaFijaBondConfig as Parameters<typeof generateCashflows>[0],
      precioNum,
      montoNum
    );
  }, [tasaFijaBondConfig, precioNum, montoNum]);

  // ─── CER ───────────────────────────────────────────────────────────────────
  const cerResult = useMemo(() => {
    if (!isCER || !bond?.tir || !bond.vencimiento) return null;
    const meses = monthsUntil(bond.vencimiento);
    if (meses === 0) return null;
    const inflaMensual = Math.pow(1 + inflacionAnual / 100, 1 / 12) - 1;
    const realMensual  = Math.pow(1 + bond.tir / 100, 1 / 12) - 1;
    const nominalMensual = (1 + inflaMensual) * (1 + realMensual) - 1;
    let acumuladoCER = montoNum;
    let acumuladoReal = montoNum;
    const bars: { mes: number; cerComponent: number; realComponent: number; total: number }[] = [];
    for (let m = 1; m <= meses; m++) {
      acumuladoCER *= (1 + inflaMensual);
      acumuladoReal *= (1 + nominalMensual);
      if (m % Math.max(1, Math.floor(meses / 12)) === 0 || m === meses) {
        bars.push({
          mes: m,
          cerComponent: +(acumuladoCER - montoNum).toFixed(2),
          realComponent: +(acumuladoReal - acumuladoCER).toFixed(2),
          total: +acumuladoReal.toFixed(2),
        });
      }
    }
    const cfFinal = montoNum * Math.pow(1 + nominalMensual, meses);
    const ajusteCER = montoNum * Math.pow(1 + inflaMensual, meses) - montoNum;
    const gananciReal = cfFinal - montoNum - ajusteCER;
    return {
      cfFinal: +cfFinal.toFixed(2),
      ajusteCER: +ajusteCER.toFixed(2),
      gananciReal: +gananciReal.toFixed(2),
      gananciaTotal: +(cfFinal - montoNum).toFixed(2),
      retornoPct: +((cfFinal / montoNum - 1) * 100).toFixed(2),
      tirNominalPct: +((Math.pow(1 + nominalMensual, 12) - 1) * 100).toFixed(2),
      meses,
      bars,
    };
  }, [isCER, bond, montoNum, inflacionAnual]);

  // ─── HARD DOLLAR / BOPREAL ──────────────────────────────────────────────────
  const usdBondConfig = useMemo(() => {
    if (!bond || !isUSD) return null;
    return {
      ticker: bond.ticker,
      nombre: bond.nombre,
      categoria: bond.categoria,
      sufijoPrecioUSD: bond.sufijoPrecioUSD,
      vencimiento: bond.vencimiento ?? '',
      amortizacion: bond.amortizacion ?? 'Bullet',
      cuponAnualPct: bond.tir ? bond.tir / 100 : 0,
      frecuenciaCupon: bond.frecuenciaCupon ?? 'Zero coupon',
      monedaCupon: 'USD',
      monedaCapital: 'USD',
      legislacion: '',
      familia: '',
    };
  }, [bond, isUSD]);

  const usdCashflows = useMemo(() => {
    if (!usdBondConfig) return [];
    return generateCashflows(usdBondConfig as Parameters<typeof generateCashflows>[0], precioNum, montoNum);
  }, [usdBondConfig, precioNum, montoNum]);

  const usdDuration = useMemo(() => {
    if (!usdCashflows.length || !bond?.tir) return null;
    return calculateDuration(usdCashflows, precioNum, bond.tir);
  }, [usdCashflows, precioNum, bond]);

  const usdNextCF = getNextCouponDate(usdCashflows);
  const usdTotalRetorno = usdCashflows.reduce((s, cf) => s + cf.totalInv, 0);

  // Next CF for non-USD bonds: use daysToCoupon from bonistas
  const nextCFLabel = isUSD
    ? (usdNextCF !== '—' ? usdNextCF : bond?.daysToCoupon ? `${bond.daysToCoupon}d` : '—')
    : bond?.daysToCoupon ? `en ${bond.daysToCoupon}d` : '—';

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #DDE6EF', borderRadius: 6, padding: '20px 24px' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0D1B2A' }}>
        Calculadora de Cashflows
      </h3>

      {/* ── Inputs ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: '2 1 200px' }}>
          <label style={{ fontSize: 12, color: '#4a6880', fontWeight: 500, display: 'block', marginBottom: 4 }}>Bono</label>
          <BondSelector bonds={allBonds} value={selectedTicker} onChange={handleTickerChange} />
        </div>
        <div style={{ flex: '1 1 110px' }}>
          <label style={{ fontSize: 12, color: '#4a6880', fontWeight: 500, display: 'block', marginBottom: 4 }}>Precio de compra</label>
          <input
            type="number" value={precioCompra}
            onChange={(e) => setPrecioCompra(e.target.value)}
            placeholder="62.91"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #DDE6EF', background: '#F8FAFC', fontSize: 13 }}
          />
          {bond && <div style={{ fontSize: 10, color: '#8ba5bf', marginTop: 2 }}>{priceSubtext}</div>}
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <label style={{ fontSize: 12, color: '#4a6880', fontWeight: 500, display: 'block', marginBottom: 4 }}>
            Monto a invertir ({isUSD ? 'USD' : 'ARS'})
          </label>
          <input
            type="text" value={montoInvertido}
            onChange={(e) => setMontoInvertido(e.target.value)}
            placeholder="10000"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #DDE6EF', background: '#F8FAFC', fontSize: 13 }}
          />
        </div>
      </div>

      {!bond && (
        <div style={{ textAlign: 'center', padding: 24, color: '#8ba5bf', fontSize: 13, background: '#F8FAFC', borderRadius: 6 }}>
          Seleccioná un bono para calcular
        </div>
      )}

      {/* ── TASA FIJA ── */}
      {isTasaFija && bond && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <MetricCard label="TIR" value={bond.tir ? `${bond.tir.toFixed(2)}%` : '—'} sub="anual" />
            <MetricCard label="TEM" value={bond.tem ? `${bond.tem.toFixed(4)}%` : '—'} sub="mensual" />
            <MetricCard label="TNA" value={bond.tna ? `${bond.tna.toFixed(2)}%` : '—'} />
            <MetricCard label="Duration" value={bond.md ? `${bond.md.toFixed(2)}` : '—'} sub="años" />
            <MetricCard label="Vencimiento" value={fmtDate(bond.vencimiento)} />
            <MetricCard label="Próx. CF" value={nextCFLabel} />
          </div>

          {/* VN a cobrar summary */}
          {precioNum > 0 && montoNum > 0 && (
            <div style={{ background: '#F8FAFC', border: '1px solid #DDE6EF', borderRadius: 6, padding: 16, marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#0D1B2A', marginBottom: 10 }}>
                Proyección al vencimiento
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 10 }}>
                <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#8ba5bf' }}>Monto invertido</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0D1B2A', marginTop: 3 }}>${fmtARS(montoNum)} ARS</div>
                </div>
                <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#8ba5bf' }}>Nominales comprados (VN)</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1F4E79', marginTop: 3 }}>
                    {(montoNum / (precioNum / 100)).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 10, color: '#8ba5bf' }}>al precio {precioNum.toFixed(2)}</div>
                </div>
                {tasaFijaResult && (
                  <>
                    <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: '#8ba5bf' }}>Cobro al vencimiento</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#16A34A', marginTop: 3 }}>${fmtARS(tasaFijaResult.cfFinal)} ARS</div>
                      <div style={{ fontSize: 10, color: '#8ba5bf' }}>en {tasaFijaResult.meses} meses</div>
                    </div>
                    <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: '#8ba5bf' }}>Ganancia</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#16A34A', marginTop: 3 }}>
                        +${fmtARS(tasaFijaResult.ganancia)}
                      </div>
                      <div style={{ fontSize: 10, color: '#8ba5bf' }}>+{tasaFijaResult.retornoPct.toFixed(2)}%</div>
                    </div>
                  </>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#8ba5bf' }}>
                TEM {bond.tem?.toFixed(4)}% × {tasaFijaResult?.meses ?? '—'} meses | Vencimiento: {fmtDate(bond.vencimiento)}
              </div>
            </div>
          )}

          {/* Cashflow chart + table */}
          {tasaFijaCashflows.length > 0 && (
            <>
              <div style={{ height: 160, marginBottom: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={tasaFijaCashflows} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#8ba5bf' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#8ba5bf' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip
                      formatter={(v, name) => [`$${fmtARS(Number(v))}`, String(name)]}
                      contentStyle={{ background: '#fff', border: '1px solid #DDE6EF', fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="cupon" name="Cupón" stackId="a" fill="#1F4E79" maxBarSize={80} />
                    <Bar yAxisId="left" dataKey="amort" name="Amort." stackId="a" fill="#D97706" maxBarSize={80} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <CashflowTable cashflows={tasaFijaCashflows} montoNum={montoNum} currency="ARS" />
            </>
          )}
        </>
      )}

      {/* ── CER ── */}
      {isCER && bond && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <MetricCard label="TIR real (ex CER)" value={bond.tir ? `${bond.tir.toFixed(2)}%` : '—'} />
            <MetricCard label="Duration" value={bond.md ? `${bond.md.toFixed(2)}` : '—'} sub="años" />
            <MetricCard label="Vencimiento" value={fmtDate(bond.vencimiento)} />
            <MetricCard label="Próx. CF" value={nextCFLabel} />
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #DDE6EF', borderRadius: 6, padding: 16, marginBottom: 14 }}>
            <div style={{ fontWeight: 600, color: '#0D1B2A', marginBottom: 10, fontSize: 14 }}>
              Proyección de retorno CER
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13, color: '#4a6880' }}>Tu estimación de inflación anual:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number" value={inflacionAnual}
                  onChange={(e) => setInflacionAnual(+e.target.value)}
                  style={{ width: 72, border: '1px solid #BDD0E0', borderRadius: 4, padding: '6px 8px', fontSize: 14, fontWeight: 600 }}
                />
                <span style={{ color: '#4a6880', fontSize: 13 }}>% anual</span>
              </div>
            </div>

            {cerResult && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: '#8ba5bf' }}>Monto invertido</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0D1B2A', marginTop: 3 }}>${fmtARS(montoNum)}</div>
                  </div>
                  <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: '#8ba5bf' }}>Ajuste CER estimado</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#D97706', marginTop: 3 }}>+${fmtARS(cerResult.ajusteCER)}</div>
                    <div style={{ fontSize: 10, color: '#8ba5bf' }}>(inflación {inflacionAnual}%)</div>
                  </div>
                  <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: '#8ba5bf' }}>Ganancia real adicional</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#16A34A', marginTop: 3 }}>+${fmtARS(cerResult.gananciReal)}</div>
                    <div style={{ fontSize: 10, color: '#8ba5bf' }}>(TIR real {bond.tir?.toFixed(2)}%)</div>
                  </div>
                  <div style={{ background: '#EBF5FB', borderRadius: 4, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: '#8ba5bf' }}>Total al vencimiento</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#16A34A', marginTop: 3 }}>${fmtARS(cerResult.cfFinal)}</div>
                    <div style={{ fontSize: 10, color: '#8ba5bf' }}>(+{cerResult.retornoPct.toFixed(1)}%)</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#4a6880', marginBottom: 10 }}>
                  TIR nominal estimada: <strong style={{ color: '#1F4E79' }}>{cerResult.tirNominalPct.toFixed(2)}% anual</strong>
                  {' '}= (1 + {bond.tir?.toFixed(2)}% real) × (1 + {inflacionAnual}% CER) − 1
                  {' '}en {cerResult.meses} meses
                </div>
                {cerResult.bars.length > 1 && (
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cerResult.bars} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
                        <XAxis dataKey="mes" tickFormatter={(v) => `m${v}`} tick={{ fontSize: 10, fill: '#8ba5bf' }} />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#8ba5bf' }} />
                        <Tooltip
                          formatter={(v, name) => [`$${fmtARS(Number(v))}`, String(name)]}
                          contentStyle={{ background: '#fff', border: '1px solid #DDE6EF', fontSize: 11 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="cerComponent" name="Ajuste CER" stackId="a" fill="#D97706" maxBarSize={60} />
                        <Bar dataKey="realComponent" name="Retorno real" stackId="a" fill="#16A34A" maxBarSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#8ba5bf' }}>
            Fórmula: retorno_nominal = (1 + TIR_real) × (1 + inflación_CER) − 1.
            El ajuste CER se aplica diariamente sobre el capital. La TIR real está garantizada por el precio de mercado.
          </div>
        </>
      )}

      {/* ── HARD DOLLAR / BOPREAL ── */}
      {isUSD && bond && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <MetricCard label="TIR" value={bond.tir ? `${bond.tir.toFixed(2)}%` : '—'} />
            <MetricCard label="TEM" value={bond.tem ? `${bond.tem.toFixed(4)}%` : '—'} />
            <MetricCard label="TNA" value={bond.tna ? `${bond.tna.toFixed(2)}%` : '—'} />
            <MetricCard label="Duration" value={usdDuration !== null ? `${usdDuration} a` : bond.md ? `${bond.md.toFixed(2)} a` : '—'} />
            <MetricCard label="Paridad" value={bond.precioUSD ? `${bond.precioUSD.toFixed(2)}%` : '—'} />
            <MetricCard label="Próx. CF" value={nextCFLabel} />
          </div>

          {usdCashflows.length > 0 ? (
            <>
              <div style={{ height: 180, marginBottom: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={usdCashflows} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#8ba5bf' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#8ba5bf' }} tickFormatter={(v) => `$${v}`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#8ba5bf' }} domain={[0, 100]} />
                    <Tooltip
                      formatter={(v, name) => [
                        name === 'VN Residual' ? Number(v).toFixed(2) : `$${Number(v).toFixed(4)}`,
                        String(name),
                      ]}
                      contentStyle={{ background: '#fff', border: '1px solid #DDE6EF', fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="cupon" name="Cupón" stackId="a" fill="#1F4E79" maxBarSize={60} />
                    <Bar yAxisId="left" dataKey="amort" name="Amort." stackId="a" fill="#D97706" maxBarSize={60} />
                    <Line yAxisId="right" type="monotone" dataKey="vnResidual" name="VN Residual"
                      stroke="#4a6880" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <CashflowTable cashflows={usdCashflows} montoNum={montoNum} currency="USD" />
              {usdTotalRetorno > 0 && (
                <div style={{ fontSize: 12, color: '#4a6880', marginTop: 8 }}>
                  Total flujos sobre inversión:{' '}
                  <strong style={{ color: '#16A34A' }}>${Math.round(usdTotalRetorno).toLocaleString('es-AR')}</strong>
                  {' '}({((usdTotalRetorno / montoNum - 1) * 100).toFixed(1)}% sobre capital)
                </div>
              )}
            </>
          ) : (
            <InfoBox>
              Calculadora de cashflows disponible para bonos GD/AL con schedule de amortización conocido.
              Para BOPREAL y otros: TIR y Duration disponibles arriba.
            </InfoBox>
          )}
        </>
      )}

      {/* Other ARS: TAMAR, DL, BADLAR */}
      {!isUSD && !isCER && !isTasaFija && bond && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <MetricCard label="TIR" value={bond.tir ? `${bond.tir.toFixed(2)}%` : '—'} />
          <MetricCard label="TEM" value={bond.tem ? `${bond.tem.toFixed(4)}%` : '—'} />
          <MetricCard label="TNA" value={bond.tna ? `${bond.tna.toFixed(2)}%` : '—'} />
          <MetricCard label="Duration" value={bond.md ? `${bond.md.toFixed(2)}` : '—'} sub="años" />
          <MetricCard label="Vencimiento" value={fmtDate(bond.vencimiento)} />
          <MetricCard label="Próx. CF" value={nextCFLabel} />
          {bond.precioARS && (
            <MetricCard label="Precio ARS" value={bond.precioARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared cashflow table ──────────────────────────────────────────────────────
function CashflowTable({ cashflows, montoNum, currency }: {
  cashflows: ReturnType<typeof generateCashflows>;
  montoNum: number;
  currency: 'USD' | 'ARS';
}) {
  const fmt = (v: number) =>
    currency === 'ARS'
      ? v.toLocaleString('es-AR', { maximumFractionDigits: 0 })
      : v.toFixed(4);

  return (
    <div style={{ overflowX: 'auto', borderRadius: 6, border: '1px solid #DDE6EF', marginBottom: 14 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#EBF5FB' }}>
            {['Fecha', 'Cupón', 'Amort.', 'Total', `Total (inv $${Math.round(montoNum).toLocaleString()})`, 'VN Residual'].map((h) => (
              <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#0D1B2A', fontSize: 10, borderBottom: '2px solid #BDD0E0', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cashflows.map((cf, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
              <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', fontWeight: 600 }}>{cf.fecha}</td>
              <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', color: '#1F4E79' }}>${fmt(cf.cupon)}</td>
              <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', color: '#D97706' }}>${fmt(cf.amort)}</td>
              <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', fontWeight: 600 }}>${fmt(cf.total)}</td>
              <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', color: '#16A34A' }}>${cf.totalInv.toLocaleString('es-AR')}</td>
              <td style={{ padding: '6px 10px', borderBottom: '1px solid #DDE6EF', color: '#4a6880' }}>{cf.vnResidual.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
