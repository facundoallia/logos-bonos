'use client';
import { useState, useEffect, useCallback } from 'react';
import { EnrichedBond, TabId } from '@/lib/types';
import { BondsTable } from './BondsTable';
import { YieldCurve } from './YieldCurve';
import { PriceChart } from './PriceChart';
import { CashflowCalculator } from './CashflowCalculator';

const MAIN_TABS: { id: TabId; label: string }[] = [
  { id: 'hard-dollar-gd', label: 'Hard Dollar' },
  { id: 'cer', label: 'CER' },
  { id: 'tasa-fija', label: 'Tasa Fija' },
  { id: 'tamar', label: 'TAMAR' },
  { id: 'dollar-linked', label: 'Dollar Linked' },
  { id: 'badlar', label: 'BADLAR' },
  { id: 'bopreal', label: 'BOPREAL' },
];

const USD_CATS: TabId[] = ['hard-dollar-gd', 'hard-dollar-al', 'bopreal'];

const TAB_CURVE_TITLES: Partial<Record<TabId, string>> = {
  'hard-dollar-gd': 'Curva HD (GD) - TIR en USD',
  'hard-dollar-al': 'Curva HD (AL) - TIR en USD',
  cer: 'Curva CER - TIR real (ex inflacion)',
  'tasa-fija': 'Curva Tasa Fija - TIR en ARS',
  tamar: 'Curva TAMAR',
  'dollar-linked': 'Curva Dollar Linked',
  badlar: 'Curva BADLAR',
  bopreal: 'Curva BOPREAL - TIR en USD',
};

function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768) setBp('mobile');
      else if (w < 1024) setBp('tablet');
      else setBp('desktop');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return bp;
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px', fontSize: 13, cursor: 'pointer',
        border: 'none', borderRadius: '4px 4px 0 0',
        background: active ? '#1F4E79' : 'transparent',
        color: active ? '#FFFFFF' : '#4a6880',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = '#EBF5FB';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

