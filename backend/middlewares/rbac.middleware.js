const Project = require('../models/Project');

const normalizeAssignment = (assignment) => (
  assignment === 'REVIEWER' ? 'SECOND_MARKER' : assignment
);

const checkContextualAssignment = (requiredAssignment, paramName = 'projectId') => {
  return async (req, res, next) => {
    try {
      const assignment = normalizeAssignment(requiredAssignment);
      const entityId = req.params[paramName];
      if (!entityId) {
        return res.status(400).json({ success: false, message: 'Missing entity ID parameter' });
      }

      const lecturerId = req.user.lecturerId; 
      if (!lecturerId && assignment !== 'STUDENT') {
        return res.status(403).json({ success: false, message: 'User is not linked to a Lecturer profile' });
      }

      req.user.activeProjectAssignments = req.user.activeProjectAssignments || [];

      if (assignment === 'SUPERVISOR') {
        const project = await Project.findById(entityId);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        
        if (project.supervisorId && project.supervisorId.toString() === lecturerId.toString()) {
          req.user.activeProjectAssignments.push('SUPERVISOR');
          return next();
        }
      }

      if (assignment === 'SECOND_MARKER') {
        const project = await Project.findById(entityId);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        
        if (project.reviewerId && project.reviewerId.toString() === lecturerId.toString()) {
          req.user.activeProjectAssignments.push('SECOND_MARKER');
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires project assignment as ${assignment}`
      });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkContextualAssignment };
