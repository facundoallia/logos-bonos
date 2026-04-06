'use client';
import { EnrichedBond } from '@/lib/types';

interface Props {
  bonds: EnrichedBond[];
  value: string;
  onChange: (ticker: string) => void;
}

const GRUPOS = [
  { label: 'Hard Dollar - Globales GD (Ley NY)', cat: 'hard-dollar-gd' },
  { label: 'Hard Dollar - Bonares AL (Ley ARG)', cat: 'hard-dollar-al' },
  { label: 'CER (bonos y letras)', cat: 'cer' },
  { label: 'Tasa Fija (bonos y letras)', cat: 'tasa-fija' },
  { label: 'TAMAR / Duales', cat: 'tamar' },
  { label: 'Dollar Linked', cat: 'dollar-linked' },
  { label: 'BADLAR', cat: 'badlar' },
  { label: 'BOPREAL', cat: 'bopreal' },
];

function fmtDate(s: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function BondSelector({ bonds, value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', padding: '8px 10px', borderRadius: 4,
        border: '1px solid #DDE6EF', background: '#F8FAFC',
        fontSize: 13, color: '#0D1B2A',
      }}
    >
      <option value="">Seleccionar bono...</option>
      {GRUPOS.map((g) => {
        const items = bonds
          .filter((b) => b.categoria === g.cat)
          .sort((a, b) => (a.vencimiento ?? '').localeCompare(b.vencimiento ?? ''));
        if (!items.length) return null;
        return (
          <optgroup key={g.cat} label={g.label}>
            {items.map((b) => (
              <option key={b.ticker} value={b.ticker}>
                {b.ticker} - {fmtDate(b.vencimiento)}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
