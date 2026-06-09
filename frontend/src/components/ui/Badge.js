import css from './Badge.module.css';

const variantClass = {
  success: css.success,
  warning: css.warning,
  error: css.error,
  info: css.info,
  neutral: css.neutral,
};

/**
 * Badge — status labels.
 * @param {'success'|'warning'|'error'|'info'|'neutral'} variant
 */
export default function Badge({ children, variant = 'neutral', className = '' }) {
  const classes = [
    css.badge,
    variantClass[variant] || css.neutral,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
}
