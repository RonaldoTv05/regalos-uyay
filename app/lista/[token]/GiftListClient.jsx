'use client';
/**
 * app/lista/[token]/GiftListClient.jsx
 * ─────────────────────────────────────────────────────────
 * Componente cliente principal que coordina:
 * - Grid de productos con selección múltiple
 * - Panel lateral vertical (CartSidebar) con gestión de cantidades
 * - Modal de Checkout con confirmación y pantalla de éxito
 * - Botón flotante para acceder al carrito en cualquier momento
 * - Polling cada 30s y actualización optimista de stock
 * ─────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import CartSidebar, { getMaxAvailableQty } from '@/components/CartSidebar';
import GiftModal from '@/components/GiftModal';
import { useToast } from '@/components/ToastProvider';

const POLL_INTERVAL = 30_000;

export default function GiftListClient({ token, initialData }) {
  const { showToast } = useToast();

  // ── Estado de productos de la lista ───────────────────────
  const [productos, setProductos] = useState(initialData?.productos ?? []);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Estado del Carrito de Reservas (Sidebar) ──────────────
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ── Estado del Modal de Checkout ──────────────────────────
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // ── Re-fetch de la lista desde Odoo para mantener sincronía ─
  const refreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/list/${token}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setProductos(data.productos ?? []);
    } catch {
      // Polling silencioso
    } finally {
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    const id = setInterval(refreshData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [refreshData]);

  // ── 1. Acción al hacer clic en "Seleccionar" en la tarjeta ──
  const handleSelectProduct = useCallback((item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((p) => p.id === item.id);
      if (existing) {
        // Si ya está en el carrito, no lo duplica
        return prevCart;
      }
      // Se añade al carrito con cantidad inicial de 1
      return [...prevCart, { ...item, qty: 1 }];
    });

    // Abrir automáticamente el sidebar lateral para feedback visual inmediato
    setIsCartOpen(true);
    showToast(`"${item.nombre}" añadido al carrito`, 'info', 2500);
  }, [showToast]);

  // ── 2. Actualizar cantidad de un item en el carrito ────────
  const handleUpdateQty = useCallback((itemId, newQty) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id !== itemId) return item;

        const maxQty = getMaxAvailableQty(item);
        // Restricción: mínimo 1, máximo disponible
        const clampedQty = Math.max(1, Math.min(newQty, maxQty));
        return { ...item, qty: clampedQty };
      })
    );
  }, []);

  // ── 3. Quitar item del carrito ────────────────────────────
  const handleRemoveItem = useCallback((itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
    showToast('Regalo removido del carrito', 'info', 2000);
  }, [showToast]);

  // ── 4. Abrir Checkout desde el botón "Reservar" del Sidebar ─
  const handleOpenCheckout = useCallback(() => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, [cart]);

  // ── 5. Callback tras confirmar reserva exitosa con Odoo ───
  const handleCheckoutSuccess = useCallback((result) => {
    const { reservedItems, reservation_code } = result;

    // Actualización optimista de cantidades regaladas en la UI
    setProductos((prevProducts) =>
      prevProducts.map((p) => {
        const reserved = reservedItems.find((r) => r.id === p.id);
        if (!reserved) return p;

        const currentGifted = p.qty_gifted ?? p.cantidadComprada ?? 0;
        const newGifted = currentGifted + (reserved.qty || 1);
        const wanted = p.qty_wanted ?? p.stockDisponible ?? 1;
        const nuevoEstado = wanted > 0 && newGifted >= wanted ? 'comprado' : p.estado;

        return {
          ...p,
          qty_gifted: newGifted,
          cantidadComprada: newGifted,
          estado: nuevoEstado,
        };
      })
    );

    // Vaciar el carrito de reservas
    setCart([]);

    showToast(`¡Reserva creada exitosamente! Código: ${reservation_code}`, 'success', 6000);

    // Sincronizar con Odoo tras un breve delay
    setTimeout(refreshData, 2000);
  }, [refreshData, showToast]);

  // Totales para métricas y badge flotante
  const cartTotalCount = cart.reduce((acc, it) => acc + (it.qty || 1), 0);
  const cartTotalAmount = cart.reduce(
    (acc, it) => acc + Number(it.precio || 0) * (it.qty || 1),
    0
  );

  const disponibles = productos.filter((p) => p.estado === 'disponible').length;
  const comprados = productos.filter((p) => p.estado === 'comprado').length;
  const total = productos.length;

  return (
    <>
      {/* ── Indicador de sincronización en tiempo real ─────── */}
      {isRefreshing && (
        <div
          className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-white"
          style={{ backgroundColor: 'rgba(66,133,244,0.92)' }}
        >
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Sincronizando con Odoo...
        </div>
      )}

      {/* ── Estadísticas de la lista ───────────────────────── */}
      {total > 0 && (
        <div className="flex justify-center gap-6 mb-6 flex-wrap">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-extrabold text-uyay-blue">{disponibles}</span>
            <span className="text-xs text-uyay-muted font-medium">Disponibles</span>
          </div>
          <div
            className="w-px"
            style={{ height: '40px', backgroundColor: '#E5E7EB', alignSelf: 'center' }}
          />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-extrabold" style={{ color: '#2E7D32' }}>
              {comprados}
            </span>
            <span className="text-xs text-uyay-muted font-medium">Regalados</span>
          </div>
          <div
            className="w-px"
            style={{ height: '40px', backgroundColor: '#E5E7EB', alignSelf: 'center' }}
          />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-extrabold" style={{ color: '#374151' }}>
              {total}
            </span>
            <span className="text-xs text-uyay-muted font-medium">Total</span>
          </div>
        </div>
      )}

      {/* ── Grid de productos ───────────────────────────────── */}
      {productos.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#EBF2FF' }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.625 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 109.375 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="font-bold text-lg text-gray-700">
            No hay regalos en esta lista aún
          </p>
          <p className="text-uyay-muted text-sm mt-1">
            Los regalos se agregarán próximamente.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
          role="list"
          aria-label="Lista de regalos"
        >
          {productos.map((item) => (
            <div key={item.id} role="listitem">
              <ProductCard
                item={item}
                onSelect={handleSelectProduct}
                isInCart={cart.some((c) => c.id === item.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Botón Flotante del Carrito (Trigger cuando hay items) ─ */}
      {cart.length > 0 && !isCartOpen && (
        <button
          id="btn-floating-cart"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-3 px-5 py-3.5 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 text-white font-extrabold cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, var(--color-uyay-blue) 0%, #1565C0 100%)',
            boxShadow: '0 8px 28px rgba(66, 133, 244, 0.45)',
          }}
          aria-label={`Ver carrito de reservas con ${cartTotalCount} regalos`}
        >
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-400 text-gray-900 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
              {cartTotalCount}
            </span>
          </div>

          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-semibold opacity-90">Ver Carrito</span>
            <span className="text-sm font-black">
              S/ {cartTotalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </button>
      )}

      {/* ── Panel Lateral (Carrito de Reservas) ──────────────── */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onOpenCheckout={handleOpenCheckout}
      />

      {/* ── Modal de Checkout (Reserva y Confirmación) ───────── */}
      <GiftModal
        isOpen={isCheckoutOpen}
        items={cart}
        listaId={initialData?.id}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />
    </>
  );
}
