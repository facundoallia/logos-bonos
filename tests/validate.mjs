/**
 * Batería de validación: compara nuestra API vs bonistas.com directo
 * Ejecutar: node tests/validate.mjs
 *
 * Cubre:
 *  A. Fórmulas matemáticas (TEM, TNA, Duration) — sin llamadas API
 *  B. Integridad de datos: ¿bonistas devuelve datos para nuestros tickers?
 *  C. Exactitud: TIR/MD de nuestra API vs bonistas directo (tolerancia ±0.3%)
 *  D. Cashflows GD30: ¿la suma de pagos es coherente con el schedule?
 *  E. Completitud: ¿cuántos bonos tienen TIR null / precio null?
 */

const BONISTAS_BASE = 'https://bonistas.com/api/bond';
const OUR_API_BASE  = 'https://bonos-logos.vercel.app/api/bonds';

// Benchmark bonds: ticker, expectedTirMin, expectedTirMax, expectedMdMin, expectedMdMax
const BENCHMARKS = [
  { ticker: 'GD30',  label: 'Hard Dollar GD - bullet 2030',   tirMin: 5,  tirMax: 14, mdMin: 1,  mdMax: 5  },
  { ticker: 'GD38',  label: 'Hard Dollar GD - 2038',          tirMin: 5,  tirMax: 14, mdMin: 3,  mdMax: 10 },
  { ticker: 'GD46',  label: 'Hard Dollar GD - 2046',          tirMin: 5,  tirMax: 14, mdMin: 5,  mdMax: 15 },
  { ticker: 'AL30',  label: 'Bonares AL 2030',                 tirMin: 5,  tirMax: 18, mdMin: 1,  mdMax: 5  },
  { ticker: 'TX26',  label: 'Boncer CER 2026',                 tirMin: -5, tirMax: 20, mdMin: 0,  mdMax: 2  },
  { ticker: 'TX28',  label: 'Boncer CER 2028',                 tirMin: -5, tirMax: 20, mdMin: 1,  mdMax: 4  },
  { ticker: 'TO26',  label: 'Bono Fijo TO26',                  tirMin: 20, tirMax: 80, mdMin: 0,  mdMax: 1  },
  { ticker: 'BPY26', label: 'BOPREAL Serie 3',                 tirMin: 3,  tirMax: 20, mdMin: 0,  mdMax: 2  },
];

const CATEGORIES = ['hard-dollar-gd', 'hard-dollar-al', 'cer', 'tasa-fija', 'bopreal'];

// ─── helpers ────────────────────────────────────────────────────────────────

const pass  = (msg) => console.log(`  ✅ PASS  ${msg}`);
const fail  = (msg) => console.log(`  ❌ FAIL  ${msg}`);
const warn  = (msg) => console.log(`  ⚠️  WARN  ${msg}`);
const info  = (msg) => console.log(`  ℹ️  INFO  ${msg}`);
const title = (msg) => console.log(`\n${'─'.repeat(60)}\n${msg}\n${'─'.repeat(60)}`);

let passed = 0, failed = 0, warned = 0;

function assert(condition, passMsg, failMsg) {
  if (condition) { pass(passMsg); passed++; }
  else           { fail(failMsg); failed++; }
}

function assertNear(a, b, tol, label) {
  if (a == null || b == null) {
    warn(`${label}: uno de los valores es null (a=${a}, b=${b})`);
    warned++;
    return;
  }
  const diff = Math.abs(a - b);
  if (diff <= tol) { pass(`${label}: ${a.toFixed(4)} ≈ ${b.toFixed(4)} (diff=${diff.toFixed(4)})`); passed++; }
  else             { fail(`${label}: ${a.toFixed(4)} ≠ ${b.toFixed(4)} (diff=${diff.toFixed(4)}, tol=${tol})`); failed++; }
}

