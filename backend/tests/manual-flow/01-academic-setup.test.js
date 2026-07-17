const assert = require('assert');
const { api, expectFailure, expectSuccess, login, sampleAccounts } = require('./helpers');

module.exports = async function runAcademicSetup(ctx) {
  ctx.tokens = {
    staff: await login(ctx, sampleAccounts.staff),
    supervisor: await login(ctx, sampleAccounts.supervisor),
    secondMarker: await login(ctx, sampleAccounts.secondMarker),
    student1: await login(ctx, sampleAccounts.students[0]),
    student2: await login(ctx, sampleAccounts.students[1]),
    student3: await login(ctx, sampleAccounts.students[2]),
  };

  const periodPayload = {
    name: 'Manual Flow - Đồ án chuyên ngành 2026.1',
    schoolYear: '2026-2027',
    semester: '1',
    type: 'foundation_project',
    courseCode: 'MANUAL-IT4911',
    courseName: 'Đồ án chuyên ngành',
    cohort: 'K67',
    classCount: 2,
    academicUnit: 'computer_science',
    facultyId: ctx.facultyId,
    departmentId: ctx.departmentId,
    allowIndividual: true,
    allowGroup: true,
    groupMinSize: 2,
    groupMaxSize: 3,
    registrationStart: '2026-08-01T00:00:00.000Z',
    registrationEnd: '2026-09-15T00:00:00.000Z',
    projectStart: '2026-09-16T00:00:00.000Z',
    projectEnd: '2026-12-31T00:00:00.000Z',
    topicChangeDeadline: '2026-10-15T00:00:00.000Z',
    finalSubmissionDeadline: '2026-12-20T00:00:00.000Z',
    gradingStart: '2027-01-05T00:00:00.000Z',
    gradingEnd: '2027-01-20T00:00:00.000Z',
    revisionDeadline: '2027-01-25T00:00:00.000Z',
    archiveDeadline: '2027-02-01T00:00:00.000Z',
    minGroupSize: 2,
    maxGroupSize: 3,
    varianceThreshold: 2,
    passScore: 5,
    rubricVersion: 'manual-v1',
    scoringFormula: { supervisor: 0.5, secondMarker: 0.5 },
  };

  const period = await expectSuccess(
    await api(ctx, 'POST', '/api/v1/periods', periodPayload, ctx.tokens.staff),
    201,
    'staff creates a course offering batch without assigning lecturers'
  );
  assert.strictEqual(period.status, 'draft');
  assert.strictEqual(period.isBatch, true);
  assert.strictEqual(period.periods.length, 2);
  assert.match(period.periods[0].classCode, /^MANUAL-IT4911-K67-2026-HK1\(N01\)$/);
  assert.strictEqual(period.periods[0].coordinatorLecturerId, undefined);
  assert.strictEqual(period.periods[1].coordinatorLecturerId, undefined);
  ctx.batchId = period._id;
  ctx.periodIds = period.periods.map((classPeriod) => classPeriod._id);
  ctx.periodId = ctx.periodIds[0];

  const invalidLecturerPatch = await api(ctx, 'PATCH', `/api/v1/periods/${ctx.periodId}`, {
    coordinatorLecturerId: 'not-a-valid-object-id',
  }, ctx.tokens.staff);
  await expectFailure(invalidLecturerPatch, 422, 'staff cannot assign an invalid lecturer id to a class');

  const assignedClassN01 = await expectSuccess(
    await api(ctx, 'PATCH', `/api/v1/periods/${ctx.periodIds[0]}`, {
      coordinatorLecturerId: ctx.accounts.supervisor.lecturer._id.toString(),
    }, ctx.tokens.staff),
    200,
    'staff assigns the main lecturer to generated class N01'
  );
  assert.strictEqual(String(assignedClassN01.coordinatorLecturerId), String(ctx.accounts.supervisor.lecturer._id));

  const assignedClassN02 = await expectSuccess(
    await api(ctx, 'PATCH', `/api/v1/periods/${ctx.periodIds[1]}`, {
      coordinatorLecturerId: ctx.accounts.secondMarker.lecturer._id.toString(),
    }, ctx.tokens.staff),
    200,
    'staff assigns a different main lecturer to generated class N02'
  );
  assert.strictEqual(String(assignedClassN02.coordinatorLecturerId), String(ctx.accounts.secondMarker.lecturer._id));

  const rosterPayload = {
    roster: sampleAccounts.students.map((student) => ({
      studentCode: student.studentCode,
      classSection: 'MANUAL-01',
      fullName: student.fullName,
      email: student.email,
    })),
  };
  const importedRoster = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/periods/${ctx.periodId}/rosters/import`, rosterPayload, ctx.tokens.staff),
    200,
    'staff imports three students into the roster'
  );
  assert.strictEqual(importedRoster.length, 3);

  const roster = await expectSuccess(
    await api(ctx, 'GET', `/api/v1/periods/${ctx.periodId}/rosters`, undefined, ctx.tokens.staff),
    200,
    'staff sees the imported roster'
  );
  assert.strictEqual(roster.length, 3);

  const opened = await expectSuccess(
    await api(ctx, 'POST', `/api/v1/periods/${ctx.periodId}/open-registration`, {}, ctx.tokens.staff),
    200,
    'staff opens registration'
  );
  assert.strictEqual(opened.status, 'registration_open');
};
