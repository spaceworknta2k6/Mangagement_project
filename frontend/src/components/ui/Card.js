import css from './Card.module.css';
/**
 * Card — surface container with optional header.
 */
export default function Card({ children, title, subtitle, actions, noPadding = false, className = '' }) {
  const classes = [css.card, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {(title || actions) && (
        <div className={css.s1} >
          <div>
            {title && (
              <h3 className={css.s2} >
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={css.s3} >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className={css.s4}>{actions}</div>}
        </div>
      )}
      <div className={noPadding ? css.bodyNoPadding : css.body}>{children}</div>
    </div>
  );
}
