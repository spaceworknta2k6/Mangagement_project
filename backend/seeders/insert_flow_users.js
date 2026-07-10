const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('../config/env').loadEnv();

const connectDB = require('../config/db');
const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');

const insertFlowUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const itFacultyId = new mongoose.Types.ObjectId();
    const softwareDeptId = new mongoose.Types.ObjectId();

    // 1. Giáo vụ
    const giaovuUser = await User.create({
      fullName: 'Giáo vụ (Flow Test)',
      email: 'giaovu_flow@demo.com',
      passwordHash,
      roles: ['FACULTY_STAFF'],
      status: 'active',
      isDeleted: false
    });
    await Lecturer.create({
      userId: giaovuUser._id,
      lecturerCode: 'GV_FLOW_01',
      facultyId: itFacultyId,
      departmentId: softwareDeptId,
      academicDegree: 'master',
      expertise: ['Quản lý'],
      maxProjects: 0,
      isExternal: false,
    });
    console.log('Created: giaovu_flow@demo.com');

    // 2. Giảng viên hướng dẫn
    const hdUser = await User.create({
      fullName: 'GV Hướng dẫn (Flow Test)',
      email: 'gv_huongdan@demo.com',
      passwordHash,
      roles: ['LECTURER'],
      status: 'active',
      isDeleted: false
    });
    await Lecturer.create({
      userId: hdUser._id,
      lecturerCode: 'GV_FLOW_02',
      facultyId: itFacultyId,
      departmentId: softwareDeptId,
      academicDegree: 'phd',
      expertise: ['Software Engineering'],
      maxProjects: 5,
      isExternal: false,
    });
    console.log('Created: gv_huongdan@demo.com');

    // 3. Giảng viên phản biện / Hội đồng
    const pbUser = await User.create({
      fullName: 'GV Phản biện (Flow Test)',
      email: 'gv_phanbien@demo.com',
      passwordHash,
      roles: ['LECTURER'],
      status: 'active',
      isDeleted: false
    });
    await Lecturer.create({
      userId: pbUser._id,
      lecturerCode: 'GV_FLOW_03',
      facultyId: itFacultyId,
      departmentId: softwareDeptId,
      academicDegree: 'phd',
      expertise: ['Data Science'],
      maxProjects: 5,
      isExternal: false,
    });
    console.log('Created: gv_phanbien@demo.com');

    // 4. Sinh viên
    const svUser = await User.create({
      fullName: 'Sinh viên (Flow Test)',
      email: 'sv_flow@demo.com',
      passwordHash,
      roles: ['STUDENT'],
      status: 'active',
      isDeleted: false
    });
    await Student.create({
      userId: svUser._id,
      studentCode: 'SV_FLOW_01',
      className: 'IT1',
      cohort: 'K67',
      major: 'IT',
      facultyId: itFacultyId,
      skills: [],
      interests: [],
      technologies: [],
    });
    console.log('Created: sv_flow@demo.com');

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

insertFlowUsers();
