export type BondCategoria =
  | 'hard-dollar-gd'
  | 'hard-dollar-al'
  | 'cer'
  | 'tasa-fija'
  | 'tamar'
  | 'dollar-linked'
  | 'badlar'
  | 'bopreal';

export interface BondConfig {
  ticker: string;
  nombre: string;
  familia: string;
  categoria: BondCategoria;
  legislacion: string;
  vencimiento: string;
  cuponAnualPct: number;
  frecuenciaCupon: string;
  monedaCupon: string;
  monedaCapital: string;
  amortizacion: string;
}

export interface LiveBond {
  symbol: string;
  q_bid: number | null;
  px_bid: number | null;
  px_ask: number | null;
  q_ask: number | null;
  v: number | null;
  q_op: number | null;
  c: number | null;
  pct_change: number | null;
}

export interface HistoricalPoint {
  date: string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  v: number | null;
  dr: number | null;
  sa: number | null;
}

export interface EnrichedBond extends BondConfig {
  precioUSD: number | null;
  precioARS: number | null;
  precioMEP: number | null;
  varDia: number | null;
  volumen: number | null;
  tir: number | null;
  tirPct: number | null;
}

export interface RatesData {
  ccl: number | null;
  mep: number | null;
  source: string;
  ts: string;
}

export type TabId =
  | 'hard-dollar-gd'
  | 'hard-dollar-al'
  | 'cer'
  | 'tasa-fija'
  | 'tamar'
  | 'dollar-linked'
  | 'badlar'
  | 'bopreal';

export type RangeId = '1M' | '3M' | '6M' | '1Y' | 'MAX';

export interface CashflowRow {
  fecha: string;
  cupon: number;
  amort: number;
  total: number;
  totalInv: number;
  vnResidual: number;
}
