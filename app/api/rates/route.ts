export async function GET() {
  try {
    const [r1, r2] = await Promise.all([
      fetch('https://dolarapi.com/v1/dolares/contadoconliqui', { next: { revalidate: 120 } }),
      fetch('https://dolarapi.com/v1/dolares/bolsa', { next: { revalidate: 120 } }),
    ]);
    if (r1.ok && r2.ok) {
      const [ccl, mep] = await Promise.all([r1.json(), r2.json()]);
      return Response.json(
        { ccl: ccl.venta, mep: mep.venta, source: 'dolarapi', ts: new Date().toISOString() },
        { headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=600' } }
      );
    }
  } catch {}

  try {
    const r = await fetch('https://criptoya.com/api/dolar', { next: { revalidate: 120 } });
    const d = await r.json();
    return Response.json(
      { ccl: d.ccl?.venta ?? null, mep: d.mep?.venta ?? null, source: 'criptoya', ts: new Date().toISOString() },
      { headers: { 'Cache-Control': 's-maxage=120' } }
    );
  } catch {}

  return Response.json({ ccl: null, mep: null, source: 'unavailable' }, { status: 503 });
}
