const assert = require('assert');
const { api, expectFailure, expectSuccess } = require('./helpers');

module.exports = async function runProjectMilestones(ctx) {
  const project = await expectSuccess(
    await api(ctx, 'GET', `/api/v1/projects/${ctx.projectId}`, undefined, ctx.tokens.student1),
    200,
    'student1 can view the assigned group project'
  );
  assert.strictEqual(project._id, ctx.projectId);

  const inProgress = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/projects/${ctx.projectId}/mark-in-progress`, {}, ctx.tokens.student1),
    200,
    'student1 starts the assigned project'
  );
  assert.strictEqual(inProgress.status, 'in_progress');

  const studentCreateMilestone = await api(ctx, 'POST', `/api/v1/projects/${ctx.projectId}/milestones`, {
    title: 'Mốc sinh viên không được tạo',
    deadline: '2026-10-01T00:00:00.000Z',
  }, ctx.tokens.student1);
  await expectFailure(studentCreateMilestone, 403, 'student cannot create a project milestone');

  const milestone = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/projects/${ctx.projectId}/milestones`, {
      title: 'Báo cáo tiến độ 1',
      description: 'Nộp phân tích yêu cầu và kế hoạch triển khai.',
      deadline: '2026-10-01T00:00:00.000Z',
    }, ctx.tokens.supervisor),
    201,
    'supervisor creates a milestone'
  );
  assert.strictEqual(milestone.status, 'open');
  ctx.milestoneId = milestone._id;

  const submitted = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/projects/${ctx.projectId}/milestones/${ctx.milestoneId}/submit`, {
      note: 'Nhóm đã nộp bản phân tích yêu cầu phiên bản đầu.',
      fileIds: [],
    }, ctx.tokens.student2),
    200,
    'accepted group member submits milestone work'
  );
  assert.strictEqual(submitted.status, 'submitted');

  const feedback = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/projects/${ctx.projectId}/milestones/${ctx.milestoneId}/feedback`, {
      status: 'accepted',
      comment: 'Nội dung đạt yêu cầu, tiếp tục triển khai.',
    }, ctx.tokens.supervisor),
    200,
    'supervisor accepts the milestone submission'
  );
  assert.strictEqual(feedback.status, 'accepted');

  const locked = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/projects/${ctx.projectId}/milestones/${ctx.milestoneId}/lock`, {}, ctx.tokens.supervisor),
    200,
    'supervisor locks the accepted milestone'
  );
  assert.strictEqual(locked.status, 'locked');
};
