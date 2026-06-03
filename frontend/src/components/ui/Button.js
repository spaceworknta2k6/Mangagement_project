'use client';

import { motion } from 'motion/react';

const VARIANTS = {
  primary: {
    bg: 'var(--accent)',
    color: '#fff',
    hoverBg: 'var(--accent-dim)',
    border: 'transparent',
  },
  secondary: {
    bg: 'var(--bg-raised)',
    color: 'var(--text-primary)',
    hoverBg: 'var(--bg-hover)',
    border: 'var(--border)',
  },
  ghost: {
    bg: 'transparent',
    color: 'var(--text-secondary)',
    hoverBg: 'var(--bg-raised)',
    border: 'transparent',
  },
  outline: {
    bg: 'transparent',
    color: 'var(--text-primary)',
    hoverBg: 'var(--bg-raised)',
    border: 'var(--border)',
  },
  danger: {
    bg: 'var(--error-bg)',
    color: 'var(--error)',
    hoverBg: 'rgba(239,68,68,0.18)',
    border: 'var(--error)',
  },
};

const SIZES = {
  sm: { padding: '6px 12px', iconPadding: '6px 8px', fontSize: '12px', height: '32px' },
  md: { padding: '8px 16px', iconPadding: '8px 10px', fontSize: '14px', height: '38px' },
  lg: { padding: '10px 20px', iconPadding: '10px 12px', fontSize: '15px', height: '44px' },
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
  style,
  className,
  icon,
  title,
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading || isLoading;
  const isSpinning = loading || isLoading;
  // Use smaller padding when icon-only (no children text)
  const computedPadding = !children ? s.iconPadding : s.padding;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      whileTap={isDisabled ? {} : { scale: 0.97, y: 1 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        height: s.height,
        padding: computedPadding,
        fontSize: s.fontSize,
        fontWeight: 500,
        fontFamily: 'inherit',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        backgroundColor: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: 'var(--radius-md)',
        transition: 'background-color 0.15s, opacity 0.15s',
        outline: 'none',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) e.currentTarget.style.backgroundColor = v.hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) e.currentTarget.style.backgroundColor = v.bg;
      }}
      className={className}
      {...rest}
    >
      {isSpinning ? (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0,
          }}
        />
      ) : icon ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
      ) : null}
      {children}
    </motion.button>
  );
}
