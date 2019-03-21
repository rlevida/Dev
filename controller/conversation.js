const dbName = "notes";
const async = require('async')
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")
const sequence = require("sequence").Sequence;
const Sequelize = require("sequelize")
const Op = Sequelize.Op;
const models = require('../modelORM');
const moment = require('moment');
const {
    Notes,
    NotesLastSeen,
    Tag,
    Tasks,
    Workstream,
    Conversation,
    Users,
    Starred,
    Document,
    Reminder
} = models;

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
        model: Tag,
        where: {
            linkType: 'workstream', tagType: 'notes'
        },
        as: 'notesTagWorkstream',
        required: false,
        include: [
            {
                model: Workstream,
                as: 'tagWorkstream',
            }
        ]
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
    index: (req, cb) => {
        const queryString = req.query;
        const association = _.cloneDeep(NotesInclude);
        sequence.create().then((nextThen) => {
            if (queryString.workstreamId) {
                sequence.create().then((nextThen2) => {
                    // get workstream task ids
                    Tasks.findAll({
                        where: { workstreamId: queryString.workstreamId }
                    }).map((e) => {
                        return e.id
                    }).then((res) => {
                        nextThen2(res)
                    })
                }).then((nextThen2, taskIds) => {
                    // get all notes ids to be shown base on task and workstream
                    Tag.findAll({
                        where: {
                            [Op.or]: [
                                { linkType: 'workstream', linkId: queryString.workstreamId },
                                { linkType: 'task', linkId: { [Op.in]: taskIds } }
                            ],
                            tagType: 'notes'
                        }
                    }).map((e) => {
                        return e.tagTypeId
                    }).then((res) => {
                        if (res.length > 0) {
                            nextThen(true, res);
                        } else {
                            cb({ status: true, data: [] })
                        }
                    })
                })
            } else {
                nextThen(false, []);
            }
        }).then((nextThen, isPerWorkstream, noteIds) => {
            let whereCon = {};
            if (isPerWorkstream) {
                whereCon.id = { [Op.in]: noteIds };
            }
            if (typeof queryString.projectId !== 'undefined' && queryString.projectId !== '') {
                whereCon.projectId = queryString.projectId;
            }
            if (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '') {
                association.push({
                    model: Starred,
                    as: 'notes_starred',
                    where: {
                        linkType: 'notes',
                        isActive: 1,
                        usersId: queryString.starredUser
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
            if (typeof queryString.userId !== 'undefined' && queryString.userId !== '') {
                _.find(association, { as: 'comments' }).include.push({
                    model: NotesLastSeen,
                    as: 'seenComments',
                    where: {
                        linkType: 'conversation',
                        userId: queryString.userId
                    },
                    required: false
                })
            }
            try {
                Notes
                    .findAll({
                        where: whereCon,
                        include: association
                    })
                    .map((res) => {
                        const responseData = res.toJSON();
                        const data = {
                            ...responseData,
                            isStarred: (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '' && (responseData.notes_starred).length > 0) ? responseData.notes_starred[0].isActive : 0,
                            tag: responseData.notesTagTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })
                                .concat(responseData.notesTagWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })),
                            isSeen: responseData.comments.filter((e) => { return e.seenComments.length == 0 }).length ? 0 : 1
                        }
                        return data;
                    })
                    .then((res) => {
                        cb({ status: true, data: res })
                    });
            } catch (err) {
                cb({ status: false, error: err })
            }
        })

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
    index: (req, cb) => {
        defaultPost(dbName, req, (res) => {
            const queryString = req.query;
            if (res.success) {
                Notes.findAll({
                    where: { id: res.data[0].id },
                    include: NotesInclude

                })
                    .map((res) => {
                        const responseData = res.toJSON();
                        const data = {
                            ...responseData,
                            isStarred: (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '' && (responseData.notes_starred).length > 0) ? responseData.notes_starred[0].isActive : 0,
                            tag: responseData.notesTagTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })
                                .concat(responseData.notesTagWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })),
                        }
                        return data;
                    }).then((result) => {
                        cb({ status: true, data: result })
                    })
            } else {
                cb({ status: false, error: res.error })
            }
        })
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
    lastSeen: (req, cb) => {
        const body = req.body;
        const queryString = req.query
        if (queryString.type == 'notes') {
            NotesLastSeen
                .findOne({
                    where: body
                })
                .then((res) => {
                    if (res !== null) {
                        cb({ status: true, data: res })
                    } else {
                        NotesLastSeen
                            .create(body)
                            .then((res) => {
                                cb({ status: true, data: res })
                            })
                    }
                })
        } else if (queryString.type == 'conversation') {
            async.map(body.commentIds, (e, mapCallback) => {
                try {
                    NotesLastSeen
                        .create({ projectId: body.projectId, linkType: 'conversation', linkId: e, userId: body.userId })
                        .then((res) => {
                            mapCallback(null, res)
                        })
                } catch (err) {
                    mapCallback(err)
                }
            }, (err, mapCallback) => {
                if (err) {
                    cb({ status: false, error: err })
                } else {
                    cb({ status: true, data: mapCallback })
                }
            })
        }
    }
}

