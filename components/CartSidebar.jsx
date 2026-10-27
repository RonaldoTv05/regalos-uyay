'use client';
/**
 * components/CartSidebar.jsx
 * ─────────────────────────────────────────────────────────
 * Panel Lateral Vertical (Carrito de Reservas).
 * Lista los productos seleccionados, permite gestionar
 * cantidades dentro de los límites de stock disponible,
 * calcula subtotales y total general, y da paso a la reserva.
 * ─────────────────────────────────────────────────────────
 */

import { useEffect } from 'react';

/**
 * Calcula la cantidad máxima que un invitado puede reservar:
 * Cantidad solicitada por el dueño MENOS los que ya han sido regalados/reservados.
 */
export function getMaxAvailableQty(item) {
  const wanted = Number(item.qty_wanted ?? item.stockDisponible ?? 1);
  const gifted = Number(item.qty_gifted ?? item.cantidadComprada ?? 0);
  const remaining = Math.max(1, wanted - gifted);
  return remaining;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onOpenCheckout,
}) {
  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll de la página cuando el sidebar está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Cálculos de totales
  const totalItemsCount = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
  const totalAmount = cart.reduce(
    (acc, item) => acc + Number(item.precio || 0) * (item.qty || 1),
    0
  );

  return (
    <>
      {/* ── Backdrop ───────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel Lateral Derecho ──────────────────────────── */}
      <aside
        id="cart-sidebar"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] max-w-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de reservas"
      >
        {/* Cabecera del Sidebar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#EBF2FF', color: 'var(--color-uyay-blue)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 leading-none">
                Carrito de Reservas
              </h2>
              <span className="text-xs text-uyay-muted font-medium mt-1 inline-block">
                {totalItemsCount} {totalItemsCount === 1 ? 'regalo seleccionado' : 'regalos seleccionados'}
              </span>
            </div>
          </div>

          <button
            id="btn-close-cart-sidebar"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar panel de reservas"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de productos seleccionados */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <p className="font-bold text-gray-700 text-base">
                Tu carrito de reservas está vacío
              </p>
              <p className="text-xs text-gray-400 max-w-xs mt-1.5 leading-relaxed">
                Selecciona los regalos que deseas obsequiar de la lista para reservarlos temporalmente.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const maxQty = getMaxAvailableQty(item);
              const isMax = item.qty >= maxQty;
              const isMin = item.qty <= 1;
              const subtotal = Number(item.precio || 0) * item.qty;

              return (
                <div
                  key={item.id}
                  className="bg-gray-50/80 hover:bg-gray-50 border border-gray-200/70 rounded-2xl p-3.5 transition-all"
                >
                  {/* Fila superior: Nombre y botón eliminar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-2">
                        {item.nombre}
                      </h3>
                      <p className="text-xs text-uyay-muted mt-0.5">
                        Precio unitario:{' '}
                        <span className="font-semibold text-gray-700">
                          S/{' '}
                          {Number(item.precio).toLocaleString('es-PE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                    </div>

                    <button
                      id={`btn-remove-${item.id}`}
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Quitar del carrito"
                      aria-label={`Quitar ${item.nombre} del carrito`}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>

                  {/* Fila inferior: Control de Cantidad y Subtotal */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-200/60">
                    {/* Control de cantidad con botones [-] y [+] */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-xs overflow-hidden">
                        <button
                          id={`btn-dec-qty-${item.id}`}
                          onClick={() => onUpdateQty(item.id, item.qty - 1)}
                          disabled={isMin}
                          className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Disminuir cantidad"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                          </svg>
                        </button>

                        <span
                          id={`qty-value-${item.id}`}
                          className="w-9 text-center text-xs font-extrabold text-gray-900 select-none"
                        >
                          {item.qty}
                        </span>

                        <button
                          id={`btn-inc-qty-${item.id}`}
                          onClick={() => onUpdateQty(item.id, item.qty + 1)}
                          disabled={isMax}
                          className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Aumentar cantidad"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      </div>

                      {/* Indicador de límite de stock disponible */}
                      <span className="text-[11px] text-uyay-muted">
                        de {maxQty} disp.
                      </span>
                    </div>

                    {/* Subtotal del item */}
                    <div className="text-right">
                      <span className="text-xs text-uyay-muted block text-[10px] uppercase font-bold tracking-wider">
                        Subtotal
                      </span>
                      <span className="font-extrabold text-sm text-gray-900">
                        S/{' '}
                        {subtotal.toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Pie del Sidebar (Totales y Botón Reservar) ────────── */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-white shadow-lg space-y-3">
            {/* Resumen de cantidades y suma total */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-uyay-muted">
                <span>Total de regalos:</span>
                <span className="font-semibold text-gray-800">{totalItemsCount}</span>
              </div>
              <div className="flex justify-between items-center text-base">
                <span className="font-bold text-gray-800">Suma Total:</span>
                <span className="text-2xl font-extrabold" style={{ color: 'var(--color-uyay-blue)' }}>
                  S/{' '}
                  {totalAmount.toLocaleString('es-PE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Botón Reservar */}
            <button
              id="btn-sidebar-reservar"
              onClick={onOpenCheckout}
              disabled={cart.length === 0}
              className="btn-uyay-primary w-full py-3.5 text-base flex items-center justify-center gap-2 shadow-md"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.625 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 109.375 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              Reservar
            </button>

            <p className="text-[11px] text-center text-gray-400">
              Pago contraentrega en tienda UYAY dentro de las 24 hrs.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
