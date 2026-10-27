/**
 * app/not-found.tsx
 * Página 404 global con diseño UYAY
 */

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-uyay-bg flex flex-col items-center justify-center p-6 text-center">
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: '#EBF2FF' }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: '#1A1A2E' }}>
        Lista no encontrada
      </h1>
      <p className="text-uyay-muted max-w-xs">
        El enlace que usaste no corresponde a ninguna lista de regalos activa.
        Verifica el enlace con quien te lo compartió.
      </p>
      <div className="mt-8 text-xs font-bold tracking-widest uppercase text-uyay-blue">
        UYAY • Regala Emociones
      </div>
    </div>
  );
}