exports.put = {
    index: (req, cb) => {
        defaultPut(dbName, req, (res) => {
            const queryString = req.query;
            if (res.success) {
                Notes.findAll({
                    where: { id: req.params.id },
                    include: NotesInclude
                })
                    .map((res) => {
                        const responseData = res.toJSON();
                        const data = {
                            ...responseData,
                            isStarred: (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '' && (responseData.notes_starred).length > 0) ? responseData.notes_starred[0].isActive : 0,
                            tag: responseData.notesTagTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })
                                .concat(responseData.notesTagWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })),
                        }
                        return data;
                    }).then((result) => {
                        cb({ status: true, data: result })
                    })
            } else {
                cb({ status: false, error: res.error })
            }
        })
    },
    comment: (req, cb) => {
        let conversation = global.initModel("conversation")
        let d = req.body;
        let id = req.params.id;
        sequence.create().then((nextThen) => {
            if (typeof id != "undefined" && id != "") {
                conversation.putData("conversation", d.data, { id: id }, (c) => {
                    Conversation.findAll({
                        where: { id: id },
                        include: [
                            {
                                model: Users,
                                as: 'users',
                            }
                        ]
                    }).then((e) => {
                        nextThen(e)
                    })
                })
            } else {
                cb({ status: false, message: "Data not found." })
            }
        }).then((nextThen, result) => {
            if (JSON.parse(d.reminderList).length) {
                let filter = (typeof d.filter != "undefined") ? d.filter : {};
                let reminder = global.initModel("reminder");
                let tempResData = []
                tempResData.push(new Promise((resolve, reject) => {
                    JSON.parse(d.reminderList).map(r => {
                        let data = { ...d.reminder, usersId: r.userId }
                        reminder.postData("reminder", data, (res) => {
                            if (res.status) {
                                filter.usersId = r.userId
                                reminder.getReminderList(filter, (e) => {
                                    if (e.data.length > 0) {
                                        resolve(e.data)
                                    } else {
                                        reject()
                                    }
                                })
                            } else {
                                reject()
                            }
                        })
                    })
                }))

                Promise.all(tempResData).then((values) => {
                    socketIo.emit("BROADCAST_SOCKET", { type: "FRONT_REMINDER_LIST", data: values[0] })
                    cb({ status: true, data: result })
                }).catch((err) => {
                    cb({ status: false, data: err })
                })
            } else {
                cb({ status: true, data: result })
            }
        })
    },
    tag: (req, cb) => {
        sequence.create().then((nextThen) => {
            try {
                Tag.destroy({
                    where: {
                        tagType: 'notes',
                        tagTypeId: req.params.id
                    }
                }).then(res => {
                    nextThen()
                })
            } catch (err) {
                console.error(err)
                cb({ status: false, data: [] })
            }
        }).then((nextThen) => {
            let promiseList = [];
            req.body.map((e) => {
                promiseList.push(
                    new Promise((resolve, reject) => {
                        Tag.create({
                            linkType: e.value.split("-")[0],
                            linkId: e.value.split("-")[1],
                            tagType: 'notes',
                            tagTypeId: req.params.id
                        })
                        resolve()
                    })
                )
            })
            Promise.all(promiseList).then((values) => {
                Notes.findAll({
                    where: { id: req.params.id },
                    include: NotesInclude

                })
                    .map((res) => {
                        const responseData = res.toJSON();
                        const data = {
                            ...responseData,
                            tag: responseData.notesTagTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })
                                .concat(responseData.notesTagWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })),
                        }
                        return data;
                    }).then((result) => {
                        cb({ status: true, data: result[0].tag })
                    })
            }).catch((err) => {
                console.error(err)
                cb({ status: false, data: [] })
            })
        })
    },
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