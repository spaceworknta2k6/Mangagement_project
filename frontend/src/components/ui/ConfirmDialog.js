'use client';

import { WarningCircle } from '@phosphor-icons/react';
import Button from './Button';
import css from './ConfirmDialog.module.css';

export default function ConfirmDialog({
  open,
  title = 'Xác nhận thao tác',
  message,
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      role="presentation"
      className={css.s1}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title" className={css.s2} >
        <div className={css.s3}>
          <div className={css.s4} >
            <WarningCircle size={20} weight="fill" />
          </div>
          <div className={css.s5}>
            <h3 id="confirm-dialog-title" className={css.s6}>
              {title}
            </h3>
            <p className={css.s7}>
              {message}
            </p>
          </div>
        </div>

        <div className={css.s8}>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
