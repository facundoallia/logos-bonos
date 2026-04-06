'use client';
import { useState, useEffect, useCallback } from 'react';
import { EnrichedBond, TabId } from '@/lib/types';
import { BondsTable } from './BondsTable';
import { YieldCurve } from './YieldCurve';
import { PriceChart } from './PriceChart';
import { CashflowCalculator } from './CashflowCalculator';

const WA_URL =
  'https://wa.me/5493517414245?text=' +
  encodeURIComponent('Hola! Me interesa conocer más sobre bonos argentinos y cómo invertir con Logos Servicios Financieros.');

const ALYCS = [
  { name: 'Balanz',          logo: '/alycs/balanz.png',         url: 'https://logos-serviciosfinancieros.com.ar/servicios/asesoramiento-en-balanz',                        cta: 'Asesoramiento en Balanz' },
  { name: 'Bull Market',     logo: '/alycs/bull-market.png',    url: 'https://logos-serviciosfinancieros.com.ar/servicios/asesoramiento-en-bull-market',                    cta: 'Asesoramiento en Bull Market' },
  { name: 'Invertir Online', logo: '/alycs/invertir-online.png', url: 'https://logos-serviciosfinancieros.com.ar/servicios/vinculacion-de-clientes-invertir-online',        cta: 'Asesoramiento en Invertir Online' },
  { name: 'Inviu',           logo: '/alycs/inviu.png',           url: 'https://logos-serviciosfinancieros.com.ar/servicios/asesoramiento-en-inviu',                         cta: 'Asesoramiento en Inviu' },
];

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
            Panel de Análisis de Bonos Argentinos
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
            {activeTab === 'hard-dollar-gd'
              ? 'Hard Dollar - Globales GD (Ley NY)'
              : activeTab === 'hard-dollar-al'
              ? 'Hard Dollar - Bonares AL (Ley ARG)'
              : MAIN_TABS.find((t) => t.id === activeTab)?.label ?? 'Bonos'}
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
        <PriceChart selectedBond={selectedBond} />
      </div>

      {/* Calculator */}
      <div style={{ marginBottom: 16 }}>
        <CashflowCalculator selectedBond={selectedBond} allBonds={allBonds} />
      </div>

      {/* ── ALYC Strip ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 12, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logos-icon.png" alt="Logos" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#1F4E79' }}>
                Plataformas de operación
              </p>
              <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 700, color: '#0D1B2A' }}>
                Invertí bonos con las mejores ALYCs
              </h2>
            </div>
          </div>
          <p style={{ margin: isMobile ? 0 : '0 0 0 auto', fontSize: 12, color: '#4a6880', maxWidth: 260, textAlign: isMobile ? 'left' : 'right' }}>
            Abrí tu cuenta con cualquiera de nuestras ALYCs asociadas y empezá a operar.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {ALYCS.map((alyc) => (
            <a
              key={alyc.name}
              href={alyc.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '24px 12px',
                border: '1px solid #DDE6EF', background: '#FFFFFF',
                textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = '#1F4E79';
                el.style.boxShadow = '0 4px 16px rgba(31,78,121,0.12)';
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = '#DDE6EF';
                el.style.boxShadow = 'none';
                el.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={alyc.logo} alt={alyc.name} style={{ maxHeight: 52, maxWidth: 160, objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1F4E79', marginTop: 12, textAlign: 'center', lineHeight: 1.3 }}>
                {alyc.cta}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #DDE6EF', paddingTop: 14,
        fontSize: 10, color: '#8ba5bf', lineHeight: 1.6,
      }}>
        Precios: data912.com (delayed ~2hs) | TIR, Duration: bonistas.com |
        Tipos de cambio: dolarapi.com | Logos Servicios Financieros — Agente
        Productor Bursatil N&#176;1271 CNV.
        Informacion de caracter educativo e informativo. No constituye recomendacion de inversion.
      </div>

      {/* Floating WhatsApp button */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 18px', borderRadius: 9999,
          background: '#25D366', color: '#fff',
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          textDecoration: 'none', transition: 'opacity 0.15s, transform 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        aria-label="Consultar por WhatsApp"
      >
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span>Consultar con un asesor</span>
      </a>
    </div>
  );
}
