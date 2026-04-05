import { NextRequest } from 'next/server';
import { BondConfig, LiveBond, HistoricalPoint } from '@/lib/types';
import bondsConfigRaw from '@/config/bonds-config.json';

const bondsConfig = bondsConfigRaw as BondConfig[];
const USD_CATS = ['hard-dollar-gd', 'hard-dollar-al', 'bopreal'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';

  const filtered = category === 'all'
    ? bondsConfig
    : bondsConfig.filter((b) => b.categoria === category);

  let prices: LiveBond[] = [];
  try {
    const res = await fetch('https://data912.com/live/arg_bonds', {
      next: { revalidate: 60 },
    });
    if (res.ok) prices = await res.json();
  } catch {}

  const priceMap = new Map<string, LiveBond>();
  prices.forEach((p) => priceMap.set(p.symbol, p));

  const tirResults = await Promise.allSettled(
    filtered.map(async (bond) => {
      const suffix = USD_CATS.includes(bond.categoria) ? 'D' : '';
      const ticker = `${bond.ticker}${suffix}`;
      try {
        const res = await fetch(`https://data912.com/historical/bonds/${ticker}`, {
          next: { revalidate: 86400 },
        });
        if (!res.ok) return { ticker: bond.ticker, tir: null };
        const hist: HistoricalPoint[] = await res.json();
        const last = hist[hist.length - 1];
        return { ticker: bond.ticker, tir: last?.sa ?? null };
      } catch {
        return { ticker: bond.ticker, tir: null };
      }
    })
  );

  const enriched = filtered.map((bond, i) => {
    const suffix = USD_CATS.includes(bond.categoria) ? 'D' : '';
    const priceD = priceMap.get(`${bond.ticker}${suffix}`);
    const priceARS = priceMap.get(bond.ticker);
    const priceC = priceMap.get(`${bond.ticker}C`);

    const tirResult = tirResults[i];
    const tir = tirResult.status === 'fulfilled' ? tirResult.value.tir : null;

    return {
      ...bond,
      precioUSD: priceD?.c ?? null,
      precioARS: priceARS?.c ?? null,
      precioMEP: priceC?.c ?? null,
      varDia: priceD?.pct_change ?? priceARS?.pct_change ?? null,
      volumen: priceD?.q_op ?? priceARS?.q_op ?? null,
      tir,
      tirPct: tir !== null ? +(tir * 100).toFixed(2) : null,
    };
  });

  return Response.json(enriched, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}
