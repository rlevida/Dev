const async = require("async");
const moment = require('moment');
const sequence = require("sequence").Sequence;
const Sequelize = require("sequelize");
const _ = require("lodash");

const dbName = "project";
const Op = Sequelize.Op;
const models = require('../modelORM');

const { TaskChecklist, ChecklistDocuments, Conversation, Document, DocumentLink, Members, Projects, Tag, Tasks, Teams, Type, Users, UsersTeam, UsersRole, Roles, Workstream, sequelize, Notes } = models;
const associationFindAllStack = [
    {
        model: DocumentLink,
        as: 'document_link',
        where: {
            linkType: 'project'
        },
        required: false,
        include: [{
            model: Document,
            as: 'document',
            where: {
                folderId: null,
                isDeleted: 0
            },
            required: false
        }]
    },
    {
        model: Type,
        as: 'type',
        required: false,
        attributes: ["type"]
    },
    {
        model: Members,
        as: 'projectManager',
        where: {
            memberType: 'project manager'
        },
        required: false,
        include: [{
            model: Users,
            as: 'user',
            required: false
        }]
    },
    {
        model: Members,
        as: 'members',
        where: {
            usersType: 'users',
            linkType: 'project'
        },
        required: false,
    },
    {
        model: Members,
        as: 'team',
        where: {
            usersType: 'team',
            linkType: 'project'
        },
        required: false,
        include: [{
            model: Teams,
            as: 'team',
            required: false,
            include: [{
                model: UsersTeam,
                as: 'users_team',
                required: false
            }]
        }]
    },
    {
        model: Workstream,
        as: 'workstream',
        include: [
            {
                model: Tasks,
                as: 'taskDueToday',
                where: {
                    dueDate: moment.utc().format("YYYY-MM-DD"),
                    status: {
                        [Op.or]: {
                            [Op.not]: "Completed",
                            [Op.eq]: null
                        }
                    }
                },
                required: false,
            },
            {
                model: Tasks,
                as: 'taskOverDue',
                where: {
                    dueDate: { [Op.lt]: moment.utc().format("YYYY-MM-DD") },
                    status: {
                        [Op.or]: {
                            [Op.not]: "Completed",
                            [Op.eq]: null
                        }
                    }
                },
                required: false,
            },
        ],
    }
]

