'use client';

import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';

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
  style,
}) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(currentPage, totalPages, maxVisiblePages);
  const startItem = totalItems && pageSize ? Math.min(totalItems, (currentPage - 1) * pageSize + 1) : null;
  const endItem = totalItems && pageSize ? Math.min(totalItems, currentPage * pageSize) : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: compact ? '16px' : '16px 20px',
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '12px',
        ...style,
      }}
    >
      <span style={{ fontSize: compact ? '12px' : '13px', color: 'var(--text-muted)' }}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          icon={compact ? null : <CaretLeft size={16} />}
          style={compact ? undefined : { minWidth: '36px', height: '36px', padding: 0, justifyContent: 'center' }}
        >
          {compact ? 'Tr\u01b0\u1edbc' : null}
        </Button>

        {compact ? (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', fontWeight: 600 }}>
            Trang {currentPage} / {totalPages}
          </div>
        ) : (
          visiblePages.map((page, idx) => {
            const showEllipsisBefore = idx > 0 && page - visiblePages[idx - 1] > 1;
            const isActive = page === currentPage;

            return (
              <div key={page} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {showEllipsisBefore && (
                  <span style={{ color: 'var(--text-muted)', padding: '0 4px', fontSize: '13px' }}>...</span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  style={{
                    minWidth: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                    backgroundColor: isActive ? 'var(--accent-glow)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--text-secondary)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-raised)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
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
          style={compact ? undefined : { minWidth: '36px', height: '36px', padding: 0, justifyContent: 'center' }}
        >
          {compact ? 'Sau' : null}
        </Button>
      </div>
    </div>
  );
}
