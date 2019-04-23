const dbName = "notes";
const async = require('async')
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")
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
    Document,
    DocumentRead,
    DocumentLink,
    Reminder,
    Projects,
    Starred,
    sequelize,
    Sequelize,
    UsersNotificationSetting,
    Notification,
    Type
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

exports.get = {
    conversationNotes: async (req, cb) => {
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
        let taggedUser = [];

        if (typeof queryString.userId && queryString.userId != "") {
            taggedUser = await Tag.findAll({
                where: {
                    tagType: 'notes',
                    linkType: 'user',
                    linkId: queryString.userId,
                    isDeleted: 0
                }
            }).map((o) => { return o.toJSON(); });
        }
        const whereObj = {
            ...(typeof queryString.projectId !== 'undefined' && queryString.projectId !== '') ? { projectId: queryString.projectId } : {},
            ...(typeof queryString.workstreamId !== 'undefined' && queryString.workstreamId !== '') ? { workstreamId: queryString.workstreamId } : {},
            ...(typeof queryString.title != "undefined" && queryString.title != "") ? {
                [Op.and]: [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('notes.note')),
                        {
                            [Op.like]: sequelize.fn('lower', `%${queryString.title}%`)
                        }
                    )
                ]
            } : {},
            ...(typeof queryString.userId && queryString.userId != "") ? {
                id: _.map(taggedUser, ({ tagTypeId }) => { return tagTypeId })
            } : {}
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
    conversationById: async (req, cb) => {
        const queryString = req.query;
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
            ...(typeof queryString.noteId !== "undefined" && queryString.noteId !== '') ? { id: queryString.noteId } : {},
            ...(typeof queryString.projectId !== 'undefined' && queryString.projectId !== '') ? { projectId: queryString.projectId } : {},
            ...(typeof queryString.workstreamId !== 'undefined' && queryString.workstreamId !== '') ? { workstreamId: queryString.workstreamId } : {},
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
        };

        const note = await Notes.findOne({
            ...options,
            where: whereObj
        }).then((resultArray) => {
            const responseObj = resultArray.toJSON();
            return {
                ...responseObj,
                isStarred: (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '' && (responseObj.notes_starred).length > 0) ? responseObj.notes_starred[0].isActive : 0
            }

        });

        cb({ status: true, data: note });
    },
    getConversationList: (req, cb) => {
        const queryString = req.query;
        const limit = 5;
        const options = {
            include: [
                {
                    model: Tag,
                    as: 'conversationDocuments',
                    attributes: ['id'],
                    where: {
                        linkType: "conversation",
                        tagType: "document",
                        isDeleted: 0
                    },
                    required: false,
                    include: [
                        {
                            model: Document,
                            as: 'document',
                            include: [{
                                model: DocumentRead,
                                as: 'document_read',
                                required: false
                            },
                            {
                                model: Users,
                                as: 'user',
                                attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
                            }],
                            where: {
                                isDeleted: 0
                            },
                            required: false
                        }
                    ]
                },
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
        const formidable = global.initRequire("formidable");
        const func = global.initFunc();
        const filesStack = [];
        let form = new formidable.IncomingForm();
        let type = "upload";
        let bodyField = "";

        form.multiples = true;
        form.on('field', function (name, field) {
            bodyField = field;
        }).on('file', function (field, file) {
            const date = new Date();
            const id = func.generatePassword(date.getTime() + file.name, "attachment");
            const filename = id + (file.name).replace(/[^\w.]|_/g, "_");

            filesStack.push({
                id,
                file: file,
                form: type,
                filename: filename
            });
        }).on('end', async () => {
            const body = _.omit(JSON.parse(bodyField), ["files"]);
            const userId = [..._.map(body.users, ({ value }) => { return value }), body.userId];
            const noteResult = await Notes.create({
                projectId: body.projectId,
                workstreamId: body.workstreamId,
                note: body.title,
                privacyType: 'Private',
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
                        },
                        {
                            model: Tag,
                            as: 'conversationDocuments',
                            attributes: ['id'],
                            where: {
                                linkType: "conversation",
                                tagType: "document",
                                isDeleted: 0
                            },
                            required: false,
                            include: [{
                                model: Document,
                                as: 'document',
                                include: [{
                                    model: DocumentRead,
                                    as: 'document_read',
                                    attributes: ['id'],
                                    required: false
                                },
                                {
                                    model: Users,
                                    as: 'user',
                                    attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
                                }],
                                where: {
                                    isDeleted: 0
                                },
                                required: false
                            }]
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
            ];
            async.parallel({
                conversations: (parallelCallback) => {
                    Conversation
                        .create({
                            comment: body.message,
                            usersId: body.userId,
                            linkType: "notes",
                            linkId: noteResult.id
                        }).then((res) => {
                            const responseObj = res.toJSON();
                            NotesLastSeen
                                .create({
                                    projectId: body.projectId,
                                    userId: body.userId,
                                    linkType: 'conversation',
                                    linkId: responseObj.id
                                })
                                .then((res) => {
                                    if (filesStack.length > 0) {
                                        async.map(filesStack, (fileObj, mapCallback) => {
                                            func.uploadFile(_.omit(fileObj, ['id']), response => {
                                                if (response.Message == 'Success') {
                                                    mapCallback(null, {
                                                        filename: fileObj.filename,
                                                        origin: fileObj.file.name,
                                                        Id: fileObj.id,
                                                        userId: body.userId
                                                    })
                                                } else {
                                                    mapCallback(esponse.Message)
                                                }
                                            });
                                        }, async (err, results) => {
                                            const newDocs = _.map(results, ({ filename, origin, userId }) => {
                                                return {
                                                    name: filename,
                                                    origin,
                                                    uploadedBy: userId,
                                                    type: 'document',
                                                    status: 'new'
                                                };
                                            });
                                            const documentUpload = await Document.bulkCreate(newDocs).map((o) => { return o.toJSON() });
                                            const documentUploadResult = await _.map((documentUpload), ({ id }) => { return { documentId: id, linkType: 'project', linkId: body.projectId } });
                                            DocumentLink.bulkCreate(documentUploadResult).map((o) => { return o.toJSON() });

                                            const workstreamTag = _(documentUpload)
                                                .map(({ id }) => {
                                                    return {
                                                        linkType: "workstream",
                                                        linkId: body.workstreamId,
                                                        tagType: "document",
                                                        tagTypeId: id
                                                    }
                                                })
                                                .value();

                                            const conversationTag = _(documentUpload)
                                                .map(({ id }) => {
                                                    return {
                                                        linkType: "conversation",
                                                        linkId: responseObj.id,
                                                        tagType: "document",
                                                        tagTypeId: id
                                                    }
                                                })
                                                .value();

                                            Tag.bulkCreate([...conversationTag, ...workstreamTag]).then((o) => {
                                                parallelCallback(null, responseObj)
                                            });
                                        });
                                    } else {
                                        parallelCallback(null, responseObj)
                                    }
                                });
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
                }
            }, async (err, { conversations }) => {

                const sender = await Users.findOne({
                    where: {
                        id: body.userId
                    }
                }).then((o) => {
                    const responseObj = o.toJSON();
                    return responseObj;
                })

                const receiver = body.users.map((e) => { return e.value });

                UsersNotificationSetting
                    .findAll({
                        where: { usersId: receiver },
                        include: [{
                            model: Users,
                            as: 'notification_setting',
                            required: false
                        }]
                    })
                    .map((response) => {
                        return response.toJSON()
                    })
                    .then((response) => {
                        let message = "Sent you a new message"

                        const notificationArr = _.filter(response, (nSetting) => {
                            return nSetting.messageSend === 1
                        }).map((nSetting) => {
                            return {
                                usersId: nSetting.usersId,
                                projectId: body.projectId,
                                createdBy: sender.id,
                                noteId: noteResult.id,
                                conversationId: conversations.id,
                                type: "messageSend",
                                message: message,
                                receiveEmail: nSetting.receiveEmail,
                                emailAddress: nSetting.notification_setting.emailAddress
                            }
                        })

                        Notification
                            .bulkCreate(notificationArr)
                            .map((notificationRes) => {
                                return notificationRes.id
                            })
                            .then((notificationRes) => {
                                Notification
                                    .findAll({
                                        where: { id: notificationRes },
                                        include: [
                                            {
                                                model: Users,
                                                as: 'to',
                                                required: false,
                                                attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                            },
                                            {
                                                model: Users,
                                                as: 'from',
                                                required: false,
                                                attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                            },
                                            {
                                                model: Projects,
                                                as: 'project_notification',
                                                required: false,
                                                include: [{
                                                    model: Type,
                                                    as: 'type',
                                                    required: false,
                                                    attributes: ["type"]
                                                }]
                                            },
                                            {
                                                model: Document,
                                                as: 'document_notification',
                                                required: false,
                                                attributes: ["origin"]
                                            },
                                            {
                                                model: Workstream,
                                                as: 'workstream_notification',
                                                required: false,
                                                attributes: ["workstream"]
                                            },
                                            {
                                                model: Tasks,
                                                as: 'task_notification',
                                                required: false,
                                                attributes: ["task"]
                                            },
                                            {
                                                model: Notes,
                                                as: 'note_notification',
                                                required: false,
                                                include: NotesInclude
                                            },
                                            {
                                                model: Conversation,
                                                as: 'conversation_notification',
                                                required: false

                                            }
                                        ]
                                    })
                                    .map((findNotificationRes) => {
                                        req.app.parent.io.emit('FRONT_NOTIFICATION', {
                                            ...findNotificationRes.toJSON()
                                        })
                                        return findNotificationRes.toJSON()
                                    })
                                    .then(() => {
                                        async.map(notificationArr, ({ emailAddress, message, receiveEmail, projectId, noteId, }, mapCallback) => {
                                            if (receiveEmail === 1) {
                                                let html = '<p>' + message + '</p>';
                                                html += '<p style="margin-bottom:0">Title: ' + message + '</p>';
                                                // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                html += `<p>Message:<br><strong>${sender.firstName}  ${sender.lastName}</strong> ${message}</p>`;
                                                html += `<a href="${((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}account#/projects/${projectId}/messages?note-id=${noteId}">Click here</a>`;
                                                html += `<p>Date:<br>${moment().format('LLL')}</p>`;
                                                const mailOptions = {
                                                    from: '"no-reply" <no-reply@c_cfo.com>',
                                                    to: `${emailAddress}`,
                                                    subject: '[CLOUD-CFO]',
                                                    html: html
                                                };
                                                global.emailtransport(mailOptions);
                                            }
                                            mapCallback(null)
                                        }, () => {
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
                                                req.app.parent.io.emit('FRONT_NEW_NOTE', {
                                                    ...responseObj,
                                                    isStarred: 0
                                                });
                                                return {
                                                    ...responseObj,
                                                    isStarred: 0
                                                }
                                            }).then((resultArray) => {
                                                cb({ status: true, data: resultArray });
                                            });
                                        })
                                    })
                            })
                    })
            });
        }).on('error', function (err) {
            cb({ status: false, error: "Upload error. Please try again later." });
        });

        form.parse(req);
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
            notification: (parallelCallback) => {
                try {
                    if (body.reminderList.length === 0) {
                        let whereObj = {
                            linkType: bodyData.linkType,
                            linkId: bodyData.linkId
                        }
                        Users.findOne({
                            where: {
                                id: body.userId
                            }
                        }).then(async (o) => {
                            const sender = o.toJSON();
                            const receiver = await Conversation.findAll({
                                where: whereObj,
                                include: [
                                    {
                                        model: Users,
                                        as: 'users',
                                        where: { id: { [Op.notIn]: [...body.reminderList, body.userId] } },
                                    }
                                ],
                                group: ['users.id']
                            }).map((response) => {
                                return response.toJSON().users.id;
                            }).then((response) => {
                                return response;
                            })

                            UsersNotificationSetting
                                .findAll({
                                    where: { usersId: receiver },
                                    include: [{
                                        model: Users,
                                        as: 'notification_setting',
                                        required: false
                                    }]
                                })
                                .map((response) => {
                                    return response.toJSON()
                                })
                                .then(async (response) => {
                                    let message = "";
                                    let notificationArr = [];

                                    if (bodyData.linkType === "task") {
                                        const task = await Tasks.findOne({
                                            include: {
                                                model: Workstream,
                                                as: 'workstream'
                                            },
                                            where: {
                                                id: bodyData.linkId
                                            }
                                        }).then((o) => {
                                            const oObj = o.toJSON();
                                            return oObj;
                                        });
                                        message = `${sender.firstName + " " + sender.lastName} replies to a comment on the task ${task.task} under ${task.workstream.workstream} workstream.`;

                                        notificationArr = await _.filter(response, (nSetting) => {
                                            return nSetting.messageSend === 1
                                        }).map((nSetting) => {
                                            const { emailAddress } = { ...nSetting.notification_setting }
                                            return {
                                                createdBy: sender.id,
                                                usersId: nSetting.usersId,
                                                projectId: task.projectId,
                                                taskId: task.id,
                                                conversationId: conversation.id,
                                                workstreamId: task.workstreamId,
                                                type: "commentReplies",
                                                message: message,
                                                emailAddress: emailAddress,
                                                receiveEmail: nSetting.receiveEmail
                                            }
                                        })
                                    } else if (bodyData.linkType === "document") {
                                        message = `Replies to a comment.`;

                                        notificationArr = await _.filter(response, (nSetting) => {
                                            return nSetting.messageSend === 1
                                        }).map((nSetting) => {
                                            const { emailAddress } = { ...nSetting.notification_setting }

                                            return {
                                                usersId: nSetting.usersId,
                                                projectId: body.projectId,
                                                createdBy: sender.id,
                                                documentId: bodyData.linkId,
                                                type: "commentReplies",
                                                message: message,
                                                emailAddress: emailAddress,
                                                receiveEmail: nSetting.receiveEmail
                                            }
                                        })
                                    }

                                    Notification
                                        .bulkCreate(notificationArr)
                                        .map((notificationRes) => {
                                            return notificationRes.id
                                        })
                                        .then((notificationRes) => {
                                            Notification
                                                .findAll({
                                                    where: { id: notificationRes },
                                                    include: [
                                                        {
                                                            model: Users,
                                                            as: 'to',
                                                            required: false,
                                                            attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                        },
                                                        {
                                                            model: Users,
                                                            as: 'from',
                                                            required: false,
                                                            attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                        },
                                                        {
                                                            model: Projects,
                                                            as: 'project_notification',
                                                            required: false,
                                                            include: [{
                                                                model: Type,
                                                                as: 'type',
                                                                required: false,
                                                                attributes: ["type"]
                                                            }]
                                                        },
                                                        {
                                                            model: Document,
                                                            as: 'document_notification',
                                                            required: false,
                                                            attributes: ["origin"]
                                                        },
                                                        {
                                                            model: Workstream,
                                                            as: 'workstream_notification',
                                                            required: false,
                                                            attributes: ["workstream"]
                                                        },
                                                        {
                                                            model: Tasks,
                                                            as: 'task_notification',
                                                            required: false,
                                                            attributes: ["task"]
                                                        },
                                                        {
                                                            model: Conversation,
                                                            as: 'conversation_notification',
                                                            required: false

                                                        }
                                                    ]
                                                })
                                                .map((findNotificationRes) => {
                                                    req.app.parent.io.emit('FRONT_NOTIFICATION', {
                                                        ...findNotificationRes.toJSON()
                                                    })
                                                    return findNotificationRes.toJSON()
                                                })
                                                .then(() => {
                                                    async.map(notificationArr, ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                        if (receiveEmail === 1) {
                                                            let html = '<p>' + message + '</p>';
                                                            html += '<p style="margin-bottom:0">Title: ' + message + '</p>';
                                                            // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                            html += `<p>Message:<br><strong>${sender.firstName}  ${sender.lastName} </strong> ${message}</p>`;
                                                            html += ` <a href="${((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                            html += `<p>Date:<br>${moment().format('LLL')}</p>`;

                                                            const mailOptions = {
                                                                from: '"no-reply" <no-reply@c_cfo.com>',
                                                                to: `${emailAddress}`,
                                                                subject: '[CLOUD-CFO]',
                                                                html: html
                                                            };
                                                            global.emailtransport(mailOptions);
                                                        }
                                                        mapCallback(null)
                                                    }, (err) => {
                                                        parallelCallback(null);
                                                    })
                                                })
                                        })
                                })
                        })
                    }else{
                        parallelCallback(null);
                    }

                } catch (err) {
                    console.error(err)
                }
            },
            mentionedNotification: (parallelCallback) => {
                const receiver = _.filter(body.reminderList, (o) => { return o !== body.userId })
                try {
                    if (receiver.length > 0) {
                        Users.findOne({
                            where: {
                                id: body.userId
                            }
                        }).then(async (o) => {
                            const sender = o.toJSON();

                            UsersNotificationSetting
                                .findAll({
                                    where: { usersId: receiver },
                                    include: [{
                                        model: Users,
                                        as: 'notification_setting',
                                        required: false
                                    }]
                                })
                                .map((response) => {
                                    return response.toJSON()
                                })
                                .then(async (response) => {
                                    let message = "";
                                    let notificationArr = [];

                                    if (bodyData.linkType === "task") {
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
                                        message = `metioned you on the task ${task.task} under ${task.workstream.workstream} workstream.`;

                                        notificationArr = await _.filter(response, (nSetting) => {
                                            return nSetting.messageSend === 1
                                        }).map((nSetting) => {
                                            const { emailAddress } = { ...nSetting.notification_setting }

                                            return {
                                                usersId: nSetting.usersId,
                                                projectId: task.projectId,
                                                createdBy: sender.id,
                                                taskId: task.id,
                                                workstreamId: task.workstreamId,
                                                type: "taskTagged",
                                                message: message,
                                                emailAddress: emailAddress,
                                                receiveEmail: nSetting.receiveEmail
                                            }
                                        })
                                    } else if (bodyData.linkType === "document") {
                                        message = `metioned you on a comment.`;

                                        notificationArr = await _.filter(response, (nSetting) => {
                                            return nSetting.messageSend === 1
                                        }).map((nSetting) => {
                                            const { emailAddress } = { ...nSetting.notification_setting }

                                            return {
                                                usersId: nSetting.usersId,
                                                projectId: body.projectId,
                                                createdBy: sender.id,
                                                documentId: bodyData.linkId,
                                                type: "taskTagged",
                                                message: message,
                                                emailAddress: emailAddress,
                                                receiveEmail: nSetting.receiveEmail
                                            }
                                        })
                                    }

                                    Notification
                                        .bulkCreate(notificationArr)
                                        .map((notificationRes) => {
                                            return notificationRes.id
                                        })
                                        .then((notificationRes) => {
                                            Notification
                                                .findAll({
                                                    where: { id: notificationRes },
                                                    include: [
                                                        {
                                                            model: Users,
                                                            as: 'to',
                                                            required: false,
                                                            attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                        },
                                                        {
                                                            model: Users,
                                                            as: 'from',
                                                            required: false,
                                                            attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                        },
                                                        {
                                                            model: Projects,
                                                            as: 'project_notification',
                                                            required: false,
                                                            include: [{
                                                                model: Type,
                                                                as: 'type',
                                                                required: false,
                                                                attributes: ["type"]
                                                            }]
                                                        },
                                                        {
                                                            model: Document,
                                                            as: 'document_notification',
                                                            required: false,
                                                            attributes: ["origin"]
                                                        },
                                                        {
                                                            model: Workstream,
                                                            as: 'workstream_notification',
                                                            required: false,
                                                            attributes: ["workstream"]
                                                        },
                                                        {
                                                            model: Tasks,
                                                            as: 'task_notification',
                                                            required: false,
                                                            attributes: ["task"]
                                                        },
                                                    ]
                                                })
                                                .map((findNotificationRes) => {
                                                    req.app.parent.io.emit('FRONT_NOTIFICATION', {
                                                        ...findNotificationRes.toJSON()
                                                    })
                                                    return findNotificationRes.toJSON()
                                                })
                                                .then(() => {
                                                    async.map(notificationArr, ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                        if (receiveEmail === 1) {
                                                            let html = '<p>' + message + '</p>';
                                                            html += '<p style="margin-bottom:0">Title: ' + message + '</p>';
                                                            // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                            html += `<p>Message:<br><strong>${sender.firstName}  ${sender.lastName} </strong> ${message}</p>`;
                                                            html += ` <a href="${((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                            html += `<p>Date:<br>${moment().format('LLL')}</p>`;

                                                            const mailOptions = {
                                                                from: '"no-reply" <no-reply@c_cfo.com>',
                                                                to: `${emailAddress}`,
                                                                subject: '[CLOUD-CFO]',
                                                                html: html
                                                            };
                                                            global.emailtransport(mailOptions);
                                                        }
                                                        mapCallback(null)
                                                    }, () => {
                                                        parallelCallback(null);
                                                    })
                                                })
                                        })
                                })
                        })
                    } else {
                        parallelCallback(null);
                    }
                } catch (err) {
                    console.error(err)
                }
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
        const formidable = global.initRequire("formidable");
        const func = global.initFunc();
        const projectId = req.query.projectId;
        const filesStack = [];
        let form = new formidable.IncomingForm();
        let type = "upload";
        let bodyField = "";
        form.multiples = true;
        form.on('field', function (name, field) {
            bodyField = field;
        }).on('file', function (field, file) {
            const date = new Date();
            const id = func.generatePassword(date.getTime() + file.name, "attachment");
            const filename = id + (file.name).replace(/[^\w.]|_/g, "_");

            filesStack.push({
                id,
                file: file,
                form: type,
                filename: filename
            });
        }).on('end', async () => {
            const body = _.omit(JSON.parse(bodyField), ["files"]);

            async.parallel({
                conversation: (parallelCallback) => {
                    try {
                        Conversation
                            .create(body)
                            .then((res) => {
                                const responseObj = res.toJSON();
                                if (filesStack.length > 0) {
                                    async.map(filesStack, (fileObj, mapCallback) => {
                                        func.uploadFile(_.omit(fileObj, ['id']), response => {
                                            if (response.Message == 'Success') {
                                                mapCallback(null, {
                                                    filename: fileObj.filename,
                                                    origin: fileObj.file.name,
                                                    Id: fileObj.id,
                                                    userId: body.usersId
                                                })
                                            } else {
                                                mapCallback(esponse.Message)
                                            }
                                        });
                                    }, async (err, results) => {
                                        const newDocs = _.map(results, ({ filename, origin, userId }) => {
                                            return {
                                                name: filename,
                                                origin,
                                                uploadedBy: userId,
                                                type: 'document',
                                                status: 'new'
                                            };
                                        });
                                        const documentUpload = await Document.bulkCreate(newDocs).map((o) => { return o.toJSON() });
                                        const documentUploadResult = await _.map((documentUpload), ({ id }) => { return { documentId: id, linkType: 'project', linkId: projectId } });
                                        DocumentLink.bulkCreate(documentUploadResult).map((o) => { return o.toJSON() });

                                        const workstreamTag = _(documentUpload)
                                            .map(({ id }) => {
                                                return {
                                                    linkType: "workstream",
                                                    linkId: body.workstreamId,
                                                    tagType: "document",
                                                    tagTypeId: id
                                                }
                                            })
                                            .value();

                                        const conversationTag = _(documentUpload)
                                            .map(({ id }) => {
                                                return {
                                                    linkType: "conversation",
                                                    linkId: responseObj.id,
                                                    tagType: "document",
                                                    tagTypeId: id
                                                }
                                            })
                                            .value();

                                        Tag.bulkCreate([...conversationTag, ...workstreamTag]).then((o) => {
                                            parallelCallback(null, responseObj)
                                        });
                                    });
                                } else {
                                    parallelCallback(null, responseObj)
                                }
                            });
                    } catch (e) {
                        parallelCallback(e);
                    }
                },
                members: (parallelCallback) => {
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
                        .map((o) => { return { ...o.toJSON(), member_type: "old" }; })
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
                                        return { ...response.toJSON(), member_type: "new" };
                                    }).then((response) => {
                                        parallelCallback(null, { new_members: response, removed_members: responseArray });
                                    });
                            } else {
                                parallelCallback(null, { new_members: [], removed_members: responseArray });
                            }
                        });
                },

            }, (err, { conversation, members }) => {
                Conversation
                    .findOne({
                        where: {
                            id: conversation.id
                        },
                        include: [
                            {
                                model: Tag,
                                as: 'conversationDocuments',
                                attributes: ['id'],
                                where: {
                                    linkType: "conversation",
                                    tagType: "document",
                                    isDeleted: 0
                                },
                                required: false,
                                include: [{
                                    model: Document,
                                    as: 'document',
                                    include: [{
                                        model: DocumentRead,
                                        as: 'document_read',
                                        attributes: ['id'],
                                        required: false
                                    },
                                    {
                                        model: Users,
                                        as: 'user',
                                        attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
                                    }],
                                    where: {
                                        isDeleted: 0
                                    },
                                    required: false
                                }]
                            },
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
                    }).then(async (res) => {
                        const responseObj = res.toJSON();
                        const sender = await Users.findOne({
                            where: {
                                id: body.usersId
                            }
                        }).then((o) => {
                            const responseObj = o.toJSON();
                            return responseObj;
                        })

                        const receiver = _.filter(body.users, (usersObj) => {
                            return usersObj.value !== sender.id
                        }).map((usersObj) => { return usersObj.value })

                        const memberUser = _.map([
                            ...members.new_members,
                            ...members.removed_members
                        ], ({ linkId, member_type }) => { return { linkId, member_type } });

                        UsersNotificationSetting
                            .findAll({
                                where: { usersId: receiver },
                                include: [{
                                    model: Users,
                                    as: 'notification_setting',
                                    required: false
                                }]
                            })
                            .map((response) => {
                                return response.toJSON()
                            })
                            .then((response) => {
                                const notificationArr = _.filter(response, (nSetting) => {
                                    return nSetting.messageSend === 1
                                }).map((nSetting) => {
                                    return {
                                        usersId: nSetting.usersId,
                                        projectId: projectId,
                                        createdBy: sender.id,
                                        noteId: responseObj.linkId,
                                        conversationId: responseObj.id,
                                        workstreamId: responseObj.conversationNotes.noteWorkstream.id,
                                        type: "messageSend",
                                        message: "Sent you a new message",
                                        emailAddress: nSetting.notification_setting.emailAddress,
                                        receiveEmail: nSetting.receiveEmail
                                    }
                                })

                                Notification
                                    .bulkCreate(notificationArr)
                                    .map((notificationRes) => {
                                        return notificationRes.id
                                    })
                                    .then((notificationRes) => {
                                        Notification
                                            .findAll({
                                                where: { id: notificationRes },
                                                include: [
                                                    {
                                                        model: Users,
                                                        as: 'to',
                                                        required: false,
                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                    },
                                                    {
                                                        model: Users,
                                                        as: 'from',
                                                        required: false,
                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                    },
                                                    {
                                                        model: Projects,
                                                        as: 'project_notification',
                                                        required: false,
                                                        include: [{
                                                            model: Type,
                                                            as: 'type',
                                                            required: false,
                                                            attributes: ["type"]
                                                        }]
                                                    },
                                                    {
                                                        model: Document,
                                                        as: 'document_notification',
                                                        required: false,
                                                        attributes: ["origin"]
                                                    },
                                                    {
                                                        model: Workstream,
                                                        as: 'workstream_notification',
                                                        required: false,
                                                        attributes: ["workstream"]
                                                    },
                                                    {
                                                        model: Notes,
                                                        as: 'note_notification',
                                                        required: false,
                                                        include: NotesInclude,
                                                    },
                                                    {
                                                        model: Conversation,
                                                        as: 'conversation_notification',
                                                        required: false
                                                    }
                                                ]
                                            })
                                            .map((findNotificationRes) => {
                                                req.app.parent.io.emit('FRONT_NOTIFICATION', {
                                                    ...findNotificationRes.toJSON()
                                                })
                                                return findNotificationRes.toJSON()
                                            })
                                            .then(() => {
                                                async.map(notificationArr, ({ emailAddress, message, receiveEmail, noteId }, mapCallback) => {
                                                    if (receiveEmail === 1) {
                                                        let html = '<p>' + message + '</p>';
                                                        html += '<p style="margin-bottom:0">Title: ' + message + '</p>';
                                                        // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                        html += `<p>Message:<br><strong>${sender.firstName}  ${sender.lastName}</strong> ${message}</p>`;
                                                        html += `<a href="${((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}account#/projects/${projectId}/messages?note-id=${noteId}">Click here</a>`;
                                                        html += `<p>Date:<br>${moment().format('LLL')}</p>`;

                                                        const mailOptions = {
                                                            from: '"no-reply" <no-reply@c_cfo.com>',
                                                            to: `${emailAddress}`,
                                                            subject: '[CLOUD-CFO]',
                                                            html: html
                                                        };
                                                        global.emailtransport(mailOptions);
                                                    }
                                                    mapCallback(null)
                                                }, () => {
                                                    req.app.parent.io.emit('FRONT_COMMENT_LIST', { result: responseObj, members: memberUser });
                                                    cb({ status: true, data: responseObj });

                                                })
                                            })
                                    })
                            })
                    })
            });
        }).on('error', function (err) {
            cb({ status: false, error: "Upload error. Please try again later." });
        });

        form.parse(req);
    },
    seen: async (req, cb) => {
        const body = req.body;
        const conversationList = await Conversation
            .findAll({
                where: {
                    linkType: 'notes',
                    linkId: body.noteId,
                    id: {
                        [Op.notIn]: sequelize.literal(`(SELECT DISTINCT linkId FROM notes_last_seen WHERE userId=${body.usersId})`)
                    }
                }
            }).map((mapObject) => {
                return mapObject.toJSON();
            });
        if (conversationList.length > 0) {
            const seenStack = _.map(conversationList, ({ id }) => {
                return {
                    projectId: body.projectId,
                    linkType: "conversation",
                    linkId: id,
                    userId: body.usersId
                }
            });

            NotesLastSeen.bulkCreate(seenStack).map((o) => {
                return o.toJSON();
            }).then((o) => {
                cb({ status: true, data: o });
            });

        } else {
            cb({ status: true, data: [] });
        }
    }
}

exports.put = {
    index: (req, cb) => {
        const body = req.body;
        const conversationId = req.params.id;
        Notes.update(body, { where: { id: conversationId } }).then((response) => {

            Notes.findOne({
                where: {
                    id: conversationId
                }
            }).then((o) => {
                cb({ status: true, data: o.toJSON() })
            })
        });
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