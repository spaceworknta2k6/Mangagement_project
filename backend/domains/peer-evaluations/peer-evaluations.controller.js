const peerEvaluationsService = require('./peer-evaluations.service');

const submitEvaluation = async (req, res, next) => {
  try {
    const { projectId, targetStudentId } = req.params;
    const result = await peerEvaluationsService.submitEvaluation(projectId, targetStudentId, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Lưu đánh giá đồng cấp thành công.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getEvaluationsByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const result = await peerEvaluationsService.getEvaluationsByProject(projectId, req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyEvaluations = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const result = await peerEvaluationsService.getMyEvaluations(projectId, req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitEvaluation,
  getEvaluationsByProject,
  getMyEvaluations,
};
