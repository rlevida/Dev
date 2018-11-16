const async = require("async");
const moment = require('moment');
const sequence = require("sequence").Sequence;

const dbName = "project";

const Sequelize = require("sequelize")
const Op = Sequelize.Op;
const models = require('../modelORM');

const { Document, DocumentLink, Members, Projects, Tag, Tasks, Teams, Type, Users, UsersTeam, UsersRole, Roles, Workstream } = models;

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
            where: { status: 'new', isDeleted: 0 },
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
    },
    {
        model: Tasks,
        as: 'taskActive',
        attributes: [],
        required: false
    },
    {
        model: Workstream,
        as: 'workstream',
        include: [
            {
                model: Tasks,
                as: 'taskDueToday',
                where: { dueDate: moment.utc().format("YYYY-MM-DD") },
                required: false,
            },
            {
                model: Tasks,
                as: 'taskOverDue',
                where: { dueDate: { [Op.lt]: moment.utc().format("YYYY-MM-DD") } },
                required: false,
            },
        ],
    }
]

exports.get = {
    index: (req, cb) => {
        const queryString = req.query
        const limit = 10;

        const options = {
            include: associationFindAllStack,
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
        };

        const whereObj = {
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "") ? { projectId: queryString.projectId } : {},
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "") ? { workstreamId: queryString.workstreamId } : {},
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "") ? { isActive: queryString.isActive } : {},
            ...(typeof queryString.typeId != "undefined" && queryString.typeId != "") ? { typeId: queryString.typeId } : {},

        };

        async.parallel({
            count: function (callback) {
                try {
                    Projects.findAndCountAll({ ...options, distinct: true }).then((response) => {
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
                            where: whereObj,
                        })
                        .map((res) => {
                            let documentCount = res.dataValues.document_link.filter((e) => { return e.document != null }).length
                            let resToReturn = {
                                ...res.dataValues,
                                projectManagerId: ((res.projectManager).length > 0) ? res.projectManager[0].userTypeLinkId : "",
                                newDocuments: documentCount
                            }

                            return _.omit(resToReturn, "projectManager", "document_link")
                        })
                        .then((res) => {
                            callback(null, res)
                        });
                } catch (err) {
                    callback(err)
                }
            }
        }, (err, results) => {
            if (err != null) {
                cb({ status: false, error: err });
            } else {
                cb({ status: true, data: results })
            }
        })
    },
    getById: (req, cb) => {
        defaultGetById(dbName, req, (res) => {
            if (res.status) {
                cb({
                    status: true,
                    data: res.data
                })
            } else {
                cb({
                    status: false,
                    error: res.error
                })
            }
        })
    },
    getProjectMembers: (req, cb) => {
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
                        model: Users,
                        as: 'user',
                        include: [
                            {
                                model: UsersRole,
                                as: 'user_role',
                                include: [{
                                    model: Roles,
                                    as: 'role',
                                }]
                            },
                            {
                                model: UsersTeam,
                                as: 'users_team',
                                include: [{
                                    model: Teams,
                                    as: 'team',
                                }]
                            }
                        ]
                    },]
                }).map((mapObject) => {
                    return mapObject.toJSON();
                }).then((res) => {
                    cb({
                        status: true,
                        data: res
                    })
                })
                .catch((err) => {
                    console.error(err)
                })
        } catch (err) {
            cb({
                status: false,
                error: err
            })
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
                                    as: 'team'
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
    }
}

