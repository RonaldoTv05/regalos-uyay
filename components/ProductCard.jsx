'use client';
/**
 * components/ProductCard.jsx
 * ─────────────────────────────────────────────────────────
 * Tarjeta de producto con:
 * - Indicador visual de cantidad solicitada por el dueño ("Solicitados: X")
 * - Botón "Seleccionar" que cambia a "✓ Añadido" cuando está en el carrito
 * - Imagen Base64, precio en S/ PEN y badge de estado
 * ─────────────────────────────────────────────────────────
 */

import { useState } from 'react';

// ── Badges de estado ──────────────────────────────────────

const BADGE_CONFIG = {
  disponible: { label: '✓ Disponible',        className: 'badge badge-disponible' },
  comprado:   { label: '🎁 ¡Ya lo regalaron!', className: 'badge badge-comprado'   },
  agotado:    { label: '✕ Agotado',            className: 'badge badge-agotado'    },
};

// ── Ícono de regalo SVG ───────────────────────────────────

function GiftIcon({ size = 40, color = '#4285F4' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.625 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 109.375 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

// ── Componente principal ──────────────────────────────────

export default function ProductCard({ item, onSelect, isInCart = false }) {
  const [imgError, setImgError] = useState(false);

  const badge = BADGE_CONFIG[item.estado] ?? BADGE_CONFIG.disponible;
  const isDisponible = item.estado === 'disponible';

  // Cantidad total solicitada por el dueño de la lista
  const qtyWanted = Number(item.qty_wanted ?? item.stockDisponible ?? 1);
  const qtyGifted = Number(item.qty_gifted ?? item.cantidadComprada ?? 0);

  const imagenSrc = (!imgError && item.imagenBase64)
    ? `data:image/png;base64,${item.imagenBase64}`
    : null;

  const precioFormateado = Number(item.precio).toLocaleString('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  });

  return (
    <article
      className={`product-card ${item.estado === 'comprado' ? 'is-comprado' : ''} ${item.estado === 'agotado' ? 'is-agotado' : ''} ${isInCart ? 'ring-2 ring-blue-500/50' : ''}`}
      aria-label={`${item.nombre} — ${badge.label}`}
    >
      {/* Imagen del producto */}
      <div
        className="relative w-full"
        style={{ aspectRatio: '1 / 1', backgroundColor: '#EBF2FF', overflow: 'hidden' }}
      >
        {imagenSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imagenSrc}
            alt={item.nombre}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <GiftIcon size={44} color={isDisponible ? '#4285F4' : '#9CA3AF'} />
          </div>
        )}

        {/* Badge flotante de estado */}
        <div className="absolute top-2.5 left-2.5">
          <span className={badge.className}>{badge.label}</span>
        </div>

        {/* Badge de cantidad solicitada en la esquina superior derecha */}
        <div className="absolute top-2.5 right-2.5">
          <span className="bg-white/90 backdrop-blur-xs text-gray-800 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-gray-200/80">
            Solicitados: {qtyWanted}
          </span>
        </div>
      </div>

      {/* Info del producto */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-sm leading-snug line-clamp-2" style={{ color: '#1A1A2E' }}>
            {item.nombre}
          </h3>
          {item.descripcion && (
            <p className="text-xs text-uyay-muted mt-1 line-clamp-2">
              {item.descripcion}
            </p>
          )}
        </div>

        {/* Indicador visual de cantidad solicitada y regalada */}
        <div className="flex items-center justify-between text-xs text-uyay-muted font-medium">
          <span className="font-semibold text-gray-700">
            Solicitados: <strong className="text-gray-900">{qtyWanted}</strong>
          </span>
          {qtyGifted > 0 && (
            <span className="text-emerald-700 font-semibold">
              {qtyGifted} regalado{qtyGifted !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Barra de progreso de compra (si aplica) */}
        {qtyGifted > 0 && qtyWanted > 0 && (
          <div className="w-full rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: '#E5E7EB' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (qtyGifted / qtyWanted) * 100)}%`,
                backgroundColor: 'var(--color-uyay-orange)',
              }}
            />
          </div>
        )}

        {/* Precio */}
        <div className="flex items-baseline gap-1">
          <span
            className="text-xl font-extrabold"
            style={{ color: isDisponible ? 'var(--color-uyay-blue)' : '#9CA3AF' }}
          >
            {precioFormateado}
          </span>
        </div>

        {/* Botón de acción */}
        {isDisponible ? (
          isInCart ? (
            /* Botón cuando ya está en el carrito (evita doble clic) */
            <button
              id={`btn-select-${item.id}`}
              className="w-full text-sm py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-not-allowed opacity-90 shadow-xs"
              disabled
              aria-disabled="true"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Añadido
            </button>
          ) : (
            /* Botón Seleccionar */
            <button
              id={`btn-select-${item.id}`}
              className="btn-uyay-primary w-full text-sm py-2.5 flex items-center justify-center gap-1.5"
              onClick={() => onSelect(item)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Seleccionar
            </button>
          )
        ) : (
          /* Estado no disponible */
          <button
            id={`btn-select-${item.id}`}
            className="btn-uyay-primary w-full text-sm py-2.5"
            disabled
            aria-disabled="true"
          >
            {item.estado === 'comprado' && '✓ ¡Ya lo regalaron!'}
            {item.estado === 'agotado' && 'Agotado'}
          </button>
        )}
      </div>
    </article>
  );
}
