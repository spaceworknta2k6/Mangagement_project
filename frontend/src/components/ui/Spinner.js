import css from './Spinner.module.css';

/**
 * Spinner — loading indicator.
 * @param {'sm'|'md'|'lg'} size
 */
export default function Spinner({ size = 'md', color = 'accent', className = '' }) {
  const classes = [
    css.spinner,
    css[size] || css.md,
    color === 'border' ? css.borderColor : css.accentColor,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      role="status"
      aria-label="Đang tải..."
      className={classes}
    />
  );
}
