/**
 * app/layout.tsx
 * Layout raíz — Envuelve toda la app con el ToastProvider
 * y configura la fuente Plus Jakarta Sans vía Google Fonts.
 */

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ToastProvider } from '@/components/ToastProvider';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: {
    default: 'Lista de Regalos | UYAY — Regala Emociones',
    template: '%s | UYAY',
  },
  description: 'Regala emociones. Descubre la lista de regalos perfecta para el evento más especial.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${plusJakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
