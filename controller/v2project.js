const projectService = require('../service/ProjectSummaryService');

exports.get = {
    index: async (req, cb) => {
        const isAdmin = req.query.userRole == 1 ? true : false;
        const results = await projectService.listProjects(req.query.userId, isAdmin, req.query.page);
        cb({status: true, data: {result: results}});
    }
};
