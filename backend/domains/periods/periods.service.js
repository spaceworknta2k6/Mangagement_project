const ProjectPeriod = require('../../models/ProjectPeriod');
const CourseOfferingBatch = require('../../models/CourseOfferingBatch');
const WorkflowEvent = require('../../models/WorkflowEvent');
const Lecturer = require('../../models/Lecturer');
const { ACADEMIC_UNIT_DEPARTMENT_IDS, IT_FACULTY_ID } = require('../../constants/academic-units');

// Utility helper to create workflow events for audit logs
const logWorkflowEvent = async ({
  entityId,
  fromStatus,
  toStatus,
  actorId,
  actorRoles,
  action,
  reason = '',
}) => {
  return await WorkflowEvent.create({
    entityType: 'ProjectPeriod',
    entityId,
    fromStatus,
    toStatus,
    actorId,
    actorRoles,
    action,
    reason,
  });
};

const normalizeCodePart = (value) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const buildCourseOfferingCode = ({ courseCode, cohort, schoolYear, semester }) => {
  const startYear = String(schoolYear || '').split('-')[0] || 'YEAR';
  return [
    normalizeCodePart(courseCode),
    normalizeCodePart(cohort),
    startYear,
    `HK${String(semester || '').trim()}`,
  ].filter(Boolean).join('-');
};

const buildClassSection = (index) => `N${String(index).padStart(2, '0')}`;

const toPeriodPayload = (periodData, facultyId, departmentId, actorId) => ({
  ...periodData,
  facultyId,
  departmentId,
  status: 'draft',
  createdBy: actorId,
  updatedBy: actorId,
});

const createPeriod = async (periodData, actorId) => {
  let { facultyId, departmentId } = periodData;

  // Auto-resolve facultyId and departmentId from Lecturer profile of the staff member if missing
  if (!facultyId || !departmentId) {
    const lecturer = await Lecturer.findOne({ userId: actorId });
    if (lecturer) {
      facultyId = facultyId || lecturer.facultyId;
      departmentId = departmentId || lecturer.departmentId;
    }
  }

  if (!facultyId || !departmentId) {
    const academicUnit = periodData.academicUnit || 'computer_science';
    facultyId = facultyId || IT_FACULTY_ID;
    departmentId = departmentId || ACADEMIC_UNIT_DEPARTMENT_IDS[academicUnit] || ACADEMIC_UNIT_DEPARTMENT_IDS.computer_science;
  }

  const classCount = Number.parseInt(periodData.classCount, 10);
  const shouldCreateBatch = Number.isInteger(classCount) && classCount > 0;

  if (shouldCreateBatch) {
    const cohort = String(periodData.cohort || '').trim().toUpperCase();
    const courseOfferingCode = periodData.courseOfferingCode || buildCourseOfferingCode({
      courseCode: periodData.courseCode,
      cohort,
      schoolYear: periodData.schoolYear,
      semester: periodData.semester,
    });

    const batch = await CourseOfferingBatch.create({
      name: periodData.name || periodData.courseName,
      courseCode: periodData.courseCode,
      courseName: periodData.courseName,
      courseOfferingCode,
      cohort,
      schoolYear: periodData.schoolYear,
      semester: periodData.semester,
      academicUnit: periodData.academicUnit || 'computer_science',
      classCount,
      status: 'draft',
      createdBy: actorId,
      updatedBy: actorId,
    });

    const periods = [];
    for (let index = 1; index <= classCount; index += 1) {
      const classSection = buildClassSection(index);
      const period = new ProjectPeriod(toPeriodPayload({
        ...periodData,
        name: `${periodData.courseName || periodData.name} (${classSection})`,
        batchId: batch._id,
        cohort,
        classSection,
        classCode: `${courseOfferingCode}(${classSection})`,
        coordinatorLecturerId: undefined,
        isBatchChild: true,
      }, facultyId, departmentId, actorId));
      await period.save();
      periods.push(period);

      await logWorkflowEvent({
        entityId: period._id,
        fromStatus: '',
        toStatus: 'draft',
        actorId,
        actorRoles: ['FACULTY_STAFF'],
        action: 'CREATE_PERIOD_CLASS',
        reason: `Tự động tạo lớp học phần ${period.classCode}`,
      });
    }

    batch.periodIds = periods.map((period) => period._id);
    await batch.save();

    return {
      ...batch.toObject(),
      periods,
      isBatch: true,
    };
  }

  const period = new ProjectPeriod(toPeriodPayload(periodData, facultyId, departmentId, actorId));

  await period.save();

  // Log creation event
  await logWorkflowEvent({
    entityId: period._id,
    fromStatus: '',
    toStatus: 'draft',
    actorId,
    actorRoles: ['FACULTY_STAFF'],
    action: 'CREATE_PERIOD',
    reason: 'Khởi tạo đợt đồ án mới',
  });

  return period;
};

