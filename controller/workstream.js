const dbName = "workstream";
const sequence = require("sequence").Sequence;
const models = require('../modelORM');
const moment = require('moment');
const { defaultDelete } = require("./");
const { Type, Workstream, Tasks, Tag, Members, Users, Document, Sequelize, sequelize } = models;
const associationStack = [
    {
        model: Type,
        as: 'type',
        required: false,
        where: { linkType: 'workstream' },
        attributes: ['id', 'type', 'linkType']
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
        where: { linkType: 'workstream' },
        include: [
            {
                required: false,
                model: Document,
                as: 'document',
                where: { isDeleted: 0 },
            }
        ]
    }
];
exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 10;
        const whereObj = {
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "") ? { projectId: queryString.projectId } : {},
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "") ? { isActive: queryString.isActive } : {},
            ...(typeof queryString.isTemplate != "undefined" && queryString.isTemplate != "") ? { isTemplate: queryString.isTemplate } : {},
            ...(typeof queryString.typeId != "undefined" && queryString.typeId != "") ? { typeId: queryString.typeId } : {},
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
        const options = {
            include: associationStack,
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
                        const issuesTasks = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment(new Date());
                            return dueDateMoment.isBefore(currentDateMoment, 'day') && taskObj.status != "Completed"
                        });
                        const pendingTasks = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment(new Date());
                            return dueDateMoment.isBefore(currentDateMoment, 'day') == false && dueDateMoment.isSame(currentDateMoment, 'day') == false && taskObj.status != "Completed"
                        });
                        const dueTodayTask = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment(new Date());
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
                            issues: issuesTasks,
                            dueToday: dueTodayTask,
                            new_documents: newDoc,
                            members,
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

                Members.create(responsible).then((response) => {
                    return Workstream.findOne({ where: { id: resultObj.id }, ...options }).then((response) => {
                        const resultObj = response.toJSON();
                        const completedTasks = _.filter(resultObj.task, (taskObj) => { return taskObj.status == "Completed" });
                        const issuesTasks = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment(new Date());
                            return dueDateMoment.isBefore(currentDateMoment, 'day') && taskObj.status != "Completed"
                        });
                        const pendingTasks = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment(new Date());
                            return dueDateMoment.isBefore(currentDateMoment, 'day') == false && dueDateMoment.isSame(currentDateMoment, 'day') == false && taskObj.status != "Completed"
                        });
                        const dueTodayTask = _.filter(resultObj.task, (taskObj) => {
                            const dueDateMoment = moment(taskObj.dueDate);
                            const currentDateMoment = moment(new Date());
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

                        cb({ status: true, data: { ...resultObj, pending: pendingTasks, completed: completedTasks, issues: issuesTasks, dueToday: dueTodayTask, new_documents: newDoc, members } });
                    })
                });

            })
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
            Workstream.update(body, { where: { id: workstreamId } }).then((response) => {
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
                                const currentDateMoment = moment(new Date());
                                return dueDateMoment.isBefore(currentDateMoment, 'day') && taskObj.status != "Completed"
                            });
                            const pendingTasks = _.filter(resultObj.task, (taskObj) => {
                                const dueDateMoment = moment(taskObj.dueDate);
                                const currentDateMoment = moment(new Date());
                                return dueDateMoment.isBefore(currentDateMoment, 'day') == false && dueDateMoment.isSame(currentDateMoment, 'day') == false && taskObj.status != "Completed"
                            });
                            const dueTodayTask = _.filter(resultObj.task, (taskObj) => {
                                const dueDateMoment = moment(taskObj.dueDate);
                                const currentDateMoment = moment(new Date());
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
                            cb({ status: true, data: { ...resultObj, pending: pendingTasks, completed: completedTasks, issues: issuesTasks, dueToday: dueTodayTask, new_documents: newDoc, members } });
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
        defaultDelete(dbName, req, (res) => {
            if (res.success) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: res.error })
            }
        })
    }
}