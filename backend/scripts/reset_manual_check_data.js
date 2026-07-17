const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('../config/env').loadEnv();
const connectDB = require('../config/db');

const AiJob = require('../models/AiJob');
const AppealRequest = require('../models/AppealRequest');
const ChatMessage = require('../models/ChatMessage');
const ChatRoom = require('../models/ChatRoom');
const CourseOfferingBatch = require('../models/CourseOfferingBatch');
const EvaluationRubric = require('../models/EvaluationRubric');
const ExtensionRequest = require('../models/ExtensionRequest');
const FileAsset = require('../models/FileAsset');
const FinalGrade = require('../models/FinalGrade');
const Milestone = require('../models/Milestone');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const ProjectGroup = require('../models/ProjectGroup');
const ProjectPeriod = require('../models/ProjectPeriod');
const ProjectRoster = require('../models/ProjectRoster');
const ProjectTopic = require('../models/ProjectTopic');
const ScoreSheet = require('../models/ScoreSheet');
const SubmissionPackage = require('../models/SubmissionPackage');
const TopicChangeRequest = require('../models/TopicChangeRequest');
const TopicEmbedding = require('../models/TopicEmbedding');
const WorkflowEvent = require('../models/WorkflowEvent');
const User = require('../models/User');
const Student = require('../models/Student');

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

const SAMPLE_STUDENTS = [
  {
    fullName: 'Sinh viên Mẫu 1',
    email: 'student1@st.phenikaa-uni.edu.vn',
    studentCode: 'SVTEST001',
    className: 'CNTT-K67',
    cohort: 'K67',
  },
  {
    fullName: 'Sinh viên Mẫu 2',
    email: 'student2@st.phenikaa-uni.edu.vn',
    studentCode: 'SVTEST002',
    className: 'CNTT-K67',
    cohort: 'K67',
  },
  {
    fullName: 'Sinh viên Mẫu 3',
    email: 'student3@st.phenikaa-uni.edu.vn',
    studentCode: 'SVTEST003',
    className: 'CNTT-K67',
    cohort: 'K67',
  },
];

async function upsertSampleStudent(student, passwordHash, facultyId) {
  const user = await User.findOneAndUpdate(
    { email: student.email },
    {
      $set: {
        fullName: student.fullName,
        email: student.email,
        passwordHash,
        roles: ['STUDENT'],
        status: 'active',
        cohort: student.cohort,
        isDeleted: false,
      },
      $unset: {
        deletedAt: '',
        deletedBy: '',
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  await Student.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        studentCode: student.studentCode,
        className: student.className,
        cohort: student.cohort,
        major: 'Công nghệ thông tin',
        facultyId,
        skills: [],
        interests: [],
        technologies: [],
        isDeleted: false,
      },
      $unset: {
        deletedAt: '',
        deletedBy: '',
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  return user;
}

async function resetManualCheckData() {
  await connectDB();

  console.log('--- Hard deleting business data; keeping account collections ---');
  for (const Model of BUSINESS_MODELS) {
    const result = await Model.deleteMany({});
    console.log(`${Model.modelName}: deleted ${result.deletedCount}`);
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const existingStudent = await Student.findOne({});
  const facultyId = existingStudent?.facultyId || new mongoose.Types.ObjectId();

  console.log('\n--- Upserting manual-check student accounts ---');
  for (const sample of SAMPLE_STUDENTS) {
    await upsertSampleStudent(sample, passwordHash, facultyId);
    console.log(`${sample.email} / ${sample.studentCode}`);
  }

  console.log('\nManual-check reset complete.');
  console.log('Kept User, Student, and Lecturer collections. Added/updated 3 sample students.');
  await mongoose.disconnect();
}

resetManualCheckData().catch(async (error) => {
  console.error('Manual-check reset failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
