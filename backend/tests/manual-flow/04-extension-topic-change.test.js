const assert = require('assert');
const { api, expectFailure, expectSuccess } = require('./helpers');

module.exports = async function runExtensionAndTopicChange(ctx) {
  const extension = await expectSuccess(
    await api(ctx, 'POST', '/api/v1/extensions', {
      targetType: 'milestone',
      targetId: ctx.milestoneId,
      projectId: ctx.projectId,
      reason: 'Nhóm cần thêm thời gian để bổ sung minh chứng kiểm thử.',
      requestedTo: '2026-10-08T00:00:00.000Z',
    }, ctx.tokens.student1),
    201,
    'student creates a milestone extension request'
  );
  assert.strictEqual(extension.status, 'pending');
  ctx.extensionId = extension._id;

  const prematureFacultyDecision = await api(ctx, 'POST', `/api/v1/extensions/${ctx.extensionId}/faculty-approve`, {
    status: 'approved',
    note: 'Duyệt trước khi GVHD cho ý kiến.',
  }, ctx.tokens.staff);
  await expectFailure(prematureFacultyDecision, 400, 'faculty cannot approve extension before supervisor review');

  const supervisorDecision = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/extensions/${ctx.extensionId}/supervisor-approve`, {
      status: 'approved',
      note: 'Đồng ý gia hạn vì nhóm có lý do hợp lệ.',
    }, ctx.tokens.supervisor),
    200,
    'supervisor approves the extension request'
  );
  assert.strictEqual(supervisorDecision.supervisorApproval.status, 'approved');
  assert.strictEqual(supervisorDecision.status, 'pending');

  const facultyDecision = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/extensions/${ctx.extensionId}/faculty-approve`, {
      status: 'approved',
      note: 'Giáo vụ phê duyệt gia hạn theo khuyến nghị GVHD.',
    }, ctx.tokens.staff),
    200,
    'faculty approves the extension request'
  );
  assert.strictEqual(facultyDecision.status, 'approved');

  const topicChange = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/topics/${ctx.topicId}/change-requests`, {
      newTitle: 'Hệ thống quản lý quy trình đồ án có kiểm soát thay đổi',
      newScope: 'Bổ sung quy trình xin đổi đề tài, gia hạn và theo dõi lịch sử.',
      newPlan: 'Tuần 1-2 phân tích thay đổi, tuần 3-6 triển khai, tuần 7-8 kiểm thử hồi quy.',
      reason: 'Phạm vi mới phản ánh đúng yêu cầu nghiệp vụ sau khi thống nhất với GVHD.',
    }, ctx.tokens.student2),
    201,
    'accepted group member creates a topic-change request'
  );
  assert.strictEqual(topicChange.status, 'pending');
  ctx.topicChangeId = topicChange._id;

  const facultyTopicDecisionTooSoon = await api(ctx, 'POST', `/api/v1/topic-change-requests/${ctx.topicChangeId}/faculty-approve`, {
    note: 'Duyệt trước khi GVHD cho ý kiến.',
  }, ctx.tokens.staff);
  await expectFailure(facultyTopicDecisionTooSoon, 400, 'faculty cannot approve topic change before supervisor review');

  const supervisorTopicDecision = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/topic-change-requests/${ctx.topicChangeId}/supervisor-approve`, {
      note: 'Đồng ý đổi tên và phạm vi đề tài.',
    }, ctx.tokens.supervisor),
    200,
    'supervisor approves the topic-change request'
  );
  assert.strictEqual(supervisorTopicDecision.supervisorApproval.status, 'approved');

  const facultyTopicDecision = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/topic-change-requests/${ctx.topicChangeId}/faculty-approve`, {
      note: 'Giáo vụ phê duyệt thay đổi đề tài.',
    }, ctx.tokens.staff),
    200,
    'faculty approves and applies the topic change'
  );
  assert.strictEqual(facultyTopicDecision.status, 'approved');

  const changedTopic = await expectSuccess(
    await api(ctx, 'GET', `/api/v1/topics/${ctx.topicId}`, undefined, ctx.tokens.staff),
    200,
    'topic reflects the approved title change'
  );
  assert.strictEqual(changedTopic.status, 'changed');
  assert.strictEqual(changedTopic.title, 'Hệ thống quản lý quy trình đồ án có kiểm soát thay đổi');
};
