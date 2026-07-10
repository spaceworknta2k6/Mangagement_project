const mongoose = require('mongoose');
require('../config/env').loadEnv();
const connectDB = require('../config/db');

const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const ProjectPeriod = require('../models/ProjectPeriod');
const ProjectRoster = require('../models/ProjectRoster');
const ProjectGroup = require('../models/ProjectGroup');
const ProjectTopic = require('../models/ProjectTopic');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const EvaluationRubric = require('../models/EvaluationRubric');
const Project = require('../models/Project');
const SubmissionPackage = require('../models/SubmissionPackage');
const ScoreSheet = require('../models/ScoreSheet');
const ExtensionRequest = require('../models/ExtensionRequest');
const TopicChangeRequest = require('../models/TopicChangeRequest');
const Milestone = require('../models/Milestone');

const seedFull = async () => {
  try {
    await connectDB();
    console.log('--- Cleaning Up Old Data ---');
    await ProjectPeriod.deleteMany({});
    await ProjectRoster.deleteMany({});
    await ProjectGroup.deleteMany({});
    await ProjectTopic.deleteMany({});
    await ChatRoom.deleteMany({});
    await ChatMessage.deleteMany({});
    await Project.deleteMany({});
    await SubmissionPackage.deleteMany({});
    await ScoreSheet.deleteMany({});
    await ExtensionRequest.deleteMany({});
    await TopicChangeRequest.deleteMany({});
    await Milestone.deleteMany({});
    
    // Fetch users created by user.seeder.js
    const admin = await User.findOne({ email: 'admin@st.phenikaa-uni.edu.vn' });
    const studentUser = await User.findOne({ email: 'hoanganh@st.phenikaa-uni.edu.vn' });
    const studentProfile = await Student.findOne({ userId: studentUser._id });
    const supervisorUser = await User.findOne({ email: 'haikt@st.phenikaa-uni.edu.vn' });
    const staffUser = await User.findOne({ email: 'huonglt@st.phenikaa-uni.edu.vn' });
    
    const rubric = await EvaluationRubric.findOne({}); // from rubric.seeder.js

    console.log('--- Creating Project Period ---');
    const period = await ProjectPeriod.create({
      name: 'Đồ án Chuyên ngành Kỹ thuật phần mềm Kỳ 2026.1',
      schoolYear: '2025-2026',
      semester: 'Học kỳ I',
      facultyId: new mongoose.Types.ObjectId(),
      departmentId: new mongoose.Types.ObjectId(),
      type: 'foundation_project',
      academicUnit: 'computer_science',
      registrationStart: new Date(Date.now() - 86400000 * 10),
      registrationEnd: new Date(Date.now() + 86400000 * 10),
      projectStart: new Date(Date.now() - 86400000 * 5),
      projectEnd: new Date(Date.now() + 86400000 * 60),
      minGroupSize: 1,
      maxGroupSize: 5,
      topicChangeDeadline: new Date(Date.now() + 86400000 * 20),
      varianceThreshold: 2.0,
      passScore: 5.0,
      rubricVersion: '1.0',
      rubricId: rubric ? rubric._id : new mongoose.Types.ObjectId(),
      scoringFormula: { "GVHD": 40, "GVPB": 60 },
      status: 'in_progress',
      createdBy: admin._id
    });

    console.log('--- Importing Roster ---');
    await ProjectRoster.create({
      periodId: period._id,
      studentId: studentProfile._id,
      classSection: 'IT1 - K67',
      importedBy: admin._id,
      status: 'active'
    });

    console.log('--- Creating Project Group ---');
    const group = await ProjectGroup.create({
      periodId: period._id,
      name: 'Nhóm AI Fintech K67',
      leaderStudentId: studentProfile._id,
      members: [{ studentId: studentProfile._id, role: 'leader', status: 'accepted', joinedAt: new Date() }],
      status: 'confirmed'
    });

    console.log('--- Creating Project Topic ---');
    const topic = await ProjectTopic.create({
      periodId: period._id,
      groupId: group._id,
      departmentId: period.departmentId,
      title: 'Hệ thống Dự báo Dòng tiền thông minh (AI Cashflow)',
      englishName: 'AI Cashflow Forecasting System',
      summary: 'Nghiên cứu ứng dụng Time-series AI (LSTM) để phân tích và dự báo dòng tiền cho doanh nghiệp.',
      objectives: 'Dự báo chính xác dòng tiền',
      scope: 'Doanh nghiệp vừa và nhỏ',
      expectedResult: 'Hệ thống website Next.js tích hợp mô hình AI',
      plan: 'Tháng 1 nghiên cứu, Tháng 2 code, Tháng 3 test',
      tags: ['AI', 'Fintech', 'Next.js'],
      status: 'approved',
      source: 'student_proposed',
      supervisorId: supervisorUser._id, // haikt
      suggestedByGroupId: group._id
    });
    
    // Update group to link topic
    group.topicId = topic._id;
    await group.save();

    console.log('--- Creating Project ---');
    const project = await Project.create({
      periodId: period._id,
      ownerType: 'group',
      ownerId: group._id,
      groupId: group._id,
      topicId: topic._id,
      supervisorId: supervisorUser._id,
      status: 'ready_for_grading'
    });

    console.log('--- Creating Milestone & Submission ---');
    const milestone = await Milestone.create({
      projectId: project._id,
      title: 'Báo cáo Tiến độ Lần 1',
      description: 'Nộp báo cáo tuần 4',
      deadline: new Date(Date.now() - 86400000 * 2), // Past due
      status: 'open'
    });

    const submission = await SubmissionPackage.create({
      ownerType: 'project',
      ownerId: project._id,
      periodId: period._id,
      groupId: group._id,
      phase: 'progress',
      deadline: new Date(Date.now() + 86400000 * 5),
      submittedBy: studentUser._id,
      status: 'submitted',
      items: [{ type: 'report_pdf', status: 'submitted' }]
    });

    console.log('--- Creating Extension Request ---');
    await ExtensionRequest.create({
      targetType: 'milestone',
      targetId: milestone._id,
      projectId: project._id,
      groupId: group._id,
      requestedTo: new Date(Date.now() + 86400000 * 5),
      reason: 'Các thành viên trong nhóm bị ốm nên trễ tiến độ làm báo cáo.',
      status: 'pending'
    });

    console.log('--- Creating Topic Change Request ---');
    await TopicChangeRequest.create({
      topicId: topic._id,
      groupId: group._id,
      oldTitle: topic.title,
      newTitle: 'Hệ thống Quản lý Đồ án Tốt nghiệp (Phiên bản mới)',
      newScope: 'Mở rộng thêm mobile app',
      newPlan: 'Thêm 2 tuần phát triển mobile',
      reason: 'Đề tài cũ quá rộng.',
      status: 'pending'
    });

    console.log('--- Creating ScoreSheet ---');
    if (rubric && rubric.criteria && rubric.criteria.SUPERVISOR) {
      await ScoreSheet.create({
        projectId: project._id,
        periodId: period._id,
        targetType: 'SUPERVISOR',
        targetId: project._id,
        graderId: supervisorUser._id,
        graderRole: 'SUPERVISOR',
        rubricId: rubric._id,
        rubricRole: 'SUPERVISOR',
        rubricVersion: rubric.version,
        criteriaScores: rubric.criteria.SUPERVISOR.map(c => ({
          criteriaCode: c.criteriaCode,
          criteriaName: c.criteriaName,
          maxScore: c.maxScore,
          weight: c.weight,
          score: 8
        })),
        rawTotal: 8,
        roundedTotal: 8,
        comment: 'Cần cố gắng thêm phần tài liệu',
        lastSavedAt: new Date()
      });
    }

    console.log('--- Creating Chat Room & Messages ---');
    const chatRoom = await ChatRoom.create({
      name: 'Nhóm AI Fintech K67',
      type: 'group',
      groupId: group._id,
      projectId: project._id,
      memberIds: [studentUser._id, supervisorUser._id]
    });

    await ChatMessage.create({
      roomId: chatRoom._id,
      senderId: studentUser._id,
      body: 'Dạ thưa thầy, nhóm em đã hoàn thiện sườn báo cáo tuần 1 ạ. Thầy xem giúp nhóm em nhé!',
      status: 'sent'
    });

    await ChatMessage.create({
      roomId: chatRoom._id,
      senderId: supervisorUser._id,
      body: 'Thầy nhận được rồi, các em làm khá tốt. Chú ý bổ sung thêm phần vẽ Use Case Diagram nhé!',
      status: 'sent'
    });

    console.log('✅ Full Seeding Completed SUCCESSFUL!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seedFull();
