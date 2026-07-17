const assert = require('assert');
const { api, expectFailure, expectSuccess, sampleAccounts } = require('./helpers');

module.exports = async function runGroupsAndTopics(ctx) {
  const group = await expectSuccess(
    await api(ctx, 'POST', '/api/v1/groups', {
      periodId: ctx.periodId,
      name: 'Nhóm Manual Flow',
    }, ctx.tokens.student1),
    201,
    'student1 creates a draft group'
  );
  assert.strictEqual(group.status, 'draft');
  ctx.groupId = group._id;

  const duplicateLeaderGroup = await api(ctx, 'POST', '/api/v1/groups', {
    periodId: ctx.periodId,
    name: 'Nhóm trùng leader',
  }, ctx.tokens.student1);
  await expectFailure(duplicateLeaderGroup, 400, 'student1 cannot create a second active group');

  const invited = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/groups/${ctx.groupId}/invite`, {
      studentCode: sampleAccounts.students[1].studentCode,
    }, ctx.tokens.student1),
    200,
    'leader invites student2 by student code'
  );
  assert.ok(invited.members.some((member) => member.status === 'invited'));

  const accepted = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/groups/${ctx.groupId}/accept`, {}, ctx.tokens.student2),
    200,
    'student2 accepts the group invitation'
  );
  assert.strictEqual(accepted.members.filter((member) => member.status === 'accepted').length, 2);

  const confirmed = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/groups/${ctx.groupId}/confirm`, {}, ctx.tokens.student1),
    200,
    'leader confirms the group when minimum size is met'
  );
  assert.strictEqual(confirmed.status, 'confirmed');

  const topicPayload = {
    periodId: ctx.periodId,
    ownerType: 'group',
    groupId: ctx.groupId,
    title: 'Hệ thống quản lý quy trình đồ án theo học kỳ',
    summary: 'Xây dựng hệ thống theo dõi nhóm, đề tài, tiến độ và chấm điểm đồ án.',
    objectives: 'Chuẩn hóa quy trình đồ án từ đăng ký tới nghiệm thu.',
    scope: 'Áp dụng cho quy trình đồ án chuyên ngành trong một học kỳ.',
    expectedResult: 'Ứng dụng web có dashboard cho giáo vụ, giảng viên và sinh viên.',
    plan: 'Tuần 1-2 phân tích, tuần 3-6 triển khai, tuần 7-8 kiểm thử.',
    technologies: ['Next.js', 'Express', 'MongoDB'],
    keywords: ['project-management', 'workflow'],
    academicUnit: 'computer_science',
    topicDomain: 'software_development',
    proposedSupervisorId: ctx.accounts.supervisor.lecturer._id.toString(),
  };

  const topic = await expectSuccess(
    await api(ctx, 'POST', '/api/v1/topics', topicPayload, ctx.tokens.student1),
    201,
    'group leader proposes a topic'
  );
  assert.strictEqual(topic.status, 'submitted');
  assert.strictEqual(String(topic.groupId), String(ctx.groupId));
  ctx.topicId = topic._id;

  const nonLeaderTopic = await api(ctx, 'POST', '/api/v1/topics', {
    ...topicPayload,
    title: 'Đề tài do thành viên không phải leader gửi',
  }, ctx.tokens.student2);
  await expectFailure(nonLeaderTopic, 403, 'non-leader cannot propose a group topic');

  const unrelatedLecturerDecision = await api(ctx, 'POST', `/api/v1/topics/${ctx.topicId}/approve`, {
    note: 'Giảng viên không phụ trách lớp không được duyệt đề tài của lớp này.',
  }, ctx.tokens.secondMarker);
  await expectFailure(unrelatedLecturerDecision, 403, 'lecturer who is not the class coordinator cannot approve the class topic');

  const approved = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/topics/${ctx.topicId}/approve`, {
      note: 'Đề tài phù hợp phạm vi học phần.',
    }, ctx.tokens.staff),
    200,
    'staff approves the submitted topic after class coordinator is assigned'
  );
  assert.strictEqual(approved.status, 'approved');

  const project = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/topics/${ctx.topicId}/assign-supervisor`, {
      supervisorId: ctx.accounts.supervisor.lecturer._id.toString(),
    }, ctx.tokens.staff),
    200,
    'staff assigns supervisor and creates project workspace'
  );
  assert.strictEqual(project.status, 'assigned');
  assert.strictEqual(String(project.groupId), String(ctx.groupId));
  ctx.projectId = project._id;
};
