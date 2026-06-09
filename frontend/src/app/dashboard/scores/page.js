'use client';

import { useCallback, useEffect, useState } from 'react';
import useAuthStore from '@/store/auth.store';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { ClipboardText, ArrowsClockwise, CheckCircle, Calculator } from '@phosphor-icons/react';
import css from './page.module.css';

export default function ScoresPage() {
  const { user, token } = useAuthStore();
  const toast = useToast();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Selected session to score
  const [selectedSession, setSelectedSession] = useState(null);

  // Form for grading
  const [form, setForm] = useState({
    comment: '',
    criteriaScores: [
      {
        criteriaCode: 'C1',
        criteriaName: 'Chất lượng Báo cáo',
        maxScore: 3,
        score: 0,
        weight: 0.3
      },
      {
        criteriaCode: 'C2',
        criteriaName: 'Chất lượng Sản phẩm / Source Code',
        maxScore: 4,
        score: 0,
        weight: 0.4
      },
      {
        criteriaCode: 'C3',
        criteriaName: 'Trình bày & Trả lời câu hỏi',
        maxScore: 3,
        score: 0,
        weight: 0.3
      }
    ]
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/defense-sessions', token);
      setSessions(res.data || []);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách dự án cần chấm');
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    if (token) fetchData();
  }, [fetchData, token]);

  const handleOpenScoreModal = (session) => {
    setSelectedSession(session);
    setForm({
      comment: '',
      criteriaScores: [
        { criteriaCode: 'C1', criteriaName: 'Chất lượng Báo cáo', maxScore: 3, score: 0, weight: 0.3 },
        { criteriaCode: 'C2', criteriaName: 'Chất lượng Sản phẩm / Source Code', maxScore: 4, score: 0, weight: 0.4 },
        { criteriaCode: 'C3', criteriaName: 'Trình bày & Trả lời câu hỏi', maxScore: 3, score: 0, weight: 0.3 }
      ]
    });
    setShowModal(true);
  };

  const handleScoreChange = (index, value) => {
    const newCriteria = [...form.criteriaScores];
    newCriteria[index].score = Number(value);
    setForm({ ...form, criteriaScores: newCriteria });
  };

  const getTotalScore = () => {
    return form.criteriaScores.reduce((sum, c) => sum + (c.score || 0), 0).toFixed(1);
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!selectedSession || !selectedSession.projectId) return;

    const projectId = selectedSession.projectId._id || selectedSession.projectId;
    const groupId = selectedSession.groupId;
    // Assuming periodId exists on project or committee. For prototype, we extract it.
    const periodId = selectedSession.committeeId?.periodId || selectedSession.projectId?.periodId || '660a1b2c3d4e5f6a7b8c9d0e'; // Fallback if missing in populate

    const payload = {
      projectId,
      groupId,
      periodId,
      rubricRole: 'COMMITTEE_MEMBER',
      targetType: 'COMMITTEE_MEMBER',
      targetId: projectId,
      comment: form.comment,
      criteriaScores: form.criteriaScores
    };

    try {
      setSubmitting(true);
      await api.post('/scores/score-sheets', payload, token);
      toast.success('Đã nộp phiếu điểm thành công');
      setShowModal(false);
      // Optional: Call aggregate final grade
      try {
        await api.post(`/scores/final-grades/aggregate/${projectId}`, {}, token);
      } catch (e) {
        console.error('Aggregate failed', e);
      }
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi nộp phiếu điểm');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={css.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className={css.s2}>
        <div>
          <h1 className={`text-display ${css.s3}`}>
            <ClipboardText size={28} className={css.s4} />
            Chấm điểm Đồ án
          </h1>
          <p className={css.s5}>
            Nhập điểm đánh giá dành cho Giảng viên (Hội đồng, Phản biện, Hướng dẫn)
          </p>
        </div>
        
        <Button variant="outline" onClick={fetchData} icon={<ArrowsClockwise />} title="Làm mới" />
      </div>

      <div className={css.s6}>
        {sessions.map((session) => (
          <Card key={session._id} className={css.s7}>
            <div className={css.s8}>
              <div>
                <h3 className={css.s9}>
                  {session.projectId?.topicId?.title || 'Đồ án'}
                </h3>
                <div className={css.s10}>
                  Hội đồng: {session.committeeId?.name || 'Không xác định'}
                </div>
              </div>
              <Badge variant="neutral">Ca {session.orderNumber}</Badge>
            </div>

            <div className={css.s11}>
              <div><strong>Nhóm SV:</strong> {session.groupId?.name || 'Nhóm'}</div>
              <div className={css.s12}><strong>Bảo vệ:</strong> {formatDate(session.defenseDate).split(' ')[0]}</div>
            </div>
            
            <div className={css.s13}>
              <Button size="sm" variant="primary" icon={<CheckCircle />} onClick={() => handleOpenScoreModal(session)}>
                Nhập phiếu điểm
              </Button>
            </div>
          </Card>
        ))}

        {sessions.length === 0 && (
          <div className={css.s14}>
            Bạn không có lịch bảo vệ nào cần chấm điểm
          </div>
        )}
      </div>

      {/* Modal Chấm Điểm */}
      {showModal && (
        <div className={css.s15}>
          <div className={css.s16}>
            <div className={css.s17}>
              <h2 className={css.s18}>Phiếu chấm điểm</h2>
            </div>
            
            <div className={css.s19}>
              <div className={css.s20}>
                <strong>Đề tài:</strong> {selectedSession?.projectId?.topicId?.title}<br/>
                <strong>Nhóm:</strong> {selectedSession?.groupId?.name}
              </div>

              <form id="score-form" onSubmit={handleSubmitScore} className={css.s21}>
                <div className={css.s22}>
                  {form.criteriaScores.map((c, index) => (
                    <div key={index} className={css.s23}>
                      <div className={css.s24}>
                        <div className={css.s25}>{c.criteriaName}</div>
                        <div className={css.s26}>Tối đa: {c.maxScore} điểm</div>
                      </div>
                      <div className={css.s27}>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max={c.maxScore}
                          value={c.score}
                          onChange={(e) => handleScoreChange(index, e.target.value)}
                          required className={css.s33} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className={css.s28}>
                  <div className={css.s29}>
                    <Calculator size={20} /> Tổng điểm
                  </div>
                  <div className={css.s30}>
                    {getTotalScore()} / 10
                  </div>
                </div>

                <div>
                  <label className={css.s31}>Nhận xét / Đánh giá</label>
                  <textarea
                    value={form.comment}
                    onChange={(e) => setForm({...form, comment: e.target.value})}
                    rows="3"
                    placeholder="Nhập nhận xét của Giảng viên..." className={css.s34} ></textarea>
                </div>
              </form>
            </div>
            
            <div className={css.s32}>
              <Button variant="ghost" onClick={() => setShowModal(false)} type="button">Hủy</Button>
              <Button variant="primary" type="submit" form="score-form" isLoading={submitting}>Nộp Phiếu Điểm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
