const mongoose = require('mongoose');

const PeerEvaluationSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectGroup',
    required: true,
  },
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  targetStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  contributionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Ensure a student can only evaluate a target student once per project
PeerEvaluationSchema.index({ projectId: 1, evaluatorId: 1, targetStudentId: 1 }, { unique: true });

module.exports = mongoose.model('PeerEvaluation', PeerEvaluationSchema);