exports.get = {
    index: async (req, cb) => {
        const associationArray = _.cloneDeep(associationFindAllStack);
        const queryString = req.query;
        const limit = 10;
        const options = {
            include: associationArray,
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
        };

        const whereObj = {
            ...(typeof queryString.id != "undefined" && queryString.id != "") ? { id: queryString.id.split(',') } : {},
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "") ? { projectId: queryString.projectId } : {},
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "") ? { workstreamId: queryString.workstreamId } : {},
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "") ? { isActive: queryString.isActive } : { isActive: 1 },
            ...(typeof queryString.typeId != "undefined" && queryString.typeId != "") ? { typeId: queryString.typeId } : {},
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "") ? { isDeleted: queryString.isDeleted } : { isDeleted: 0 },
            ...(typeof queryString.project != "undefined" && queryString.project != "") ? {
                [Sequelize.Op.and]: [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('project')),
                        {
                            [Sequelize.Op.like]: sequelize.fn('lower', `%${queryString.project}%`)
                        }
                    )
                ]
            } : {}
        };

        if (
            (typeof queryString.userId != "undefined" && queryString.userId != "") &&
            (typeof queryString.userRole != "undefined" && queryString.userRole > 3)
        ) {
            const userTeam = await UsersTeam.findAll({
                where: {
                    usersId: queryString.userId
                }
            }).map((res) => {
                return res.toJSON();
            });

            const projectMembers = await Members.findAll({
                where: {
                    [Op.or]: [
                        {
                            usersType: "users",
                            userTypeLinkId: queryString.userId,
                            linkType: "project"
                        },
                        {
                            usersType: "team",
                            userTypeLinkId: _.map(userTeam, (o) => { return o.teamId }),
                            linkType: "project"
                        }
                    ]
                }
            }).map((res) => {
                return res.toJSON();
            });

            if (queryString.userRole > 4) {
                whereObj["typeId"] = 1;
            }

            whereObj[Sequelize.Op.or] = [{
                id: _(projectMembers)
                    .uniqBy("linkId")
                    .map((o) => { return o.linkId })
                    .value()
            },
            {
                createdBy: queryString.userId
            }];
        }

        if (typeof queryString.projectStatus != "undefined" && queryString.projectStatus != "") {
            switch (queryString.projectStatus) {
                case "All":
                    whereObj[Sequelize.Op.or] = [
                        {
                            isActive: {
                                [Sequelize.Op.or]: [0, 1]
                            }
                        }
                    ];
                    whereObj["isDeleted"] = [1, 0]
                    break;
                case "Active":
                    whereObj["isActive"] = 1;
                    break;
                case "On Time":
                    whereObj["id"] = {
                        [Op.and]: {
                            [Op.in]: Sequelize.literal(`(SELECT DISTINCT workstream.projectId
                                FROM
                                    workstream
                                LEFT JOIN
                                    task
                                ON task.workstreamId = workstream.id
                                WHERE task.dueDate >= "${moment(queryString.dueDate, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm")}"
                                OR task.dueDate IS NULL
                                OR task.status = "Completed"
                                )`),
                            [Op.notIn]: Sequelize.literal(`(SELECT DISTINCT
                                workstream.projectId
                            FROM
                                workstream
                            LEFT JOIN
                                task
                            ON task.workstreamId = workstream.id
                            WHERE task.dueDate < "${moment(queryString.dueDate, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm")}" 
                            AND (task.status != "Completed" OR task.status IS NULL)
                            )`)
                        }
                    }
                    break;
                case "Issues":
                    whereObj["id"] = {
                        [Op.in]: Sequelize.literal(`(SELECT DISTINCT
                            workstream.projectId
                        FROM
                            workstream
                        LEFT JOIN
                            task
                        ON task.workstreamId = workstream.id
                        WHERE task.dueDate < "${moment(queryString.dueDate, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm")}"
                        AND (task.status != "Completed" OR task.status IS NULL)
                    )`)
                    }
                    break;
                default:
            }
        }

        async.parallel({
            count: function (callback) {
                try {
                    Projects.findAndCountAll({ ..._.omit(options, ['offset', 'limit']), where: whereObj, distinct: true }).then((response) => {
                        const pageData = {
                            total_count: response.count,
                            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (response.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(response.count / limit) } : {}
                        }
                        callback(null, pageData)
                    });
                } catch (err) {
                    callback(err)
                }
            },
            result: function (callback) {
                try {
                    Projects
                        .findAll({
                            ...options,
                            where: whereObj
                        })
                        .map(async (res) => {
                            const responseObj = res.toJSON();
                            const documentCount = _.filter((responseObj.document_link), ({ document }) => { return document != null }).length;
                            const projectUserMembers = _.map(responseObj.members, (o) => { return o.userTypeLinkId });
                            const projectTeamMembers = _.flatten(_.map(responseObj.team, (o) => { return o.team.users_team }), ({ usersId }) => { return usersId });
                            const projectMembers = [...projectUserMembers, ..._.map(projectTeamMembers, ({ usersId }) => { return usersId })];

                            const memberList = await Users.findAll({
                                where: {
                                    id: projectMembers
                                },
                                attributes: ['id', 'firstName', 'lastName', 'avatar']
                            }).map((o) => { return o.toJSON() })
                            const resToReturn = {
                                ...res.dataValues,
                                projectManagerId: ((res.projectManager).length > 0) ? res.projectManager[0].userTypeLinkId : "",
                                newDocuments: documentCount,
                                members: memberList
                            };

                            if (typeof queryString.userId != "undefined" && queryString.userId != "") {
                                const conversationCount = new Promise((resolve) => {
                                    Conversation.findAndCountAll({
                                        where: {
                                            linkType: 'notes',
                                            id: {
                                                [Op.notIn]: sequelize.literal(`(SELECT DISTINCT linkId FROM notes_last_seen WHERE userId=${queryString.userId})`)
                                            },
                                            linkId: {
                                                [Op.in]: sequelize.literal(`(SELECT DISTINCT notes.id FROM notes LEFT JOIN tag ON tag.tagTypeId = notes.id WHERE notes.projectId = ${responseObj.id} AND tag.tagType = "notes" and tag.linkType = "user" and tag.linkId=${queryString.userId})`)
                                            }
                                        },
                                        include: [{
                                            model: Users,
                                            as: 'users',
                                            required: true,
                                            attributes: ['id', 'firstName', 'lastName', 'avatar']
                                        }],
                                        distinct: true
                                    }).then(({ count, rows }) => {
                                        const resultRows = _.map(rows, (o) => {
                                            const responseObj = o.toJSON();
                                            return {
                                                type: 'New Messages',
                                                title: responseObj.users.firstName + " " + responseObj.users.lastName,
                                                sub_title: responseObj.comment,
                                                image: responseObj.users.avatar,
                                                date: responseObj.dateAdded
                                            }
                                        });
                                        resolve({ count, result: resultRows });
                                    })
                                });
                                const documentCount = new Promise((resolve) => {
                                    Document.findAndCountAll({
                                        where: {
                                            folderId: null,
                                            id: {
                                                [Op.in]: sequelize.literal(`(SELECT DISTINCT documentId FROM document_link WHERE linkType="project" AND linkid=${responseObj.id})`)
                                            }
                                        }
                                    }).then(({ count, rows }) => {
                                        const resultRows = _.map(rows, (o) => {
                                            const responseObj = o.toJSON();
                                            return {
                                                type: 'New Files',
                                                title: responseObj.origin
                                            }
                                        });
                                        resolve({ count, result: resultRows });
                                    })
                                });
                                const taskCount = new Promise((resolve) => {
                                    Tasks.findAndCountAll({
                                        where: {
                                            status: 'For Approval',
                                            projectId: responseObj.id,
                                            approverId: queryString.userId
                                        },
                                        include: [{
                                            model: Members,
                                            as: 'task_members',
                                            required: false,
                                            where: { linkType: 'task', isDeleted: 0 },
                                            include: [
                                                {
                                                    model: Users,
                                                    as: 'user'
                                                }
                                            ],
                                        }],
                                        distinct: true
                                    }).then(({ count, rows }) => {
                                        const resultRows = _.map(rows, (o) => {
                                            const responseObj = o.toJSON();
                                            const assigned = _.find(responseObj.task_members, (o) => { return o.memberType == "assignedTo" });

                                            return {
                                                type: 'Task For Approval',
                                                title: responseObj.task,
                                                image: (typeof assigned != "undefined") ? assigned.user.avatar : "",
                                                date: responseObj.dueDate
                                            }
                                        });
                                        resolve({ count, result: resultRows });
                                    })
                                })
                                const updateCount = await Promise.all([
                                    conversationCount,
                                    documentCount,
                                    taskCount
                                ]);
                                return _.omit({
                                    ...resToReturn, updates: {
                                        count: _.sumBy(updateCount, 'count'),
                                        list: _.flatten(_.map(updateCount, ({ result }) => { return result }))
                                    }
                                }, "projectManager", "document_link")

                            } else {
                                return _.omit(resToReturn, "projectManager", "document_link");
                            }

                        })
                        .then((res) => {
                            callback(null, res)
                        });
                } catch (err) {
                    callback(err)
                }
            }
        }, async (err, results) => {
            if (err != null) {
                cb({ status: false, error: err });
            } else {
                const projectResults = results.result;
                const projectIds = _.map(projectResults, (projectResult) => { return projectResult.id });
                const dueDate = queryString.dueDate || new Date();
                const startMonth = moment(dueDate, 'YYYY-MM-DD').startOf('month').utc().format("YYYY-MM-DD HH:mm");
                const endMonth = moment(dueDate, 'YYYY-MM-DD').endOf('month').utc().format("YYYY-MM-DD HH:mm");

                try {
                    const projectCompletionStack = await Tasks.findAll({
                        group: ['projectId'],
                        where: {
                            isDeleted: 0,
                            projectId: projectIds,
                            ...(typeof queryString.dueDate != "undefined" && queryString.dueDate != "") ? {
                                dueDate: {
                                    [Op.between]: [startMonth, endMonth]
                                }
                            } : {}
                        },
                        attributes: [
                            'projectId',
                            [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.id <> 0 THEN task.id END)'), 'total_tasks'],
                            [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status = "Completed" THEN task.id END)'), 'completed'],
                            [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.dueDate < "' + moment(dueDate, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" AND task.status = "In Progress" THEN task.id END)'), 'issues'],
                            [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status = "For Approval" THEN task.id END)'), 'for_approval'],
                            [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.dueDate = "' + moment(dueDate, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" AND task.status <> "Completed" THEN task.id END)'), 'due_today']
                        ]
                    }).map((response) => {
                        return response.toJSON();
                    });
                    const projectStack = _.map(projectResults, (obj) => {
                        const completionRate = _.find(projectCompletionStack, { projectId: obj.id });
                        return {
                            ..._.omit(obj, ['team']),
                            numberOfTasks: (typeof completionRate != "undefined") ? completionRate.total_tasks : 0,
                            completion_rate: {
                                tasks_due_today: {
                                    value: (typeof completionRate != "undefined") ? (completionRate.due_today / completionRate.total_tasks) * 100 : 0,
                                    color: "#f6dc64",
                                    count: (typeof completionRate != "undefined") ? completionRate.due_today : 0
                                },
                                tasks_for_approval: {
                                    value: (typeof completionRate != "undefined") ? (completionRate.for_approval / completionRate.total_tasks) * 100 : 0,
                                    color: "#ff754a",
                                    count: (typeof completionRate != "undefined") ? completionRate.for_approval : 0
                                },
                                delayed_task: {
                                    value: (typeof completionRate != "undefined") ? (completionRate.issues / completionRate.total_tasks) * 100 : 0,
                                    color: '#f9003b',
                                    count: (typeof completionRate != "undefined") ? completionRate.issues : 0
                                },
                                completed: {
                                    value: (typeof completionRate != "undefined") ? (completionRate.completed / completionRate.total_tasks) * 100 : 0,
                                    color: '#00e589',
                                    count: (typeof completionRate != "undefined") ? completionRate.completed : 0
                                },
                            }
                        }
                    });
                    cb({ status: true, data: { ...results, result: projectStack } })
                } catch (err) {
                    cb({ status: false, error: err });
                }
            }
        })
    },
    getById: (req, cb) => {
        const id = req.params.id;
        try {
            Projects
                .findOne({
                    include: associationFindAllStack,
                    where: { id: id }
                })
                .then((res) => {
                    const response = res.toJSON();
                    const returnObj = {
                        ...response,
                        projectManagerId: ((response.projectManager).length > 0) ? response.projectManager[0].userTypeLinkId : "",
                    };
                    cb({ status: true, data: returnObj })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    getProjectMembers: async (req, cb) => {
        const queryString = req.query;

        const limit = 10;
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
        };
        const whereObj = {
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "") ? {
                linkType: queryString.linkType
            } : {},
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "") ? {
                linkId: queryString.linkId
            } : {},
            ...(typeof queryString.usersType != "undefined" && queryString.usersType != "") ? {
                usersType: queryString.usersType
            } : {},
        }

        try {
            const memberList = await Members
                .findAll({
                    ...options,
                    where: whereObj
                })
                .map((o) => {
                    return o.toJSON()
                });

            const userMembers = _.filter(memberList, (o) => { return o.usersType == "users" });
            const teamMembers = _.filter(memberList, (o) => { return o.usersType == "team" });

            async.parallel({
                users: (parallelCallback) => {
                    const userIds = _.map(userMembers, (o) => { return o.userTypeLinkId });
                    parallelCallback(null, userIds)
                },
                team_users: (parallelCallback) => {
                    const teamIds = _.map(teamMembers, (o) => { return o.userTypeLinkId });
                    async.parallel({
                        team_leaders: (parallelCallback) => {
                            Teams
                                .findAll({
                                    where: {
                                        id: teamIds
                                    }
                                })
                                .map((o) => {
                                    return o.toJSON()
                                }).then((res) => {
                                    const teamLeadUserIds = _.map(res, (o) => { return o.teamLeaderId });
                                    parallelCallback(null, teamLeadUserIds);
                                });
                        },
                        team_members: (parallelCallback) => {
                            UsersTeam.findAll({
                                where: {
                                    teamId: teamIds
                                }
                            })
                                .map((o) => {
                                    return o.toJSON()
                                }).then((res) => {
                                    const teamUserIds = _.map(res, (o) => { return o.usersId });
                                    parallelCallback(null, teamUserIds);
                                });
                        }
                    }, (err, res) => {
                        const returnStack = [...res.team_leaders, ...res.team_members];
                        parallelCallback(null, returnStack);
                    });
                }
            }, async (err, results) => {
                let userMemberIds = _.uniq([...results.users, ...results.team_users]);

                if (
                    (typeof queryString.project_type != "undefined" && queryString.project_type != "") ||
                    (typeof queryString.memberType != "undefined" && queryString.memberType != "")
                ) {
                    userMemberIds = await UsersRole.findAll({
                        where: {
                            ...(
                                typeof queryString.project_type != "undefined" && queryString.project_type == "Client" ||
                                typeof queryString.memberType != "undefined" && queryString.memberType == "approver"
                            ) ? {
                                    roleId: {
                                        [Op.notIn]: [4, 6]
                                    }
                                } : {},
                            ...(
                                typeof queryString.project_type != "undefined" && queryString.project_type == "Private"
                            ) ? {
                                    roleId: {
                                        [Op.lte]: 4
                                    }
                                } : {},
                            ... (
                                typeof queryString.project_type != "undefined" && queryString.project_type == "Client" &&
                                typeof queryString.memberType != "undefined" && queryString.memberType == "responsible"
                            ) ? {
                                    roleId: {
                                        [Op.lte]: 3
                                    }
                                } : {},
                            usersId: userMemberIds
                        }
                    }).map((o) => {
                        const { usersId } = o.toJSON();
                        return usersId
                    });
                }
                Users.findAll({
                    where: {
                        id: userMemberIds,
                        ...(typeof queryString.memberName != "undefined" && queryString.memberName != "") ? {
                            [Op.or]: [
                                Sequelize.where(Sequelize.fn('lower', Sequelize.col('users.firstName')),
                                    {
                                        [Sequelize.Op.like]: sequelize.fn('lower', `%${queryString.memberName}%`)
                                    }
                                ),
                                Sequelize.where(Sequelize.fn('lower', Sequelize.col('users.lastName')),
                                    {
                                        [Sequelize.Op.like]: sequelize.fn('lower', `%${queryString.memberName}%`)
                                    }
                                ),
                                Sequelize.where(Sequelize.fn('lower', Sequelize.col('users.username')),
                                    {
                                        [Sequelize.Op.like]: sequelize.fn('lower', `%${queryString.memberName}%`)
                                    }
                                )
                            ]
                        } : {},
                        ...(typeof queryString.userType != "undefined" && queryString.userType != "") ? {
                            userType: queryString.userType
                        } : {}
                    },
                    include: [
                        {
                            model: Teams,
                            as: 'team_as_teamLeader',
                            where: {
                                isDeleted: 0
                            },
                            required: false
                        },
                        {
                            model: UsersRole,
                            as: 'user_role',
                            include: [{
                                model: Roles,
                                as: 'role',
                            }],
                            required: false
                        },
                        {
                            model: UsersTeam,
                            as: 'users_team',
                            where: {
                                isDeleted: 0
                            },
                            include: [{
                                model: Teams,
                                as: 'team',
                                where: {
                                    isDeleted: 0
                                }
                            }],
                            required: false
                        }
                    ]
                }).map((o) => {
                    const responseObj = o.toJSON();
                    const userTeams = _.map(responseObj.users_team, (o) => { return o.team });
                    const teamArray = [...userTeams, ...responseObj.team_as_teamLeader];
                    const memberByTeam = _.filter(teamArray, (o) => {
                        const checkIndex = _.findIndex(teamMembers, (teamMember) => {
                            return teamMember.userTypeLinkId == o.id
                        });
                        return checkIndex >= 0;
                    });
                    return {
                        ...responseObj,
                        team: _.uniqBy(teamArray, (o) => { return o.id }),
                        memberByTeam
                    };
                }).then((res) => {
                    cb({
                        status: true,
                        data: res
                    })
                });
            });

        } catch (err) {
            cb({
                status: false,
                error: err
            });
        }
    },
    getProjectTeams: (req, cb) => {
        const queryString = req.query;
        const whereObj = {
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "") ? {
                linkType: queryString.linkType
            } : {},
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "") ? {
                linkId: queryString.linkId
            } : {},
            ...(typeof queryString.usersType != "undefined" && queryString.usersType != "") ? {
                usersType: queryString.usersType
            } : {},
        }

        try {
            Members
                .findAll({
                    where: whereObj,
                    include: [{
                        model: Teams,
                        as: 'team',
                        include: [{
                            model: Users,
                            as: 'teamLeader'
                        },
                        {
                            model: UsersTeam,
                            as: 'users_team',
                            include: [{
                                model: Users,
                                as: 'user',
                                include: [{
                                    model: UsersRole,
                                    as: 'user_role',
                                    include: [{
                                        model: Roles,
                                        as: 'role',
                                    }]
                                },
                                {
                                    model: UsersTeam,
                                    as: 'team',
                                    include: [{
                                        model: Teams,
                                        as: 'team'
                                    }]
                                }
                                ]
                            }]
                        }
                        ]
                    },]
                })
                .then((res) => {
                    cb({
                        status: true,
                        data: res
                    })
                })
        } catch (err) {
            cb({
                status: false,
                error: err
            })
        }
    },
    status: (req, cb) => {
        const queryString = req.query;

        try {
            sequelize.query(`
            SELECT
            tb.typeId,
            Active,
            type,
            linkType,
            taskStatus.Issues,
            taskStatus.OnTrack
            FROM
                (
                SELECT
                    typeId,
                    SUM(IF(isActive = "1", 1, 0)) AS Active
                FROM
                    project
                GROUP BY
                    typeId
            ) AS tb
            LEFT JOIN type ON tb.typeId = type.id
            LEFT JOIN(
                SELECT
                    typeId,
                    SUM(Issues) AS Issues,
                    SUM(OnTrack) AS OnTrack
                FROM
                    (
                    SELECT
                        typeId,
                        projectId,
                        IF(Issues > 0, 1, 0) AS Issues,
                        IF(Issues > 0, 0, IF(OnTrack > 0, 1, 0)) AS OnTrack
                    FROM
                        project
                    LEFT JOIN(
                        SELECT
                            projectId,
                            SUM(IF(dueDate >= :date, 1, 0)) AS OnTrack,
                            SUM(
                                IF(
                                    dueDate < :date AND duedate > "1970-01-01", 1, 0)
                                ) AS Issues
                            FROM
                                task
                            WHERE
                                (
                                STATUS
                                    <> "Completed" OR
                                STATUS IS NULL
                            ) AND isActive = 1
                        GROUP BY
                            projectId
                            ) AS tbTask
                        ON
                            project.id = tbTask.projectId) AS tbpt
                        GROUP BY
                            typeId
                    ) AS taskStatus
                ON
                    tb.typeId = taskStatus.typeId
            `,
                {
                    replacements: {
                        date: moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm")
                    },
                    type: sequelize.QueryTypes.SELECT
                }
            )
                .then((response) => {
                    cb({ status: true, data: response });
                });
        } catch (err) {
            callback(err)
        }
    }
}

