const async = require("async");
const models = require("../modelORM");
const moment = require("moment");
const { Type, Workstream, Tasks, Tag, Members, Users, Document, Sequelize, sequelize, Projects, ActivityLogs, Notes, TaskChecklist } = models;
const associationStack = [
    {
        model: Type,
        as: "type",
        required: false,
        where: { linkType: "workstream" },
        attributes: ["id", "type", "linkType"]
    },
    {
        model: Projects,
        as: "project",
        include: [
            {
                model: Type,
                as: "type",
                required: false,
                attributes: ["type"]
            }
        ]
    },
    {
        model: Tasks,
        as: "task",
        required: false,
        attributes: ["id", "task", "status", "dueDate", "isDeleted"],
        where: { isDeleted: 0 },
        include: [
            {
                model: Members,
                as: "task_members",
                required: false,
                where: { linkType: "task", isDeleted: 0 },
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: ["id", "firstName", "lastName", "avatar"]
                    }
                ]
            }
        ]
    },
    {
        model: Members,
        as: "responsible",
        required: false,
        where: {
            linkType: "workstream"
        },
        include: [
            {
                model: Users,
                as: "user",
                attributes: ["id", "firstName", "lastName", "avatar"]
            }
        ]
    },
    {
        model: Tag,
        as: "tag",
        required: false,
        where: { linkType: "workstream", tagType: "document" },
        include: [
            {
                required: false,
                model: Document,
                as: "document",
                where: { isDeleted: 0 }
            }
        ]
    },
    {
        model: Notes,
        as: "workstreamNotes",
        required: false
    }
];

const taskInclude = [
    {
        model: TaskChecklist,
        as: "checklist",
        where: { isDeleted: 0 },
        required: false
    }
];

