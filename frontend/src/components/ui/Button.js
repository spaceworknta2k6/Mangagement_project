'use client';

import { motion } from 'motion/react';
import css from './Button.module.css';

const variantClass = {
  primary: css.primary,
  secondary: css.secondary,
  ghost: css.ghost,
  outline: css.outline,
  danger: css.danger,
};

const sizeClass = {
  sm: css.sm,
  md: css.md,
  lg: css.lg,
};

/**
 * Button component
 * @param {'primary'|'secondary'|'ghost'|'outline'|'danger'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {React.ReactNode} icon - Optional icon shown before children
 * @param {boolean} isLoading - Alias for loading
 * @param {string} title - Tooltip text (used when icon-only button)
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  isLoading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className,
  icon,
  title,
  ...rest
}) {
  const isDisabled = disabled || loading || isLoading;
  const isSpinning = loading || isLoading;
  const classes = [
    css.button,
    variantClass[variant] || css.primary,
    sizeClass[size] || css.md,
    !children ? css.iconOnly : '',
    fullWidth ? css.fullWidth : '',
    className || '',
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      whileTap={isDisabled ? {} : { scale: 0.97, y: 1 }}
      className={classes}
      {...rest}
    >
      {isSpinning ? (
        <span className={css.s1} />
      ) : icon ? (
        <span className={css.s2}>
          {icon}
        </span>
      ) : null}
      {children}
    </motion.button>
  );
}
