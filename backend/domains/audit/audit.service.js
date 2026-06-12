const WorkflowEvent = require('../../models/WorkflowEvent');

const getAuditEvents = async (query = {}, { page = 1, limit = 20 } = {}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [events, total] = await Promise.all([
    WorkflowEvent.find(query)
      .populate('actorId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    WorkflowEvent.countDocuments(query),
  ]);

  return {
    events,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
};

const getEntityHistory = async (entityType, entityId) => {
  return await WorkflowEvent.find({ entityType, entityId }).populate('actorId').sort({ createdAt: -1 });
};

module.exports = {
  getAuditEvents,
  getEntityHistory,
};
