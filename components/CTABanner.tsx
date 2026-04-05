export function CTABanner() {
  return (
    <div style={{
      background: '#EBF5FB', border: '1px solid #BDD0E0',
      borderRadius: 4, padding: 24,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 16,
    }}>
      <div>
        <p style={{ margin: '0 0 2px', fontSize: 12, color: '#8ba5bf', fontWeight: 500 }}>
          ¿Querés invertir en bonos argentinos?
        </p>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#0D1B2A' }}>
          Consultá con un asesor de Logos
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: '#4a6880' }}>
          Logos Servicios Financieros — Agente Productor Bursátil N°1271 CNV
        </p>
      </div>
      <a
        href="https://wa.me/5493517414245?text=Hola!%20Quiero%20consultar%20sobre%20bonos%20argentinos."
        target="_blank" rel="noopener noreferrer"
        style={{
          background: '#1E4B78', color: '#FFFFFF',
          padding: '12px 24px', borderRadius: 4,
          fontSize: 14, fontWeight: 600,
          textDecoration: 'none', whiteSpace: 'nowrap',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#163A5F')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#1E4B78')}
      >
        Consultar por WhatsApp →
      </a>
    </div>
  );
}
