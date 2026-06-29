const validateSubmitEvaluation = (req, res, next) => {
  const { contributionPercentage, score, comment } = req.body;
  const errors = [];

  if (contributionPercentage === undefined || contributionPercentage === null) {
    errors.push({ field: 'contributionPercentage', code: 'PERCENTAGE_REQUIRED', message: 'Phần trăm đóng góp là bắt buộc.' });
  } else if (typeof contributionPercentage !== 'number' || contributionPercentage < 0 || contributionPercentage > 100) {
    errors.push({ field: 'contributionPercentage', code: 'PERCENTAGE_INVALID', message: 'Phần trăm đóng góp phải từ 0 đến 100.' });
  }

  if (score === undefined || score === null) {
    errors.push({ field: 'score', code: 'SCORE_REQUIRED', message: 'Điểm số đánh giá là bắt buộc.' });
  } else if (typeof score !== 'number' || score < 0 || score > 10) {
    errors.push({ field: 'score', code: 'SCORE_INVALID', message: 'Điểm số phải từ 0 đến 10.' });
  }

  if (comment && typeof comment !== 'string') {
    errors.push({ field: 'comment', code: 'COMMENT_INVALID', message: 'Nhận xét phải là chuỗi ký tự.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu đánh giá không hợp lệ.',
      errors
    });
  }

  next();
};

module.exports = {
  validateSubmitEvaluation,
};