const getAllPeriods = async (query = {}) => {
  return await ProjectPeriod.find({ ...query, isDeleted: { $ne: true } })
    .populate('rubricId')
    .populate('batchId')
    .populate({
      path: 'coordinatorLecturerId',
      populate: { path: 'userId', select: 'fullName email' },
    })
    .sort({ createdAt: -1 });
};

const getPeriodById = async (id) => {
  const period = await ProjectPeriod.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate('rubricId')
    .populate('batchId')
    .populate({
      path: 'coordinatorLecturerId',
      populate: { path: 'userId', select: 'fullName email' },
    });
  if (!period) {
    throw { status: 404, message: 'Đợt đồ án không tồn tại.' };
  }
  return period;
};

const updatePeriod = async (id, updateData, actorId) => {
  const period = await ProjectPeriod.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!period) {
    throw { status: 404, message: 'Đợt đồ án không tồn tại.' };
  }

  // Business constraint: locked/archived periods cannot be modified
  if (['result_locked', 'archived'].includes(period.status)) {
    throw { status: 400, message: `Không thể chỉnh sửa đợt đồ án đã ở trạng thái [${period.status}].` };
  }

  // Update allowed fields
  Object.keys(updateData).forEach((key) => {
    period[key] = updateData[key];
  });
  period.updatedBy = actorId;

  await period.save();

  await logWorkflowEvent({
    entityId: period._id,
    fromStatus: period.status,
    toStatus: period.status,
    actorId,
    actorRoles: ['FACULTY_STAFF'],
    action: 'UPDATE_PERIOD',
    reason: 'Cập nhật cấu hình đợt đồ án',
  });

  return period;
};

const deletePeriod = async (id, actorId) => {
  const period = await ProjectPeriod.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!period) {
    throw { status: 404, message: 'Đợt đồ án không tồn tại hoặc đã bị xóa.' };
  }

  if (['result_locked', 'archived'].includes(period.status)) {
    throw { status: 400, message: 'Không thể xóa đợt đồ án đã khóa kết quả hoặc lưu trữ.' };
  }

  period.isDeleted = true;
  period.deletedAt = new Date();
  period.deletedBy = actorId;
  period.updatedBy = actorId;
  await period.save();

  await logWorkflowEvent({
    entityId: period._id,
    fromStatus: period.status,
    toStatus: period.status,
    actorId,
    actorRoles: ['FACULTY_STAFF'],
    action: 'SOFT_DELETE_PERIOD',
    reason: 'Xóa mềm đợt đồ án',
  });

  return { success: true, message: 'Đợt đồ án đã được xóa thành công.' };
};

// Transition status machine states
const transitionStatus = async (id, toStatus, action, actorId, actorRoles = ['FACULTY_STAFF'], reason = '') => {
  const period = await ProjectPeriod.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!period) {
    throw { status: 404, message: 'Đợt đồ án không tồn tại.' };
  }

  const fromStatus = period.status;

  // Validate state machine flow rules
  const allowedTransitions = {
    'draft': ['registration_open', 'cancelled'],
    'registration_open': ['topic_review', 'in_progress', 'cancelled'],
    'topic_review': ['in_progress', 'cancelled'],
    'in_progress': ['grading', 'cancelled'],
    'grading': ['results_published', 'result_locked', 'cancelled'],
    'results_published': ['appeal_open', 'result_locked', 'cancelled'],
    'appeal_open': ['result_locked', 'cancelled'],
    'result_locked': ['archived'],
    'archived': [],
  };

  if (!allowedTransitions[fromStatus] || !allowedTransitions[fromStatus].includes(toStatus)) {
    throw {
      status: 400,
      message: `Chuyển đổi trạng thái không hợp lệ: Không thể chuyển từ trạng thái [${fromStatus}] sang [${toStatus}].`,
    };
  }

  period.status = toStatus;
  period.updatedBy = actorId;
  if (toStatus === 'result_locked') {
    period.lockedAt = new Date();
  }

  await period.save();

  // Write secure audit log
  await logWorkflowEvent({
    entityId: period._id,
    fromStatus,
    toStatus,
    actorId,
    actorRoles,
    action,
    reason,
  });

  return period;
};

module.exports = {
  createPeriod,
  getAllPeriods,
  getPeriodById,
  updatePeriod,
  deletePeriod,
  transitionStatus,
};
