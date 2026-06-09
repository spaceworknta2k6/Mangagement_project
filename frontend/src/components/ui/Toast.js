'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, WarningCircle, XCircle, Info, X } from '@phosphor-icons/react';
import css from './Toast.module.css';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={18} weight="fill" className={css.s1} />,
  warning: <WarningCircle size={18} weight="fill" className={css.s2} />,
  error: <XCircle size={18} weight="fill" className={css.s3} />,
  info: <Info size={18} weight="fill" className={css.s4} />,
};

const toastTypeClass = {
  success: css.success,
  warning: css.warning,
  error: css.error,
  info: css.info,
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useMemo(() => ({
    success: (msg, dur) => addToast(msg, 'success', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container */}
      <div className={css.s5} >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={[css.toast, toastTypeClass[t.type] || css.info].filter(Boolean).join(' ')}
            >
              <div className={css.s6}>
                {ICONS[t.type]}
              </div>
              <p className={css.s7}>
                {t.message}
              </p>
              <button
                onClick={() => removeToast(t.id)} aria-label="Đóng" className={css.s8}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
