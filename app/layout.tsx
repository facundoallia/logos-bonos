import type { Metadata } from 'next';
import './globals.css';
import { IframeResizer } from '@/components/IframeResizer';

export const metadata: Metadata = {
  title: 'Bonos Argentinos — Logos Servicios Financieros',
  description:
    'Precios, TIR, curvas de rendimiento y calculadora de cashflows para bonos argentinos. Hard Dollar (GD/AL), CER, Tasa Fija, TAMAR, Dollar Linked, BADLAR y BOPREAL.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <IframeResizer />
        {children}
      </body>
    </html>
  );
}
