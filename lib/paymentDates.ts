export interface PaymentMark {
  fecha: string;
  tipo: 'C' | 'A' | 'C+A';
}

const FREQ_MONTHS: Record<string, number> = {
  Semestral: 6,
  Trimestral: 3,
  Mensual: 1,
  'Zero coupon': 0,
  Capitalizable: 0,
};

export function getPaymentDatesInRange(
  bond: { vencimiento: string | null; frecuenciaCupon: string | null },
  startDate: Date,
  endDate: Date
): PaymentMark[] {
  if (!bond.vencimiento) return [];
  const vto = new Date(bond.vencimiento);
  const payments: PaymentMark[] = [];

  const freq = bond.frecuenciaCupon ?? 'Zero coupon';
  const intervalo = FREQ_MONTHS[freq] ?? 0;

  if (intervalo === 0) {
    if (vto >= startDate && vto <= endDate) {
      payments.push({ fecha: vto.toISOString().substring(0, 10), tipo: 'C+A' });
    }
    return payments;
  }

  let d = new Date(vto);
  while (d >= startDate) {
    if (d >= startDate && d <= endDate) {
      const isVto = d.getTime() === vto.getTime();
      payments.push({
        fecha: d.toISOString().substring(0, 10),
        tipo: isVto ? 'C+A' : 'C',
      });
    }
    d = new Date(d);
    d.setMonth(d.getMonth() - intervalo);
  }

  return payments.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
