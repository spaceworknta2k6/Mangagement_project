'use client';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import css from '../page.module.css';

export default function TopicModal({
  editingTopicId,
  form,
  setForm,
  periods,
  groups = [],
  handleSubmitTopic,
  onClose,
  submitting,
  isLecturerOrStaff = false,
}) {
  return (
    <div className={css.s27}>
      <div className={css.s28}>
        <div className={css.s29}>
          <h3 className={css.s30}>
            {editingTopicId 
              ? (isLecturerOrStaff ? 'Chỉnh sửa đề tài' : 'Chỉnh sửa đề xuất đề tài') 
              : (isLecturerOrStaff ? 'Tạo đề tài đồ án mới' : 'Đề xuất đề tài đồ án mới')}
          </h3>
        </div>
        <form onSubmit={handleSubmitTopic} className={css.s31}>
          <div className={css.s32}>
            <label className={css.s33}>Chọn học phần đồ án</label>
            <select
              value={form.periodId}
              onChange={(e) => {
                const nextPeriod = periods.find((period) => period._id === e.target.value);
                setForm((p) => ({
                  ...p,
                  periodId: e.target.value,
                  academicUnit: nextPeriod?.academicUnit || '',
                }));
              }}
              className={css.s70}
            >
              {periods.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.courseName || p.name}
                </option>
              ))}
            </select>
          </div>

          {!editingTopicId && !isLecturerOrStaff && (
            <>
              <div className={css.s32}>
                <label className={css.s33}>Hình thức thực hiện</label>
                <select
                  name="ownerType"
                  value={form.ownerType}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    ownerType: e.target.value,
                    groupId: e.target.value === 'student' ? '' : p.groupId,
                  }))}
                  className={css.s70}
                >
                  <option value="student">Cá nhân</option>
                  <option value="group">Nhóm</option>
                </select>
              </div>

              {form.ownerType === 'group' && (
                <div className={css.s32}>
                  <label className={css.s33}>Chọn nhóm</label>
                  <select
                    value={form.groupId}
                    onChange={(e) => setForm((p) => ({ ...p, groupId: e.target.value }))}
                    className={css.s70}
                  >
                    <option value="">Chọn nhóm đã chốt danh sách</option>
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  {groups.length === 0 && (
                    <p className={css.s19}>Bạn chưa có nhóm đã chốt danh sách trong học phần này.</p>
                  )}
                </div>
              )}

              {form.ownerType === 'student' && (
                <p className={css.s19}>Nếu bạn chưa có trong danh sách học phần này, hệ thống sẽ thông báo khi gửi đề xuất.</p>
              )}
            </>
          )}

          {!isLecturerOrStaff && (
            <Input
              label="Email giảng viên hướng dẫn đề xuất"
              name="proposedSupervisorEmail"
              type="email"
              value={form.proposedSupervisorEmail}
              onChange={(e) => setForm((p) => ({ ...p, proposedSupervisorEmail: e.target.value }))}
              placeholder="Ví dụ: giangvien@phenikaa-uni.edu.vn"
            />
          )}

          <Input
            label="Tên đề tài đồ án"
            name="title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Nhập tên đề tài bằng tiếng Việt có dấu..."
          />

          <div className={css.s34}>
            <label className={css.s35}>Tóm tắt/Nội dung thực hiện</label>
            <textarea
              value={form.summary || ''}
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              placeholder="Mô tả tóm tắt nội dung nghiên cứu, công nghệ sử dụng, và kết quả mong đợi..."
              rows={3}
              className={css.s71}
            />
          </div>

          <div className={css.s34}>
            <label className={css.s35}>Mục tiêu đề tài</label>
            <textarea
              value={form.objectives || ''}
              onChange={(e) => setForm((p) => ({ ...p, objectives: e.target.value }))}
              placeholder="Mục tiêu cụ thể cần đạt được..."
              rows={2}
              className={css.s71}
            />
          </div>

          <div className={css.s34}>
            <label className={css.s35}>Phạm vi thực hiện</label>
            <textarea
              value={form.scope || ''}
              onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value }))}
              placeholder="Giới hạn và phạm vi của đề tài..."
              rows={2}
              className={css.s71}
            />
          </div>

          <div className={css.s34}>
            <label className={css.s35}>Công nghệ sử dụng</label>
            <Input
              value={Array.isArray(form.technologies) ? form.technologies.join(', ') : (form.technologies || '')}
              onChange={(e) => setForm((p) => ({ ...p, technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              placeholder="Ví dụ: React, Node.js, MongoDB (cách nhau bởi dấu phẩy)"
            />
          </div>

          <div className={css.s34}>
            <label className={css.s35}>Kết quả dự kiến</label>
            <textarea
              value={form.expectedResult || ''}
              onChange={(e) => setForm((p) => ({ ...p, expectedResult: e.target.value }))}
              placeholder="Kết quả đầu ra mong đợi..."
              rows={2}
              className={css.s71}
            />
          </div>

          <div className={css.s34}>
            <label className={css.s35}>Kế hoạch thực hiện</label>
            <textarea
              value={form.plan || ''}
              onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))}
              placeholder="Các giai đoạn và công việc cần làm..."
              rows={3}
              className={css.s71}
            />
          </div>

          <div className={css.s36}>
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingTopicId ? 'Cập nhật' : (isLecturerOrStaff ? 'Tạo đề tài' : 'Đề xuất')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
