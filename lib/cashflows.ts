import { BondConfig, CashflowRow } from './types';

// Step-up coupon schedules for 2020 restructured bonds (Argentina indenture)
// Coupons per $100 VN, semi-annual periods
const STEP_UP_SCHEDULES: Record<string, { date: string; couponRate: number; amortRate: number }[]> = {
  GD29: [
    { date: '2024-07-09', couponRate: 0.005, amortRate: 0 },
    { date: '2025-01-09', couponRate: 0.005, amortRate: 0 },
    { date: '2025-07-09', couponRate: 0.0075, amortRate: 0 },
    { date: '2026-01-09', couponRate: 0.0075, amortRate: 0.04167 },
    { date: '2026-07-09', couponRate: 0.0075, amortRate: 0.04167 },
    { date: '2027-01-09', couponRate: 0.0075, amortRate: 0.04167 },
    { date: '2027-07-09', couponRate: 0.0075, amortRate: 0.04167 },
    { date: '2028-01-09', couponRate: 0.0075, amortRate: 0.04167 },
    { date: '2028-07-09', couponRate: 0.0075, amortRate: 0.04167 },
    { date: '2029-01-09', couponRate: 0.0075, amortRate: 0.04167 },
    { date: '2029-07-09', couponRate: 0.0075, amortRate: 0.54169 },
  ],
  GD30: [
    { date: '2024-07-09', couponRate: 0.005, amortRate: 0 },
    { date: '2025-01-09', couponRate: 0.005, amortRate: 0 },
    { date: '2025-07-09', couponRate: 0.0075, amortRate: 0 },
    { date: '2026-01-09', couponRate: 0.0075, amortRate: 0 },
    { date: '2026-07-09', couponRate: 0.0075, amortRate: 0 },
    { date: '2027-01-09', couponRate: 0.0125, amortRate: 0 },
    { date: '2027-07-09', couponRate: 0.0125, amortRate: 0 },
    { date: '2028-01-09', couponRate: 0.0125, amortRate: 0 },
    { date: '2028-07-09', couponRate: 0.0125, amortRate: 0 },
    { date: '2029-01-09', couponRate: 0.0125, amortRate: 0 },
    { date: '2029-07-09', couponRate: 0.0125, amortRate: 0.04 },
    { date: '2030-01-09', couponRate: 0.0125, amortRate: 0.04 },
    { date: '2030-07-09', couponRate: 0.0125, amortRate: 0.92 },
  ],
  GD35: [
    { date: '2024-07-09', couponRate: 0.0075, amortRate: 0 },
    { date: '2025-01-09', couponRate: 0.0075, amortRate: 0 },
    { date: '2025-07-09', couponRate: 0.0125, amortRate: 0 },
    { date: '2026-01-09', couponRate: 0.0125, amortRate: 0 },
    { date: '2026-07-09', couponRate: 0.0175, amortRate: 0 },
    { date: '2027-01-09', couponRate: 0.0175, amortRate: 0 },
    { date: '2027-07-09', couponRate: 0.02063, amortRate: 0 },
    { date: '2028-01-09', couponRate: 0.02063, amortRate: 0 },
    { date: '2028-07-09', couponRate: 0.02063, amortRate: 0 },
    { date: '2029-01-09', couponRate: 0.02063, amortRate: 0 },
    { date: '2029-07-09', couponRate: 0.02063, amortRate: 0 },
    { date: '2030-01-09', couponRate: 0.02063, amortRate: 0 },
    { date: '2030-07-09', couponRate: 0.02063, amortRate: 0.005 },
    { date: '2031-01-09', couponRate: 0.02063, amortRate: 0.005 },
    { date: '2031-07-09', couponRate: 0.02063, amortRate: 0.015 },
    { date: '2032-01-09', couponRate: 0.02063, amortRate: 0.02 },
    { date: '2032-07-09', couponRate: 0.02063, amortRate: 0.025 },
    { date: '2033-01-09', couponRate: 0.02063, amortRate: 0.025 },
    { date: '2033-07-09', couponRate: 0.02063, amortRate: 0.025 },
    { date: '2034-01-09', couponRate: 0.02063, amortRate: 0.025 },
    { date: '2034-07-09', couponRate: 0.02063, amortRate: 0.025 },
    { date: '2035-01-09', couponRate: 0.02063, amortRate: 0.025 },
    { date: '2035-07-09', couponRate: 0.02063, amortRate: 0.785 },
  ],
  GD38: [
    { date: '2024-01-09', couponRate: 0.0125, amortRate: 0 },
    { date: '2024-07-09', couponRate: 0.025, amortRate: 0 },
    { date: '2025-01-09', couponRate: 0.025, amortRate: 0 },
    { date: '2025-07-09', couponRate: 0.025, amortRate: 0 },
    { date: '2026-01-09', couponRate: 0.025, amortRate: 0 },
    { date: '2026-07-09', couponRate: 0.025, amortRate: 0 },
    { date: '2027-01-09', couponRate: 0.025, amortRate: 0 },
    { date: '2027-07-09', couponRate: 0.025, amortRate: 0 },
    { date: '2028-01-09', couponRate: 0.025, amortRate: 0 },
    { date: '2028-07-09', couponRate: 0.025, amortRate: 0 },
    { date: '2029-01-09', couponRate: 0.025, amortRate: 0 },
    { date: '2029-07-09', couponRate: 0.025, amortRate: 0 },
    { date: '2030-01-09', couponRate: 0.025, amortRate: 0 },
    { date: '2030-07-09', couponRate: 0.025, amortRate: 0 },
    { date: '2031-01-09', couponRate: 0.025, amortRate: 0 },
    { date: '2031-07-09', couponRate: 0.025, amortRate: 0 },
    { date: '2032-01-09', couponRate: 0.025, amortRate: 0 },
    { date: '2032-07-09', couponRate: 0.025, amortRate: 0 },
    { date: '2033-01-09', couponRate: 0.025, amortRate: 0 },
    { date: '2033-07-09', couponRate: 0.025, amortRate: 0 },
    { date: '2034-01-09', couponRate: 0.025, amortRate: 0.02 },
    { date: '2034-07-09', couponRate: 0.025, amortRate: 0.02 },
    { date: '2035-01-09', couponRate: 0.025, amortRate: 0.02 },
    { date: '2035-07-09', couponRate: 0.025, amortRate: 0.025 },
    { date: '2036-01-09', couponRate: 0.025, amortRate: 0.025 },
    { date: '2036-07-09', couponRate: 0.025, amortRate: 0.025 },
    { date: '2037-01-09', couponRate: 0.025, amortRate: 0.025 },
    { date: '2037-07-09', couponRate: 0.025, amortRate: 0.025 },
    { date: '2038-01-09', couponRate: 0.025, amortRate: 0.84 },
  ],
  GD41: [
    { date: '2025-07-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2026-01-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2026-07-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2027-01-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2027-07-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2028-01-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2028-07-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2029-01-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2029-07-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2030-01-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2030-07-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2031-01-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2031-07-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2032-01-09', couponRate: 0.02125, amortRate: 0 },
    { date: '2032-07-09', couponRate: 0.02125, amortRate: 0.01 },
    { date: '2033-01-09', couponRate: 0.02125, amortRate: 0.01 },
    { date: '2033-07-09', couponRate: 0.02125, amortRate: 0.01 },
    { date: '2034-01-09', couponRate: 0.02125, amortRate: 0.015 },
    { date: '2034-07-09', couponRate: 0.02125, amortRate: 0.015 },
    { date: '2035-01-09', couponRate: 0.02125, amortRate: 0.015 },
    { date: '2035-07-09', couponRate: 0.02125, amortRate: 0.015 },
    { date: '2036-01-09', couponRate: 0.02125, amortRate: 0.02 },
    { date: '2036-07-09', couponRate: 0.02125, amortRate: 0.02 },
    { date: '2037-01-09', couponRate: 0.02125, amortRate: 0.02 },
    { date: '2037-07-09', couponRate: 0.02125, amortRate: 0.025 },
    { date: '2038-01-09', couponRate: 0.02125, amortRate: 0.025 },
    { date: '2038-07-09', couponRate: 0.02125, amortRate: 0.025 },
    { date: '2039-01-09', couponRate: 0.02125, amortRate: 0.025 },
    { date: '2039-07-09', couponRate: 0.02125, amortRate: 0.025 },
    { date: '2040-01-09', couponRate: 0.02125, amortRate: 0.025 },
    { date: '2040-07-09', couponRate: 0.02125, amortRate: 0.025 },
    { date: '2041-01-09', couponRate: 0.02125, amortRate: 0.025 },
    { date: '2041-07-09', couponRate: 0.02125, amortRate: 0.565 },
  ],
  GD46: [
    { date: '2025-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2026-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2026-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2027-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2027-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2028-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2028-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2029-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2029-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2030-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2030-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2031-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2031-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2032-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2032-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2033-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2033-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2034-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2034-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2035-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2035-07-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2036-01-09', couponRate: 0.01922, amortRate: 0 },
    { date: '2036-07-09', couponRate: 0.01922, amortRate: 0.01 },
    { date: '2037-01-09', couponRate: 0.01922, amortRate: 0.01 },
    { date: '2037-07-09', couponRate: 0.01922, amortRate: 0.01 },
    { date: '2038-01-09', couponRate: 0.01922, amortRate: 0.015 },
    { date: '2038-07-09', couponRate: 0.01922, amortRate: 0.015 },
    { date: '2039-01-09', couponRate: 0.01922, amortRate: 0.015 },
    { date: '2039-07-09', couponRate: 0.01922, amortRate: 0.015 },
    { date: '2040-01-09', couponRate: 0.01922, amortRate: 0.015 },
    { date: '2040-07-09', couponRate: 0.01922, amortRate: 0.015 },
    { date: '2041-01-09', couponRate: 0.01922, amortRate: 0.02 },
    { date: '2041-07-09', couponRate: 0.01922, amortRate: 0.02 },
    { date: '2042-01-09', couponRate: 0.01922, amortRate: 0.02 },
    { date: '2042-07-09', couponRate: 0.01922, amortRate: 0.025 },
    { date: '2043-01-09', couponRate: 0.01922, amortRate: 0.025 },
    { date: '2043-07-09', couponRate: 0.01922, amortRate: 0.025 },
    { date: '2044-01-09', couponRate: 0.01922, amortRate: 0.025 },
    { date: '2044-07-09', couponRate: 0.01922, amortRate: 0.025 },
    { date: '2045-01-09', couponRate: 0.01922, amortRate: 0.025 },
    { date: '2045-07-09', couponRate: 0.01922, amortRate: 0.025 },
    { date: '2046-01-09', couponRate: 0.01922, amortRate: 0.025 },
    { date: '2046-07-09', couponRate: 0.01922, amortRate: 0.605 },
  ],
};

