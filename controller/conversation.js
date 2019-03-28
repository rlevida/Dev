const dbName = "notes";
const async = require('async')
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")
const models = require('../modelORM');
const {
    Notes,
    NotesLastSeen,
    Tag,
    Tasks,
    Workstream,
    Conversation,
    Users,
    Document,
    Reminder,
    Projects,
    Starred,
    sequelize,
    Sequelize
} = models;
const Op = Sequelize.Op;

const NotesInclude = [
    {
        model: Tag,
        where: {
            linkType: 'task', tagType: 'notes'
        },
        as: 'notesTagTask',
        required: false,
        include: [
            {
                model: Tasks,
                as: 'tagTask',
            }
        ]
    },
    {
        model: Workstream,
        as: 'noteWorkstream'
    },
    {
        model: Tag,
        where: {
            linkType: 'notes', tagType: 'document'
        },
        as: 'documentTags',
        required: false,
        include: [
            {
                model: Document,
                as: 'document',
                include: [{
                    model: Users,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'emailAddress']
                }]
            }
        ]
    },
    {
        model: Conversation,
        where: {
            linkType: 'notes'
        },
        as: 'comments',
        required: false,
        include: [
            {
                model: Users,
                as: 'users',
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            }
        ]
    },
    {
        model: Users,
        as: 'creator',
        required: false,
        attributes: ['id', 'firstName', 'lastName', 'emailAddress']
    }
];


let io = require('socket.io-client');

const socketIo = io(((global.environment == "production") ? "https:" : "http:") + global.site_url, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 99999
});