exports.post = {
    index: (req, cb) => {
        let d = req.body
        sequence.create().then((nextThen) => {
            Projects
                .findAll({
                    raw: true,
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
            let workstreamData = {
                projectId: result.dataValues.id,
                workstream: "Default Workstream",
                typeId: 4
            };
            Workstream
                .create(workstreamData)
                .then((res) => {
                    nextThen(result)
                })
        }).then((nextThen, result) => {
            let membersData = {
                linkId: result.dataValues.id,
                linkType: "project",
                usersType: "users",
                userTypeLinkId: d.projectManagerId,
                memberType: "project manager"
            };
            Members
                .create(membersData)
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
                    where: { id: project.dataValues.id },
                    raw: true,
                    include: [{
                        model: Type,
                        as: 'type',
                        required: false,
                        attributes: []
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
                    ],
                    attributes: {
                        include: [
                            [Sequelize.fn("COUNT", Sequelize.col("taskActive.id")), "taskActive"],
                            [Sequelize.fn("COUNT", Sequelize.col("taskOverDue.id")), "taskOverDue"],
                            [Sequelize.fn("COUNT", Sequelize.col("taskDueToday.id")), "taskDueToday"],
                            [Sequelize.col("projectManager.userTypeLinkId"), "projectManagerId"],
                            [Sequelize.col("type.type"), "type"]
                        ]
                    },
                    group: ['id']
                })
                .then(res => {
                    cb({ status: true, data: { project: { ...res }, members: members } })
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
    }
}

exports.put = {
    index: (req, cb) => {
        let dataToSubmit = req.body
        let id = req.params.id

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
                .update(dataToSubmit, { where: { id: id } })
                .then((res) => {
                    nextThen(res)
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
                    raw: true,
                    include: [{
                        model: Type,
                        as: 'type',
                        required: false,
                        attributes: []
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
                    ],
                    attributes: {
                        include: [
                            [Sequelize.fn("COUNT", Sequelize.col("taskActive.id")), "taskActive"],
                            [Sequelize.fn("COUNT", Sequelize.col("taskOverDue.id")), "taskOverDue"],
                            [Sequelize.fn("COUNT", Sequelize.col("taskDueToday.id")), "taskDueToday"],
                            [Sequelize.col("projectManager.userTypeLinkId"), "projectManagerId"],
                            [Sequelize.col("type.type"), "type"]
                        ]
                    },
                    group: ['id']
                })
                .then(res => {
                    cb({ status: true, data: { project: { ...res }, members: members } })
                })
        })
    },
    archive: (req, cb) => {
        let dataToSubmit = req.body
        let id = req.params.id

        sequence.create().then((nextThen) => {
            try {
                Project
                    .update({
                        ...dataToSubmit
                    }, {
                            where: {
                                id: id
                            },
                        })
                    .then(res => {
                        nextThen(res)
                    })
            } catch (err) {
                cb({
                    status: false,
                    error: err
                })
            }

        }).then((nextThen, result) => {
            try {
                Project
                    .findById(result[0])
                    .then(res => {
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
        })
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
    index: (req, cb) => {
        let d = req.params
        async.waterfall([
            function (callback) {
                async.parallel({
                    projects: (parallelCallback) => {
                        try {
                            Project
                                .findAll({
                                    where: {
                                        id: d.id
                                    }
                                })
                                .map((res) => {
                                    return res.id
                                })
                                .then((res) => {
                                    parallelCallback(null, res)
                                })
                        } catch (err) {
                            parallelCallback(null, "")
                        }
                    },
                    workstreams: (parallelCallback) => {
                        try {
                            Workstream
                                .findAll({
                                    where: {
                                        projectId: d.id
                                    }
                                })
                                .map((res) => {
                                    return res.id
                                })
                                .then((res) => {
                                    parallelCallback(null, res)
                                })
                        } catch (err) {
                            parallelCallback(null, "")
                        }
                    },
                    tasks: (parallelCallback) => {
                        try {
                            Tasks
                                .findAll({
                                    where: {
                                        projectId: d.id
                                    }
                                })
                                .map((res) => {
                                    return res.id
                                })
                                .then((res) => {
                                    parallelCallback(null, res)
                                })
                        } catch (err) {
                            parallelCallback(null, "")
                        }
                    },
                    documents: (parallelCallback) => {
                        try {
                            DocumentLink
                                .findAll({
                                    where: {
                                        linkType: 'project',
                                        linkId: d.id
                                    }
                                })
                                .map((res) => {
                                    return res.documentId
                                })
                                .then((res) => {
                                    parallelCallback(null, res)
                                })
                        } catch (err) {
                            parallelCallback(null, "")
                        }
                    }
                }, (err, parallelCallbackResult) => {
                    callback(null, parallelCallbackResult)
                })
            },
            function (result, callback) {
                async.parallel({
                    projects: (parallelCallback) => {
                        try {
                            if (result.projects.length > 0) {
                                Project
                                    .destroy({
                                        where: {
                                            id: result.projects
                                        }
                                    })
                                    .then((res) => {
                                        parallelCallback(null, res)
                                    })
                            } else {
                                parallelCallback(null, "")
                            }
                        } catch (err) {
                            parallelCallback(null, "")
                        }
                    },
                    workstreams: (parallelCallback) => {
                        try {
                            if (result.workstreams.length > 0) {
                                Workstream
                                    .destroy({
                                        where: {
                                            id: result.workstreams
                                        }
                                    })
                                    .then((res) => {
                                        parallelCallback(null, res)
                                    })
                            } else {
                                parallelCallback(null, "")
                            }
                        } catch (err) {
                            parallelCallback(null, "")
                        }
                    },
                    tasks: (parallelCallback) => {
                        try {
                            if (result.tasks.length > 0) {
                                Tasks
                                    .destroy({
                                        where: {
                                            id: result.tasks
                                        }
                                    })
                                    .then((res) => {
                                        parallelCallback(null, res)
                                    })
                                    .catch((err) => {

                                    })
                            } else {
                                parallelCallback(null, "")
                            }
                        } catch (err) {
                            parallelCallback(null, "")
                        }
                    },
                    members: (parallelCallback) => {
                        try {
                            Members
                                .destroy({
                                    where: {
                                        [Op.or]: [{
                                            linkType: 'project',
                                            linkId: d.id
                                        },
                                        {
                                            linkType: 'workstream',
                                            linkId: {
                                                [Op.or]: result.workstreams
                                            }
                                        },
                                        {
                                            linkType: 'task',
                                            linkId: {
                                                [Op.or]: result.tasks
                                            }
                                        }
                                        ]
                                    }
                                })
                                .then((res) => {
                                    parallelCallback(null, res)
                                })
                        } catch (err) {
                            parallelCallback(null, "")
                        }
                    },
                    documents: (parallelCallback) => {
                        try {
                            if (result.documents.length > 0) {
                                Document
                                    .destroy({
                                        where: {
                                            id: result.documents
                                        }
                                    })
                                    .then((res) => {
                                        parallelCallback(null, res)
                                    })
                            } else {
                                parallelCallback(null, "")
                            }
                        } catch (err) {
                            parallelCallback(null, "")
                        }
                    },
                    documentLinks: (parallelCallback) => {
                        try {
                            if (result.documents.length > 0) {
                                DocumentLink
                                    .destroy({
                                        where: {
                                            linkType: 'project',
                                            linkId: result.projects
                                        }
                                    })
                                    .then((res) => {
                                        parallelCallback(null, res)
                                    })
                            } else {
                                parallelCallback(null, "")
                            }
                        } catch (err) {
                            parallelCallback(null, "")
                        }
                    },
                    documentTags: (parallelCallback) => {
                        if (result.documents.length > 0) {
                            Tag
                                .destroy({
                                    where: {
                                        tagType: 'document',
                                        tagTypeId: result.documents
                                    }
                                })
                                .then((res) => {
                                    parallelCallback(null, res)
                                })
                        } else {
                            parallelCallback(null, "")
                        }
                    }
                }, (err, parallelCallbackResult) => {
                    callback(null, parallelCallbackResult)
                })
            }
        ], function (error, result) {
            cb({
                status: true,
                data: d.id
            })
        });
    },
    deleteProjectMember: (req, cb) => {
        try {
            let d = req.params
            Members.destroy({
                where: {
                    id: d.id
                }
            })
                .then((res) => {
                    cb({
                        status: true,
                        data: d.id
                    })
                })
        } catch (err) {
            cb({
                status: false,
                error: err
            })
        }
    }
}