// AL series mirrors GD series for the same maturity
['AL29', 'AL30', 'AL35', 'AE38', 'AL41'].forEach((ticker) => {
  const base = ticker.replace('AL', 'GD').replace('AE', 'GD');
  if (STEP_UP_SCHEDULES[base]) {
    STEP_UP_SCHEDULES[ticker] = STEP_UP_SCHEDULES[base];
  }
});

// AO27 simplified schedule
STEP_UP_SCHEDULES['AO27'] = [
  { date: '2024-10-29', couponRate: 0.005, amortRate: 0 },
  { date: '2025-04-29', couponRate: 0.005, amortRate: 0 },
  { date: '2025-10-29', couponRate: 0.005, amortRate: 0 },
  { date: '2026-04-29', couponRate: 0.005, amortRate: 0 },
  { date: '2026-10-29', couponRate: 0.005, amortRate: 0 },
  { date: '2027-04-29', couponRate: 0.005, amortRate: 0 },
  { date: '2027-10-29', couponRate: 0.005, amortRate: 1.0 },
];

// AN29 — bullet bond
STEP_UP_SCHEDULES['AN29'] = [
  { date: '2026-05-30', couponRate: 0.0607 / 2, amortRate: 0 },
  { date: '2026-11-30', couponRate: 0.0607 / 2, amortRate: 0 },
  { date: '2027-05-30', couponRate: 0.0607 / 2, amortRate: 0 },
  { date: '2027-11-30', couponRate: 0.0607 / 2, amortRate: 0 },
  { date: '2028-05-30', couponRate: 0.0607 / 2, amortRate: 0 },
  { date: '2028-11-30', couponRate: 0.0607 / 2, amortRate: 0 },
  { date: '2029-05-30', couponRate: 0.0607 / 2, amortRate: 0 },
  { date: '2029-11-30', couponRate: 0.0607 / 2, amortRate: 1.0 },
];