export function BondsApp() {
  const [activeTab, setActiveTab] = useState<TabId>('hard-dollar-gd');
  const [hdSubTab, setHdSubTab] = useState<'gd' | 'al'>('gd');
  const [bonds, setBonds] = useState<EnrichedBond[]>([]);
  const [allBonds, setAllBonds] = useState<EnrichedBond[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [rates, setRates] = useState<{ ccl: number | null; mep: number | null } | null>(null);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isNarrow = bp !== 'desktop';

  const fetchBonds = useCallback(async (category: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bonds?category=${category}`);
      const data: EnrichedBond[] = await res.json();
      setBonds(data);
      if (data.length > 0) {
        setSelectedTicker((prev) => prev ?? data[0].ticker);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch('/api/bonds?category=all')
      .then((r) => r.json())
      .then((d: EnrichedBond[]) => setAllBonds(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/rates')
      .then((r) => r.json())
      .then(setRates)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedTicker(null);
    const cat =
      activeTab === 'hard-dollar-gd' || activeTab === 'hard-dollar-al'
        ? hdSubTab === 'gd' ? 'hard-dollar-gd' : 'hard-dollar-al'
        : activeTab;
    fetchBonds(cat);
  }, [activeTab, hdSubTab, fetchBonds]);

  const isUSD = USD_CATS.includes(activeTab);
  const selectedBond = bonds.find((b) => b.ticker === selectedTicker) ?? null;
  const curveTitle = TAB_CURVE_TITLES[activeTab];

  const panelHeight = isMobile ? undefined : 400;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '12px' : '20px 24px' }}>

      {/* Header */}
      <div style={{
        paddingBottom: 12, marginBottom: 16,
        borderBottom: '1px solid #DDE6EF',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#0D1B2A' }}>
            Bonos Argentinos
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#8ba5bf' }}>
            Logos Servicios Financieros | datos: data912.com + bonistas.com
          </p>
        </div>
        {rates && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {rates.ccl != null && (
              <div style={{
                background: '#EBF5FB', border: '1px solid #BDD0E0',
                borderRadius: 4, padding: '5px 10px', fontSize: 12,
              }}>
                <span style={{ color: '#8ba5bf' }}>CCL: </span>
                <span style={{ fontWeight: 700, color: '#0D1B2A' }}>
                  ${rates.ccl.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
            {rates.mep != null && (
              <div style={{
                background: '#EBF5FB', border: '1px solid #BDD0E0',
                borderRadius: 4, padding: '5px 10px', fontSize: 12,
              }}>
                <span style={{ color: '#8ba5bf' }}>MEP: </span>
                <span style={{ fontWeight: 700, color: '#0D1B2A' }}>
                  ${rates.mep.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main tabs */}
      <div style={{
        display: 'flex', gap: 2, flexWrap: 'wrap',
        borderBottom: '2px solid #DDE6EF', marginBottom: 16,
        overflowX: 'auto',
      }}>
        {MAIN_TABS.map((tab) => (
          <TabButton
            key={tab.id}
            active={
              activeTab === tab.id ||
              (tab.id === 'hard-dollar-gd' && activeTab === 'hard-dollar-al')
            }
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'hard-dollar-gd') setHdSubTab('gd');
            }}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>

      {/* HD sub-tabs */}
      {(activeTab === 'hard-dollar-gd' || activeTab === 'hard-dollar-al') && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {([
            { id: 'gd' as const, label: 'Globales GD (Ley NY)' },
            { id: 'al' as const, label: 'Bonares AL (Ley ARG)' },
          ]).map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setHdSubTab(st.id);
                setActiveTab(st.id === 'gd' ? 'hard-dollar-gd' : 'hard-dollar-al');
              }}
              style={{
                padding: '6px 14px', fontSize: 12, cursor: 'pointer',
                border: '1px solid #DDE6EF', borderRadius: 4,
                background: hdSubTab === st.id ? '#EBF5FB' : 'transparent',
                color: hdSubTab === st.id ? '#1F4E79' : '#4a6880',
                fontWeight: hdSubTab === st.id ? 600 : 400,
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {/* Table + Curve panel */}
      <div style={{
        display: isNarrow ? 'block' : 'flex',
        gap: 16,
        height: isNarrow ? undefined : panelHeight,
        alignItems: 'stretch',
        marginBottom: 16,
      }}>
        {/* Table 58% */}
        <div style={{
          flex: isNarrow ? undefined : '0 0 58%',
          display: 'flex', flexDirection: 'column',
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#0D1B2A' }}>
            {MAIN_TABS.find((t) => t.id === activeTab)?.label ?? 'Bonos'}
          </h3>
          {loading ? (
            <div style={{
              flex: 1, background: '#F8FAFC', border: '1px solid #DDE6EF',
              borderRadius: 6, display: 'flex', alignItems: 'center',
              justifyContent: 'center', height: 120, color: '#8ba5bf', fontSize: 13,
            }}>
              Cargando datos de mercado...
            </div>
          ) : (
            <BondsTable
              bonds={bonds}
              isUSD={isUSD}
              selectedTicker={selectedTicker}
              onSelect={(t) => setSelectedTicker(t)}
            />
          )}
        </div>

        {/* Curve 42% */}
        <div style={{
          flex: isNarrow ? undefined : '0 0 42%',
          display: 'flex', flexDirection: 'column',
          background: '#FFFFFF', border: '1px solid #DDE6EF',
          borderRadius: 6, padding: 16,
          marginTop: isNarrow ? 12 : 0,
          height: isNarrow ? 300 : undefined,
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#0D1B2A' }}>
            Curva de Rendimientos
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <YieldCurve
              bonds={bonds}
              selectedTicker={selectedTicker}
              onSelect={(t) => setSelectedTicker(t)}
              title={curveTitle}
            />
          </div>
        </div>
      </div>

      {/* Price chart */}
      <div style={{ marginBottom: 16 }}>
        <PriceChart
          ticker={selectedTicker}
          isUSD={isUSD}
          selectedBond={selectedBond}
        />
      </div>

      {/* Calculator */}
      <div style={{ marginBottom: 16 }}>
        <CashflowCalculator selectedBond={selectedBond} allBonds={allBonds} />
      </div>

      {/* Minimal footer — CTAs are in Joomla HTML outside iframe */}
      <div style={{
        borderTop: '1px solid #DDE6EF', paddingTop: 14,
        fontSize: 10, color: '#8ba5bf', lineHeight: 1.6,
      }}>
        Precios: data912.com (delayed ~2hs) | TIR, Duration: bonistas.com |
        Tipos de cambio: dolarapi.com | Logos Servicios Financieros — Agente
        Productor Bursatil N&#176;1271 CNV.
        Informacion de caracter educativo e informativo. No constituye recomendacion de inversion.
      </div>
    </div>
  );
}