exports.get = {
    index: async (req, cb) => {
        const includeStack = [
            {
                model: Type,
                as: "type",
                required: false,
                where: { linkType: "workstream" },
                attributes: ["id", "type", "linkType"]
            },
            {
                model: Tasks,
                as: "task",
                required: false,
                attributes: ["id", "task", "status", "dueDate", "isDeleted"],
                where: { isDeleted: 0 },
                include: [
                    {
                        model: Members,
                        as: "task_members",
                        required: false,
                        where: { linkType: "task", isDeleted: 0 },
                        include: [
                            {
                                model: Users,
                                as: "user",
                                attributes: ["id", "firstName", "lastName", "avatar"]
                            }
                        ]
                    }
                ]
            }
        ];
        const queryString = req.query;
        const limit = 10;
        const whereObj = {
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "" ? { id: queryString.workstreamId } : {}),
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "" ? { projectId: queryString.projectId } : {}),
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "" ? { isActive: queryString.isActive } : {}),
            ...(typeof queryString.isTemplate != "undefined" && queryString.isTemplate != "" ? { isTemplate: queryString.isTemplate } : {}),
            ...(typeof queryString.typeId != "undefined" && queryString.typeId != "" ? { typeId: queryString.typeId } : {}),
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "" ? { isDeleted: queryString.isDeleted } : { isDeleted: 0 }),
            ...(typeof queryString.workstream != "undefined" && queryString.workstream != ""
                ? {
                      [Sequelize.Op.and]: [
                          Sequelize.where(Sequelize.fn("lower", Sequelize.col("workstream")), {
                              [Sequelize.Op.like]: sequelize.fn("lower", `%${queryString.workstream}%`)
                          })
                      ]
                  }
                : {})
        };

        if (typeof queryString.dueDate != "undefined" && queryString.dueDate != "") {
            const dueDate = queryString.dueDate || new Date();
            const startMonth = moment(dueDate, "YYYY-MM-DD")
                .startOf("year")
                .utc()
                .format("YYYY-MM-DD HH:mm");
            const endMonth = moment(dueDate, "YYYY-MM-DD")
                .endOf("month")
                .utc()
                .format("YYYY-MM-DD HH:mm");

            _.find(includeStack, { as: "task" }).where = {
                dueDate: {
                    [Sequelize.Op.between]: [startMonth, endMonth]
                },
                isDeleted: 0
            };
        }

        if (typeof queryString.userRole != "undefined" && queryString.userRole > 4) {
            const workstreamResponsible = await Members.findAll({
                where: {
                    memberType: "responsible",
                    linkType: "workstream",
                    usersType: "users",
                    userTypeLinkId: queryString.userId
                }
            }).map(o => {
                const response = o.toJSON();
                return response.linkId;
            });
            const taskMemberAssigned = await Members.findAll({
                where: {
                    memberType: ["assignedTo", "approver"],
                    linkType: "task",
                    usersType: "users",
                    userTypeLinkId: queryString.userId
                }
            }).map(o => {
                const response = o.toJSON();
                return response.linkId;
            });
            const taskList = await Tasks.findAll({
                where: {
                    id: taskMemberAssigned
                }
            }).map(o => {
                return o.toJSON().workstreamId;
            });

            whereObj["id"] = [...workstreamResponsible, ...taskList];
        }

        if (parseInt(queryString.hasMembers)) {
            includeStack.push({
                model: Members,
                as: "responsible",
                required: false,
                where: {
                    linkType: "workstream"
                },
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: ["id", "firstName", "lastName", "avatar"]
                    }
                ],
                attributes: ["id", "userTypeLinkId"]
            });
        } else {
            includeStack.push(
                {
                    model: Tag,
                    as: "tag",
                    required: false,
                    where: { linkType: "workstream", tagType: "document" },
                    include: [
                        {
                            required: false,
                            model: Document,
                            as: "document",
                            where: { isDeleted: 0 }
                        }
                    ]
                },
                {
                    model: Notes,
                    as: "workstreamNotes",
                    required: false
                }
            );
        }

        const options = {
            include: includeStack,
            ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {}),
            order: [["dateAdded", "DESC"]]
        };

        if (typeof queryString.workstreamStatus != "undefined" && queryString.workstreamStatus != "") {
            switch (queryString.workstreamStatus) {
                case "Active":
                    whereObj["isActive"] = 1;
                    break;
                case "On Time":
                    whereObj["id"] = {
                        [Sequelize.Op.and]: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT workstream.id
                                FROM
                                    workstream
                                LEFT JOIN
                                    task
                                ON task.workstreamId = workstream.id
                                WHERE task.dueDate >= "${moment(queryString.dueDate, "YYYY-MM-DD")
                                    .utc()
                                    .format("YYYY-MM-DD HH:mm")}"
                                OR task.dueDate IS NULL
                                OR task.status = "Completed"
                                )`),
                            [Sequelize.Op.notIn]: Sequelize.literal(`(SELECT DISTINCT
                                workstream.id
                            FROM
                                workstream
                            LEFT JOIN
                                task
                            ON task.workstreamId = workstream.id
                            WHERE task.dueDate < "${moment(queryString.dueDate, "YYYY-MM-DD")
                                .utc()
                                .format("YYYY-MM-DD HH:mm")}" 
                            AND (task.status != "Completed" OR task.status IS NULL)
                            )`)
                        }
                    };
                    break;
                case "Issues":
                    whereObj["id"] = {
                        [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT
                            workstream.id
                        FROM
                            workstream
                        LEFT JOIN
                            task
                        ON task.workstreamId = workstream.id
                        WHERE task.dueDate < "${moment(queryString.dueDate, "YYYY-MM-DD")
                            .utc()
                            .format("YYYY-MM-DD HH:mm")}"
                        AND (task.status = "In Progress" OR task.status IS NULL)
                    )`)
                    };
                    break;
                default:
            }
        }

        async.parallel(
            {
                count: function(callback) {
                    try {
                        Workstream.findAndCountAll({ ...options, where: _.omit(whereObj, ["offset", "limit"]), distinct: true }).then(response => {
                            const pageData = {
                                total_count: response.count,
                                ...(typeof queryString.page != "undefined" && queryString.page != "" ? { current_page: response.count > 0 ? _.toNumber(queryString.page) : 0, last_page: _.ceil(response.count / limit) } : {})
                            };

                            callback(null, pageData);
                        });
                    } catch (err) {
                        callback(err);
                    }
                },
                result: function(callback) {
                    try {
                        Workstream.findAll({
                            where: whereObj,
                            ...options
                        })
                            .map(response => {
                                const resultObj = response.toJSON();
                                const completedTasks = _.filter(resultObj.task, taskObj => {
                                    return taskObj.status == "Completed";
                                });
                                const issuesTasks = _.filter(resultObj.task, taskObj => {
                                    const dueDateMoment = moment(taskObj.dueDate);
                                    const currentDateMoment = moment.utc();
                                    return dueDateMoment.isBefore(currentDateMoment, "day") && taskObj.status == "In Progress";
                                });
                                const pendingTasks = _.filter(resultObj.task, taskObj => {
                                    const dueDateMoment = moment(taskObj.dueDate);
                                    const currentDateMoment = moment.utc();
                                    return dueDateMoment.isBefore(currentDateMoment, "day") == false && dueDateMoment.isSame(currentDateMoment, "day") == false && (taskObj.status != "Completed" && taskObj.status != "Rejected");
                                });
                                const dueTodayTask = _.filter(resultObj.task, taskObj => {
                                    const dueDateMoment = moment(taskObj.dueDate);
                                    const currentDateMoment = moment.utc();
                                    return dueDateMoment.isSame(currentDateMoment, "day") == true && taskObj.status == "In Progress";
                                });
                                const newDoc = _.filter(resultObj.tag, tagObj => {
                                    return tagObj.document && tagObj.document.status == "new";
                                });
                                const forApproval = _.filter(resultObj.task, taskObj => {
                                    return taskObj.status == "For Approval";
                                });

                                let members = [];

                                if (parseInt(queryString.hasMembers)) {
                                    members = [
                                        ...resultObj.responsible,
                                        ..._(resultObj.task)
                                            .map(o => {
                                                return o.task_members;
                                            })
                                            .flatten()
                                            .uniqBy(e => {
                                                return e.user.id;
                                            })
                                            .value()
                                    ];
                                }
                                return {
                                    ...resultObj,
                                    pending: pendingTasks,
                                    completed: completedTasks,
                                    for_approval: forApproval.length,
                                    issues: issuesTasks.length,
                                    dueToday: dueTodayTask.length,
                                    new_documents: newDoc.length,
                                    numberOfTasks: resultObj.task.length,
                                    completion_rate: {
                                        tasks_due_today: {
                                            value: dueTodayTask.length > 0 ? (dueTodayTask.length / resultObj.task.length) * 100 : 0,
                                            color: "#f6dc64",
                                            count: dueTodayTask.length
                                        },
                                        tasks_for_approval: {
                                            value: forApproval.length > 0 ? (forApproval.length / resultObj.task.length) * 100 : 0,
                                            color: "#ff754a",
                                            count: forApproval.length
                                        },
                                        delayed_task: {
                                            value: issuesTasks.length > 0 ? (issuesTasks.length / resultObj.task.length) * 100 : 0,
                                            color: "#f9003b",
                                            count: issuesTasks.length
                                        },
                                        completed: {
                                            value: completedTasks.length > 0 ? (completedTasks.length / resultObj.task.length) * 100 : 0,
                                            color: "#00e589",
                                            count: completedTasks.length
                                        }
                                    },
                                    members,
                                    messages: resultObj.workstreamNotes ? resultObj.workstreamNotes.length : 0
                                };
                            })
                            .then(resultArray => {
                                callback(null, resultArray);
                            });
                    } catch (err) {
                        callback(err);
                    }
                }
            },
            function(err, results) {
                if (err != null) {
                    cb({ status: false, error: err });
                } else {
                    cb({ status: true, data: results });
                }
            }
        );
    },
    getById: async (req, cb) => {
        const id = req.params.id;
        const includeStack = [
            {
                model: Tasks,
                as: "task",
                required: false,
                attributes: ["id", "task", "status", "dueDate", "isDeleted"],
                where: { isDeleted: 0 },
                include: [
                    {
                        model: Members,
                        as: "task_members",
                        required: false,
                        where: { linkType: "task", isDeleted: 0 },
                        include: [
                            {
                                model: Users,
                                as: "user",
                                attributes: ["id", "firstName", "lastName", "avatar"]
                            }
                        ]
                    }
                ]
            },
            {
                model: Members,
                as: "responsible",
                required: false,
                where: {
                    linkType: "workstream"
                },
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: ["id", "firstName", "lastName", "avatar"]
                    }
                ]
            }
        ];
        const options = {
            include: includeStack
        };
        try {
            Workstream.findOne({
                where: { id: id },
                ...options
            }).then(response => {
                const resultObj = response.toJSON();
                const members = [
                    ...resultObj.responsible,
                    ..._(resultObj.task)
                        .map(o => {
                            return o.task_members;
                        })
                        .flatten()
                        .uniqBy(e => {
                            return e.user.id;
                        })
                        .value()
                ];
                const responsible = _.filter(members, member => {
                    return member.memberType == "responsible";
                });
                const returnObj = {
                    ...resultObj,
                    members,
                    responsible: responsible.length > 0 ? responsible[0].userTypeLinkId : ""
                };
                cb({ status: true, data: returnObj });
            });
        } catch (err) {
            cb({ status: false, error: err });
        }
    },
    status: (req, cb) => {
        const queryString = req.query;

        try {
            async.parallel(
                {
                    active: parallelCallback => {
                        Workstream.count({
                            distinct: true,
                            col: "id",
                            where: {
                                projectId: queryString.projectId,
                                isActive: 1
                            }
                        }).then(response => {
                            parallelCallback(null, response);
                        });
                    },
                    issues: parallelCallback => {
                        Workstream.count({
                            distinct: true,
                            col: "id",
                            where: {
                                projectId: queryString.projectId
                            },
                            include: [
                                {
                                    model: Tasks,
                                    as: "task",
                                    required: true,
                                    where: {
                                        dueDate: {
                                            [Sequelize.Op.lt]: queryString.date
                                        },
                                        status: {
                                            [Sequelize.Op.or]: {
                                                [Sequelize.Op.ne]: "Completed",
                                                [Sequelize.Op.eq]: null
                                            }
                                        }
                                    }
                                }
                            ]
                        }).then(response => {
                            parallelCallback(null, response);
                        });
                    }
                },
                (err, result) => {
                    cb({ status: true, data: result });
                }
            );
        } catch (err) {
            callback(err);
        }
    },
    completionRate: async (req, cb) => {
        const includeStack = [
            {
                model: Tasks,
                as: "task",
                required: false,
                attributes: ["id", "task", "status", "dueDate", "isDeleted"],
                where: { isDeleted: 0 },
                include: [
                    {
                        model: Members,
                        as: "task_members",
                        required: false,
                        where: { linkType: "task", isDeleted: 0 },
                        include: [
                            {
                                model: Users,
                                as: "user",
                                attributes: ["id", "firstName", "lastName", "avatar"]
                            }
                        ]
                    }
                ]
            }
        ];
        const queryString = req.query;
        const limit = 10;
        const whereObj = {
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "" ? { id: queryString.workstreamId } : {}),
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "" ? { projectId: queryString.projectId } : {}),
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "" ? { isActive: queryString.isActive } : {}),
            ...(typeof queryString.isTemplate != "undefined" && queryString.isTemplate != "" ? { isTemplate: queryString.isTemplate } : {}),
            ...(typeof queryString.typeId != "undefined" && queryString.typeId != "" ? { typeId: queryString.typeId } : {}),
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "" ? { isDeleted: queryString.isDeleted } : { isDeleted: 0 }),
            ...(typeof queryString.workstream != "undefined" && queryString.workstream != ""
                ? {
                      [Sequelize.Op.and]: [
                          Sequelize.where(Sequelize.fn("lower", Sequelize.col("workstream")), {
                              [Sequelize.Op.like]: sequelize.fn("lower", `%${queryString.workstream}%`)
                          })
                      ]
                  }
                : {})
        };

        if (typeof queryString.dueDate != "undefined" && queryString.dueDate != "") {
            const dueDate = queryString.dueDate || new Date();
            const startMonth = moment(dueDate, "YYYY-MM-DD")
                .startOf("year")
                .utc()
                .format("YYYY-MM-DD HH:mm");
            const endMonth = moment(dueDate, "YYYY-MM-DD")
                .endOf("month")
                .utc()
                .format("YYYY-MM-DD HH:mm");

            _.find(includeStack, { as: "task" }).where = {
                dueDate: {
                    [Sequelize.Op.between]: [startMonth, endMonth]
                },
                isDeleted: 0
            };
        }

        if (typeof queryString.userRole != "undefined" && queryString.userRole > 4) {
            const workstreamResponsible = await Members.findAll({
                where: {
                    memberType: "responsible",
                    linkType: "workstream",
                    usersType: "users",
                    userTypeLinkId: queryString.userId
                }
            }).map(o => {
                const response = o.toJSON();
                return response.linkId;
            });
            const taskMemberAssigned = await Members.findAll({
                where: {
                    memberType: ["assignedTo", "approver"],
                    linkType: "task",
                    usersType: "users",
                    userTypeLinkId: queryString.userId
                }
            }).map(o => {
                const response = o.toJSON();
                return response.linkId;
            });
            const taskList = await Tasks.findAll({
                where: {
                    id: taskMemberAssigned
                }
            }).map(o => {
                return o.toJSON().workstreamId;
            });

            whereObj["id"] = [...workstreamResponsible, ...taskList];
        }

        const options = {
            include: includeStack,
            ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {}),
            order: [["dateAdded", "DESC"]]
        };

        async.parallel(
            {
                count: function(callback) {
                    try {
                        Workstream.findAndCountAll({ ...options, where: _.omit(whereObj, ["offset", "limit"]), distinct: true }).then(response => {
                            const pageData = {
                                total_count: response.count,
                                ...(typeof queryString.page != "undefined" && queryString.page != "" ? { current_page: response.count > 0 ? _.toNumber(queryString.page) : 0, last_page: _.ceil(response.count / limit) } : {})
                            };

                            callback(null, pageData);
                        });
                    } catch (err) {
                        callback(err);
                    }
                },
                result: function(callback) {
                    try {
                        Workstream.findAll({
                            where: whereObj,
                            ...options
                        })
                            .map(response => {
                                const resultObj = response.toJSON();
                                const completedTasks = _.filter(resultObj.task, taskObj => {
                                    return taskObj.status == "Completed";
                                });
                                const issuesTasks = _.filter(resultObj.task, taskObj => {
                                    const dueDateMoment = moment(taskObj.dueDate);
                                    const currentDateMoment = moment.utc();
                                    return dueDateMoment.isBefore(currentDateMoment, "day") && taskObj.status == "In Progress";
                                });
                                const pendingTasks = _.filter(resultObj.task, taskObj => {
                                    const dueDateMoment = moment(taskObj.dueDate);
                                    const currentDateMoment = moment.utc();
                                    return dueDateMoment.isBefore(currentDateMoment, "day") == false && dueDateMoment.isSame(currentDateMoment, "day") == false && (taskObj.status != "Completed" && taskObj.status != "Rejected");
                                });
                                const dueTodayTask = _.filter(resultObj.task, taskObj => {
                                    const dueDateMoment = moment(taskObj.dueDate);
                                    const currentDateMoment = moment.utc();
                                    return dueDateMoment.isSame(currentDateMoment, "day") == true && taskObj.status == "In Progress";
                                });
                                const newDoc = _.filter(resultObj.tag, tagObj => {
                                    return tagObj.document && tagObj.document.status == "new";
                                });
                                const forApproval = _.filter(resultObj.task, taskObj => {
                                    return taskObj.status == "For Approval";
                                });
                                return {
                                    ...resultObj,
                                    pending: pendingTasks,
                                    completed: completedTasks,
                                    for_approval: forApproval.length,
                                    issues: issuesTasks.length,
                                    dueToday: dueTodayTask.length,
                                    new_documents: newDoc.length,
                                    numberOfTasks: resultObj.task.length,
                                    completion_rate: {
                                        tasks_due_today: {
                                            value: dueTodayTask.length > 0 ? (dueTodayTask.length / resultObj.task.length) * 100 : 0,
                                            color: "#f6dc64",
                                            count: dueTodayTask.length
                                        },
                                        tasks_for_approval: {
                                            value: forApproval.length > 0 ? (forApproval.length / resultObj.task.length) * 100 : 0,
                                            color: "#ff754a",
                                            count: forApproval.length
                                        },
                                        delayed_task: {
                                            value: issuesTasks.length > 0 ? (issuesTasks.length / resultObj.task.length) * 100 : 0,
                                            color: "#f9003b",
                                            count: issuesTasks.length
                                        },
                                        completed: {
                                            value: completedTasks.length > 0 ? (completedTasks.length / resultObj.task.length) * 100 : 0,
                                            color: "#00e589",
                                            count: completedTasks.length
                                        }
                                    }
                                };
                            })
                            .then(resultArray => {
                                callback(null, resultArray);
                            });
                    } catch (err) {
                        callback(err);
                    }
                }
            },
            function(err, results) {
                if (err != null) {
                    cb({ status: false, error: err });
                } else {
                    cb({ status: true, data: results });
                }
            }
        );
    }
};

