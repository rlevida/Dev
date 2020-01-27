const sequelize = require('../modelORM').sequelize;
const {QueryTypes} = require('sequelize');
const fs = require('fs');
const path = require('path');

class ProjectSummaryService {

    constructor(summaryQuery, adminQuery, sequelize) {
        this.summaryQuery = summaryQuery;
        this.adminQuery = adminQuery;
        this.sequelize = sequelize;
    }

    async listProjects(userId, isAdmin = false, page = 1) {
        const query = isAdmin ? this.adminQuery : this.summaryQuery;
        const results = await this.sequelize.query(query + ` limit 25 offset ${(page - 1) * 25}`, {
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
                completion_rate: {
                    delayed_task: {
                        value: (it.delayedStart / it.total) * 100,
                        color: '#f9003b',
                        count: it.delayedStart
                    },
                    tasks_due_today: {
                        value: (it.dueToday / it.total) * 100,
                        color: '#f6dc64',
                        count: it.dueToday
                    },
                    tasks_for_approval: {
                        value: (it.forApproval / it.total) * 100,
                        color: '#ff754a',
                        count: it.forApproval
                    },
                    completed: {
                        value: (it.completed / it.total) * 100,
                        color: '#00e589',
                        count: it.completed
                    }
                },
                numberOfTasks: it.total,
                newDocuments: it.newDocuments
            }
        ));
    }
}


module.exports = new ProjectSummaryService(
    fs.readFileSync(path.resolve(__dirname, 'projectSummary.sql'), 'utf8'),
    fs.readFileSync(path.resolve(__dirname, 'projectSummaryAdmin.sql'), 'utf8'),
    sequelize);