'use client';
/**
 * components/ToastProvider.jsx
 * ─────────────────────────────────────────────────────────
 * Sistema de notificaciones Toast global.
 * Uso:
 *   const { showToast } = useToast();
 *   showToast('¡Éxito!', 'success');
 *   showToast('Algo salió mal', 'error');
 *   showToast('Info', 'info');
 * ─────────────────────────────────────────────────────────
 */

import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" role="region" aria-label="Notificaciones" aria-live="polite">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role="alert"
          >
            {ICONS[toast.type]}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
