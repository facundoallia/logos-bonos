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

  // Fetch data912 ONCE (arg_bonds + arg_notes)
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

  // Fetch bonistas metadata in parallel for all filtered bonds
  const bonistasResults = await Promise.allSettled(
    filtered.map((b) =>
      fetch(`https://bonistas.com/api/bond/${b.ticker}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 },
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  const enriched = filtered.map((bond, i) => {
    const bonistasRaw =
      bonistasResults[i].status === 'fulfilled' ? bonistasResults[i].value : null;
    const meta = bonistasRaw?.bond ?? bonistasRaw ?? null;

    const tirRaw: number | null = meta?.tir ?? null;
    const mdRaw: number | null = meta?.modified_duration ?? null;
    const tem = tirRaw !== null ? Math.pow(1 + tirRaw, 1 / 12) - 1 : null;
    const tna = tem !== null ? tem * 12 : null;

    const priceBase = priceMap.get(bond.ticker) ?? null;
    const priceD = bond.sufijoPrecioUSD === 'D' ? (priceMap.get(`${bond.ticker}D`) ?? null) : null;
    const priceC = bond.sufijoPrecioUSD != null ? (priceMap.get(`${bond.ticker}C`) ?? null) : null;

    const mainPrice = priceD ?? priceBase;

    return {
      ...bond,
      vencimiento: meta?.end_date ?? null,
      emision: meta?.start_date ?? null,
      descripcion: meta?.description ?? null,
      frecuenciaCupon: meta?.coupon_frequency ?? null,
      monedaCupon: meta?.coupon_currency ?? null,
      amortizacion: meta?.amortization ?? null,
      index: meta?.index ?? null,
      daysToCoupon: meta?.days_to_coupon ?? null,
      daysToFinish: meta?.days_to_finish ?? null,
      fairValue: meta?.fair_value ?? null,
      parity: meta?.parity ?? null,
      volumenM: meta?.volume ?? null,
      tir: tirRaw !== null ? +(tirRaw * 100).toFixed(2) : null,
      tem: tem !== null ? +(tem * 100).toFixed(4) : null,
      tna: tna !== null ? +(tna * 100).toFixed(2) : null,
      md: mdRaw !== null ? +mdRaw.toFixed(2) : null,
      precioUSD: priceD?.c ?? null,
      precioARS: priceBase?.c ?? null,
      precioMEP: priceC?.c ?? null,
      varDia: mainPrice?.pct_change ?? null,
      volumenBYMA: mainPrice?.q_op ?? null,
    };
  });

  return Response.json(enriched, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}
