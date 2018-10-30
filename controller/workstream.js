const dbName = "workstream";
const sequence = require("sequence").Sequence;
const models = require('../modelORM');
const moment = require('moment');
const { defaultDelete } = require("./");
const { Type, Workstream, Tasks, Tag, Members, Users, Document, Sequelize } = models;
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
            } : {}
        };
        const options = {
            include: associationStack,
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            order: [['dateAdded', 'DESC']]
        };

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
                        ...options,
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
                        return { ...resultObj, pending: pendingTasks, completed: completedTasks, issues: issuesTasks, dueToday: dueTodayTask, new_documents: newDoc, members }
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
        defaultGetById(dbName, req, (res) => {
            if (res.status) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: res.error })
            }
        })
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
    count: (req, cb) => {
        
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
                return Workstream.findOne({ where: { id: resultObj.id }, ...options });
            }).then((response) => {
                const resultObj = response.toJSON();
                cb({ status: true, data: { ...resultObj, pending: [], completed: [], issues: [], dueToday: [], new_documents: [], members: [] } });
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
            Workstream.update(body, { where: { id: workstreamId } }).then((response) => {
                return Workstream.findOne({ where: { id: workstreamId }, ...options, })
            }).then((response) => {
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

        } catch (err) {
            cb({ status: false, error: "Something went wrong. Please try again later." })
        }



        // defaultPut(dbName, req, (res) => {
        //     console.log(res)
        //     // if (res.success) {
        //     //     cb({ status: true, data: res.data })
        //     // } else {
        //     //     cb({ status: false, error: c.error })
        //     // }
        // })
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