exports.post = {
    index: (req, cb) => {
        const body = req.body;
        const options = {
            include: associationStack
        };

        try {
            Workstream.create(body).then(response => {
                const resultObj = response.toJSON();
                const responsible = { linkType: "workstream", linkId: resultObj.id, usersType: "users", userTypeLinkId: body.responsible, memberType: "responsible" };

                async.parallel(
                    {
                        template: function(callback) {
                            if (typeof body.workstreamTemplate != "undefined" && body.workstreamTemplate != "") {
                                Workstream.findOne({
                                    where: {
                                        id: body.workstreamTemplate
                                    },
                                    include: [
                                        {
                                            model: Tasks,
                                            required: false,
                                            as: "task",
                                            include: taskInclude
                                        }
                                    ]
                                }).then(workstreamResult => {
                                    const workstreamTaskNonPeriodic = workstreamResult.task
                                        .filter(workstreamTasksObj => {
                                            return workstreamTasksObj.periodTask == null && workstreamTasksObj.periodic == 0;
                                        })
                                        .map(workstreamTasksObj => {
                                            return {
                                                ..._.omit(workstreamTasksObj.toJSON(), ["id", "dueDate", "startDate", "status"]),
                                                projectId: body.projectId,
                                                workstreamId: resultObj.id,
                                                dueDate: moment(new Date()).format("YYYY-MM-DD 00:00:00")
                                            };
                                        });

                                    const workstreamTaskPeriodicArray = workstreamResult.task
                                        .filter(workstreamTasksObj => {
                                            return workstreamTasksObj.periodTask !== null;
                                        })
                                        .map(o => {
                                            return o.toJSON();
                                        });

                                    const workstreamTaskPeriodic = _.values(
                                        _.mapValues(_.groupBy(workstreamTaskPeriodicArray, "periodTask"), e => {
                                            if (e.length > 0) {
                                                return _.orderBy(e, ["dateAdded"], ["desc"])[0];
                                            } else {
                                                return e[0];
                                            }
                                        })
                                    );
                                    const newPeriodicTask = _.map(workstreamTaskPeriodic, o => {
                                        return {
                                            ..._.omit(o, ["periodTask", "id", "dateAdded", "dateUpdated"]),
                                            dueDate: moment(new Date()).format("YYYY-MM-DD 00:00:00"),
                                            workstreamId: resultObj.id,
                                            projectId: body.projectId
                                        };
                                    });
                                    const workstreamTaskArray = workstreamTaskNonPeriodic.concat(newPeriodicTask);

                                    Users.findOne({ where: { username: "default" } }).then(userReturn => {
                                        const defaultTaskAssigned = userReturn.toJSON().id;
                                        async.map(
                                            workstreamTaskArray,
                                            (e, mapCallback) => {
                                                const taskObj = _.omit(e, ["checklist"]);
                                                const taskObjChecklistArray = e.checklist;

                                                Tasks.create({ ...taskObj }).then(o => {
                                                    const taskReturn = o.toJSON();
                                                    if (taskReturn.periodic === 1) {
                                                        const newPeriodicTask = _.times(2, t => {
                                                            const nextDueDate = moment(taskReturn.dueDate)
                                                                .add(taskReturn.periodType, taskReturn.periodInstance * (t + 1))
                                                                .format("YYYY-MM-DD HH:mm:ss");
                                                            return {
                                                                ..._.omit(taskReturn, ["dateAdded", "dateUpdated", "id"]),
                                                                dueDate: nextDueDate,
                                                                periodTask: taskReturn.id,
                                                                projectId: body.projectId
                                                            };
                                                        });
                                                        Tasks.bulkCreate(newPeriodicTask)
                                                            .map(newPeriodicTaskReturn => {
                                                                return newPeriodicTaskReturn.toJSON().id;
                                                            })
                                                            .then(newPeriodicTaskReturn => {
                                                                const newPeriodicTaskId = newPeriodicTaskReturn.concat([taskReturn.id]);
                                                                const newPeriodicTaskMembers = newPeriodicTaskId.map(o => {
                                                                    return { linkType: "task", linkId: o, userTypeLinkId: defaultTaskAssigned, usersType: "users", memberType: "assignedTo" };
                                                                });
                                                                const newPeriodicTaskChecklist = newPeriodicTaskId.map(o => {
                                                                    return taskObjChecklistArray.map(c => {
                                                                        return { ..._.omit(c, ["id", "taskId", "documents", "periodChecklist"]), isCompleted: 0, taskId: o };
                                                                    });
                                                                });
                                                                mapCallback(null, { members: newPeriodicTaskMembers, checklist: _.flatten(newPeriodicTaskChecklist) });
                                                            });
                                                    } else {
                                                        const newTaskMembers = [{ linkType: "task", linkId: taskReturn.id, userTypeLinkId: defaultTaskAssigned, usersType: "users", memberType: "assignedTo" }];
                                                        const newTaskchecklist = taskObjChecklistArray.map(c => {
                                                            return { ..._.omit(c, ["id", "taskId", "documents", "periodChecklist"]), isCompleted: 0, taskId: taskReturn.id, createdBy: defaultTaskAssigned, dateAdded: moment().format() };
                                                        });
                                                        mapCallback(null, { members: newTaskMembers, checklist: newTaskchecklist });
                                                    }
                                                });
                                            },
                                            (err, result) => {
                                                const newTaskMember = result.map(o => {
                                                    return o.members;
                                                });
                                                const newTaskChecklist = result.map(o => {
                                                    return o.checklist;
                                                });
                                                async.parallel(
                                                    {
                                                        members: parallelCallback => {
                                                            Members.bulkCreate(_.flatten(newTaskMember)).then(() => {
                                                                parallelCallback(null);
                                                            });
                                                        },
                                                        checklist: parallelCallback => {
                                                            TaskChecklist.bulkCreate(_.flatten(newTaskChecklist)).then(() => {
                                                                parallelCallback(null);
                                                            });
                                                        }
                                                    },
                                                    () => {
                                                        callback(null);
                                                    }
                                                );
                                            }
                                        );
                                    });
                                });
                            } else {
                                callback(null, "");
                            }
                        },
                        members: function(callback) {
                            Members.create(responsible).then(response => {
                                callback(null, response);
                            });
                        }
                    },
                    function(err, results) {
                        Workstream.findOne({ where: { id: resultObj.id }, ...options }).then(response => {
                            const resultObj = response.toJSON();
                            const completedTasks = _.filter(resultObj.task, taskObj => {
                                return taskObj.status == "Completed";
                            });
                            const issuesTasks = _.filter(resultObj.task, taskObj => {
                                const dueDateMoment = moment(taskObj.dueDate);
                                const currentDateMoment = moment.utc();
                                return dueDateMoment.isBefore(currentDateMoment, "day") && taskObj.status == "In Progress";
                            });
                            const pendingTasks = _.filter(resultObj.task, taskObj => {
                                const dueDateMoment = moment(taskObj.dueDate);
                                const currentDateMoment = moment.utc();
                                return dueDateMoment.isBefore(currentDateMoment, "day") == false && dueDateMoment.isSame(currentDateMoment, "day") == false && (taskObj.status != "Completed" && taskObj.status != "Rejected");
                            });
                            const dueTodayTask = _.filter(resultObj.task, taskObj => {
                                const dueDateMoment = moment(taskObj.dueDate);
                                const currentDateMoment = moment.utc();
                                return dueDateMoment.isSame(currentDateMoment, "day") == true && taskObj.status == "In Progress";
                            });
                            const newDoc = _.filter(resultObj.tag, tagObj => {
                                return tagObj.document && tagObj.document.status == "new";
                            });
                            const members = [
                                ...resultObj.responsible,
                                ..._(resultObj.task)
                                    .map(o => {
                                        return o.task_members;
                                    })
                                    .flatten()
                                    .uniqBy(e => {
                                        return e.user.id;
                                    })
                                    .value()
                            ];
                            const forApproval = _.filter(resultObj.task, taskObj => {
                                return taskObj.status == "For Approval";
                            });
                            const responsible = _.filter(members, member => {
                                return member.memberType == "responsible";
                            });
                            Projects.update(
                                { dateUpdated: body.dateUpdated },
                                {
                                    where: { id: resultObj.projectId }
                                }
                            ).then(res => {
                                cb({
                                    status: true,
                                    data: {
                                        ...resultObj,
                                        pending: pendingTasks,
                                        completed: completedTasks,
                                        for_approval: forApproval.length,
                                        issues: issuesTasks.length,
                                        dueToday: dueTodayTask.length,
                                        new_documents: newDoc.length,
                                        numberOfTasks: resultObj.task.length,
                                        completion_rate: {
                                            tasks_due_today: {
                                                value: dueTodayTask.length > 0 ? (dueTodayTask.length / resultObj.task.length) * 100 : 0,
                                                color: "#f6dc64",
                                                count: dueTodayTask.length
                                            },
                                            tasks_for_approval: {
                                                value: forApproval.length > 0 ? (forApproval.length / resultObj.task.length) * 100 : 0,
                                                color: "#ff754a",
                                                count: forApproval.length
                                            },
                                            delayed_task: {
                                                value: issuesTasks.length > 0 ? (issuesTasks.length / resultObj.task.length) * 100 : 0,
                                                color: "#f9003b",
                                                count: issuesTasks.length
                                            },
                                            completed: {
                                                value: completedTasks.length > 0 ? (completedTasks.length / resultObj.task.length) * 100 : 0,
                                                color: "#00e589",
                                                count: completedTasks.length
                                            }
                                        },
                                        members,
                                        responsible: responsible.length > 0 ? responsible[0].userTypeLinkId : ""
                                    }
                                });
                            });
                        });
                    }
                );
            });
        } catch (err) {
            cb({ status: false, error: "Something went wrong. Please try again later." });
        }
    }
};

