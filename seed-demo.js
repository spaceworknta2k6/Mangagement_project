const path = require('path');
module.paths.push(path.join(__dirname, 'backend', 'node_modules'));

require('./backend/config/env').loadEnv();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./backend/config/db');

// Models
const User = require('./backend/models/User');
const Student = require('./backend/models/Student');
const Lecturer = require('./backend/models/Lecturer');
const ProjectPeriod = require('./backend/models/ProjectPeriod');
const ProjectRoster = require('./backend/models/ProjectRoster');
const ProjectGroup = require('./backend/models/ProjectGroup');
const ProjectTopic = require('./backend/models/ProjectTopic');
const Project = require('./backend/models/Project');
const Milestone = require('./backend/models/Milestone');
const ChatRoom = require('./backend/models/ChatRoom');

const seedDemo = async () => {
  try {
    await connectDB();
    console.log('Đã kết nối Database. Đang tạo dữ liệu Test...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    // 1. Xóa toàn bộ dữ liệu demo cũ
    await User.deleteMany({ email: { $regex: /@demo.com$/ } });
    await ProjectPeriod.deleteMany({ name: 'Đợt Đồ án Demo Web Nâng Cao' });
    await ProjectGroup.deleteMany({ name: 'Nhóm SV Demo 1' });
    await ProjectTopic.deleteMany({ title: 'Đề tài Demo nộp báo cáo' });
    await ChatRoom.deleteMany({ name: 'Nhóm Demo Chat' });
    
    // 2. Tạo Users
    const adminUser = await User.create({
      fullName: 'Quản trị viên Hệ thống', email: 'admin@demo.com', passwordHash, roles: ['SYSTEM_ADMIN'],
    });

    const giaovuUser = await User.create({
      fullName: 'Giáo vụ Khoa', email: 'giaovu@demo.com', passwordHash, roles: ['FACULTY_STAFF'],
    });

    const gvUser = await User.create({
      fullName: 'TS. Nguyễn Văn Giảng Viên', email: 'giangvien@demo.com', passwordHash, roles: ['LECTURER'],
    });
    await Lecturer.deleteMany({ lecturerCode: 'GV_DEMO_01' });
    const gvProfile = await Lecturer.create({
      userId: gvUser._id, lecturerCode: 'GV_DEMO_01', facultyId: new mongoose.Types.ObjectId(), departmentId: new mongoose.Types.ObjectId(), academicDegree: 'phd', expertise: ['React', 'Node.js', 'Web Security'], maxProjects: 5,
    });

    const sv1User = await User.create({
      fullName: 'SV. Trần Thị A', email: 'sinhvien1@demo.com', passwordHash, roles: ['STUDENT'],
    });
    await Student.deleteMany({ studentCode: 'SV_DEMO_01' });
    const sv1Profile = await Student.create({
      userId: sv1User._id, studentCode: 'SV_DEMO_01', className: 'K15-CNTT', cohort: 'K15', major: 'Công nghệ thông tin', facultyId: new mongoose.Types.ObjectId(), skills: ['HTML', 'CSS', 'JS'],
    });

    const sv2User = await User.create({
      fullName: 'SV. Lê Văn B', email: 'sinhvien2@demo.com', passwordHash, roles: ['STUDENT'],
    });
    await Student.deleteMany({ studentCode: 'SV_DEMO_02' });
    const sv2Profile = await Student.create({
      userId: sv2User._id, studentCode: 'SV_DEMO_02', className: 'K15-CNTT', cohort: 'K15', major: 'Công nghệ thông tin', facultyId: new mongoose.Types.ObjectId(), skills: ['React', 'Next.js'],
    });

    console.log('✅ Đã tạo xong tài khoản (admin, giaovu, giangvien, sinhvien1, sinhvien2).');

    // 3. Tạo Project Period đang diễn ra
    const period = await ProjectPeriod.create({
      name: 'Đợt Đồ án Demo Web Nâng Cao',
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
      minGroupSize: 1, maxGroupSize: 5,
      topicChangeDeadline: new Date(Date.now() + 86400000 * 20),
      varianceThreshold: 2.0, passScore: 5.0,
      rubricVersion: '1.0', rubricId: new mongoose.Types.ObjectId(),
      scoringFormula: { "GVHD": 40, "GVPB": 60 },
      status: 'in_progress',
      createdBy: adminUser._id
    });

    // 4. Thêm Sinh viên vào Danh sách đợt đồ án
    await ProjectRoster.create({ periodId: period._id, studentId: sv1Profile._id, classSection: 'CNTT1', importedBy: adminUser._id, status: 'active' });
    await ProjectRoster.create({ periodId: period._id, studentId: sv2Profile._id, classSection: 'CNTT1', importedBy: adminUser._id, status: 'active' });

    // 5. Tạo Nhóm (Group)
    const group = await ProjectGroup.create({
      periodId: period._id,
      name: 'Nhóm SV Demo 1',
      leaderStudentId: sv1Profile._id,
      members: [
        { studentId: sv1Profile._id, role: 'leader', status: 'accepted', joinedAt: new Date() },
        { studentId: sv2Profile._id, role: 'member', status: 'accepted', joinedAt: new Date() }
      ],
      status: 'confirmed'
    });

    // 6. Tạo Đề tài & Ghép với Giảng viên
    const topic = await ProjectTopic.create({
      periodId: period._id,
      groupId: group._id,
      departmentId: period.departmentId,
      title: 'Đề tài Demo nộp báo cáo',
      englishName: 'Demo Topic for Submission',
      summary: 'Dùng để bảo vệ môn Web Nâng Cao',
      objectives: 'Test luồng nộp bài và chat',
      scope: 'Hệ thống nội bộ',
      expectedResult: 'Web chạy mượt',
      plan: '1 ngày',
      tags: ['Demo', 'Web Nâng Cao'],
      status: 'approved',
      source: 'student_proposed',
      supervisorId: gvUser._id, // Assign to GV Demo
      suggestedByGroupId: group._id
    });
    
    group.topicId = topic._id;
    await group.save();

    // 7. Tạo Project (Đồ án chính thức đã bắt đầu)
    const project = await Project.create({
      periodId: period._id,
      ownerType: 'group',
      ownerId: group._id,
      groupId: group._id,
      topicId: topic._id,
      supervisorId: gvUser._id,
      status: 'in_progress'
    });

    // 8. Mở 1 Milestone (Nhiệm vụ) để Sinh viên có chỗ Nộp bài (Hạn nộp +15 ngày)
    await Milestone.create({
      projectId: project._id,
      title: 'Nộp báo cáo Tiến độ tuần 1',
      description: 'Sinh viên nộp file báo cáo PDF hoặc Word tại đây để test.',
      deadline: new Date(Date.now() + 86400000 * 15), // Future date
      status: 'open'
    });

    // 9. Tạo Room Chat chung để test Socket.io
    await ChatRoom.create({
      name: 'Nhóm Demo Chat',
      type: 'group',
      groupId: group._id,
      projectId: project._id,
      memberIds: [sv1User._id, sv2User._id, gvUser._id]
    });

    console.log('✅ Đã khởi tạo hoàn chỉnh: Đợt đồ án, Nhóm, Đề tài, Project, Milestone, và Room Chat.');
    console.log('\n🎉 SẴN SÀNG LIVE DEMO! TÀI KHOẢN:');
    console.log('Giáo vụ khoa: giaovu@demo.com | Mật khẩu: 123456');
    console.log('Sinh viên 1: sinhvien1@demo.com | Mật khẩu: 123456 (Dùng để test nộp bài)');
    console.log('Giảng viên : giangvien@demo.com | Mật khẩu: 123456 (Dùng để test duyệt bài/chat)');

  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu Demo:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối DB.');
  }
};

seedDemo();
