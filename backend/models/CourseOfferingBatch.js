const mongoose = require('mongoose');

const CourseOfferingBatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  courseCode: {
    type: String,
    required: true,
    trim: true,
  },
  courseName: {
    type: String,
    required: true,
    trim: true,
  },
  courseOfferingCode: {
    type: String,
    required: true,
    trim: true,
  },
  cohort: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  schoolYear: {
    type: String,
    required: true,
    trim: true,
  },
  semester: {
    type: String,
    required: true,
    trim: true,
  },
  academicUnit: {
    type: String,
    default: 'computer_science',
  },
  classCount: {
    type: Number,
    required: true,
    min: 1,
  },
  periodIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectPeriod',
  }],
  status: {
    type: String,
    enum: ['draft', 'registration_open', 'topic_review', 'in_progress', 'grading', 'results_published', 'appeal_open', 'result_locked', 'archived', 'cancelled'],
    default: 'draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

CourseOfferingBatchSchema.index(
  { courseOfferingCode: 1, cohort: 1, schoolYear: 1, semester: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

CourseOfferingBatchSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

module.exports = mongoose.model('CourseOfferingBatch', CourseOfferingBatchSchema);
