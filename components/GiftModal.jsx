'use client';
/**
 * components/GiftModal.jsx
 * ─────────────────────────────────────────────────────────
 * Modal de Checkout para la reserva múltiple de regalos.
 *
 * Características:
 * - Sin imágenes individuales de producto
 * - Aviso superior destacado: "Tiene 24 horas para hacer el pago contraentrega en la tienda UYAY"
 * - Resumen compacto de los regalos a reservar
 * - Formulario con validación: DNI, Nombre completo, Celular, Correo
 * - Botón de confirmación: "Separar Regalos y Confirmar"
 * - Envío a /api/order con payload estructurado
 * - Pantalla de Éxito con el código de reserva devuelto por Odoo
 * ─────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react';
import { useToast } from './ToastProvider';

const INITIAL_FORM = { dni: '', nombre: '', celular: '', correo: '' };

// ── Pantalla de Éxito ─────────────────────────────────────

function SuccessScreen({ reservationCode, items, onClose }) {
  const [copied, setCopied] = useState(false);
  const confettiColors = ['#4285F4', '#FF7043', '#FFCA28', '#EF5350', '#43A047'];

  const totalAmount = items.reduce(
    (acc, it) => acc + Number(it.precio || 0) * (it.qty || 1),
    0
  );

  const handleCopy = () => {
    if (reservationCode && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(reservationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-4 py-2">
      {/* Confetti dots decorativo */}
      <div className="relative w-full h-10 pointer-events-none overflow-hidden">
        {confettiColors.map((color, i) => (
          <span
            key={i}
            className="confetti-dot"
            style={{
              backgroundColor: color,
              left: `${12 + i * 18}%`,
              animationDelay: `${i * 0.12}s`,
              animationDuration: `${1.1 + i * 0.15}s`,
              borderRadius: i % 2 === 0 ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      {/* Ícono animado de éxito */}
      <div
        className="w-18 h-18 rounded-full flex items-center justify-center shadow-xs"
        style={{ backgroundColor: '#E8F5E9' }}
      >
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="#43A047" strokeWidth="3" fill="none" />
          <path
            className="check-circle"
            d="M14 24.5L21 31.5L34 17"
            stroke="#43A047"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Mensaje principal de Éxito */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight">
          ¡Reserva Exitosa!
        </h2>
        <p className="text-gray-600 mt-2 text-base font-semibold">
          Tu código para pagar en caja es:
        </p>
      </div>

      {/* Caja de Código de Reserva */}
      <div
        className="w-full rounded-2xl p-4 sm:p-5 my-1 transition-all"
        style={{
          backgroundColor: '#EBF2FF',
          border: '2px dashed var(--color-uyay-blue)',
        }}
      >
        <span className="text-xs font-bold text-uyay-blue uppercase tracking-widest block mb-1">
          Código de Reserva UYAY
        </span>
        <div className="flex items-center justify-center gap-3">
          <span
            id="lbl-reservation-code"
            className="text-3xl sm:text-4xl font-extrabold tracking-widest text-gray-900 select-all font-mono"
          >
            {reservationCode}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-xl bg-white border border-blue-200 text-uyay-blue hover:bg-blue-50 transition-colors shadow-xs"
            title="Copiar código"
            aria-label="Copiar código de reserva"
          >
            {copied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
        {copied && (
          <span className="text-xs font-bold text-emerald-600 mt-1 block">
            ✓ ¡Código copiado al portapapeles!
          </span>
        )}
      </div>

      {/* Recordatorio de 24 horas y monto */}
      <div className="w-full bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-left flex items-start gap-2.5">
        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <div className="text-xs text-amber-900">
          <p className="font-bold">
            Tiene 24 horas para hacer el pago contraentrega en la tienda UYAY.
          </p>
          <p className="text-amber-700 mt-0.5">
            Monto a pagar en caja:{' '}
            <strong className="text-gray-900">
              S/ {totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>{' '}
            por {items.reduce((s, it) => s + it.qty, 0)} regalo(s).
          </p>
        </div>
      </div>

      <button
        id="btn-volver-lista-exito"
        className="btn-uyay-primary w-full mt-2 py-3 text-base"
        onClick={onClose}
      >
        Volver a la lista de regalos
      </button>
    </div>
  );
}

// ── Componente Principal del Modal de Checkout ─────────────

export default function GiftModal({
  isOpen,
  items = [],
  listaId,
  onClose,
  onSuccess,
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState(null);

  const firstInputRef = useRef(null);
  const backdropRef = useRef(null);

  // Auto-focus en el primer campo al abrir
  useEffect(() => {
    if (isOpen && !successCode) {
      setTimeout(() => firstInputRef.current?.focus(), 150);
    }
  }, [isOpen, successCode]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll de fondo
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

  if (!isOpen) return null;

  // Cálculo de totales
  const totalCount = items.reduce((acc, it) => acc + (it.qty || 1), 0);
  const totalAmount = items.reduce(
    (acc, it) => acc + Number(it.precio || 0) * (it.qty || 1),
    0
  );

  // ── Validación del formulario ──────────────────────────
  function validate() {
    const errs = {};
    const dniClean = form.dni.trim();
    const nombreClean = form.nombre.trim();
    const celularClean = form.celular.trim().replace(/\s/g, '');
    const correoClean = form.correo.trim();

    if (!/^\d{8}$/.test(dniClean)) {
      errs.dni = 'Ingresa tu DNI de 8 dígitos numéricos';
    }
    if (nombreClean.length < 3) {
      errs.nombre = 'Ingresa tu nombre completo (mínimo 3 caracteres)';
    }
    if (!/^\d{9,15}$/.test(celularClean)) {
      errs.celular = 'Ingresa un celular válido (9 dígitos)';
    }
    if (correoClean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoClean)) {
      errs.correo = 'Ingresa un correo electrónico válido';
    }

    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  // ── Envío del formulario ───────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (!items || items.length === 0) {
      showToast('No has seleccionado regalos para reservar.', 'error');
      return;
    }

    setLoading(true);

    try {
      // Payload estricto solicitado:
      // { guest_name, guest_dni, guest_phone, guest_email, items: [{ registry_line_id, qty }, ...] }
      const payload = {
        guest_name: form.nombre.trim(),
        guest_dni: form.dni.trim(),
        guest_phone: form.celular.trim(),
        guest_email: form.correo.trim(),
        listaId,
        items: items.map((it) => ({
          registry_line_id: it.id,
          qty: it.qty || 1,
        })),
      };

      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          showToast(
            data.error || 'Uno o más regalos ya fueron reservados por otro invitado.',
            'error',
            6000
          );
          onClose();
          return;
        }
        throw new Error(data.error || 'Error al procesar la reserva');
      }

      const returnedCode = data.reservation_code || data.codigoRecojo || 'RSV-UYAY';
      setSuccessCode(returnedCode);

      // Notificar al componente padre para actualización optimista de inventario
      if (onSuccess) {
        onSuccess({
          reservation_code: returnedCode,
          reservedItems: items,
        });
      }
    } catch (err) {
      showToast(err.message || 'Hubo un error de conexión. Intenta nuevamente.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="modal-backdrop"
        onClick={(e) => {
          if (e.target === backdropRef.current) onClose();
        }}
        aria-hidden="true"
      />

      {/* Panel del modal */}
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-checkout-title"
      >
        {/* Handle bar móvil */}
        <div
          className="w-12 h-1 rounded-full mx-auto mb-4 sm:hidden"
          style={{ backgroundColor: '#D1D5DB' }}
        />

        {/* Botón Cerrar */}
        <button
          id="btn-cerrar-checkout-modal"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Cerrar modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Contenido: Pantalla de Éxito o Formulario */}
        {successCode ? (
          <SuccessScreen
            reservationCode={successCode}
            items={items}
            onClose={onClose}
          />
        ) : (
          <>
            {/* ── Aviso Superior Requerido ──────────────────────── */}
            <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 mb-5 flex items-start gap-3 shadow-xs">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-amber-900 leading-snug">
                  Tiene 24 horas para hacer el pago contraentrega en la tienda UYAY
                </p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Completa tus datos para generar tu código único y separar los regalos de inmediato.
                </p>
              </div>
            </div>

            {/* ── Resumen de Regalos a Reservar (Sin imagen individual) ── */}
            <div className="bg-gray-50 border border-gray-200/70 rounded-2xl p-3.5 mb-5 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider pb-1 border-b border-gray-200/60">
                <span>Regalos a reservar ({totalCount})</span>
                <span>Subtotal</span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-100">
                {items.map((it) => (
                  <div key={it.id} className="pt-1.5 first:pt-0 flex justify-between items-center text-xs sm:text-sm">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-gray-800 truncate">
                        {it.nombre}
                      </p>
                      <span className="text-[11px] text-uyay-muted">
                        Cant: <strong>{it.qty}</strong> × S/ {Number(it.precio).toFixed(2)}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 whitespace-nowrap">
                      S/{' '}
                      {(Number(it.precio) * it.qty).toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold">
                <span className="text-gray-700">Total a pagar en caja:</span>
                <span className="text-lg font-extrabold text-uyay-blue">
                  S/{' '}
                  {totalAmount.toLocaleString('es-PE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* ── Formulario de Invitado ────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate>
              <h3
                id="modal-checkout-title"
                className="font-bold text-sm uppercase tracking-wider text-gray-600 mb-3"
              >
                Datos del Invitado
              </h3>

              <div className="flex flex-col gap-3.5">
                {/* DNI */}
                <div>
                  <label htmlFor="input-dni" className="block text-xs font-bold text-gray-700 mb-1">
                    DNI <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    id="input-dni"
                    name="dni"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{8}"
                    maxLength={8}
                    value={form.dni}
                    onChange={handleChange}
                    placeholder="8 dígitos (ej. 12345678)"
                    className={`form-input ${errors.dni ? 'error' : ''}`}
                    disabled={loading}
                    autoComplete="off"
                  />
                  {errors.dni && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{errors.dni}</p>
                  )}
                </div>

                {/* Nombre Completo */}
                <div>
                  <label htmlFor="input-nombre" className="block text-xs font-bold text-gray-700 mb-1">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-nombre"
                    name="nombre"
                    type="text"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Nombre y Apellidos"
                    className={`form-input ${errors.nombre ? 'error' : ''}`}
                    disabled={loading}
                    autoComplete="name"
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{errors.nombre}</p>
                  )}
                </div>

                {/* Celular */}
                <div>
                  <label htmlFor="input-celular" className="block text-xs font-bold text-gray-700 mb-1">
                    Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-celular"
                    name="celular"
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    value={form.celular}
                    onChange={handleChange}
                    placeholder="987654321"
                    className={`form-input ${errors.celular ? 'error' : ''}`}
                    disabled={loading}
                    autoComplete="tel"
                  />
                  {errors.celular && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{errors.celular}</p>
                  )}
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label htmlFor="input-correo" className="block text-xs font-bold text-gray-700 mb-1">
                    Correo electrónico <span className="text-uyay-muted font-normal">(opcional)</span>
                  </label>
                  <input
                    id="input-correo"
                    name="correo"
                    type="email"
                    value={form.correo}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    className={`form-input ${errors.correo ? 'error' : ''}`}
                    disabled={loading}
                    autoComplete="email"
                  />
                  {errors.correo && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{errors.correo}</p>
                  )}
                </div>
              </div>

              {/* Botón Final Requerido */}
              <button
                id="btn-confirmar-reserva"
                type="submit"
                className="btn-uyay-primary w-full mt-5 py-3.5 text-base flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Procesando Reserva con Odoo...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.625 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 109.375 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    Separar Regalos y Confirmar
                  </>
                )}
              </button>

              <p className="text-[11px] text-uyay-muted text-center mt-2.5">
                🔒 Tus datos están protegidos y solo se usan para validar tu retiro en caja.
              </p>
            </form>
          </>
        )}
      </div>
    </>
  );
}
