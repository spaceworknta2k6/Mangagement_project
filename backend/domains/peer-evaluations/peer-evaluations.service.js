const PeerEvaluation = require('../../models/PeerEvaluation');
const Project = require('../../models/Project');
const ProjectGroup = require('../../models/ProjectGroup');
const { assertProjectAccess, isStaff } = require('../../utils/access-control');

const submitEvaluation = async (projectId, targetStudentId, data, user) => {
  if (!user.studentId) {
    throw { status: 403, message: 'Chỉ sinh viên mới có quyền gửi đánh giá đồng cấp.' };
  }

  const evaluatorId = user.studentId;
  if (evaluatorId.toString() === targetStudentId.toString()) {
    throw { status: 400, message: 'Bạn không thể tự đánh giá chính mình.' };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw { status: 404, message: 'Dự án đồ án không tồn tại.' };
  }

  if (project.ownerType !== 'group' || !project.groupId) {
    throw { status: 400, message: 'Đánh giá đồng cấp chỉ áp dụng cho dự án nhóm.' };
  }

  const group = await ProjectGroup.findById(project.groupId);
  if (!group) {
    throw { status: 404, message: 'Nhóm đồ án không tồn tại.' };
  }

  // Verify both evaluator and target are accepted members of the group
  const isEvaluatorInGroup = group.members.some(
    m => m.studentId.toString() === evaluatorId.toString() && m.status === 'accepted'
  ) || (group.leaderStudentId && group.leaderStudentId.toString() === evaluatorId.toString());

  const isTargetInGroup = group.members.some(
    m => m.studentId.toString() === targetStudentId.toString() && m.status === 'accepted'
  ) || (group.leaderStudentId && group.leaderStudentId.toString() === targetStudentId.toString());

  if (!isEvaluatorInGroup || !isTargetInGroup) {
    throw { status: 403, message: 'Cả người đánh giá và người được đánh giá phải là thành viên chính thức của nhóm dự án.' };
  }

  let evaluation = await PeerEvaluation.findOne({
    projectId,
    evaluatorId,
    targetStudentId,
    isDeleted: { $ne: true }
  });

  if (evaluation) {
    evaluation.contributionPercentage = data.contributionPercentage;
    evaluation.score = data.score;
    if (data.comment !== undefined) {
      evaluation.comment = data.comment;
    }
  } else {
    evaluation = new PeerEvaluation({
      projectId,
      groupId: project.groupId,
      evaluatorId,
      targetStudentId,
      contributionPercentage: data.contributionPercentage,
      score: data.score,
      comment: data.comment,
    });
  }

  return await evaluation.save();
};

const getEvaluationsByProject = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw { status: 404, message: 'Dự án đồ án không tồn tại.' };
  }

  // Check if user is staff or the assigned supervisor/reviewer for the project
  await assertProjectAccess(project, user);

  // But students should NOT see other's evaluations.
  if (user.studentId) {
    throw { status: 403, message: 'Sinh viên không có quyền xem báo cáo đánh giá đồng cấp tổng hợp.' };
  }

  return await PeerEvaluation.find({ projectId, isDeleted: { $ne: true } })
    .populate({
      path: 'evaluatorId',
      populate: { path: 'userId', select: 'fullName email' }
    })
    .populate({
      path: 'targetStudentId',
      populate: { path: 'userId', select: 'fullName email' }
    });
};

const getMyEvaluations = async (projectId, user) => {
  if (!user.studentId) {
    throw { status: 403, message: 'Chỉ sinh viên mới có quyền xem các đánh giá của mình.' };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw { status: 404, message: 'Dự án đồ án không tồn tại.' };
  }

  return await PeerEvaluation.find({
    projectId,
    evaluatorId: user.studentId,
    isDeleted: { $ne: true }
  }).populate({
    path: 'targetStudentId',
    populate: { path: 'userId', select: 'fullName email' }
  });
};

module.exports = {
  submitEvaluation,
  getEvaluationsByProject,
  getMyEvaluations,
};
