'use client';

import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getAcademicUnitLabel, getTopicDomainLabel } from '@/lib/academicUnits';
import { getStatus } from '@/lib/utils';
import css from '../page.module.css';

export default function TopicDetailModal({ topic, onClose }) {
  if (!topic) return null;

  const statusInfo = getStatus(topic.status === 'submitted' || topic.status === 'ai_checked' ? 'pending_review' : topic.status);

  return (
    <div className={css.s27}>
      <div className={css.s28} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={css.s29} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 className={css.s30}>{topic.title}</h3>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge variant="info">{getAcademicUnitLabel(topic.academicUnit || topic.periodId?.academicUnit)}</Badge>
              <Badge variant="neutral">{getTopicDomainLabel(topic.topicDomain)}</Badge>
            </div>
          </div>
        </div>

        <div className={css.s31} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Tóm tắt/Nội dung</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-card-nested)', borderRadius: '6px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {topic.summary || 'Chưa có thông tin'}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Mục tiêu đề tài</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-card-nested)', borderRadius: '6px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {topic.objectives || 'Chưa có thông tin'}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Phạm vi thực hiện</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-card-nested)', borderRadius: '6px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {topic.scope || 'Chưa có thông tin'}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Công nghệ dự kiến</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-card-nested)', borderRadius: '6px', fontSize: '14px', lineHeight: '1.5' }}>
              {Array.isArray(topic.technologies) && topic.technologies.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {topic.technologies.map((tech, idx) => (
                    <Badge key={idx} variant="neutral">{tech}</Badge>
                  ))}
                </div>
              ) : (
                typeof topic.technologies === 'string' && topic.technologies.trim() !== '' 
                  ? topic.technologies 
                  : 'Chưa có thông tin'
              )}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Kết quả mong đợi</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-card-nested)', borderRadius: '6px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {topic.expectedResult || 'Chưa có thông tin'}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Kế hoạch thực hiện</h4>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-card-nested)', borderRadius: '6px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {topic.plan || 'Chưa có thông tin'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Học phần đồ án</h4>
              <p style={{ fontSize: '14px' }}>{topic.periodId?.name || '—'}</p>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Hình thức thực hiện</h4>
              <p style={{ fontSize: '14px' }}>
                {topic.ownerType === 'group' ? 'Làm theo nhóm' : 
                 topic.ownerType === 'student' ? 'Làm cá nhân' : 
                 topic.createdByRole === 'lecturer' ? (
                   topic.allowGroup ? 'Cho phép làm nhóm' : 'Chỉ làm cá nhân'
                 ) : '—'}
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>GVHD đề xuất</h4>
              <p style={{ fontSize: '14px' }}>{topic.proposedSupervisorId?.userId?.fullName || topic.proposedSupervisorEmail || 'Chưa có'}</p>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Người/Nhóm tạo</h4>
              <p style={{ fontSize: '14px' }}>
                {topic.createdByRole === 'lecturer' ? `GV: ${topic.proposedByLecturerId?.userId?.fullName || ''}` : 
                 topic.ownerType === 'group' ? `Nhóm: ${topic.groupId?.name || ''}` : 
                 `SV: ${topic.proposedByStudentId?.userId?.fullName || ''}`}
              </p>
            </div>
          </div>

          <div className={css.s36} style={{ marginTop: '8px' }}>
            <Button variant="secondary" onClick={onClose} style={{ width: '100%' }}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