exports.post = {
    index: (req, cb) => {
        let d = { ...req.body, picture: "https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/production/project_pictures/default.png" };
        sequence.create().then((nextThen) => {
            Projects
                .findAll({
                    where: { project: d.project },
                    order: [["projectNameCount", "DESC"]]
                })
                .then((res) => {
                    if (res.length) {
                        d.projectNameCount = res[0].projectNameCount + 1
                        nextThen()
                    } else {
                        d.projectNameCount = 0
                        nextThen()
                    }
                })
        }).then((nextThen) => {
            Projects
                .create(d)
                .then((res) => {
                    nextThen(res)
                })
        }).then((nextThen, result) => {
            const workstreamData = {
                projectId: result.dataValues.id,
                workstream: "Default Workstream",
                typeId: 4,
                color: "#7ed321"
            };

            Workstream
                .create(workstreamData)
                .then((res) => {
                    nextThen({ project_result: result.toJSON(), workstream_result: res.toJSON() })
                });
        }).then((nextThen, { project_result, workstream_result }) => {
            let result = project_result
            Members
                .bulkCreate([
                    {
                        linkId: result.id,
                        linkType: "project",
                        usersType: "users",
                        userTypeLinkId: d.projectManagerId,
                        memberType: "project manager"
                    },
                    {
                        linkId: workstream_result.id,
                        linkType: "workstream",
                        usersType: "users",
                        userTypeLinkId: d.projectManagerId,
                        memberType: "responsible"
                    }
                ])
                .then((res) => {
                    Members
                        .findAll({
                            where: {
                                linkId: result.id,
                                linkType: "project",
                                usersType: "users",
                                userTypeLinkId: d.projectManagerId,
                                memberType: "project manager"
                            },
                            include: [{
                                model: Users,
                                as: 'user',
                                include: [{
                                    model: UsersRole,
                                    as: 'user_role',
                                    include: [{
                                        model: Roles,
                                        as: 'role',
                                    }]
                                },
                                {
                                    model: UsersTeam,
                                    as: 'team'
                                }
                                ]
                            },]
                        })
                        .map((mapObject) => {
                            return mapObject.toJSON();
                        })
                        .then((findRes) => {
                            nextThen(result, findRes)
                        })
                })

        }).then((nextThen, project, members) => {
            Projects
                .findOne({
                    where: { id: project.id },
                    include: [{
                        model: Type,
                        as: 'type',
                        required: false
                    },
                    {
                        model: Members,
                        as: 'projectManager',
                        where: {
                            memberType: 'project manager'
                        },
                        required: false,
                        attributes: []
                    },
                    {
                        model: Tasks,
                        as: 'taskActive',
                        attributes: [],
                        required: false
                    },
                    {
                        model: Tasks,
                        as: 'taskOverDue',
                        where: {
                            dueDate: { [Op.lt]: moment.utc().format("YYYY-MM-DD") },
                            status: {
                                [Op.or]: {
                                    [Op.not]: "Completed",
                                    [Op.eq]: null
                                }
                            }
                        },
                        required: false,
                        attributes: []
                    },
                    {
                        model: Tasks,
                        as: 'taskDueToday',
                        where: Sequelize.where(Sequelize.fn('date', Sequelize.col('taskDueToday.dueDate')), '=', moment().format('YYYY-MM-DD 00:00:00')),
                        required: false,
                        attributes: []
                    }
                    ]
                })
                .then(res => {
                    cb({ status: true, data: { project: { ...res.toJSON() }, members: members } })
                })
        })
    },
    projectMember: (req, cb) => {
        let d = req.body
        if (d.data.usersType == 'users') {
            try {
                Members
                    .create(req.body.data)
                    .then((res) => {
                        Members
                            .findOne({
                                where: {
                                    userTypeLinkId: res.dataValues.userTypeLinkId,
                                    usersType: 'users'
                                },
                                include: [{
                                    model: Users,
                                    as: 'user',
                                    include: [{
                                        model: UsersRole,
                                        as: 'user_role',
                                        include: [{
                                            model: Roles,
                                            as: 'role',
                                        }]
                                    },
                                    {
                                        model: UsersTeam,
                                        as: 'team'
                                    }
                                    ]
                                },]
                            })
                            .then((findRes) => {
                                cb({
                                    status: true,
                                    data: [findRes]
                                });
                            })
                        return null;
                    })
            } catch (err) {
                cb({
                    status: false,
                    error: err
                });
            }

        } else {
            async.waterfall([
                function (callback) {
                    try {
                        UsersTeam
                            .findAll({
                                where: {
                                    teamId: d.data.userTypeLinkId
                                },
                            })
                            .map((res) => {
                                return res.usersId
                            })
                            .then((res) => {
                                callback(null, res)
                            })
                    } catch (err) {
                        callback(err)
                    }

                },
                function (userIds, callback) {
                    try {
                        Members.destroy({
                            where: {
                                userTypeLinkId: userIds,
                                usersType: 'users'
                            }
                        })
                            .then((res) => {
                                callback(null, res)
                                return null;
                            })
                    } catch (err) {
                        callback(err)
                    }
                },
                function (usersIds, callback) {
                    try {
                        Members
                            .create(req.body.data)
                            .then((res) => {
                                callback(null, res.dataValues.id)
                                return null;
                            })
                    } catch (err) {
                        callback(err)
                    }
                },
                function (teamId, callback) {
                    try {
                        Members
                            .findOne({
                                where: {
                                    id: teamId
                                },
                                include: [{
                                    model: Teams,
                                    as: 'team',
                                    include: [{
                                        model: Users,
                                        as: 'teamLeader'
                                    },
                                    {
                                        model: UsersTeam,
                                        as: 'users_team',
                                        include: [{
                                            model: Users,
                                            as: 'user',
                                            include: [{
                                                model: UsersRole,
                                                as: 'user_role',
                                                include: [{
                                                    model: Roles,
                                                    as: 'role',
                                                }]
                                            },
                                            {
                                                model: UsersTeam,
                                                as: 'team'
                                            }
                                            ]
                                        }]
                                    }
                                    ]
                                },],
                            })
                            .then((findRes) => {
                                callback(null, findRes)
                                return null;
                            })
                    } catch (err) {
                        callback(err)
                    }
                }
            ], function (err, result) {
                if (err != null) {
                    cb({
                        status: false,
                        error: err
                    })
                } else {
                    cb({
                        status: true,
                        data: [result]
                    })
                }
            });
        }
    },
    upload: (req, cb) => {
        const formidable = global.initRequire("formidable");
        const func = global.initFunc();
        let form = new formidable.IncomingForm();
        let files = [];
        let type = "project_pictures";
        let projectId = "";
        form.multiples = false;
        files.push(new Promise((resolve, reject) => {
            form
                .on('field', function (name, field) {
                    projectId = field;
                })
                .on('file', function (field, file) {
                    const date = new Date();
                    const Id = func.generatePassword(date.getTime() + file.name, "attachment");
                    const filename = Id + (file.name).replace(/[^\w.]|_/g, "_");
                    func.uploadFile({
                        file: file,
                        form: type,
                        filename: filename
                    }, response => {
                        if (response.Message == 'Success') {
                            resolve({
                                filename: filename,
                                origin: file.name,
                                Id: Id,
                                projectId
                            })
                        } else {
                            reject()
                        }
                    });
                })

        }));

        Promise.all(files).then(e => {
            if (e.length > 0) {
                const { filename, projectId } = e[0];
                const url = global.AWSLink + global.environment + "/project_pictures/" + filename;
                Projects
                    .update({ picture: url }, { where: { id: projectId } })
                    .then((res) => {
                        cb({ status: true, data: global.AWSLink + global.environment + "/project_pictures/" + filename });
                    })
            } else {
                cb({ status: false, data: [] });
            }
        })
        // log any errors that occur
        form.on('error', function (err) {
            cb({ status: false, error: "Upload error. Please try again later." });
        });
        form.parse(req);
    }
}

