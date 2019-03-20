const async = require("async");
const dbName = "workstream";
const sequence = require("sequence").Sequence;
const models = require('../modelORM');
const moment = require('moment');
const { defaultDelete } = require("./");
const { Type, Workstream, Tasks, Tag, Members, Users, Document, Sequelize, sequelize, Projects, ActivityLogs, Notes } = models;
const associationStack = [
    {
        model: Type,
        as: 'type',
        required: false,
        where: { linkType: 'workstream' },
        attributes: ['id', 'type', 'linkType']
    },
    {
        model: Projects,
        as: 'project'
    },
    {
        model: Tasks,
        as: 'task',
        required: false,
        attributes: ['id', 'task', 'status', 'dueDate'],
        include: [{
            model: Members,
            as: 'task_members',
            required: false,
            where: { linkType: 'task' },
            include: [
                {
                    model: Users,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName']
                }
            ]
        }]
    },
    {
        model: Members,
        as: 'responsible',
        required: false,
        where: {
            linkType: 'workstream'
        },
        include: [
            {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName']
            }
        ]
    },
    {
        model: Tag,
        as: 'tag',
        required: false,
        where: { linkType: 'workstream', tagType: 'tagType' },
        include: [
            {
                required: false,
                model: Document,
                as: 'document',
                where: { isDeleted: 0 },
            }
        ]
    },
    {
        model: Tag,
        as: 'tag_notes',
        required: false,
        where: { linkType: 'workstream', tagType: 'notes' },
        include: [
            {
                required: false,
                model: Notes,
                as: 'TagNotes',
                where: { isDeleted: 0 },
            }
        ]
    }
];
exports.get = {
    index: (req, cb) => {
        const includeStack = _.cloneDeep(associationStack);
        const queryString = req.query;
        const limit = 10;
        const whereObj = {
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "") ? { id: queryString.workstreamId } : {},
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "") ? { projectId: queryString.projectId } : {},
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "") ? { isActive: queryString.isActive } : {},
            ...(typeof queryString.isTemplate != "undefined" && queryString.isTemplate != "") ? { isTemplate: queryString.isTemplate } : {},
            ...(typeof queryString.typeId != "undefined" && queryString.typeId != "") ? { typeId: queryString.typeId } : {},
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "") ? { isDeleted: queryString.isDeleted } : { isDeleted: 0 },
            ...((typeof queryString.userType != "undefined" && queryString.userType == "External") && (typeof queryString.userId != "undefined" && queryString.userId != "")) ? {
                [Sequelize.Op.or]: [
                    {
                        id: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT workstreamId FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.userTypeLinkId = ${queryString.userId})`)
                        }
                    },
                    {
                        id: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT linkId FROM members WHERE memberType="responsible" AND linkType="workstream" AND userTypeLinkId = ${queryString.userId})`)
                        }
                    }
                ]
            } : {},
            ...(typeof queryString.workstream != "undefined" && queryString.workstream != "") ? {
                [Sequelize.Op.and]: [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('workstream')),
                        {
                            [Sequelize.Op.like]: sequelize.fn('lower', `%${queryString.workstream}%`)
                        }
                    )
                ]
            } : {}
        };

        if (typeof queryString.dueDate != "undefined" && queryString.dueDate != "") {
            const dueDate = queryString.dueDate || new Date();
            const startMonth = moment(queryString.dueDate, 'YYYY-MM-DD').startOf('month').utc().format("YYYY-MM-DD HH:mm");
            const endMonth = moment(queryString.dueDate, 'YYYY-MM-DD').endOf('month').utc().format("YYYY-MM-DD HH:mm");

            _.find(includeStack, { as: 'task' }).where = {
                dueDate: {
                    [Sequelize.Op.between]: [startMonth, endMonth]
                }
            };
        }

        const options = {
            include: includeStack,
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            order: [['dateAdded', 'DESC']]
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
                                WHERE task.dueDate >= "${moment(queryString.dueDate, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm")}"
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
                            WHERE task.dueDate < "${moment(queryString.dueDate, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm")}" 
                            AND (task.status != "Completed" OR task.status IS NULL)
                            )`)
                        }
                    }
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
                    Workstream.findAndCountAll({ ...options, where: _.omit(whereObj, ["offset", "limit"]), distinct: true }).then((response) => {
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
                    Workstream.findAll({
                        where: whereObj,
                        ...options
                    }).map((mapObject) => {
                        const resultObj = mapObject.toJSON();
                        const completedTasks = _.filter(resultObj.task, (taskObj) => { return taskObj.status == "Completed" });
                        const forApproval = _.filter(resultObj.task, (taskObj) => { return taskObj.status == "For Approval" });
                        const issuesTasks = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment.utc();
                            return dueDateMoment.isBefore(currentDateMoment, 'day') && taskObj.status != "Completed"
                        });
                        const pendingTasks = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment.utc();
                            return dueDateMoment.isBefore(currentDateMoment, 'day') == false && dueDateMoment.isSame(currentDateMoment, 'day') == false && taskObj.status != "Completed"
                        });
                        const dueTodayTask = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment.utc();
                            return dueDateMoment.isSame(currentDateMoment, 'day') == true && taskObj.status != "Completed"
                        });
                        const newDoc = _.filter(resultObj.tag, (tagObj) => {
                            return tagObj.document.status == "new"
                        });
                        const members = [...resultObj.responsible,
                        ..._(resultObj.task)
                            .map((o) => { return o.task_members })
                            .flatten()
                            .uniqBy((e) => {
                                return e.user.id;
                            })
                            .value()
                        ];
                        const responsible = _.filter(members, (member) => { return member.memberType == "responsible" });
                        return {
                            ...resultObj,
                            pending: pendingTasks,
                            completed: completedTasks,
                            issues: issuesTasks.length,
                            dueToday: dueTodayTask.length,
                            new_documents: newDoc.length,
                            numberOfTasks: (resultObj.task).length,
                            completion_rate: {
                                tasks_due_today: {
                                    value: (dueTodayTask.length > 0) ? (dueTodayTask.length / (resultObj.task).length) * 100 : 0,
                                    color: "#f6dc64",
                                    count: dueTodayTask.length
                                },
                                tasks_for_approval: {
                                    value: (forApproval.length > 0) ? (forApproval.length / (resultObj.task).length) * 100 : 0,
                                    color: "#ff754a",
                                    count: forApproval.length
                                },
                                delayed_task: {
                                    value: (issuesTasks.length > 0) ? (issuesTasks.length / (resultObj.task).length) * 100 : 0,
                                    color: '#f9003b',
                                    count: issuesTasks.length
                                },
                                completed: {
                                    value: (completedTasks.length > 0) ? (completedTasks.length / (resultObj.task).length) * 100 : 0,
                                    color: '#00e589',
                                    count: completedTasks.length
                                },
                            },
                            members,
                            messages: (resultObj.tag_notes).length,
                            responsible: ((responsible).length > 0) ? responsible[0].userTypeLinkId : ""
                        }
                    }).then((resultArray) => {
                        callback(null, resultArray);
                    })
                } catch (err) {
                    callback(err)
                }
            }
        }, function (err, results) {
            if (err != null) {
                cb({ status: false, error: err });
            } else {
                cb({ status: true, data: results })
            }
        });



    },
    getById: (req, cb) => {
        const whereObj = {
            id: req.params.id
        };
        const options = {
            include: associationStack
        };

        try {
            Workstream.findOne(
                { ...options, where: whereObj }
            ).then((response) => {
                const responseData = response.toJSON();
                cb({
                    status: true,
                    data: responseData
                });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    getWorkstreamDetail: (req, cb) => {
        let d = req.query
        sequence.create().then((nextThen) => {
            let workstream = global.initModel("workstream")
            workstream.getData("workstream", { id: d.id }, {}, (c) => {
                if (c.data.length > 0) {
                    nextThen(c.data[0])
                }
            })
        }).then((nextThen, data) => {
            let members = global.initModel("members")
            members.getData("members", { linkType: "workstream", linkId: data.id, usersType: "users", memberType: "responsible" }, {}, (e) => {
                if (e.data.length > 0) {
                    data.responsible = e.data[0].userTypeLinkId;
                }
                nextThen(data)
            })

        }).then((nextThen, data) => {
            let members = global.initModel("members")
            let filter = (typeof d.filter != "undefined") ? d.filter : {};
            members.getWorkstreamTaskMembers({ id: d.id }, (c) => {
                if (c.status) {
                    data.taskMemberList = c.data
                    cb({ status: true, data: data })
                } else {
                    cb({ status: false, error: c.error })
                }
            })
        })
    },
    status: (req, cb) => {
        const queryString = req.query;

        try {
            async.parallel({
                active: (parallelCallback) => {
                    Workstream.count({
                        distinct: true,
                        col: 'id',
                        where: {
                            projectId: queryString.projectId,
                            isActive: 1
                        }
                    }).then((response) => {
                        parallelCallback(null, response)
                    });
                },
                issues: (parallelCallback) => {
                    Workstream.count({
                        distinct: true,
                        col: 'id',
                        where: {
                            projectId: queryString.projectId
                        },
                        include: [
                            {
                                model: Tasks,
                                as: 'task',
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
                            },
                        ]
                    }).then((response) => {
                        parallelCallback(null, response)
                    });
                }
            }, (err, result) => {
                cb({ status: true, data: result });
            })
        } catch (err) {
            callback(err)
        }
    }
}

exports.post = {
    index: (req, cb) => {
        const body = req.body;
        const options = {
            include: associationStack
        };
        try {
            Workstream.create(body).then((response) => {
                const resultObj = response.toJSON();
                const responsible = { linkType: "workstream", linkId: resultObj.id, usersType: "users", userTypeLinkId: body.responsible, memberType: "responsible" };

                async.parallel({
                    template: function (callback) {
                        if (typeof body.workstreamTemplate != "undefined" && body.workstreamTemplate != "") {
                            Workstream.findOne({
                                where: {
                                    id: body.workstreamTemplate
                                },
                                include: [
                                    {
                                        model: Tasks,
                                        required: false,
                                        as: 'task'
                                    }
                                ]
                            }).then((workstreamResult) => {
                                const responseObj = workstreamResult.toJSON();
                                const workstreamTasks = _(responseObj.task)
                                    .filter((workstreamTasksObj) => {
                                        return workstreamTasksObj.periodTask == null
                                    })
                                    .map((workstreamTasksObj) => {
                                        return {
                                            ..._.omit(workstreamTasksObj, ["id", "dueDate", "startDate", "status"]),
                                            projectId: body.projectId,
                                            workstreamId: resultObj.id,
                                            ...(workstreamTasksObj.periodic == 1) ? { dueDate: moment(new Date()).format("YYYY-MM-DD 00:00:00") } : {}
                                        }
                                    })
                                    .value();

                                Tasks.bulkCreate(workstreamTasks).map((taskResponse) => {
                                    return taskResponse.toJSON();
                                }).then((taskArray) => {
                                    const periodicTask = _(taskArray)
                                        .filter((taskObj) => {
                                            return taskObj.periodic == 1;
                                        })
                                        .map((taskObj) => {
                                            return _.times(taskObj.periodInstance - 1, (o) => {
                                                const nextDueDate = moment(taskObj.dueDate).add(taskObj.periodType, o + 1).format('YYYY-MM-DD HH:mm:ss');
                                                return { ..._.omit(taskObj, ["id", "startDate", "status"]), dueDate: nextDueDate, periodTask: taskObj.id, ...(taskObj.startDate != null && taskObj.startDate != "") ? { startDate: moment(taskObj.startDate).add(taskObj.periodType, o + 1).format('YYYY-MM-DD 00:00:00') } : {} }
                                            })
                                        })
                                        .flatten()
                                        .value();

                                    Tasks.bulkCreate(periodicTask).map((taskResponse) => {
                                        return taskResponse.toJSON();
                                    }).then((periodicTaskArray) => {
                                        const activityLogs = _.map([...taskArray, ...periodicTaskArray], (taskActObj) => {
                                            const activityObj = _.omit(taskActObj, ["dateAdded", "dateUpdated"]);
                                            return {
                                                usersId: body.userId,
                                                linkType: "task",
                                                linkId: activityObj.id,
                                                actionType: "created",
                                                new: JSON.stringify({ task: activityObj }),
                                                title: activityObj.task
                                            }
                                        });

                                        ActivityLogs.bulkCreate(activityLogs).then((response) => {
                                            callback(null, "");
                                        });
                                    });
                                });
                            });
                        } else {
                            callback(null, "");
                        }
                    },
                    members: function (callback) {
                        Members.create(responsible).then((response) => {
                            callback(null, response);
                        });
                    }
                }, function (err, results) {
                    Workstream.findOne({ where: { id: resultObj.id }, ...options }).then((response) => {
                        const resultObj = response.toJSON();
                        const completedTasks = _.filter(resultObj.task, (taskObj) => { return taskObj.status == "Completed" });
                        const issuesTasks = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment.utc();
                            return dueDateMoment.isBefore(currentDateMoment, 'day') && taskObj.status != "Completed"
                        });
                        const pendingTasks = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment.utc();
                            return dueDateMoment.isBefore(currentDateMoment, 'day') == false && dueDateMoment.isSame(currentDateMoment, 'day') == false && taskObj.status != "Completed"
                        });
                        const dueTodayTask = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment.utc();
                            return dueDateMoment.isSame(currentDateMoment, 'day') == true && taskObj.status != "Completed"
                        });
                        const newDoc = _.filter(resultObj.tag, (tagObj) => {
                            return tagObj.document.status == "new"
                        });
                        const members = [...resultObj.responsible,
                        ..._(resultObj.task)
                            .map((o) => { return o.task_members })
                            .flatten()
                            .uniqBy((e) => {
                                return e.user.id;
                            })
                            .value()
                        ];
                        const forApproval = _.filter(resultObj.task, (taskObj) => { return taskObj.status == "For Approval" });
                        Projects.update({ dateUpdated: body.dateUpdated },
                            {
                                where: { id: resultObj.projectId }
                            })
                            .then((res) => {
                                cb({
                                    status: true, data: {
                                        ...resultObj,
                                        pending: pendingTasks,
                                        completed: completedTasks,
                                        issues: issuesTasks.length,
                                        dueToday: dueTodayTask.length,
                                        new_documents: newDoc.length,
                                        numberOfTasks: (resultObj.task).length,
                                        completion_rate: {
                                            tasks_due_today: {
                                                value: (dueTodayTask.length > 0) ? (dueTodayTask.length / (resultObj.task).length) * 100 : 0,
                                                color: "#f6dc64",
                                                count: dueTodayTask.length
                                            },
                                            tasks_for_approval: {
                                                value: (forApproval.length > 0) ? (forApproval.length / (resultObj.task).length) * 100 : 0,
                                                color: "#ff754a",
                                                count: forApproval.length
                                            },
                                            delayed_task: {
                                                value: (issuesTasks.length > 0) ? (issuesTasks.length / (resultObj.task).length) * 100 : 0,
                                                color: '#f9003b',
                                                count: issuesTasks.length
                                            },
                                            completed: {
                                                value: (completedTasks.length > 0) ? (completedTasks.length / (resultObj.task).length) * 100 : 0,
                                                color: '#00e589',
                                                count: completedTasks.length
                                            }
                                        },
                                        members,
                                    }
                                });
                            });
                    });
                });
            });
        } catch (err) {
            cb({ status: false, error: "Something went wrong. Please try again later." })
        }
    }
}

exports.put = {
    index: (req, cb) => {
        const body = req.body;
        const workstreamId = req.params.id;
        const options = {
            include: associationStack
        };
        try {
            Workstream.update(_.omit(body, ["dateUpdated"]), { where: { id: workstreamId } }).then((response) => {
                return Workstream.findOne({ where: { id: workstreamId }, ...options, })
            }).then((response) => {
                const resultObj = response.toJSON();
                Members.destroy({
                    where: { linkType: "workstream", linkId: resultObj.id, usersType: "users", memberType: "responsible" }
                }).then((response) => {
                    const responsible = { linkType: "workstream", linkId: resultObj.id, usersType: "users", userTypeLinkId: body.responsible, memberType: "responsible" };

                    Members.create(responsible).then((response) => {
                        return Workstream.findOne({ where: { id: resultObj.id }, ...options }).then((response) => {
                            const resultObj = response.toJSON();
                            const completedTasks = _.filter(resultObj.task, (taskObj) => { return taskObj.status == "Completed" });
                            const issuesTasks = _.filter(resultObj.task, (taskObj) => {
                                const dueDateMoment = moment(taskObj.dueDate);
                                const currentDateMoment = moment.utc();
                                return dueDateMoment.isBefore(currentDateMoment, 'day') && taskObj.status != "Completed"
                            });
                            const pendingTasks = _.filter(resultObj.task, (taskObj) => {
                                const dueDateMoment = moment(taskObj.dueDate);
                                const currentDateMoment = moment.utc();
                                return dueDateMoment.isBefore(currentDateMoment, 'day') == false && dueDateMoment.isSame(currentDateMoment, 'day') == false && taskObj.status != "Completed"
                            });
                            const dueTodayTask = _.filter(resultObj.task, (taskObj) => {
                                const dueDateMoment = moment(taskObj.dueDate);
                                const currentDateMoment = moment.utc();
                                return dueDateMoment.isSame(currentDateMoment, 'day') == true && taskObj.status != "Completed"
                            });
                            const newDoc = _.filter(resultObj.tag, (tagObj) => {
                                return tagObj.document.status == "new"
                            });
                            const members = [...resultObj.responsible,
                            ..._(resultObj.task)
                                .map((o) => { return o.task_members })
                                .flatten()
                                .uniqBy((e) => {
                                    return e.user.id;
                                })
                                .value()
                            ];
                            const forApproval = _.filter(resultObj.task, (taskObj) => { return taskObj.status == "For Approval" });
                            async.parallel({
                                projects: (parallelCallback) => {
                                    Projects.update({ dateUpdated: body.dateUpdated },
                                        {
                                            where: { id: resultObj.projectId }
                                        })
                                        .then((res) => {
                                            parallelCallback(null);
                                        });
                                },
                                workstream: (parallelCallback) => {
                                    Workstream.update({ dateUpdated: body.dateUpdated },
                                        {
                                            where: { id: resultObj.id }
                                        })
                                        .then((res) => {
                                            parallelCallback(null);
                                        });
                                }
                            }, () => {
                                cb({
                                    status: true, data: {
                                        ...resultObj,
                                        pending: pendingTasks,
                                        completed: completedTasks,
                                        issues: issuesTasks.length,
                                        dueToday: dueTodayTask.length,
                                        new_documents: newDoc.length,
                                        numberOfTasks: (resultObj.task).length,
                                        completion_rate: {
                                            tasks_due_today: {
                                                value: (dueTodayTask.length > 0) ? (dueTodayTask.length / (resultObj.task).length) * 100 : 0,
                                                color: "#f6dc64",
                                                count: dueTodayTask.length
                                            },
                                            tasks_for_approval: {
                                                value: (forApproval.length > 0) ? (forApproval.length / (resultObj.task).length) * 100 : 0,
                                                color: "#ff754a",
                                                count: forApproval.length
                                            },
                                            delayed_task: {
                                                value: (issuesTasks.length > 0) ? (issuesTasks.length / (resultObj.task).length) * 100 : 0,
                                                color: '#f9003b',
                                                count: issuesTasks.length
                                            },
                                            completed: {
                                                value: (completedTasks.length > 0) ? (completedTasks.length / (resultObj.task).length) * 100 : 0,
                                                color: '#00e589',
                                                count: completedTasks.length
                                            }
                                        },
                                        members,
                                    }
                                });
                            });
                        });
                    });
                });
            });

        } catch (err) {
            cb({ status: false, error: "Something went wrong. Please try again later." })
        }
    }
}

exports.delete = {
    index: (req, cb) => {
        const id = req.params.id;
        try {
            Workstream
                .update({ isDeleted: 1 }, { where: { id: id } })
                .then((res) => {
                    cb({ status: true, data: res })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}