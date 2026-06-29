import { NextRequest } from 'next/server';
import { BondConfigSlim, LiveBond } from '@/lib/types';
import bondsList from '@/config/bonds-config.json';

const bonds = bondsList as BondConfigSlim[];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';

  const filtered = category === 'all'
    ? bonds
    : bonds.filter((b) => b.categoria === category);

  // Fetch data912 ONCE (arg_bonds + arg_notes merged)
  let bondsData: LiveBond[] = [];
  let notesData: LiveBond[] = [];
  try {
    const [r1, r2] = await Promise.all([
      fetch('https://data912.com/live/arg_bonds', { next: { revalidate: 60 } }),
      fetch('https://data912.com/live/arg_notes', { next: { revalidate: 60 } }),
    ]);
    if (r1.ok) bondsData = await r1.json();
    if (r2.ok) notesData = await r2.json();
  } catch {}

  const allPrices = [...bondsData, ...notesData].filter(
    (p) => p.symbol && !p.symbol.includes(' ')
  );
  const priceMap = new Map<string, LiveBond>(allPrices.map((p) => [p.symbol, p]));

  // Fetch ALL bonistas metadata in ONE bulk request (was 80 per-ticker calls
  // batched to dodge throttling, but still ~30% of TIRs came back null in prod).
  // The bulk endpoint is a superset of /api/bond/{ticker} and avoids rate limits.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bonistasMap = new Map<string, any>();
  try {
    const r = await fetch('https://bonistas.com/api/bonds', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });
    if (r.ok) {
      const all = await r.json();
      if (Array.isArray(all)) {
        for (const b of all) {
          if (b?.ticker) bonistasMap.set(String(b.ticker).toUpperCase(), b);
        }
      }
    }
  } catch {}

  const enriched = filtered.map((bond) => {
    const meta = bonistasMap.get(bond.ticker.toUpperCase()) ?? null;

    const tirRaw: number | null = meta?.tir ?? null;
    const mdRaw: number | null = meta?.modified_duration ?? null;
    const tem = tirRaw !== null ? Math.pow(1 + tirRaw, 1 / 12) - 1 : null;
    const tna = tem !== null ? tem * 12 : null;

    // Resolve price ticker symbols — BOPREAL has different D/C tickers in data912
    const symBase = bond.ticker;
    const symD = bond.tickerD ?? (bond.sufijoPrecioUSD === 'D' ? `${bond.ticker}D` : null);
    const symC = bond.tickerC ?? (bond.sufijoPrecioUSD != null ? `${bond.ticker}C` : null);

    const priceBase = priceMap.get(symBase) ?? null;
    const priceD = symD ? (priceMap.get(symD) ?? null) : null;
    const priceC = symC ? (priceMap.get(symC) ?? null) : null;

    const mainPrice = priceD ?? priceBase;

    // Historical: ticker used for /api/historical/{histTicker}
    const histTicker = bond.sufijoPrecioUSD === 'D'
      ? symD ?? `${bond.ticker}D`   // USD bonds use D ticker
      : bond.ticker;                // ARS bonds use base ticker

    return {
      ...bond,
      vencimiento: meta?.end_date ?? null,
      emision: meta?.start_date ?? null,
      descripcion: meta?.description ?? null,
      frecuenciaCupon: meta?.coupon_frequency ?? null,
      monedaCupon: meta?.coupon_currency ?? null,
      amortizacion: meta?.amortization ?? null,
      index: meta?.index ?? null,
      settlement: meta?.settlement ?? null,
      daysToCoupon: meta?.days_to_coupon ?? null,
      daysToFinish: meta?.days_to_finish ?? null,
      fairValue: meta?.fair_value ?? null,
      parity: meta?.parity ?? null,
      volumenM: meta?.volume ?? null,
      tir: tirRaw !== null ? +(tirRaw * 100).toFixed(4) : null,  // 4 dec para consistencia con TEM
      tem: tem !== null ? +(tem * 100).toFixed(4) : null,
      tna: tna !== null ? +(tna * 100).toFixed(4) : null,
      md: mdRaw !== null ? +mdRaw.toFixed(2) : null,
      couponPct: null, // bonistas `coupon` viene con unidades inconsistentes (CUAP=1250) → no confiable

      precioUSD: priceD?.c ?? null,
      precioARS: priceBase?.c ?? null,
      precioMEP: priceC?.c ?? null,
      varDia: mainPrice?.pct_change ?? null,
      volumenBYMA: mainPrice?.q_op ?? null,
      histTicker,
      hasHistorical: true, // always try; gracefully shows 'Sin datos' if empty
    };
  });

  return Response.json(enriched, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}