exports.put = {
    index: (req, cb) => {
        const dataToSubmit = req.body;
        const id = req.params.id;

        sequence.create().then((nextThen) => {
            Projects
                .findAll({
                    raw: true,
                    where: { project: dataToSubmit.project },
                    order: [["projectNameCount", "DESC"]]
                })
                .then((res) => {
                    if (res.length) {
                        let existingData = res.filter(f => f.id == id)
                        if (existingData.length == 0) {
                            dataToSubmit.projectNameCount = c.data[0].projectNameCount + 1
                        }
                        nextThen()
                    } else {
                        dataToSubmit.projectNameCount = 0
                        nextThen()
                    }
                })
        }).then((nextThen) => {
            Projects
                .update(_.omit(dataToSubmit, ['updatedBy']),
                    {
                        where: { id: id },
                    })
                .then((res) => {
                    nextThen(res);
                })
        }).then((nextThen, result) => {
            Members
                .destroy({
                    where: { linkType: "project", linkId: id, usersType: "users", memberType: "project manager" }
                })
                .then((res) => {
                    nextThen(result)
                })
        }).then((nextThen, result) => {
            if (dataToSubmit.projectManagerId != "") {
                Members
                    .create({ linkType: "project", linkId: id, usersType: "users", memberType: "project manager", userTypeLinkId: dataToSubmit.projectManagerId })
                    .then((res) => {
                        Members
                            .findAll({
                                where: { id: res.dataValues.id },
                                include: [{
                                    model: Users,
                                    as: 'user',
                                    include: [{
                                        model: UsersRole,
                                        as: 'user_role',
                                    },
                                    {
                                        model: UsersTeam,
                                        as: 'team'
                                    }
                                    ]
                                },]
                            })
                            .then((findRes) => {
                                nextThen(findRes)
                            })
                    })
            } else {
                nextThen([])
            }
        }).then((nextThen, members) => {
            Projects
                .findOne({
                    where: { id: id },
                    include: [{
                        model: Type,
                        as: 'type',
                        required: false
                    },
                    {
                        model: Members,
                        as: 'projectManager',
                        where: {
                            memberType: 'project manager'
                        },
                        required: false,
                        attributes: []
                    },
                    {
                        model: Tasks,
                        as: 'taskActive',
                        attributes: [],
                        required: false
                    },
                    {
                        model: Tasks,
                        as: 'taskOverDue',
                        where: Sequelize.where(Sequelize.fn('date', Sequelize.col('taskOverDue.dueDate')), '<', moment().format('YYYY-MM-DD 00:00:00')),
                        required: false,
                        attributes: []
                    },
                    {
                        model: Tasks,
                        as: 'taskDueToday',
                        where: Sequelize.where(Sequelize.fn('date', Sequelize.col('taskDueToday.dueDate')), '=', moment().format('YYYY-MM-DD 00:00:00')),
                        required: false,
                        attributes: []
                    }
                    ]
                })
                .then(res => {
                    cb({ status: true, data: { project: { ...res.toJSON() }, members: members } })
                })
        })
    },
    archive: (req, cb) => {
        const dataToSubmit = req.body
        const id = req.params.id;

        try {
            Projects.update(
                { ...dataToSubmit },
                {
                    where: {
                        id: id
                    },
                }).then((res) => {
                    cb({
                        status: true,
                        data: id
                    });
                })
        } catch (err) {
            cb({
                status: false,
                error: err
            });
        }
    },
    projectMember: (req, cb) => {
        let d = req.body
        let filter = d.filter
        try {
            Members
                .update(d.data, {
                    where: filter
                })
                .then((res) => {
                    cb({
                        status: true,
                        data: res
                    });
                })
        } catch (err) {
            cb({
                status: false,
                error: err
            });
        }
    }
}

