const projectService = require('../service/ProjectSummaryService');

exports.get = {
    index: async (req, cb) => {
        const isAdmin = req.query.userRole == 1 || req.query.userRole == 2 ? true : false;
        const results = await projectService.listProjects(
            req.query.userId, isAdmin, req.query.page,
            req.query.isActive, req.query.isDeleted,
            req.query.typeId, req.query.hasMembers,
            req.query.project, req.query.projectProgress,
            req.query.dueDate
        );
        cb({ status: true, data: { result: results } });
    }
};
