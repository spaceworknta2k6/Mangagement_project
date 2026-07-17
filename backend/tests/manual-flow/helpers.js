const assert = require('assert');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const AiJob = require('../../models/AiJob');
const AppealRequest = require('../../models/AppealRequest');
const ChatMessage = require('../../models/ChatMessage');
const ChatRoom = require('../../models/ChatRoom');
const CourseOfferingBatch = require('../../models/CourseOfferingBatch');
const EvaluationRubric = require('../../models/EvaluationRubric');
const ExtensionRequest = require('../../models/ExtensionRequest');
const FileAsset = require('../../models/FileAsset');
const FinalGrade = require('../../models/FinalGrade');
const Milestone = require('../../models/Milestone');
const Notification = require('../../models/Notification');
const Project = require('../../models/Project');
const ProjectGroup = require('../../models/ProjectGroup');
const ProjectPeriod = require('../../models/ProjectPeriod');
const ProjectRoster = require('../../models/ProjectRoster');
const ProjectTopic = require('../../models/ProjectTopic');
const ScoreSheet = require('../../models/ScoreSheet');
const SubmissionPackage = require('../../models/SubmissionPackage');
const TopicChangeRequest = require('../../models/TopicChangeRequest');
const TopicEmbedding = require('../../models/TopicEmbedding');
const WorkflowEvent = require('../../models/WorkflowEvent');
const User = require('../../models/User');
const Student = require('../../models/Student');
const Lecturer = require('../../models/Lecturer');

const BUSINESS_MODELS = [
  AiJob,
  AppealRequest,
  ChatMessage,
  ChatRoom,
  CourseOfferingBatch,
  EvaluationRubric,
  ExtensionRequest,
  FileAsset,
  FinalGrade,
  Milestone,
  Notification,
  Project,
  ProjectGroup,
  ProjectPeriod,
  ProjectRoster,
  ProjectTopic,
  ScoreSheet,
  SubmissionPackage,
  TopicChangeRequest,
  TopicEmbedding,
  WorkflowEvent,
];

const PASSWORD = 'password123';

const sampleAccounts = {
  admin: {
    fullName: 'Quản trị viên Test',
    email: 'admin.manual@st.phenikaa-uni.edu.vn',
    roles: ['SYSTEM_ADMIN'],
  },
  staff: {
    fullName: 'Giáo vụ Test',
    email: 'staff.manual@st.phenikaa-uni.edu.vn',
    roles: ['FACULTY_STAFF'],
    lecturerCode: 'GV-MANUAL-STAFF',
  },
  supervisor: {
    fullName: 'Giảng viên Hướng dẫn Test',
    email: 'supervisor.manual@st.phenikaa-uni.edu.vn',
    roles: ['LECTURER'],
    lecturerCode: 'GV-MANUAL-001',
  },
  secondMarker: {
    fullName: 'Giảng viên Chấm 2 Test',
    email: 'secondmarker.manual@st.phenikaa-uni.edu.vn',
    roles: ['LECTURER'],
    lecturerCode: 'GV-MANUAL-SECOND',
  },
  students: [
    {
      fullName: 'Sinh viên Mẫu 1',
      email: 'student1@st.phenikaa-uni.edu.vn',
      studentCode: 'SVTEST001',
    },
    {
      fullName: 'Sinh viên Mẫu 2',
      email: 'student2@st.phenikaa-uni.edu.vn',
      studentCode: 'SVTEST002',
    },
    {
      fullName: 'Sinh viên Mẫu 3',
      email: 'student3@st.phenikaa-uni.edu.vn',
      studentCode: 'SVTEST003',
    },
  ],
};

async function clearBusinessData() {
  for (const Model of BUSINESS_MODELS) {
    await Model.deleteMany({});
  }
}

async function upsertUser({ fullName, email, roles }, passwordHash) {
  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        fullName,
        email,
        passwordHash,
        roles,
        status: 'active',
        isDeleted: false,
      },
      $unset: {
        deletedAt: '',
        deletedBy: '',
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertLecturer(account, passwordHash, facultyId, departmentId) {
  const user = await upsertUser(account, passwordHash);
  const lecturer = await Lecturer.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        lecturerCode: account.lecturerCode,
        facultyId,
        departmentId,
        academicDegree: 'master',
        expertise: ['Manual flow verification'],
        maxProjects: account.roles.includes('FACULTY_STAFF') ? 0 : 5,
        isExternal: false,
        organization: 'PHENIKAA',
        status: 'active',
        isDeleted: false,
      },
      $unset: {
        deletedAt: '',
        deletedBy: '',
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  return { user, lecturer };
}

async function upsertStudent(account, passwordHash, facultyId) {
  const user = await upsertUser({ ...account, roles: ['STUDENT'] }, passwordHash);
  const student = await Student.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        studentCode: account.studentCode,
        className: 'CNTT-K67',
        cohort: 'K67',
        major: 'Công nghệ thông tin',
        facultyId,
        skills: ['React', 'Node.js'],
        interests: ['Quản lý đồ án'],
        technologies: ['Next.js', 'MongoDB'],
        isDeleted: false,
      },
      $unset: {
        deletedAt: '',
        deletedBy: '',
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  return { user, student };
}

async function ensureManualAccounts(ctx) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const facultyId = new mongoose.Types.ObjectId();
  const departmentId = new mongoose.Types.ObjectId();

  ctx.accounts = {};
  ctx.accounts.admin = { user: await upsertUser(sampleAccounts.admin, passwordHash) };
  ctx.accounts.staff = await upsertLecturer(sampleAccounts.staff, passwordHash, facultyId, departmentId);
  ctx.accounts.supervisor = await upsertLecturer(sampleAccounts.supervisor, passwordHash, facultyId, departmentId);
  ctx.accounts.secondMarker = await upsertLecturer(sampleAccounts.secondMarker, passwordHash, facultyId, departmentId);
  ctx.accounts.students = [];

  for (const student of sampleAccounts.students) {
    ctx.accounts.students.push(await upsertStudent(student, passwordHash, facultyId));
  }

  ctx.facultyId = facultyId.toString();
  ctx.departmentId = departmentId.toString();
}

async function api(ctx, method, path, body, token) {
  const response = await fetch(`${ctx.baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function expectSuccess(result, expectedStatus, label) {
  assert.strictEqual(
    result.response.status,
    expectedStatus,
    `${label}: expected HTTP ${expectedStatus}, got ${result.response.status} ${JSON.stringify(result.payload)}`
  );
  assert.strictEqual(result.payload.success, true, `${label}: expected success=true`);
  return result.payload.data;
}

async function expectFailure(result, expectedStatus, label) {
  assert.strictEqual(
    result.response.status,
    expectedStatus,
    `${label}: expected HTTP ${expectedStatus}, got ${result.response.status} ${JSON.stringify(result.payload)}`
  );
  assert.strictEqual(result.payload.success, false, `${label}: expected success=false`);
  return result.payload;
}

async function login(ctx, account) {
  const result = await api(ctx, 'POST', '/api/v1/auth/login', {
    email: account.email,
    password: PASSWORD,
  });
  const data = await expectSuccess(result, 200, `login ${account.email}`);
  assert.ok(data.accessToken, `login ${account.email}: token is required`);
  return data.accessToken;
}

module.exports = {
  PASSWORD,
  sampleAccounts,
  clearBusinessData,
  ensureManualAccounts,
  api,
  expectSuccess,
  expectFailure,
  login,
};
