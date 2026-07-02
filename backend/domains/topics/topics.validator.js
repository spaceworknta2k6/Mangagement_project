const mongoose = require('mongoose');
const ProjectGroup = require('../../models/ProjectGroup');
const ProjectRoster = require('../../models/ProjectRoster');
const Lecturer = require('../../models/Lecturer');
const User = require('../../models/User');
const { ACADEMIC_UNITS, TOPIC_DOMAINS } = require('../../constants/academic-units');

const OWNER_TYPES = ['student', 'group'];

const resolveLecturerByEmail = async (email) => {
  const value = String(email || '').trim().toLowerCase();
  if (!value) return null;

  const user = await User.findOne({
    email: value,
    roles: 'LECTURER',
    status: 'active',
    isDeleted: { $ne: true },
  });
  if (!user) return null;

  return Lecturer.findOne({
    userId: user._id,
    status: 'active',
    isDeleted: { $ne: true },
  });
};

const validateTopicPropose = async (req, res, next) => {
  try {
    const isStudent = req.user.roles && req.user.roles.includes('STUDENT') && !req.user.roles.includes('FACULTY_STAFF') && !req.user.roles.includes('SYSTEM_ADMIN');

    if (isStudent) {
      if (!req.body.ownerType) {
        req.body.ownerType = req.body.groupId ? 'group' : undefined;
      }

      if (req.body.ownerType !== 'student' && !req.body.groupId && req.user.studentId) {
        const group = await ProjectGroup.findOne({
          periodId: req.body.periodId,
          isDeleted: { $ne: true },
          status: { $ne: 'cancelled' },
          members: {
            $elemMatch: {
              studentId: req.user.studentId,
              status: 'accepted',
            },
          },
        });

        if (group) {
          req.body.ownerType = 'group';
          req.body.groupId = group._id.toString();
        }
      }

      if (!req.body.ownerType) {
        req.body.ownerType = 'student';
      }
    }

    const {
      periodId,
      ownerType,
      groupId,
      technologies,
      proposedSupervisorId,
      proposedSupervisorEmail,
      academicUnit,
      topicDomain,
    } = req.body;

    const errors = [];

    if (!periodId || !mongoose.Types.ObjectId.isValid(periodId)) {
      errors.push({ field: 'periodId', code: 'PERIOD_ID_INVALID', message: 'Mã đợt đồ án (periodId) không hợp lệ.' });
    }
    if (academicUnit !== undefined && !ACADEMIC_UNITS.includes(academicUnit)) {
      errors.push({ field: 'academicUnit', code: 'ACADEMIC_UNIT_INVALID', message: 'Khoa/đơn vị chuyên môn của đề tài không hợp lệ.' });
    }
    if (topicDomain !== undefined && !TOPIC_DOMAINS.includes(topicDomain)) {
      errors.push({ field: 'topicDomain', code: 'TOPIC_DOMAIN_INVALID', message: 'Hướng chuyên môn của đề tài không hợp lệ.' });
    }

    if (isStudent) {
      if (!OWNER_TYPES.includes(ownerType)) {
        errors.push({ field: 'ownerType', code: 'OWNER_TYPE_INVALID', message: 'Hình thức thực hiện phải là cá nhân hoặc theo nhóm.' });
      }

      if (ownerType === 'group') {
        if (!groupId) {
          errors.push({ field: 'groupId', code: 'GROUP_REQUIRED', message: 'Bạn cần chọn một nhóm đã tham gia trong đợt đồ án này trước khi đề xuất đề tài.' });
        } else if (!mongoose.Types.ObjectId.isValid(groupId)) {
          errors.push({ field: 'groupId', code: 'GROUP_ID_INVALID', message: 'Mã nhóm đồ án (groupId) không hợp lệ.' });
        }
      }

      if (ownerType === 'student' && periodId && mongoose.Types.ObjectId.isValid(periodId) && req.user.studentId) {
        const roster = await ProjectRoster.findOne({
          periodId,
          studentId: req.user.studentId,
          status: 'active',
        });

        if (!roster) {
          errors.push({ field: 'periodId', code: 'ROSTER_REQUIRED', message: 'Bạn chưa có trong danh sách tham gia đợt này.' });
        }
      }

      if (!proposedSupervisorId && proposedSupervisorEmail) {
        const lecturer = await resolveLecturerByEmail(proposedSupervisorEmail);
        if (lecturer) {
          req.body.proposedSupervisorId = lecturer._id.toString();
        }
      }

      if (!req.body.proposedSupervisorId || !mongoose.Types.ObjectId.isValid(req.body.proposedSupervisorId)) {
        errors.push({ field: 'proposedSupervisorEmail', code: 'SUPERVISOR_EMAIL_INVALID', message: 'Email giảng viên hướng dẫn không hợp lệ hoặc không tồn tại.' });
      }
    } else {
      if (!proposedSupervisorId && proposedSupervisorEmail) {
        const lecturer = await resolveLecturerByEmail(proposedSupervisorEmail);
        if (lecturer) {
          req.body.proposedSupervisorId = lecturer._id.toString();
        }
      }

      if (req.body.proposedSupervisorId && !mongoose.Types.ObjectId.isValid(req.body.proposedSupervisorId)) {
        errors.push({ field: 'proposedSupervisorEmail', code: 'SUPERVISOR_EMAIL_INVALID', message: 'Email giảng viên hướng dẫn không hợp lệ hoặc không tồn tại.' });
      }
    }

    const requiredStrings = {
      title: 'Tên đề tài',
      summary: 'Tóm tắt đề tài',
      objectives: 'Mục tiêu đề tài',
      scope: 'Phạm vi đề tài',
      expectedResult: 'Sản phẩm đầu ra dự kiến',
      plan: 'Kế hoạch thực hiện',
    };

    for (const [field, label] of Object.entries(requiredStrings)) {
      const val = req.body[field];
      if (!val || typeof val !== 'string' || val.trim() === '') {
        errors.push({ field, code: `${field.toUpperCase()}_REQUIRED`, message: `${label} là bắt buộc.` });
      }
    }

    if (technologies !== undefined && !Array.isArray(technologies)) {
      errors.push({ field: 'technologies', code: 'TECHNOLOGIES_MUST_BE_ARRAY', message: 'Danh sách công nghệ sử dụng phải là một mảng.' });
    }

    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Dữ liệu đề xuất đề tài không hợp lệ.',
        errors,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const validateTopicUpdate = async (req, res, next) => {
  try {
    const ProjectTopic = require('../../models/ProjectTopic');
    const topic = await ProjectTopic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'De tai khong ton tai.' });
    }

    if (!req.body.periodId) req.body.periodId = topic.periodId.toString();
    if (!req.body.ownerType) req.body.ownerType = topic.ownerType || (topic.groupId ? 'group' : 'student');
    if (!req.body.groupId && topic.groupId) req.body.groupId = topic.groupId.toString();
    if (!req.body.proposedSupervisorId && topic.proposedSupervisorId) {
      req.body.proposedSupervisorId = topic.proposedSupervisorId.toString();
    }

    return validateTopicPropose(req, res, next);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateTopicPropose,
  validateTopicUpdate,
};
