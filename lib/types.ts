export type BondCategoria =
  | 'hard-dollar-gd'
  | 'hard-dollar-al'
  | 'cer'
  | 'tasa-fija'
  | 'tamar'
  | 'dollar-linked'
  | 'badlar'
  | 'bopreal';

export interface BondConfigSlim {
  ticker: string;
  nombre: string;
  categoria: BondCategoria;
  sufijoPrecioUSD: 'D' | 'C' | null;
  /** Override data912 D-ticker (e.g. BOPREAL: BPOA7 -> BPA7D) */
  tickerD?: string;
  /** Override data912 C-ticker (e.g. BOPREAL: BPOA7 -> BPA7C) */
  tickerC?: string;
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

export interface EnrichedBond extends BondConfigSlim {
  // Bonistas metadata
  vencimiento: string | null;
  emision: string | null;
  descripcion: string | null;
  frecuenciaCupon: string | null;
  monedaCupon: string | null;
  amortizacion: string | null;
  index: string | null;
  settlement: string | null;      // '24hs' | 'CI' | etc.
  daysToCoupon: number | null;
  daysToFinish: number | null;
  fairValue: number | null;
  parity: number | null;
  volumenM: number | null;
  // Rates
  tir: number | null;     // % ej: 9.95
  tem: number | null;     // % ej: 0.7948
  tna: number | null;     // % ej: 9.54
  md: number | null;      // modified duration ej: 4.70
  // Prices
  precioUSD: number | null;
  precioARS: number | null;
  precioMEP: number | null;
  varDia: number | null;
  volumenBYMA: number | null;
  // Historical
  histTicker: string;
  hasHistorical: boolean;
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
