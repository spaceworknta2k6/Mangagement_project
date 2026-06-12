const auditService = require('./audit.service');
const mongoose = require('mongoose');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getAuditEvents = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.actorId) filter.actorId = req.query.actorId;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.fromDate || req.query.toDate) {
      filter.createdAt = {};
      if (req.query.fromDate && !Number.isNaN(Date.parse(req.query.fromDate))) {
        filter.createdAt.$gte = new Date(req.query.fromDate);
      }
      if (req.query.toDate && !Number.isNaN(Date.parse(req.query.toDate))) {
        filter.createdAt.$lte = new Date(req.query.toDate);
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }
    if (req.query.search) {
      const search = String(req.query.search).trim();
      if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
        const or = [
          { action: regex },
          { reason: regex },
          { entityType: regex },
        ];
        if (mongoose.Types.ObjectId.isValid(search)) {
          or.push({ entityId: new mongoose.Types.ObjectId(search) });
          or.push({ actorId: new mongoose.Types.ObjectId(search) });
        }
        filter.$or = or;
      }
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await auditService.getAuditEvents(filter, { page, limit });
    res.status(200).json({
      success: true,
      data: result.events,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getEntityHistory = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const history = await auditService.getEntityHistory(entityType, entityId);
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditEvents,
  getEntityHistory,
};
