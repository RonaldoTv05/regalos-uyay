/**
 * app/page.tsx
 * Página de inicio — Redirige o muestra demo de desarrollo.
 * En producción puedes mostrar un landing de UYAY o redirigir.
 */

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-uyay-bg flex flex-col items-center justify-center p-6 text-center">
      {/* Logo */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #4285F4, #1565C0)', boxShadow: '0 8px 24px rgba(66,133,244,0.4)' }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.625 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 109.375 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>

      <h1 className="text-4xl font-extrabold mb-2" style={{ color: '#1A1A2E' }}>
        UYAY
      </h1>
      <p className="text-uyay-muted text-lg font-medium mb-8">
        Regala Emociones 🎁
      </p>

      <div
        className="rounded-2xl p-6 max-w-sm w-full text-left"
        style={{ background: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        <h2 className="font-bold text-sm uppercase tracking-wider text-uyay-muted mb-3">
          Modo Desarrollo
        </h2>
        <p className="text-sm" style={{ color: '#374151' }}>
          Accede a una lista de regalos usando la URL:
        </p>
        <code
          className="block mt-2 p-3 rounded-xl text-xs font-mono"
          style={{ background: '#F3F4F6', color: '#1A1A2E', wordBreak: 'break-all' }}
        >
          /lista/<span style={{ color: '#4285F4' }}>TOKEN_AQUI</span>
        </code>
        <p className="text-xs text-uyay-muted mt-3">
          El token es generado por Odoo al crear un registro en{' '}
          <code>gift.registry</code>.
        </p>
      </div>
    </div>
  );
}
