'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useAuthStore from '@/store/auth.store';
import api from '@/services/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { formatDate, getStatus, hasAnyRole } from '@/lib/utils';
import { BookOpen, Plus, Check, X, Shield, Cpu, Sparkle, Pencil, Lightbulb, Star } from '@phosphor-icons/react';
import css from './page.module.css';

const topicTabs = [
  { id: 'all', label: 'T\u1ea5t c\u1ea3' },
  { id: 'pending_review', label: 'Ch\u1edd duy\u1ec7t' },
  { id: 'approved', label: '\u0110\u00e3 duy\u1ec7t' },
  { id: 'rejected', label: 'T\u1eeb ch\u1ed1i' },
];

function getConfidenceClass(confidence) {
  if (confidence >= 75) return css.confidenceHigh;
  if (confidence >= 50) return css.confidenceMedium;
  return css.confidenceLow;
}

export default function TopicsPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const toast = useToast();

  const [periods, setPeriods] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // AI states
  const [aiCheckingId, setAiCheckingId] = useState(null);
  const [aiResults, setAiResults] = useState({});
  const [showOverrideModal, setShowOverrideModal] = useState(null); // jobId
  const [overrideComment, setOverrideComment] = useState('');
  const [overriding, setOverriding] = useState(false);

  // AI topic suggestion chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Proposed topic form
  const [form, setForm] = useState({
    title: '',
    summary: '',
    periodId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null);

  const isStaff = hasAnyRole(user, ['FACULTY_STAFF', 'SYSTEM_ADMIN']);
  const isStudent = hasAnyRole(user, ['STUDENT']);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resPeriods, resTopics] = await Promise.all([
        api.get('/periods', token).catch(() => api.get('/auth/periods', token).catch(() => ({ data: [] }))),
        api.get('/topics', token)
      ]);
      
      const pList = resPeriods.data || [];
      setPeriods(pList);
      if (pList.length > 0) {
        setForm((prev) => ({ ...prev, periodId: pList[0]._id }));
      }
      setTopics(resTopics.data || []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải dữ liệu đề tài');
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [loadData, token]);

  const handleSubmitTopic = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.periodId) return;

    setSubmitting(true);
    try {
      if (editingTopicId) {
        await api.put(`/topics/${editingTopicId}`, {
          title: form.title.trim(),
          summary: form.summary.trim(),
          periodId: form.periodId,
        }, token);
        toast.success('Cập nhật đề tài thành công! Chờ Giáo vụ duyệt lại.');
      } else {
        await api.post('/topics', {
          title: form.title.trim(),
          summary: form.summary.trim(),
          periodId: form.periodId,
        }, token);
        toast.success('Đề xuất đề tài thành công! Chờ Giáo vụ duyệt.');
      }
      setShowProposeModal(false);
      setEditingTopicId(null);
      setForm((prev) => ({ ...prev, title: '', summary: '' }));
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi gửi đề xuất đề tài');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (t) => {
    setEditingTopicId(t._id);
    setForm({
      title: t.title,
      summary: t.summary || '',
      periodId: t.periodId?._id || t.periodId || '',
    });
    setShowProposeModal(true);
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/topics/${id}/approve`, {}, token);
      toast.success('Đã phê duyệt đề tài thành công!');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi phê duyệt đề tài');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/topics/${id}/reject`, {}, token);
      toast.success('Đã từ chối đề tài.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi từ chối đề tài');
    }
  };

  const handleRequestRevision = async (id) => {
    try {
      await api.post(`/topics/${id}/request-revision`, {}, token);
      toast.success('Đã gửi yêu cầu chỉnh sửa đề tài.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi yêu cầu chỉnh sửa');
    }
  };

  // Run AI topic suggestion for student — loads initial suggestions as first chat message
  const handleSuggestTopics = async (force = false) => {
    if (!user?.studentId) return;
    setSuggestLoading(true);
    try {
      const url = `/ai/students/${user.studentId}/topic-suggestions${force ? '?force=true' : ''}`;
      const res = await api.post(url, {}, token);
      const job = res.data;
      const list = job?.result?.suggestions || [];
      const textRepresentation = list.length === 0
        ? 'Hiện tại chưa có đề tài phù hợp trong hệ thống.'
        : 'Dựa trên hồ sơ của bạn, tôi gợi ý các đề tài sau:\n\n' +
          list.map((s, i) => `${i + 1}. "${s.title}" — ${s.confidence}% phù hợp\nLý do: ${s.reason}`).join('\n\n');
      setChatMessages([{ role: 'assistant', type: 'suggestions', suggestions: list, content: textRepresentation }]);
      setChatOpen(true);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      toast.error(err.message || 'Không thể lấy gợi ý đề tài từ hệ thống AI');
    } finally {
      setSuggestLoading(false);
    }
  };

  // Send a follow-up chat message to AI
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading || !user?.studentId) return;
    const userMsg = { role: 'user', type: 'text', content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.post(`/ai/students/${user.studentId}/topic-chat`, { messages: apiMessages }, token);
      setChatMessages(prev => [...prev, { role: 'assistant', type: 'text', content: res.data.message }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi gửi tin nhắn');
    } finally {
      setChatLoading(false);
    }
  };

  // Pre-fill proposal form from a suggested topic
  const handleSelectSuggestedTopic = (s) => {
    const originalTopic = topics.find(t => t._id === s.topicId);
    setForm({
      title: s.title,
      summary: originalTopic?.summary || s.reason || '',
      periodId: periods[0]?._id || '',
    });
    setChatOpen(false);
    setShowProposeModal(true);
  };

  // Run AI duplicate check
  const handleCheckDuplicate = async (id) => {
    setAiCheckingId(id);
    try {
      const res = await api.post(`/ai/topics/${id}/check-duplicate`, {}, token);
      const job = res.data;
      setAiResults((prev) => ({ ...prev, [id]: job }));
      toast.success('Tác vụ phân tích trùng lặp AI hoàn tất!');
    } catch (err) {
      toast.error(err.message || 'Không thể kiểm tra trùng lặp qua AI');
    } finally {
      setAiCheckingId(null);
    }
  };

  // Submit manual override
  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!showOverrideModal || !overrideComment.trim()) return;

    setOverriding(true);
    try {
      const jobId = showOverrideModal;
      await api.post(`/ai/jobs/${jobId}/manual-override`, {
        result: {
          comment: overrideComment.trim()
        }
      }, token);
      toast.success('Đã phê duyệt ghi đè AI thành công!');
      setShowOverrideModal(null);
      setOverrideComment('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi áp dụng ghi đè');
    } finally {
      setOverriding(false);
    }
  };

  // Filter topics based on activeTab
  const filteredTopics = topics.filter((t) => {
    if (activeTab === 'all') return true;
    const mappedStatus = (t.status === 'submitted' || t.status === 'ai_checked' || t.status === 'needs_revision') ? 'pending_review' : t.status;
    return mappedStatus === activeTab;
  });

  return (
    <div>
      {/* Page Header section */}
      <div className={css.s1} >
        <div>
          <h1 className={`text-display ${css.s2}`}>
            <BookOpen size={28} className={css.s3} />
            Quản lý Đề tài
          </h1>
          <p className={css.s4}>
            Xem danh sách đề tài đồ án tốt nghiệp, duyệt đề xuất và thực hiện kiểm tra AI
          </p>
        </div>
        {isStudent && (
          <div className={css.s5}>
            <Button
              variant="secondary"
              size="sm"
              loading={suggestLoading}
              onClick={() => {
                if (chatMessages.length > 0) {
                  setChatOpen(true);
                } else {
                  handleSuggestTopics();
                }
              }}
              className={css.buttonGap}
            >
              <Lightbulb size={16} />
              Gợi ý đề tài cho tôi
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowProposeModal(true)}>
              <Plus size={16} />
              Đề xuất đề tài mới
            </Button>
          </div>
        )}
      </div>

      <Tabs tabs={topicTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* List items */}
      {loading ? (
        <div className={css.s6}>
          <Spinner size="lg" />
        </div>
      ) : filteredTopics.length === 0 ? (
        <Card>
          <div className={css.s7}>
            Chưa có đề tài nào thuộc danh mục này.
          </div>
        </Card>
      ) : (
        <div className={css.s8}>
          {filteredTopics.map((t) => {
            const mappedStatus = (t.status === 'submitted' || t.status === 'ai_checked') ? 'pending_review' : t.status;
            const statusInfo = getStatus(mappedStatus);
            const aiJob = aiResults[t._id];

            return (
              <Card
                key={t._id}
                title={t.title}
                subtitle={`Sinh viên đề xuất: ${t.proposedByStudentId?.userId?.fullName || 'Giáo vụ'} | Học kỳ: ${t.periodId?.semester || '—'}`}
                actions={
                  <div className={css.s9}>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>

                    {isStaff && (t.status === 'pending_review' || t.status === 'submitted' || t.status === 'ai_checked') && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => handleRequestRevision(t._id)}>
                          <Pencil size={14} /> Yêu cầu sửa
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleReject(t._id)}>
                          <X size={14} /> Từ chối
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => handleApprove(t._id)}>
                          <Check size={14} /> Duyệt đề tài
                        </Button>
                      </>
                    )}

                    {isStudent && t.status === 'needs_revision' && t.proposedByStudentId?._id?.toString() === user?.studentId?.toString() && (
                      <Button variant="secondary" size="sm" onClick={() => handleEditClick(t)}>
                        <Pencil size={14} /> Chỉnh sửa
                      </Button>
                    )}
                  </div>
                }
              >
                <div className={css.s10}>
                  <p className={css.s11}>Tóm tắt đề tài:</p>
                  <p className={css.s12}>{t.summary || 'Không có tóm tắt chi tiết.'}</p>

                  {/* AI Duplicate Checker section */}
                  {isStaff && (
                    <div className={css.s13} >
                      <div className={css.s14}>
                        <div className={css.s15}>
                          <Cpu size={18} className={css.s16} />
                          <span className={css.s17}>Kiểm tra trùng lặp đề tài</span>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={aiCheckingId === t._id}
                          onClick={() => handleCheckDuplicate(t._id)}
                        >
                          <Sparkle size={14} /> Kiểm tra trùng lặp
                        </Button>
                      </div>

                      {/* Display AI outcome */}
                      {aiJob && (
                        <div className={css.s18}>
                          {aiJob.status === 'running' ? (
                            <p className={css.s19}>AI đang phân tích độ tương đồng ngữ nghĩa...</p>
                          ) : aiJob.status === 'succeeded' ? (
                            <div>
                              <div className={css.s20}>
                                <Badge variant={aiJob.result?.hasRisk ? 'error' : 'success'}>
                                  {aiJob.result?.hasRisk ? 'Có rủi ro trùng lặp cao' : 'An toàn'}
                                </Badge>
                                <span>Tỉ lệ trùng lặp: <strong className={aiJob.result?.hasRisk ? css.riskHigh : css.riskLow}>{aiJob.result?.riskScore}%</strong></span>
                              </div>
                              
                              {aiJob.result?.hasRisk && (
                                <div className={css.s21}>
                                  <p className={css.s22}>Lý giải của AI: {aiJob.result?.reasoning}</p>
                                  {aiJob.manualOverride?.isOverridden ? (
                                    <div className={css.s23}>
                                      <strong className={css.s24}>[ĐÃ GHI ĐÈ BỞI GIÁO VỤ]</strong> Lời phê: {aiJob.manualOverride?.comment}
                                    </div>
                                  ) : (
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      className={css.s25}
                                      onClick={() => setShowOverrideModal(aiJob._id)}
                                    >
                                      <Shield size={14} /> Phê duyệt ghi đè thủ công
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className={css.s26}>AI kiểm tra thất bại: {aiJob.error}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Propose Topic Modal */}
      {showProposeModal && (
        <div className={css.s27} >
          <div className={css.s28} >
            <div className={css.s29}>
              <h3 className={css.s30}>
                {editingTopicId ? 'Chỉnh sửa đề tài đồ án' : 'Đề xuất đề tài đồ án mới'}
              </h3>
            </div>
            <form onSubmit={handleSubmitTopic} className={css.s31}>
              <div className={css.s32}>
                <label className={css.s33}>Chọn đợt đồ án</label>
                <select
                  value={form.periodId}
                  onChange={(e) => setForm((p) => ({ ...p, periodId: e.target.value }))} className={css.s70} >
                  {periods.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Tên đề tài đồ án"
                name="title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Nhập tên đề tài bằng tiếng Việt có dấu..."
                required
              />

              <div className={css.s34}>
                <label className={css.s35}>Tóm tắt/Nội dung thực hiện</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                  placeholder="Mô tả tóm tắt nội dung nghiên cứu, công nghệ sử dụng, và kết quả mong đợi..."
                  rows={4} className={css.s71} />
              </div>

              <div className={css.s36}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowProposeModal(false);
                    setEditingTopicId(null);
                    setForm((prev) => ({ ...prev, title: '', summary: '' }));
                  }}
                >
                  Hủy
                </Button>
                <Button variant="primary" type="submit" loading={submitting}>
                  {editingTopicId ? 'Cập nhật' : 'Đề xuất'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff manual override modal */}
      {showOverrideModal && (
        <div className={css.s37} >
          <div className={css.s38} >
            <div className={css.s39}>
              <h3 className={css.s40}>
                Ghi đè thủ công kết quả trùng lặp AI
              </h3>
            </div>
            <form onSubmit={handleOverrideSubmit} className={css.s41}>
              <div className={css.s42}>
                <label className={css.s43}>Lời phê bình/Lý do duyệt ghi đè</label>
                <textarea
                  value={overrideComment}
                  onChange={(e) => setOverrideComment(e.target.value)}
                  placeholder="Nhập lý do chi tiết từ Giáo vụ để lưu trữ nhật ký hệ thống (ví dụ: Hai đề tài sử dụng hai kiến trúc nghiệp vụ khác nhau hoàn toàn)..."
                  rows={4}
                  required className={css.s72} />
              </div>

              <div className={css.s44}>
                <Button variant="secondary" onClick={() => setShowOverrideModal(null)}>Hủy</Button>
                <Button variant="primary" type="submit" loading={overriding}>Xác nhận Ghi đè</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Suggestion Chat panel */}
      {chatOpen && (
        <div
          className={css.s45}
          onClick={() => setChatOpen(false)}
        >
          <div
            className={css.s46}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={css.s47} >
              <div className={css.s48}>
                <div className={css.s49}>
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className={css.s50}>
                    Trợ lý Đề tài AI
                  </h3>
                  <span className={css.s51}>
                    Tư vấn & điều chỉnh đề tài theo nguyện vọng của bạn
                  </span>
                </div>
              </div>
              
              <div className={css.s52}>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={suggestLoading}
                  onClick={() => handleSuggestTopics(true)} className={css.s73} >
                  <Sparkle size={13} /> Gợi ý lại
                </Button>
                <button
                  onClick={() => setChatOpen(false)}
                  className={css.s74}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className={css.s53} >
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={[css.messageWrap, msg.role === 'user' ? css.messageWrapUser : css.messageWrapAssistant].filter(Boolean).join(' ')}
                >
                  {msg.type === 'suggestions' ? (
                    <div className={css.s54}>
                      <div className={css.s55}>
                        <Cpu size={14} className={css.s56} />
                        Phân tích hồ sơ hoàn tất &bull; {msg.suggestions.length} gợi ý phù hợp &bull;
                        <span className={css.s57}> Bấm vào đề tài để chỉnh sửa</span>
                      </div>
                      
                      {msg.suggestions.length === 0 ? (
                        <div className={css.s58}>
                          Chưa tìm thấy đề tài phù hợp với hồ sơ hiện tại. Bạn có thể chat để mô tả định hướng của mình.
                        </div>
                      ) : (
                        msg.suggestions.map((s, si) => (
                          <div
                            key={s.topicId || si}
                            onClick={() => {
                              setChatInput(`Tôi muốn điều chỉnh đề tài "${s.title}" theo hướng: `);
                            }}
                            className={css.s75}
                          >
                            <div className={css.s59}>
                              <span className={css.s60}>
                                {s.title}
                              </span>
                              <span className={[css.confidenceBadge, getConfidenceClass(s.confidence)].filter(Boolean).join(' ')}>
                                <Star size={10} weight="fill" /> {s.confidence}%
                              </span>
                            </div>
                            
                            <p className={css.s61}>
                              {s.reason}
                            </p>
                            
                            <div className={css.s62}>
                              <div className={css.s63}>
                                <Lightbulb size={12} /> Bấm để đề xuất chỉnh sửa
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                className={css.s64}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSuggestedTopic(s);
                                }}
                              >
                                Chọn đề tài này
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : msg.role === 'user' ? (
                    <div className={css.s65} >
                      {msg.content}
                    </div>
                  ) : (
                    <div className={css.s66} >
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className={css.s67}>
                  <Spinner size="sm" />
                  <span>AI đang soạn câu trả lời...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className={css.s68} >
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder="Trao đổi với AI về đề tài của bạn... (Enter để gửi, Shift+Enter xuống dòng)"
                rows={2}
                disabled={chatLoading} className={css.s76} />
              <Button
                variant="primary"
                size="sm"
                loading={chatLoading}
                disabled={!chatInput.trim()}
                onClick={handleSendChat} className={css.s69} >
                Gửi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