exports.get = {
    conversationNotes: (req, cb) => {
        const queryString = req.query;
        const limit = 10;
        const getAssociation = [
            {
                model: Workstream,
                as: 'noteWorkstream',
                include: [
                    {
                        model: Projects,
                        as: 'project'
                    }
                ]
            },
            {
                model: Tag,
                as: 'notesTagTask',
                required: false,
                where: {
                    linkType: 'user',
                    tagType: 'notes',
                    isDeleted: 0
                },
                include: [
                    {
                        model: Users,
                        as: 'user'
                    }
                ]
            }
        ]

        const whereObj = {
            ...(typeof queryString.projectId !== 'undefined' && queryString.projectId !== '') ? { projectId: queryString.projectId } : {},
            ...(typeof queryString.title != "undefined" && queryString.title != "") ? {
                [Op.and]: [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('notes.note')),
                        {
                            [Op.like]: sequelize.fn('lower', `%${queryString.title}%`)
                        }
                    )
                ]
            } : {},
        }

        if (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '') {
            getAssociation.push({
                model: Starred,
                as: 'notes_starred',
                where: {
                    linkType: 'notes',
                    isActive: 1,
                    usersId: queryString.starredUser,
                    isDeleted: 0
                },
                required: false,
                include: [
                    {
                        model: Users,
                        as: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'emailAddress']
                    }
                ]
            });
        }
        const options = {
            include: getAssociation,
            order: [['dateUpdated', 'DESC']],
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
        };

        async.parallel({
            count: function (callback) {
                try {
                    Notes.findAndCountAll({ ..._.omit(options, ['offset', 'limit']), where: whereObj, distinct: true }).then((response) => {
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
                    Notes.findAll({
                        ...options,
                        where: whereObj
                    }).map((mapObject) => {
                        const responseObj = mapObject.toJSON();
                        return {
                            ...responseObj,
                            isStarred: (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '' && (responseObj.notes_starred).length > 0) ? responseObj.notes_starred[0].isActive : 0
                        }
                    }).then((resultArray) => {
                        callback(null, resultArray);
                    });
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
    getConversationList: (req, cb) => {
        const queryString = req.query;
        const limit = 5;
        const options = {
            include: [
                {
                    model: Users,
                    as: 'users',
                }
            ],
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            order: [['dateAdded', 'DESC']]
        };
        let whereObj = {
            ...(typeof queryString.linkType !== 'undefined' && queryString.linkType !== '') ? { linkType: queryString.linkType } : {},
            ...(typeof queryString.linkId !== 'undefined' && queryString.linkId !== '') ? { linkId: queryString.linkId } : {}
        }

        if (typeof queryString.search !== 'undefined' && queryString.search !== '') {
            whereObj = {
                ...whereObj,
                comment: { [Op.like]: `%${queryString.search}%` }
            }
        }

        async.parallel({
            count: function (callback) {
                try {
                    Conversation.findAndCountAll({ ..._.omit(options, ['offset', 'limit']), where: whereObj, distinct: true }).then((response) => {
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
                    Conversation
                        .findAll({
                            where: whereObj,
                            ...options
                        }).map((mapObject) => {
                            return mapObject.toJSON();
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
    status: (req, cb) => {
        const queryString = req.query;
        const association = _.cloneDeep(NotesInclude);
        const whereObj = {
            ...(typeof queryString.projectId !== 'undefined' && queryString.projectId !== '') ? { projectId: queryString.projectId } : {},
        }

        _.find(association, { as: 'comments' }).include.push({
            model: NotesLastSeen,
            as: 'seenComments',
            where: {
                linkType: 'conversation',
                userId: queryString.userId
            },
            required: false

        })

        Notes
            .findAll({
                where: whereObj,
                include: association
            })
            .map((res) => {
                const responseData = res.toJSON();
                const data = {
                    ...responseData,
                    isSeen: responseData.comments.filter((e) => { return e.seenComments.length == 0 }).length ? 0 : 1
                }
                return data;
            })
            .then((res) => {
                cb({ status: true, data: res })
            });
    }
}

exports.post = {
    message: async (req, cb) => {
        const body = req.body;
        const userId = [..._.map(body.users, ({ value }) => { return value }), body.userId];
        const noteResult = await Notes.create({
            projectId: body.projectId,
            workstreamId: body.workstreamId,
            note: body.title,
            createdBy: body.userId
        }).then((o) => { return o.toJSON() });
        const getAssociation = [
            {
                model: Conversation,
                as: 'comments',
                where: {
                    linkType: 'notes',
                    isDeleted: 0
                },
                include: [
                    {
                        model: Users,
                        as: 'users'
                    }
                ]
            },
            {
                model: Workstream,
                as: 'noteWorkstream',
                include: [
                    {
                        model: Projects,
                        as: 'project'
                    }
                ]
            },
            {
                model: Tag,
                as: 'notesTagTask',
                required: false,
                where: {
                    linkType: 'user',
                    tagType: 'notes',
                    isDeleted: 0
                },
                include: [
                    {
                        model: Users,
                        as: 'user'
                    }
                ]
            }
        ]

        async.parallel({
            notesLastSeen: (parallelCallback) => {
                NotesLastSeen
                    .create({
                        userId: body.userId,
                        linkType: 'notes',
                        linkId: noteResult.id
                    })
                    .then((res) => {
                        parallelCallback(null, res.toJSON())
                    });
            },
            conversations: (parallelCallback) => {
                Conversation
                    .create({
                        comment: body.message,
                        usersId: body.userId,
                        linkType: "notes",
                        linkId: noteResult.id
                    }).then((res) => {
                        parallelCallback(null, res.toJSON())
                    });
            },
            tags: (parallelCallback) => {
                const submitArray = _.map(userId, (id) => {
                    return {
                        linkType: "user",
                        linkId: id,
                        tagType: "notes",
                        tagTypeId: noteResult.id
                    }
                });

                Tag.bulkCreate(submitArray, { returning: true })
                    .map((response) => {
                        return response.toJSON();
                    }).then((response) => {
                        parallelCallback(null, response)
                    });
            },
        }, (err, result) => {
            Users.findAll({
                where: {
                    id: userId
                }
            }).map((o) => {
                const userObj = o.toJSON();
                return userObj;
            }).then(async (response) => {
                const workstream = await Workstream.findOne({
                    where: {
                        id: body.workstreamId
                    },
                    include: [
                        {
                            model: Projects,
                            as: 'project'
                        }
                    ]
                }).then((o) => { return o.toJSON() });

                const sender = _.find(response, (o) => { return o.id == body.userId });
                const receivers = _.filter(response, (o) => { return o.id != body.userId });
                const reminderList = _.map(receivers, (receiver) => {
                    return {
                        detail: sender.firstName + " " + sender.lastName + " started a message.",
                        emailAddress: receiver.emailAddress,
                        usersId: receiver.id,
                        linkType: 'notes',
                        linkId: noteResult.id,
                        type: "Send Message",
                        createdBy: sender.id
                    }
                });

                Reminder.bulkCreate(
                    _.map(reminderList, (o) => { return _.omit(o, ["emailAddress"]) })
                ).map((response) => {
                    return response.toJSON();
                }).then((resultArray) => {
                    async.map(reminderList, ({ emailAddress, detail }, mapCallback) => {
                        let html = '<p>' + detail + '</p>';
                        html += '<p style="margin-bottom:0">Title: ' + body.title + '</p>';
                        html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                        html += '<p>Message:<br>' + body.message + '</p>';

                        const mailOptions = {
                            from: '"no-reply" <no-reply@c_cfo.com>',
                            to: `${emailAddress}`,
                            subject: '[CLOUD-CFO]',
                            html: html
                        };

                        global.emailtransport(mailOptions);
                        mapCallback(null);
                    }, (err, result) => {
                        const options = {
                            include: getAssociation,
                            order: [['dateUpdated', 'DESC']]
                        };
                        Notes.findAll({
                            ...options,
                            where: {
                                id: noteResult.id
                            }
                        }).map((mapObject) => {
                            const responseObj = mapObject.toJSON();
                            return {
                                ...responseObj,
                                isStarred: 0
                            }
                        }).then((resultArray) => {
                            cb({ status: true, data: resultArray });
                        });
                    });
                });
            })
        });

    },
    comment: async (req, cb) => {
        const body = req.body;
        const bodyData = body.data;
        const conversation = await Conversation
            .create({
                comment: bodyData.comment,
                usersId: bodyData.usersId,
                linkType: bodyData.linkType,
                linkId: bodyData.linkId
            })
            .then((o) => {
                const responseObj = o.toJSON();
                return Conversation
                    .findOne({
                        where: {
                            id: responseObj.id
                        },
                        include: [
                            {
                                model: Users,
                                as: 'users',
                            }
                        ]
                    }).then((res) => {
                        return res.toJSON();
                    })
            });
        async.parallel({
            notesLastSeen: (parallelCallback) => {
                NotesLastSeen
                    .create({
                        projectId: body.projectId,
                        userId: bodyData.usersId,
                        linkType: 'conversation',
                        linkId: conversation.id
                    })
                    .then((res) => {
                        parallelCallback(null, res)
                    });
            },
            reminder: (parallelCallback) => {
                Users.findAll({
                    where: {
                        id: [...body.reminderList, bodyData.usersId]
                    }
                })
                    .map((o) => { return o.toJSON() })
                    .then(async (users) => {
                        const reminderList = _.map(_.filter(users, (o) => { return o.id != bodyData.usersId }), async (o) => {
                            const mentioned = _.find(users, (o) => { return o.id == bodyData.usersId });
                            let message = "";
                            let data = {};

                            if (bodyData.linkType == "task") {
                                const task = await Tasks.findOne({
                                    include: {
                                        model: Workstream,
                                        as: 'workstream'
                                    },
                                    where: {
                                        id: bodyData.linkId
                                    }
                                }).then((o) => {
                                    const responseObj = o.toJSON();
                                    return responseObj;
                                });
                                message = `${mentioned.firstName + " " + mentioned.lastName} metioned you on the task ${task.task} under ${task.workstream.workstream} workstream.`;
                                data = {
                                    detail: message,
                                    usersId: o.id,
                                    linkType: bodyData.linkType,
                                    linkId: bodyData.linkId,
                                    type: 'Tag in Comment',
                                    projectId: body.projectId,
                                    createdBy: bodyData.usersId
                                }
                            } else if (bodyData.linkType == "document") {
                                const document = await Tasks.findOne({
                                    where: {
                                        id: bodyData.linkId
                                    }
                                }).then((o) => {
                                    const responseObj = o.toJSON();
                                    return responseObj;
                                });
                                message = `${mentioned.firstName + " " + mentioned.lastName} metioned you on the ${document.origin}`
                                data = {
                                    detail: message,
                                    usersId: o.id,
                                    linkType: bodyData.linkType,
                                    linkId: bodyData.linkId,
                                    type: 'Tag in Comment',
                                    projectId: body.projectId,
                                    createdBy: bodyData.usersId
                                }
                            }
                            const mailOptions = {
                                from: '"no-reply" <no-reply@c_cfo.com>',
                                to: `${o.emailAddress}`,
                                subject: '[CLOUD-CFO]',
                                html: '<p>' + message + '</p>'
                            }
                            global.emailtransport(mailOptions)
                            return data
                        });

                        Reminder.bulkCreate(reminderList).map((response) => {
                            return response.toJSON();
                        }).then((resultArray) => {
                            parallelCallback(null, resultArray)
                        });
                    })
            }
        }, (err, result) => {
            if (err != null) {
                cb({ status: false, error: err });
            } else {
                cb({ status: true, data: _.omit(conversation, ["dateUpdated"]) });
            }
        })
    },
    index: async (req, cb) => {
        const body = req.body;
        async.parallel({
            conversation: (parallelCallback) => {
                try {
                    Conversation
                        .create(body)
                        .then((o) => {
                            const responseObj = o.toJSON();
                            parallelCallback(null, responseObj);
                        });
                } catch (e) {
                    parallelCallback(e);
                }
            },
            users: (parallelCallback) => {
                Tag.findAll({
                    where: {
                        tagType: 'notes',
                        tagTypeId: body.linkId,
                        linkType: 'user',
                        linkId: {
                            [Op.notIn]: [..._.map((body.users), ({ value }) => { return value }), body.usersId]
                        },
                        isDeleted: 0
                    }
                })
                    .map((o) => { return o.toJSON() })
                    .then(async (responseArray) => {
                        if (responseArray.length > 0) {
                            await Tag.update({ isDeleted: 1 }, {
                                where: {
                                    tagType: 'notes',
                                    tagTypeId: body.linkId,
                                    linkType: 'user',
                                    linkId: {
                                        [Op.in]: _.map(responseArray, (o) => { return o.linkId })
                                    }
                                }
                            });
                        }

                        const currentMembers = await Tag.findAll({
                            where: {
                                tagType: 'notes',
                                tagTypeId: body.linkId,
                                linkType: 'user',
                                isDeleted: 0
                            }
                        }).map((o => {
                            const responseObj = o.toJSON();
                            return {
                                value: responseObj.linkId
                            }
                        }));

                        const newMembers = _.differenceBy(body.users, currentMembers, 'value');

                        if (newMembers.length > 0) {
                            const submitArray = _.map(newMembers, ({ value }) => {
                                return {
                                    linkType: "user",
                                    linkId: value,
                                    tagType: "notes",
                                    tagTypeId: body.linkId
                                }
                            });

                            Tag.bulkCreate(submitArray, { returning: true })
                                .map((response) => {
                                    return response.toJSON();
                                }).then((response) => {
                                    parallelCallback(null, response);
                                });
                        } else {
                            parallelCallback(null);
                        }
                    });
            }
        }, (err, { conversation }) => {
            Conversation
                .findOne({
                    where: {
                        id: conversation.id
                    },
                    include: [
                        {
                            model: Users,
                            as: 'users',
                        },
                        {
                            model: Notes,
                            as: 'conversationNotes',
                            include: [
                                {
                                    model: Workstream,
                                    as: 'noteWorkstream',
                                    include: [
                                        {
                                            model: Projects,
                                            as: 'project'
                                        }
                                    ]
                                },
                                {
                                    model: Tag,
                                    as: 'notesTagTask',
                                    required: false,
                                    where: {
                                        linkType: 'user',
                                        tagType: 'notes',
                                        isDeleted: 0
                                    },
                                    include: [
                                        {
                                            model: Users,
                                            as: 'user'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }).then((res) => {
                    cb({ status: true, data: res.toJSON() });
                })
        })
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
    },
    comment: (req, cb) => {
        const tablename = "conversation";
        const model = global.initModel(tablename);
        model.getData(tablename, { id: req.params.id }, {}, (b) => {
            if (b.data.length > 0) {
                model.deleteData(tablename, { id: req.params.id }, (c) => {
                    if (c.status) {
                        cb({ status: true, data: { id: req.params.id }, message: "Successfully deleted." })
                    } else {
                        if (c.error) { cb({ status: false, data: { id: 0 }, message: c.error.sqlMessage }); return; }

                        cb({ status: false, data: { id: 0 }, message: "Delete failed. Please try again later." })
                    }
                })
            } else {
                cb({ status: true, data: { id: req.params.id }, message: "Successfully deleted." })
            }
        })
    },
    documentTag: (req, cb) => {
        Tag.destroy({
            where: {
                id: req.params.id
            }
        }).then(res => {
            cb({ status: true, data: { id: req.params.id } })
        }).catch(error => {
            console.error(error)
            cb({ status: false, data: { id: req.params.id } })
        })
    },

}