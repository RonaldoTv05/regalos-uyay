/**
 * app/lista/[token]/page.tsx
 * ─────────────────────────────────────────────────────────
 * Server Component — Página pública de Lista de Regalos UYAY.
 *
 * Flujo:
 * 1. Lee el token de la URL (params es una Promise en Next.js 16)
 * 2. Llama al Route Handler interno /api/list/[token] para
 *    obtener los datos desde Odoo
 * 3. Maneja estados de error/expiración con páginas amigables
 * 4. Renderiza el Server Component con el Client Component
 *    GiftListClient que gestiona el estado interactivo
 * ─────────────────────────────────────────────────────────
 */
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import GiftListClient from './GiftListClient';
import SkeletonGrid from '@/components/SkeletonGrid';

export const instant = false;


// ── Tipos ────────────────────────────────────────────────

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenBase64: string | null;
  stockDisponible: number;
  cantidadComprada: number;
  estado: 'disponible' | 'comprado' | 'agotado';
  qty_wanted?: number;
  qty_gifted?: number;
  qty_available?: number;
}


interface ListaData {
  id: number;
  nombre: string;
  descripcion: string;
  fechaEvento: string | null;
  fechaCierre: string | null;
  productos: Producto[];
}

// ── Función de fetch de datos ─────────────────────────────

async function getListaData(token: string): Promise<{ data?: ListaData; error?: string; status: number }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/list/${token}`, {
      cache: 'no-store',
    });

    const json = await res.json();

    if (!res.ok) {
      return { error: json.error || 'Error al cargar la lista', status: res.status };
    }

    return { data: json, status: 200 };
  } catch {
    return { error: 'No se pudo conectar con el servidor.', status: 500 };
  }
}

// ── Generación dinámica de metadata ──────────────────────

export async function generateMetadata(

  { params }: PageProps<'/lista/[token]'>
): Promise<Metadata> {
  const { token } = await params;
  const result = await getListaData(token);

  const title = result.data?.nombre
    ? `Lista de Regalos — ${result.data.nombre} | UYAY`
    : 'Lista de Regalos | UYAY';

  return {
    title,
    description: result.data?.descripcion || 'Regala emociones con UYAY. Encuentra el regalo perfecto para este evento especial.',
    openGraph: {
      title,
      description: result.data?.descripcion || 'Regala emociones con UYAY.',
      siteName: 'UYAY — Regala Emociones',
    },
  };
}

// ── Componente de error amigable ──────────────────────────

function ErrorPage({ message, isExpired = false }: { message: string; isExpired?: boolean }) {
  return (
    <div className="min-h-dvh bg-uyay-bg flex flex-col items-center justify-center p-6 text-center">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: isExpired ? '#FFF3E0' : '#FEECEC' }}
      >
        {isExpired ? (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF7043" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF5350" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        )}
      </div>

      <h1 className="text-2xl font-extrabold mb-3" style={{ color: '#1A1A2E' }}>
        {isExpired ? '⏰ Lista Expirada' : 'Lista no encontrada'}
      </h1>
      <p className="text-uyay-muted text-base max-w-xs">{message}</p>

      <div
        className="mt-8 text-xs font-bold tracking-widest uppercase"
        style={{ color: '#4285F4' }}
      >
        UYAY • Regala Emociones
      </div>
    </div>
  );
}

// ── Componente de Header ──────────────────────────────────

function ListaHeader({ lista }: { lista: ListaData }) {
  const fechaEvento = lista.fechaEvento
    ? new Date(lista.fechaEvento).toLocaleDateString('es-PE', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    : null;

  const fechaCierre = lista.fechaCierre
    ? new Date(lista.fechaCierre).toLocaleDateString('es-PE', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    : null;

  return (
    <header className="uyay-header">
      <div className="relative z-10 flex flex-col items-center gap-3">
        {/* Logo UYAY */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(255,255,255,0.35)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.625 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 109.375 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>

        <div
          className="text-xs font-bold tracking-[0.25em] uppercase"
          style={{ color: 'rgba(255,255,255,0.75)' }}
        >
          UYAY • Regala Emociones
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight max-w-xs sm:max-w-sm">
          {lista.nombre}
        </h1>

        {lista.descripcion && (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '28rem' }}>
            {lista.descripcion}
          </p>
        )}

        {/* Fechas */}
        <div className="flex flex-wrap gap-3 justify-center mt-1">
          {fechaEvento && (
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Evento: {fechaEvento}
            </span>
          )}
          {fechaCierre && (
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(255,202,40,0.25)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,202,40,0.4)',
                color: '#FFCA28',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lista hasta: {fechaCierre}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Página principal ──────────────────────────────────────

export default async function ListaPage({ params }: PageProps<'/lista/[token]'>) {
  await connection();
  const { token } = await params;

  const result = await getListaData(token);

  // Lista no encontrada
  if (result.status === 404) {
    notFound();
  }

  // Lista expirada
  if (result.status === 403) {
    return <ErrorPage message={result.error!} isExpired />;
  }

  // Error de servidor
  if (!result.data) {
    return <ErrorPage message={result.error || 'No se pudo cargar la lista de regalos.'} />;
  }

  const lista = result.data;

  return (
    <div className="min-h-dvh bg-uyay-bg">
      {/* Header con info del evento */}
      <ListaHeader lista={lista} />

      {/* Ola decorativa entre header y grid */}
      <div style={{ marginTop: '-2px', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%' }}>
          <path d="M0 0C360 40 1080 40 1440 0V40H0V0Z" fill="#F9FAFB" />
        </svg>
      </div>

      {/* Contenido principal */}
      <main
        id="main-gift-list"
        className="max-w-2xl mx-auto px-4 pb-12"
        style={{ marginTop: '-0.5rem' }}
      >
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <GiftListClient token={token} initialData={lista} />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 px-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-uyay-muted">
          Con ❤️ de <span className="text-uyay-blue">UYAY</span> — Regala Emociones
        </p>
      </footer>
    </div>
  );
}