exports.delete = {
    index: async (req, cb) => {
        let d = req.params;

        try {
            const workstreamIds = await Workstream.findAll({ where: { projectId: d.id } }).map((o) => { return o.id });
            const taskIds = await Tasks.findAll({ where: { projectId: d.id } }).map((o) => { return o.id });
            const documentIds = await DocumentLink.findAll({ where: { linkType: 'project', linkId: d.id } }).map((o) => { return o.id });

            async.parallel({
                projects: (parallelCallback) => {
                    Projects.destroy({
                        where: {
                            id: d.id
                        }
                    }).then((res) => {
                        parallelCallback(null, res);
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                },
                workstreams: (parallelCallback) => {
                    Workstream.destroy({
                        where: {
                            projectId: d.id
                        }
                    }).then((res) => {
                        parallelCallback(null, res)
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                },
                tasks: (parallelCallback) => {
                    Tasks.destroy({
                        where: {
                            projectId: d.id
                        }
                    }).then((res) => {
                        parallelCallback(null, res)
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                },
                notes: (parallelCallback) => {
                    Notes.destroy({
                        where: {
                            workstreamId: workstreamIds
                        }
                    }).then((res) => {
                        parallelCallback(null, res)
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                },
                checklist: (parallelCallback) => {
                    TaskChecklist.destroy({
                        where: {
                            taskId: taskIds
                        }
                    }).then((res) => {
                        parallelCallback(null, res)
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                },
                checklist_document: (parallelCallback) => {
                    ChecklistDocuments.destroy({
                        where: {
                            taskId: taskIds
                        }
                    }).then((res) => {
                        parallelCallback(null, res)
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                },
                conversation: (parallelCallback) => {
                    Conversation.destroy({
                        where: {
                            linkType: 'task',
                            linkid: taskIds
                        }
                    }).then((res) => {
                        parallelCallback(null, res)
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                },
                members: (parallelCallback) => {
                    Members.destroy({
                        where: {
                            [Op.or]: [{
                                linkType: 'project',
                                linkId: d.id
                            },
                            {
                                linkType: 'workstream',
                                linkId: workstreamIds
                            },
                            {
                                linkType: 'task',
                                linkId: taskIds
                            }
                            ]
                        }
                    }).then((res) => {
                        parallelCallback(null, res)
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                },
                documents: (parallelCallback) => {
                    Document.destroy({
                        where: {
                            id: documentIds
                        }
                    }).then((res) => {
                        parallelCallback(null, res)
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                },
                documentLinks: (parallelCallback) => {
                    DocumentLink.destroy({
                        where: {
                            linkType: 'project',
                            linkId: d.id
                        }
                    }).then((res) => {
                        parallelCallback(null, res)
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                },
                documentTags: (parallelCallback) => {
                    Tag.destroy({
                        where: {
                            tagType: 'document',
                            tagTypeId: documentIds
                        }
                    }).then((res) => {
                        parallelCallback(null, res)
                    }).catch((err) => {
                        parallelCallback(err);
                    });
                }
            }, (err) => {
                if (err != null) {
                    throw err
                } else {
                    cb({
                        status: true,
                        data: d.id
                    });
                }
            });
        } catch (error) {
            cb({
                status: false,
                data: error
            });
        }
    },
    deleteProjectMember: (req, cb) => {
        const queryString = req.query;
        const memberId = req.params.id;

        if (queryString.memberByTeam == 'true') {
            async.parallel({
                team_leaders: (parallelCallback) => {
                    Teams
                        .findAll({
                            where: {
                                teamLeaderId: memberId
                            }
                        })
                        .map((o) => {
                            return o.toJSON()
                        }).then((res) => {
                            parallelCallback(null, res);
                        });
                },
                team_members: (parallelCallback) => {
                    UsersTeam.findAll({
                        where: {
                            usersId: memberId
                        }
                    })
                        .map((o) => {
                            return o.toJSON()
                        }).then((res) => {
                            parallelCallback(null, res);
                        });
                }
            }, (o, response) => {
                const teamMemberToBeDeleted = _.map(response.team_members, (o) => { return o.teamId });
                const teamToBeDeleted = _.map(response.team_leaders, (o) => { return o.id });
                const teamToBeDeletedIds = _.uniq([...teamMemberToBeDeleted, ...teamToBeDeleted]);

                Members.destroy({
                    where: {
                        userTypeLinkId: teamToBeDeletedIds,
                        usersType: "team"
                    }
                }).then((res) => {
                    cb({
                        status: true,
                        data: memberId
                    })
                })
            });
        } else {
            Members.destroy({
                where: {
                    userTypeLinkId: memberId,
                    usersType: "users"
                }
            })
                .then((res) => {
                    cb({
                        status: true,
                        data: memberId
                    })
                })
        }
    }
}