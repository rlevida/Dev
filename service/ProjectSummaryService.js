const sequelize = require('../modelORM').sequelize;
const {QueryTypes} = require('sequelize');
const fs = require('fs');
const path = require('path');

class ProjectSummaryService {

    constructor(summaryQuery, sequelize) {
        this.summaryQuery = summaryQuery;
        this.sequelize = sequelize;
    }

    async listProjects(userId) {
        const results = await this.sequelize.query(this.summaryQuery, {
            replacements: {userId: userId},
            type: QueryTypes.SELECT
        });
        return this.mapResults(results);
    }

    mapResults(results) {
        return results.map(it => (
            {
                id: it.projectId,
                picture: it.picture,
                isDeleted: it.isDeleted,
                isActive: it.isActive,
                project: it.project,
                projectType: it.projectType,
                color: it.color,
                tinNo: it.tinNo,
                remindOnDuedate: it.remindOnDuedate,
                remindBeforeDuedate: it.remindBeforeDuedate,
                emailNotification: it.emailNotification,
                companyAddress: it.companyAddress,
                statusId: it.statusId,
                projectNameCount: it.projectNameCount,
                createdBy: it.createdBy,
                appNotification: it.appNotification,
                classification: it.classification,
                dateAdded: it.dateAdded,
                type: {
                    type: it.type
                },
                numberOfTasks: 36,
                newDocuments: 2
            }
        ));
    }
}

const summaryQuery = fs.readFileSync(path.resolve(__dirname, 'projectSummary.sql'), 'utf8');
module.exports = new ProjectSummaryService(summaryQuery, sequelize);