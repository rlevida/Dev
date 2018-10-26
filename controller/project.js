const async = require("async");
const moment = require('moment');
const sequence = require("sequence").Sequence;

const dbName = "project";
var {
    defaultPost,
    defaultPut,
} = require("./")

const Sequelize = require("sequelize")
const Op = Sequelize.Op;

const models = require('../modelORM');

const {
    Document,
    DocumentLink,
    Members,
    Projects,
    Tag,
    Tasks,
    Teams,
    Type,
    Users,
    UsersTeam,
    UsersRole,
    Workstream,
} = models;

exports.get = {
    index: (req, cb) => {
        try {
            Projects
                .findAll({
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

                    cb({
                        status: true,
                        data: res
                    })
                })
        } catch (err) {
            console.log(err)
            cb({
                status: false,
                error: err
            })
        }
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
                        include: [{
                                model: UsersRole,
                                as: 'role',
                            },
                            {
                                model: UsersTeam,
                                as: 'team'
                            }
                        ]
                    }, ]
                })
                .then((res) => {
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
                                            as: 'role',
                                        },
                                        {
                                            model: UsersTeam,
                                            as: 'team'
                                        }
                                    ]
                                }]
                            }
                        ]
                    }, ]
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
        defaultPost(dbName, req, (res) => {
            if (res.success) {
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
                                            as: 'role',
                                        },
                                        {
                                            model: UsersTeam,
                                            as: 'team'
                                        }
                                    ]
                                }, ]
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
                                                        as: 'role',
                                                    },
                                                    {
                                                        model: UsersTeam,
                                                        as: 'team'
                                                    }
                                                ]
                                            }]
                                        }
                                    ]
                                }, ],
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
        defaultPut(dbName, req, (res) => {
            if (res.success) {
                cb({
                    status: true,
                    data: res.data
                })
            } else {
                cb({
                    status: false,
                    error: c.error
                })
            }
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