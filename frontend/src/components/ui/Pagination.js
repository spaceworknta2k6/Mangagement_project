'use client';

import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import css from './Pagination.module.css';

function getVisiblePages(currentPage, totalPages, maxVisiblePages) {
  return Array.from({ length: totalPages }, (_, i) => i + 1).filter((page) => {
    if (totalPages <= maxVisiblePages) return true;
    return Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;
  });
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  currentItemCount,
  itemLabel = 'b\u1ea3n ghi',
  maxVisiblePages = 5,
  compact = false,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(currentPage, totalPages, maxVisiblePages);
  const startItem = totalItems && pageSize ? Math.min(totalItems, (currentPage - 1) * pageSize + 1) : null;
  const endItem = totalItems && pageSize ? Math.min(totalItems, currentPage * pageSize) : null;
  const rootClass = [css.pagination, compact ? css.compact : '', className].filter(Boolean).join(' ');
  const metaClass = [css.meta, compact ? css.metaCompact : ''].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <span className={metaClass}>
        {totalItems && pageSize ? (
          <>
            {'Hi\u1ec3n th\u1ecb '}<strong>{startItem}</strong>{' \u0111\u1ebfn '}<strong>{endItem}</strong>{' trong t\u1ed5ng s\u1ed1 '}
            <strong>{totalItems}</strong> {itemLabel}
          </>
        ) : (
          <>
            {'Hi\u1ec3n th\u1ecb '}{currentItemCount}{' tr\u00ean t\u1ed5ng s\u1ed1 '}{totalItems} {itemLabel}
          </>
        )}
      </span>

      <div className={css.s1}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          icon={compact ? null : <CaretLeft size={16} />}
          className={compact ? '' : css.navButton}
        >
          {compact ? 'Tr\u01b0\u1edbc' : null}
        </Button>

        {compact ? (
          <div className={css.s2}>
            Trang {currentPage} / {totalPages}
          </div>
        ) : (
          visiblePages.map((page, idx) => {
            const showEllipsisBefore = idx > 0 && page - visiblePages[idx - 1] > 1;
            const isActive = page === currentPage;

            return (
              <div key={page} className={css.s3}>
                {showEllipsisBefore && (
                  <span className={css.s4}>...</span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={[css.pageButton, isActive ? css.pageButtonActive : ''].filter(Boolean).join(' ')}
                >
                  {page}
                </button>
              </div>
            );
          })
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          icon={compact ? null : <CaretRight size={16} />}
          className={compact ? '' : css.navButton}
        >
          {compact ? 'Sau' : null}
        </Button>
      </div>
    </div>
  );
}
