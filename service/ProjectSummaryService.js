const sequelize = require('../modelORM').sequelize;
const { QueryTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

class ProjectSummaryService {

    constructor(summaryQuery, adminQuery, sequelize) {
        this.summaryQuery = summaryQuery;
        this.adminQuery = adminQuery;
        this.sequelize = sequelize;
    }

    async listProjects(userId, isAdmin = false, page = 1, isActive = 1, isDeleted = 0, typeId = false, hasMembers = false, project = false, projectProgress = false, dueDate) {
        const query = this.summaryQuery
            .replace('{{taskSummarySelectClause}}', dueDate ? this.taskSummary(dueDate) : ``)
            .replace('{{memberSelectClause}}', hasMembers ? ` ,project_team_members_summary_v.members as team, project_members_summary_v.members as members` : ``)
            .replace('{{memberFromClause}}', hasMembers ? ` ,project_team_members_summary_v, project_members_summary_v` : ``)
            .replace('{{memberWhereClause}}', hasMembers ? ` and project_team_members_summary_v.projectId = project.id and project_members_summary_v.projectId = project.id` : ``)
            .replace('{{adminWhereClause}}', !isAdmin ? ` and project.id in (select linkId from members where userTypeLinkId = :userId AND linkType = 'project' AND isActive = 1)` : ``)
            .replace('{{progressWhereClause}}', projectProgress ? this.projectProcess(projectProgress) : ``)
            .replace('{{typeIdWhereClause}}', typeId ? ` and project.typeId = ${typeId}` : ``)
            .replace('{{projectWhereClause}}', project ? ` and LOWER(project.project) like '%${project.toLowerCase()}%'` : ``)
            .replace('{{page}}', ` limit 25 offset ${(page - 1) * 25}`);

        const results = await this.sequelize.query(query, {
            replacements: { userId: userId, isActive, isDeleted },
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
                newDocuments: it.newDocuments,
                workstream: it.workstream,
                dateUpdated: it.dateUpdated,
                ...(it.team ? { team: JSON.parse(it.team) } : {}),
                ...(it.members ? { members: JSON.parse(it.members) } : {})
            }
        ));
    }

    projectProcess(projectProgress) {
        switch (projectProgress) {
            case "On Time":
                return ` 
                    and project.id in (
                    SELECT  DISTINCT workstream.projectId
                            FROM
                                workstream
                            JOIN
                                task
                            ON task.workstreamId = workstream.id AND workstream.isDeleted = 0
                            WHERE task.dueDate >=  DATE(NOW())
                                OR task.dueDate IS NULL
                                OR task.status = "Completed"
                                AND task.isDeleted = 0
                    )
                    and project.id not in (
                    SELECT  DISTINCT workstream.projectId
                            FROM
                                workstream
                            JOIN
                                task
                            ON task.workstreamId = workstream.id AND workstream.isDeleted = 0
                            WHERE task.dueDate < DATE(NOW())
                                AND (task.status != "Completed" OR task.status IS NULL) 
                                AND task.isDeleted = 0
                    
                    )
                `
            case "Issues":
                return `
                    and project.id in (
                    SELECT DISTINCT
                            workstream.projectId
                    FROM
                            workstream
                    JOIN
                            task ON task.workstreamId = workstream.id AND workstream.isDeleted = 0
                    WHERE task.dueDate < DATE(NOW())
                            AND (task.status != "Completed" OR task.status IS NULL) 
                            AND task.isDeleted = 0
                    )`
            default:
                return ``
        }
    }

    taskSummary(dueDate) {
        return `
            ,
            (
                SELECT  count(delayedStart.id)  
                FROM    task as delayedStart
                WHERE   delayedStart.projectId = project.id
                        and delayedStart.dueDate < '${dueDate}'
                        and delayedStart.isDeleted = 0
                        and delayedStart.status = "In Progress"
                        and
                            delayedStart.workstreamId in (
                                SELECT  projectWorkstream.id  
                                FROM    workstream as projectWorkstream
                                WHERE   projectWorkstream.projectId = project.id 
                                        and projectWorkstream.isDeleted = 0
                                        and projectWorkstream.isActive = 1
                            )
            ) as delayedStart
            ,
            (
                SELECT  count(dueToday.id)  
                FROM    task as dueToday
                WHERE   dueToday.projectId = project.id
                        and dueToday.dueDate = '${dueDate}'
                        and dueToday.isDeleted = 0
                        and dueToday.status = "In Progress"
                        and
                            dueToday.workstreamId in (
                                SELECT  projectWorkstream.id  
                                FROM    workstream as projectWorkstream
                                WHERE   projectWorkstream.projectId = project.id 
                                        and projectWorkstream.isDeleted = 0
                                        and projectWorkstream.isActive = 1
                            )
            ) as dueToday
        `
    }
}

module.exports = new ProjectSummaryService(
    fs.readFileSync(path.resolve(__dirname, 'projectSummary.sql'), 'utf8'),
    fs.readFileSync(path.resolve(__dirname, 'projectSummaryAdmin.sql'), 'utf8'),
    sequelize);