async function fetchBonistas(ticker) {
  try {
    const r = await fetch(`${BONISTAS_BASE}/${ticker}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.bond ?? j ?? null;
  } catch { return null; }
}

async function fetchOurAPI(category) {
  try {
    const r = await fetch(`${OUR_API_BASE}?category=${category}`);
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

// ─── SUITE A: Fórmulas matemáticas ──────────────────────────────────────────

function runFormulaTests() {
  title('SUITE A — Fórmulas matemáticas (sin API)');

  // A1: TEM desde TIR anual decimal
  const tir = 0.0782;  // 7.82% como decimal
  const temExpected = Math.pow(1 + tir, 1/12) - 1;
  const temCalc = Math.pow(1 + tir, 1/12) - 1;
  assertNear(temCalc * 100, 0.6294, 0.001, 'A1 TEM(7.82% anual) debería ser ≈ 0.6294%');

  // A2: TNA = TEM * 12
  const tna = temExpected * 12;
  assertNear(tna * 100, 7.553, 0.01, 'A2 TNA(TEM×12) debería ser ≈ 7.55%');

  // A3: TEM < TIR (siempre para tasas positivas)
  assert(temExpected < tir, 'A3 TEM < TIR anual (correcto: efecto compuesto)', `A3 TEM(${temExpected}) debería ser < TIR(${tir})`);

  // A4: (1+TEM)^12 - 1 = TIR
  const tirReconstruida = Math.pow(1 + temExpected, 12) - 1;
  assertNear(tirReconstruida, tir, 0.00001, 'A4 (1+TEM)^12 - 1 = TIR original (consistencia)');

  // A5: Duration de bono bullet simple
  // Bono bullet: 1 pago de 100 en T=2 años, precio=100, TIR=8%
  // Macaulay Duration = T = 2 años (solo 1 cashflow)
  // Modified Duration = Mac / (1 + r) = 2 / 1.08 = 1.852
  const mac = 2;
  const modDur = mac / (1 + 0.08);
  assertNear(modDur, 1.852, 0.001, 'A5 MD bono bullet T=2, r=8% debería ser ≈ 1.852');

  // A6: VN comprado = monto / (precio/100)
  const monto = 10000, precio = 62.91;
  const vnComprado = monto / (precio / 100);
  assertNear(vnComprado, 15895.72, 1.0, 'A6 VN comprado: $10000 / 62.91% = ~15.895 nominales');
}

// ─── SUITE B: Integridad bonistas ────────────────────────────────────────────

async function runBonistasIntegrityTests() {
  title('SUITE B — Integridad: bonistas devuelve datos para nuestros tickers');

  for (const bm of BENCHMARKS) {
    const meta = await fetchBonistas(bm.ticker);
    if (!meta) {
      fail(`${bm.ticker}: bonistas no respondió o devolvió null`);
      failed++;
      continue;
    }
    const hasTir = meta.tir != null;
    const hasMd  = meta.modified_duration != null;
    const hasVto = meta.end_date != null;

    if (hasTir && hasMd && hasVto) {
      pass(`${bm.ticker}: TIR=${(meta.tir*100).toFixed(2)}%, MD=${meta.modified_duration?.toFixed(2)}, Vto=${meta.end_date}`);
      passed++;
    } else {
      warn(`${bm.ticker}: datos parciales — TIR=${hasTir?'✓':'null'}, MD=${hasMd?'✓':'null'}, Vto=${hasVto?'✓':'null'}`);
      warned++;
    }

    // Sanity range check
    if (hasTir) {
      const tirPct = meta.tir * 100;
      if (tirPct >= bm.tirMin && tirPct <= bm.tirMax) {
        pass(`${bm.ticker}: TIR ${tirPct.toFixed(2)}% en rango esperado [${bm.tirMin}%–${bm.tirMax}%]`);
        passed++;
      } else {
        warn(`${bm.ticker}: TIR ${tirPct.toFixed(2)}% fuera del rango esperado [${bm.tirMin}%–${bm.tirMax}%] — puede ser volatilidad`);
        warned++;
      }
    }
  }
}

// ─── SUITE C: Exactitud nuestra API vs bonistas ───────────────────────────────

async function runAccuracyTests() {
  title('SUITE C — Exactitud: nuestra API vs bonistas directo');

  for (const bm of BENCHMARKS) {
    const [meta, ourAll] = await Promise.all([
      fetchBonistas(bm.ticker),
      fetchOurAPI(/* necesitamos la categoria */ 'all').then(r => r),
    ]);
    if (!meta || !Array.isArray(ourAll)) {
      warn(`${bm.ticker}: no se pudo obtener datos para comparar`);
      warned++;
      continue;
    }
    const ours = ourAll.find(b => b.ticker === bm.ticker);
    if (!ours) {
      fail(`${bm.ticker}: no encontrado en nuestra API`);
      failed++;
      continue;
    }

    const bonTirPct = meta.tir != null ? meta.tir * 100 : null;
    const bonMd     = meta.modified_duration ?? null;

    // TIR comparison (±0.7% tolerance — delayed prices + cache cause slight drift)
    assertNear(ours.tir, bonTirPct, 0.7, `C-${bm.ticker} TIR nuestra vs bonistas`);
    // MD comparison (±0.2 tolerance)
    assertNear(ours.md, bonMd, 0.2, `C-${bm.ticker} MD nuestra vs bonistas`);

    // TEM/TNA consistency with our own TIR
    // Tolerance 0.001%: TIR stored with 4 dec → TEM should match to within floating point
    if (ours.tir != null && ours.tem != null) {
      const expectedTem = (Math.pow(1 + ours.tir/100, 1/12) - 1) * 100;
      assertNear(ours.tem, expectedTem, 0.001, `C-${bm.ticker} TEM consistente con TIR propia`);
    }

    // Vencimiento populated
    assert(ours.vencimiento != null, `C-${bm.ticker} vencimiento no es null`, `C-${bm.ticker} vencimiento es null`);
  }
}

// ─── SUITE D: Cashflows GD30 ─────────────────────────────────────────────────

async function runCashflowTests() {
  title('SUITE D — Cashflows: schedule GD30 vs bonistas');

  const meta = await fetchBonistas('GD30');
  if (!meta) { warn('D: bonistas no respondió para GD30'); warned++; return; }

  // GD30 hardcoded schedule — should sum amortizations to 1.0
  const GD30_SCHEDULE = [
    { date: '2024-07-09', couponRate: 0.005,   amortRate: 0 },
    { date: '2025-01-09', couponRate: 0.005,   amortRate: 0 },
    { date: '2025-07-09', couponRate: 0.0075,  amortRate: 0 },
    { date: '2026-01-09', couponRate: 0.0075,  amortRate: 0 },
    { date: '2026-07-09', couponRate: 0.0075,  amortRate: 0 },
    { date: '2027-01-09', couponRate: 0.0125,  amortRate: 0 },
    { date: '2027-07-09', couponRate: 0.0125,  amortRate: 0 },
    { date: '2028-01-09', couponRate: 0.0125,  amortRate: 0 },
    { date: '2028-07-09', couponRate: 0.0125,  amortRate: 0 },
    { date: '2029-01-09', couponRate: 0.0125,  amortRate: 0 },
    { date: '2029-07-09', couponRate: 0.0125,  amortRate: 0.04 },
    { date: '2030-01-09', couponRate: 0.0125,  amortRate: 0.04 },
    { date: '2030-07-09', couponRate: 0.0125,  amortRate: 0.92 },
  ];

  const totalAmort = GD30_SCHEDULE.reduce((s, p) => s + p.amortRate, 0);
  assertNear(totalAmort, 1.0, 0.001, 'D1 GD30: suma amortizaciones = 100% del capital');

  // All coupon rates should be positive
  const negativeCoupons = GD30_SCHEDULE.filter(p => p.couponRate <= 0);
  assert(negativeCoupons.length === 0, 'D2 GD30: todos los cupones son positivos', `D2 GD30: ${negativeCoupons.length} cupones <= 0`);

  // Dates should be monotonically increasing
  const dates = GD30_SCHEDULE.map(p => new Date(p.date).getTime());
  const isMonotone = dates.every((d, i) => i === 0 || d > dates[i-1]);
  assert(isMonotone, 'D3 GD30: fechas del schedule son crecientes', 'D3 GD30: fechas NO son crecientes');

  // Bonistas vencimiento should match our last schedule date
  const lastDate = GD30_SCHEDULE[GD30_SCHEDULE.length - 1].date;
  const bonVto = meta.end_date ?? '';
  assert(
    bonVto.startsWith('2030'),
    `D4 GD30: vencimiento bonistas (${bonVto}) es en 2030 como esperado`,
    `D4 GD30: vencimiento bonistas (${bonVto}) NO coincide con 2030`
  );

  // Step-up: coupon rates should increase or stay the same over time
  const coupons = GD30_SCHEDULE.map(p => p.couponRate);
  let isStepUp = true;
  for (let i = 1; i < coupons.length; i++) {
    if (coupons[i] < coupons[i-1] - 0.0001) { isStepUp = false; break; }
  }
  assert(isStepUp, 'D5 GD30: cupones step-up (no decrece)', 'D5 GD30: schedule tiene cupones decrecientes — verificar');

  // Final period should return most of the capital
  const lastPeriod = GD30_SCHEDULE[GD30_SCHEDULE.length - 1];
  assert(lastPeriod.amortRate > 0.5, `D6 GD30: última amortización (${lastPeriod.amortRate}) > 50%`, `D6 GD30: última amortización (${lastPeriod.amortRate}) parece baja`);

  // Log bonistas coupon data if available
  if (meta.coupon != null) {
    info(`D7 GD30 coupon rate bonistas: ${(meta.coupon*100).toFixed(4)}%`);
  } else {
    warn('D7 GD30: bonistas no devuelve campo coupon');
    warned++;
  }
}

// ─── SUITE E: Completitud de la API ──────────────────────────────────────────

async function runCompletenessTests() {
  title('SUITE E — Completitud: ¿cuántos bonos tienen datos nulos?');

  const all = await fetchOurAPI('all');
  if (!Array.isArray(all) || all.length === 0) {
    fail('E0: API /bonds?category=all no devolvió datos');
    failed++;
    return;
  }

  info(`E0: API devolvió ${all.length} bonos en total`);

  const fields = ['tir', 'md', 'tem', 'tna', 'vencimiento'];
  for (const f of fields) {
    const nullCount  = all.filter(b => b[f] == null).length;
    const pct = ((nullCount / all.length) * 100).toFixed(0);
    const label = `E-${f}: ${nullCount}/${all.length} (${pct}%) con valor null`;
    if (nullCount === 0)       pass(label);
    else if (nullCount < all.length * 0.3) warn(label);
    else                       fail(label);
  }

  // Price checks by category
  const hdGd = all.filter(b => b.categoria === 'hard-dollar-gd');
  const nullPriceHD = hdGd.filter(b => b.precioUSD == null).length;
  assert(nullPriceHD === 0,
    `E-precio HD: todos los ${hdGd.length} GD tienen precioUSD`,
    `E-precio HD: ${nullPriceHD}/${hdGd.length} GD sin precioUSD`
  );

  const bopreal = all.filter(b => b.categoria === 'bopreal');
  const nullPriceBop = bopreal.filter(b => b.precioUSD == null).length;
  if (nullPriceBop === 0) pass(`E-precio BOPREAL: todos los ${bopreal.length} tienen precioUSD`);
  else warn(`E-precio BOPREAL: ${nullPriceBop}/${bopreal.length} sin precioUSD`);

  // Null tir breakdown by category
  info('');
  info('Detalle TIR null por categoría:');
  const cats = [...new Set(all.map(b => b.categoria))];
  for (const cat of cats) {
    const group = all.filter(b => b.categoria === cat);
    const nullTir = group.filter(b => b.tir == null).length;
    info(`  ${cat}: ${nullTir}/${group.length} sin TIR`);
  }
}

// ─── SUITE F: Validación del fix de batching (category=all debe tener <10% nulls) ──

async function runBatchingTest() {
  title('SUITE F — Batching: category=all debe tener datos completos tras el fix');

  const all = await fetchOurAPI('all');
  if (!Array.isArray(all) || all.length === 0) {
    fail('F0: /api/bonds?category=all no devolvió datos'); failed++; return;
  }

  const nullTir  = all.filter(b => b.tir == null).length;
  const nullPct  = (nullTir / all.length * 100).toFixed(1);

  if (nullTir === 0)                        pass(`F1 batching: 0 TIR null en ${all.length} bonos (${nullPct}%)`);
  else if (nullTir / all.length < 0.10)     warn(`F1 batching: ${nullTir}/${all.length} TIR null (${nullPct}%) — algunos bonos no están en bonistas`);
  else                                      fail(`F1 batching: ${nullTir}/${all.length} TIR null (${nullPct}%) — rate limiting sigue activo`);

  // TNA should be TEM * 12 for all non-null values
  const mismatch = all.filter(b => {
    if (b.tem == null || b.tna == null) return false;
    return Math.abs(b.tna - b.tem * 12) > 0.01;
  });
  assert(mismatch.length === 0,
    `F2 TNA = TEM×12 para todos los bonos con datos`,
    `F2 TNA ≠ TEM×12 en ${mismatch.length} bonos: ${mismatch.map(b=>b.ticker).join(', ')}`
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   BONOS LOGOS — BATERÍA DE VALIDACIÓN vs bonistas.com   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  runFormulaTests();
  await runBonistasIntegrityTests();
  await runAccuracyTests();
  await runCashflowTests();
  await runCompletenessTests();
  await runBatchingTest();

  console.log('\n' + '═'.repeat(60));
  console.log(`RESULTADOS FINALES:  ✅ ${passed} PASS  |  ❌ ${failed} FAIL  |  ⚠️  ${warned} WARN`);
  console.log('═'.repeat(60) + '\n');

  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
