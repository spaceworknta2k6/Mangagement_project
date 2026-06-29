const express = require('express');
const router = express.Router();
const peerEvaluationsController = require('./peer-evaluations.controller');
const { validateSubmitEvaluation } = require('./peer-evaluations.validator');
const { requireAuth } = require('../../middlewares/auth.middleware');

// Apply auth middleware to all routes
router.use(requireAuth);

// Gửi đánh giá đồng cấp
router.post(
  '/project/:projectId/target/:targetStudentId',
  validateSubmitEvaluation,
  peerEvaluationsController.submitEvaluation
);

// GVHD hoặc Staff xem toàn bộ đánh giá của một project
router.get(
  '/project/:projectId',
  peerEvaluationsController.getEvaluationsByProject
);

// Sinh viên xem lại các đánh giá mà mình đã gửi
router.get(
  '/project/:projectId/my-evaluations',
  peerEvaluationsController.getMyEvaluations
);

module.exports = router;
