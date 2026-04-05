import { NextRequest } from 'next/server';
import { HistoricalPoint } from '@/lib/types';

const CUTOFFS: Record<string, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  MAX: 99999,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '1Y';

  try {
    const res = await fetch(`https://data912.com/historical/bonds/${ticker}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return Response.json({ error: 'upstream error' }, { status: 502 });
    }
    const data: HistoricalPoint[] = await res.json();
    const days = CUTOFFS[range] ?? 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = data.filter((d) => new Date(d.date) >= cutoff);
    return Response.json(filtered, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch {
    return Response.json({ error: 'fetch failed' }, { status: 500 });
  }
}
