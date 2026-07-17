const EvaluationRubric = require('../../models/EvaluationRubric');
const ProjectPeriod = require('../../models/ProjectPeriod');

const normalizeCriteria = (criteria = {}) => {
  if (!criteria.REVIEWER) return criteria;
  const { REVIEWER, ...rest } = criteria;
  return {
    ...rest,
    SECOND_MARKER: criteria.SECOND_MARKER || REVIEWER,
  };
};

const createRubric = async (data, user) => {
  const rubric = new EvaluationRubric({
    ...data,
    criteria: normalizeCriteria(data.criteria),
    createdBy: user._id,
    updatedBy: user._id,
  });
  return await rubric.save();
};

const getRubrics = async (query = {}) => {
  return await EvaluationRubric.find({ ...query, isDeleted: { $ne: true } })
    .populate('createdBy', 'fullName email')
    .populate('updatedBy', 'fullName email');
};

const getRubricById = async (id) => {
  const rubric = await EvaluationRubric.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate('createdBy', 'fullName email')
    .populate('updatedBy', 'fullName email');
  if (!rubric) {
    throw { status: 404, message: 'Tiêu chí đánh giá (Rubric) không tồn tại hoặc đã bị xóa.' };
  }
  return rubric;
};

const updateRubric = async (id, data, user) => {
  const rubric = await EvaluationRubric.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!rubric) {
    throw { status: 404, message: 'Tiêu chí đánh giá (Rubric) không tồn tại hoặc đã bị xóa.' };
  }

  // Update fields
  if (data.name !== undefined) rubric.name = data.name;
  if (data.description !== undefined) rubric.description = data.description;
  if (data.version !== undefined) rubric.version = data.version;
  if (data.criteria !== undefined) {
    const criteria = normalizeCriteria(data.criteria);
    if (criteria.SUPERVISOR) rubric.criteria.SUPERVISOR = criteria.SUPERVISOR;
    if (criteria.SECOND_MARKER) rubric.criteria.SECOND_MARKER = criteria.SECOND_MARKER;
  }
  rubric.updatedBy = user._id;

  return await rubric.save();
};

const deleteRubric = async (id, user) => {
  const rubric = await EvaluationRubric.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!rubric) {
    throw { status: 404, message: 'Tiêu chí đánh giá (Rubric) không tồn tại hoặc đã bị xóa.' };
  }

  // Check if rubric is linked to any active/existing project period
  const periodsCount = await ProjectPeriod.countDocuments({ rubricId: id, isDeleted: { $ne: true } });
  if (periodsCount > 0) {
    throw { status: 400, message: 'Không thể xóa Rubric này vì đang được liên kết với đợt đồ án đang hoạt động.' };
  }

  rubric.isDeleted = true;
  rubric.deletedAt = new Date();
  rubric.deletedBy = user._id;

  return await rubric.save();
};

module.exports = {
  createRubric,
  getRubrics,
  getRubricById,
  updateRubric,
  deleteRubric,
};
