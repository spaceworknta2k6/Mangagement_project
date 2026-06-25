'use client';

import Button from '@/components/ui/Button';
import css from '../page.module.css';

export default function AssignReviewerModal({
  isOpen,
  lecturers,
  selectedReviewerId,
  setSelectedReviewerId,
  submitting,
  onSubmit,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className={css.s18}>
      <div className={css.s19}>
        <div className={css.s20}>
          <h3 className={css.s21}>
            Phân công Giảng viên chấm 2
          </h3>
          <button onClick={onClose} className={css.s26}>
            &times;
          </button>
        </div>
        <form onSubmit={onSubmit} className={css.s22}>
          <div className={css.s23}>
            <label className={css.s24}>Chọn giảng viên chấm 2</label>
            <select
              value={selectedReviewerId}
              onChange={(e) => setSelectedReviewerId(e.target.value)}
              className={css.s27}
            >
              <option value="">-- Chọn giảng viên --</option>
              {lecturers.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.userId?.fullName} ({l.userId?.email})
                </option>
              ))}
            </select>
          </div>

          <div className={css.s25}>
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Xác nhận phân công
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