function formatDate(date: Date): string {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function generateCashflows(
  bond: BondConfig,
  precioCompra: number,
  montoInvertido: number
): CashflowRow[] {
  const today = new Date();
  const schedule = STEP_UP_SCHEDULES[bond.ticker];

  if (!schedule) {
    // Generic bullet bond (LECER, Tasa Fija letras, etc.)
    if (bond.amortizacion === 'Bullet') {
      const vto = new Date(bond.vencimiento);
      if (vto <= today) return [];
      const cuponSemestral = bond.cuponAnualPct / 2;
      const rows: CashflowRow[] = [];
      let vnResidual = 100;
      const daysToVto = (vto.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      const periodsLeft = Math.ceil(daysToVto / 182);

      if (bond.frecuenciaCupon === 'Zero coupon' || bond.cuponAnualPct === 0) {
        return [
          {
            fecha: formatDate(vto),
            cupon: 0,
            amort: 100,
            total: 100,
            totalInv: (100 / precioCompra) * montoInvertido,
            vnResidual: 0,
          },
        ];
      }

      // Semi-annual coupons
      const vtoDate = new Date(bond.vencimiento);
      const d = new Date(vtoDate);
      const dates: Date[] = [];
      while (d > today) {
        dates.unshift(new Date(d));
        d.setMonth(d.getMonth() - 6);
      }
      rows.push(
        ...dates.map((dt, i) => {
          const isLast = i === dates.length - 1;
          const cupon = cuponSemestral * vnResidual;
          const amort = isLast ? vnResidual : 0;
          const total = cupon + amort;
          if (isLast) vnResidual = 0;
          return {
            fecha: formatDate(dt),
            cupon: +cupon.toFixed(4),
            amort: +amort.toFixed(4),
            total: +total.toFixed(4),
            totalInv: +((total / precioCompra) * montoInvertido).toFixed(0),
            vnResidual: +vnResidual.toFixed(4),
          };
        })
      );
      return rows;
    }
    return [];
  }

  // Use detailed schedule
  const lamina = 100; // VN base
  let vnResidual = lamina;
  const rows: CashflowRow[] = [];

  for (const period of schedule) {
    const dt = new Date(period.date);
    if (dt <= today) {
      vnResidual -= period.amortRate * lamina;
      continue;
    }

    const cupon = period.couponRate * vnResidual;
    const amort = period.amortRate * lamina;
    const total = cupon + amort;
    const totalInv = (total / precioCompra) * montoInvertido;

    rows.push({
      fecha: formatDate(dt),
      cupon: +cupon.toFixed(4),
      amort: +amort.toFixed(4),
      total: +total.toFixed(4),
      totalInv: +totalInv.toFixed(0),
      vnResidual: +Math.max(0, vnResidual - amort).toFixed(4),
    });

    vnResidual -= amort;
    if (vnResidual <= 0) break;
  }

  return rows;
}

export function calculateDuration(cashflows: CashflowRow[], precioCompra: number, tir: number): number {
  if (!cashflows.length || !precioCompra) return 0;
  const today = new Date();
  let weightedSum = 0;
  let totalPV = 0;
  const r = tir / 100;

  cashflows.forEach((cf) => {
    const parts = cf.fecha.split(' ');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = months.indexOf(parts[0]);
    const year = parseInt(parts[1]);
    const cfDate = new Date(year, month, 9);
    const t = (cfDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (t <= 0) return;
    const pv = cf.total / Math.pow(1 + r, t);
    weightedSum += pv * t;
    totalPV += pv;
  });

  return totalPV > 0 ? +(weightedSum / totalPV).toFixed(2) : 0;
}

export function getNextCouponDate(cashflows: CashflowRow[]): string {
  return cashflows[0]?.fecha ?? '—';
}