exports.put = {
    index: (req, cb) => {
        const body = req.body;
        const workstreamId = req.params.id;
        const options = {
            include: associationStack
        };
        try {
            Workstream.update(_.omit(body, ["dateUpdated"]), { where: { id: workstreamId } })
                .then(response => {
                    return Workstream.findOne({ where: { id: workstreamId }, ...options });
                })
                .then(response => {
                    const resultObj = response.toJSON();
                    Members.update(
                        { isDeleted: 1 },
                        {
                            where: { linkType: "workstream", linkId: resultObj.id, usersType: "users", memberType: "responsible" }
                        }
                    ).then(response => {
                        const responsible = { linkType: "workstream", linkId: resultObj.id, usersType: "users", userTypeLinkId: body.responsible, memberType: "responsible" };

                        Members.create(responsible).then(response => {
                            return Workstream.findOne({ where: { id: resultObj.id }, ...options }).then(response => {
                                const resultObj = response.toJSON();
                                const completedTasks = _.filter(resultObj.task, taskObj => {
                                    return taskObj.status == "Completed";
                                });
                                const issuesTasks = _.filter(resultObj.task, taskObj => {
                                    const dueDateMoment = moment(taskObj.dueDate);
                                    const currentDateMoment = moment.utc();
                                    return dueDateMoment.isBefore(currentDateMoment, "day") && taskObj.status == "In Progress";
                                });
                                const pendingTasks = _.filter(resultObj.task, taskObj => {
                                    const dueDateMoment = moment(taskObj.dueDate);
                                    const currentDateMoment = moment.utc();
                                    return dueDateMoment.isBefore(currentDateMoment, "day") == false && dueDateMoment.isSame(currentDateMoment, "day") == false && (taskObj.status != "Completed" && taskObj.status != "Rejected");
                                });
                                const dueTodayTask = _.filter(resultObj.task, taskObj => {
                                    const dueDateMoment = moment(taskObj.dueDate);
                                    const currentDateMoment = moment.utc();
                                    return dueDateMoment.isSame(currentDateMoment, "day") == true && taskObj.status == "In Progress";
                                });
                                const newDoc = _.filter(resultObj.tag, tagObj => {
                                    return tagObj.document && tagObj.document.status == "new";
                                });
                                const members = [
                                    ...resultObj.responsible,
                                    ..._(resultObj.task)
                                        .map(o => {
                                            return o.task_members;
                                        })
                                        .flatten()
                                        .uniqBy(e => {
                                            return e.user.id;
                                        })
                                        .value()
                                ];
                                const forApproval = _.filter(resultObj.task, taskObj => {
                                    return taskObj.status == "For Approval";
                                });
                                const responsible = _.filter(members, member => {
                                    return member.memberType == "responsible";
                                });
                                async.parallel(
                                    {
                                        projects: parallelCallback => {
                                            Projects.update(
                                                { dateUpdated: body.dateUpdated },
                                                {
                                                    where: { id: resultObj.projectId }
                                                }
                                            ).then(res => {
                                                parallelCallback(null);
                                            });
                                        },
                                        workstream: parallelCallback => {
                                            Workstream.update(
                                                { dateUpdated: body.dateUpdated },
                                                {
                                                    where: { id: resultObj.id }
                                                }
                                            ).then(res => {
                                                parallelCallback(null);
                                            });
                                        }
                                    },
                                    () => {
                                        cb({
                                            status: true,
                                            data: {
                                                ...resultObj,
                                                pending: pendingTasks,
                                                completed: completedTasks,
                                                issues: issuesTasks.length,
                                                dueToday: dueTodayTask.length,
                                                for_approval: forApproval.length,
                                                new_documents: newDoc.length,
                                                numberOfTasks: resultObj.task.length,
                                                completion_rate: {
                                                    tasks_due_today: {
                                                        value: dueTodayTask.length > 0 ? (dueTodayTask.length / resultObj.task.length) * 100 : 0,
                                                        color: "#f6dc64",
                                                        count: dueTodayTask.length
                                                    },
                                                    tasks_for_approval: {
                                                        value: forApproval.length > 0 ? (forApproval.length / resultObj.task.length) * 100 : 0,
                                                        color: "#ff754a",
                                                        count: forApproval.length
                                                    },
                                                    delayed_task: {
                                                        value: issuesTasks.length > 0 ? (issuesTasks.length / resultObj.task.length) * 100 : 0,
                                                        color: "#f9003b",
                                                        count: issuesTasks.length
                                                    },
                                                    completed: {
                                                        value: completedTasks.length > 0 ? (completedTasks.length / resultObj.task.length) * 100 : 0,
                                                        color: "#00e589",
                                                        count: completedTasks.length
                                                    }
                                                },
                                                members,
                                                responsible: responsible.length > 0 ? responsible[0].userTypeLinkId : ""
                                            }
                                        });
                                    }
                                );
                            });
                        });
                    });
                });
        } catch (err) {
            cb({ status: false, error: "Something went wrong. Please try again later." });
        }
    }
};

exports.delete = {
    index: (req, cb) => {
        const id = req.params.id;
        try {
            Workstream.update({ isDeleted: 1 }, { where: { id: id } }).then(res => {
                cb({ status: true, data: res });
            });
        } catch (err) {
            cb({ status: false, error: err });
        }
    }
};
