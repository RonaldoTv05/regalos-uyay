'use client';
/**
 * components/SkeletonGrid.jsx
 * ─────────────────────────────────────────────────────────
 * Grid de tarjetas skeleton mientras se cargan los productos
 * ─────────────────────────────────────────────────────────
 */

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}
    >
      {/* Imagen skeleton */}
      <div className="skeleton w-full" style={{ aspectRatio: '1/1' }} />

      {/* Contenido skeleton */}
      <div className="p-4 flex flex-col gap-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-7 w-1/2 mt-1" />
        <div className="skeleton h-10 w-full rounded-2xl mt-1" />
      </div>
    </div>
  );
}

export default function SkeletonGrid({ count = 6 }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
      aria-busy="true"
      aria-label="Cargando regalos..."
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
