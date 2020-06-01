const async = require("async");
const socketIo = global.socketIo();
const models = require("../modelORM");
const {
    Notes,
    Members,
    NotesLastSeen,
    Tag,
    Tasks,
    Workstream,
    Conversation,
    Users,
    Document,
    DocumentRead,
    DocumentLink,
    Projects,
    Starred,
    sequelize,
    Sequelize,
    ActivityLogsDocument
} = models;
const Op = Sequelize.Op;

const sendNotification = require("./sendNotification");
const notificationService = require('../service/NotificationService');

const NotesInclude = [
    {
        model: Tag,
        where: {
            linkType: "task",
            tagType: "notes"
        },
        as: "notesTagTask",
        required: false,
        include: [
            {
                model: Tasks,
                as: "tagTask"
            }
        ]
    },
    {
        model: Workstream,
        as: "noteWorkstream"
    },
    {
        model: Tag,
        where: {
            linkType: "notes",
            tagType: "document"
        },
        as: "documentTags",
        required: false,
        include: [
            {
                model: Document,
                as: "document",
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: ["id", "firstName", "lastName", "emailAddress"]
                    }
                ]
            }
        ]
    },
    {
        model: Conversation,
        where: {
            linkType: "notes"
        },
        as: "comments",
        required: false,
        include: [
            {
                model: Users,
                as: "users",
                attributes: ["id", "firstName", "lastName", "emailAddress"]
            }
        ]
    },
    {
        model: Users,
        as: "creator",
        required: false,
        attributes: ["id", "firstName", "lastName", "emailAddress"]
    }
];

exports.get = {
    conversationNotes: async (req, cb) => {
        const queryString = req.query;
        const limit = 10;
        const getAssociation = [
            {
                model: Workstream,
                as: "noteWorkstream",
                include: [
                    {
                        model: Projects,
                        as: "project"
                    }
                ]
            },
            {
                model: Tag,
                as: "notesTagTask",
                required: false,
                where: {
                    linkType: "user",
                    tagType: "notes",
                    isDeleted: 0
                },
                include: [
                    {
                        model: Users,
                        as: "user"
                    }
                ]
            }
        ];

        let taggedUser = [];
        let conversationQuery = "";
        let taggedUserQuery = "";

        if (typeof queryString.userId && queryString.userId != "") {
            taggedUser = await Tag.findAll({
                where: {
                    tagType: "notes",
                    linkType: "user",
                    linkId: queryString.userId,
                    isDeleted: 0
                }
            }).map(o => {
                return o.toJSON();
            });
        }
        if (typeof queryString.message !== "undefined" && queryString.message !== "") {
            taggedUserQuery = "(";
            taggedUserQuery += `SELECT tagTypeId from tag where linkType = "user" AND linkId=${queryString.userId} AND tagType = "notes" AND tagTypeId IN ( SELECT DISTINCT notes.id FROM notes LEFT JOIN conversation on notes.id = conversation.linkId WHERE conversation.linkType = "notes" AND LOWER(conversation.comment) LIKE LOWER('%${queryString.message}%'))`;
            taggedUserQuery += ")";

            conversationQuery = "(";
            conversationQuery += `SELECT DISTINCT notes.id FROM notes LEFT JOIN conversation on notes.id = conversation.linkId WHERE conversation.linkType = "notes" AND LOWER(conversation.comment) LIKE LOWER('%${queryString.message}%')`;
            conversationQuery += ")";
        }

        const whereObj = {
            ...(typeof queryString.projectId !== "undefined" && queryString.projectId !== "" ? { projectId: queryString.projectId } : {}),
            ...(typeof queryString.workstreamId !== "undefined" && queryString.workstreamId !== "" ? { workstreamId: queryString.workstreamId } : {}),
            ...(typeof queryString.title !== "undefined" && queryString.title !== "undefined"
                ? {
                    [Op.or]: [
                        {
                            [Op.and]: [
                                {
                                    [Sequelize.Op.or]: [
                                        Sequelize.where(Sequelize.fn("lower", Sequelize.col("notes.note")), {
                                            [Op.like]: sequelize.fn("lower", `%${queryString.title}%`)
                                        })
                                    ]
                                },
                                {
                                    id: _.map(taggedUser, ({ tagTypeId }) => {
                                        return tagTypeId;
                                    })
                                }
                            ]
                        },
                        {
                            [Op.and]: [
                                {
                                    id: {
                                        [Sequelize.Op.in]: Sequelize.literal(conversationQuery)
                                    }
                                },
                                {
                                    id: {
                                        [Sequelize.Op.in]: Sequelize.literal(taggedUserQuery)
                                    }
                                }
                            ]
                        }
                    ]
                }
                : {}),
            ...(typeof queryString.userId && queryString.userId != "" && !queryString.message
                ? {
                    id: _.map(taggedUser, ({ tagTypeId }) => {
                        return tagTypeId;
                    })
                }
                : {})
        };
        if (typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "") {
            getAssociation.push({
                model: Starred,
                as: "notes_starred",
                where: {
                    linkType: "notes",
                    isActive: 1,
                    usersId: queryString.starredUser,
                    isDeleted: 0
                },
                required: false,
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: ["id", "firstName", "lastName", "emailAddress"]
                    }
                ]
            });
        }
        const options = {
            include: getAssociation,
            order: [["dateUpdated", "DESC"]],
            ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {})
        };

        async.parallel(
            {
                count: function (callback) {
                    try {
                        Notes.findAndCountAll({ ..._.omit(options, ["offset", "limit"]), where: whereObj, distinct: true }).then(response => {
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
                result: function (callback) {
                    try {
                        Notes.findAll({
                            ...options,
                            where: whereObj
                        })
                            .map(mapObject => {
                                const responseObj = mapObject.toJSON();
                                return {
                                    ...responseObj,
                                    isStarred: typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "" && responseObj.notes_starred.length > 0 ? responseObj.notes_starred[0].isActive : 0
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
            function (err, results) {
                if (err != null) {
                    cb({ status: false, error: err });
                } else {
                    cb({ status: true, data: results });
                }
            }
        );
    },
    conversationById: async (req, cb) => {
        const queryString = req.query;
        const getAssociation = [
            {
                model: Workstream,
                as: "noteWorkstream",
                include: [
                    {
                        model: Projects,
                        as: "project"
                    }
                ]
            },
            {
                model: Tag,
                as: "notesTagTask",
                required: false,
                where: {
                    linkType: "user",
                    tagType: "notes",
                    isDeleted: 0
                },
                include: [
                    {
                        model: Users,
                        as: "user"
                    }
                ]
            }
        ];

        const whereObj = {
            ...(typeof queryString.noteId !== "undefined" && queryString.noteId !== "" ? { id: queryString.noteId } : {}),
            ...(typeof queryString.projectId !== "undefined" && queryString.projectId !== "" ? { projectId: queryString.projectId } : {}),
            ...(typeof queryString.workstreamId !== "undefined" && queryString.workstreamId !== "" ? { workstreamId: queryString.workstreamId } : {}),
            ...(typeof queryString.title != "undefined" && queryString.title != ""
                ? {
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn("lower", Sequelize.col("notes.note")), {
                            [Op.like]: sequelize.fn("lower", `%${queryString.title}%`)
                        })
                    ]
                }
                : {})
        };

        if (typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "") {
            getAssociation.push({
                model: Starred,
                as: "notes_starred",
                where: {
                    linkType: "notes",
                    isActive: 1,
                    usersId: queryString.starredUser,
                    isDeleted: 0
                },
                required: false,
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: ["id", "firstName", "lastName", "emailAddress"]
                    }
                ]
            });
        }

        const options = {
            include: getAssociation
        };

        const note = await Notes.findOne({
            ...options,
            where: whereObj
        }).then(resultArray => {
            const responseObj = resultArray.toJSON();
            return {
                ...responseObj,
                isStarred: typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "" && responseObj.notes_starred.length > 0 ? responseObj.notes_starred[0].isActive : 0
            };
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
                    as: "conversationDocuments",
                    attributes: ["id"],
                    where: {
                        linkType: "conversation",
                        tagType: "document",
                        isDeleted: 0
                    },
                    required: false,
                    include: [
                        {
                            model: Document,
                            as: "document",
                            include: [
                                {
                                    model: DocumentRead,
                                    as: "document_read",
                                    required: false
                                },
                                {
                                    model: Users,
                                    as: "user",
                                    attributes: ["id", "username", "firstName", "lastName", "avatar"]
                                }
                            ],
                            where: {
                                isDeleted: 0
                            },
                            required: false
                        }
                    ]
                },
                {
                    model: Users,
                    as: "users"
                }
            ],
            ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {}),
            order: [["dateAdded", "DESC"]]
        };
        let whereObj = {
            ...(typeof queryString.linkType !== "undefined" && queryString.linkType !== "" ? { linkType: queryString.linkType } : {}),
            ...(typeof queryString.linkId !== "undefined" && queryString.linkId !== "" ? { linkId: queryString.linkId } : {})
        };

        if (typeof queryString.search !== "undefined" && queryString.search !== "") {
            whereObj = {
                ...whereObj,
                [Op.and]: [
                    Sequelize.where(Sequelize.fn("lower", Sequelize.col("comment")), {
                        [Op.like]: sequelize.fn("lower", `%${queryString.search}%`)
                    })
                ]
            };
        }

        async.parallel(
            {
                count: function (callback) {
                    try {
                        Conversation.findAndCountAll({ ..._.omit(options, ["offset", "limit"]), where: whereObj, distinct: true }).then(response => {
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
                result: function (callback) {
                    try {
                        Conversation.findAll({
                            where: whereObj,
                            ...options
                        })
                            .map(mapObject => {
                                return mapObject.toJSON();
                            })
                            .then(resultArray => {
                                callback(null, resultArray);
                            });
                    } catch (err) {
                        callback(err);
                    }
                }
            },
            function (err, results) {
                if (err != null) {
                    cb({ status: false, error: err });
                } else {
                    cb({ status: true, data: results });
                }
            }
        );
    },
    status: (req, cb) => {
        const queryString = req.query;
        const association = _.cloneDeep(NotesInclude);
        const whereObj = {
            ...(typeof queryString.projectId !== "undefined" && queryString.projectId !== "" ? { projectId: queryString.projectId } : {})
        };

        _.find(association, { as: "comments" }).include.push({
            model: NotesLastSeen,
            as: "seenComments",
            where: {
                linkType: "conversation",
                userId: queryString.userId
            },
            required: false
        });

        Notes.findAll({
            where: whereObj,
            include: association
        })
            .map(res => {
                const responseData = res.toJSON();
                const data = {
                    ...responseData,
                    isSeen: responseData.comments.filter(e => {
                        return e.seenComments.length == 0;
                    }).length
                        ? 0
                        : 1
                };
                return data;
            })
            .then(res => {
                cb({ status: true, data: res });
            });
    }
};

exports.post = {
    message: async (req, cb) => {
        const formidable = global.initRequire("formidable");
        const func = global.initFunc();
        const filesStack = [];
        let form = new formidable.IncomingForm();
        let type = "upload";
        let bodyField = "";

        form.multiples = true;
        form.on("field", function (name, field) {
            bodyField = field;
        })
            .on("file", function (field, file) {
                const date = new Date();
                const id = func.generatePassword(date.getTime() + file.name, "attachment");
                const filename = id + file.name.replace(/[^\w.]|_/g, "_");

                filesStack.push({
                    id,
                    file: file,
                    form: type,
                    filename: filename
                });
            })
            .on("end", async () => {
                const mentionedUsers = JSON.parse(bodyField).mentionedUsers;
                const body = _.omit(JSON.parse(bodyField), ["files", "mentionedUsers"]);
                const userId = [
                    ..._.map(body.users, ({ value }) => {
                        return value;
                    }),
                    body.userId
                ];
                const noteResult = await Notes.create({
                    projectId: body.projectId,
                    workstreamId: body.workstreamId,
                    note: body.title,
                    privacyType: "Private",
                    createdBy: body.userId
                }).then(o => {
                    return o.toJSON();
                });
                const getAssociation = [
                    {
                        model: Conversation,
                        as: "comments",
                        where: {
                            linkType: "notes",
                            isDeleted: 0
                        },
                        include: [
                            {
                                model: Users,
                                as: "users"
                            },
                            {
                                model: Tag,
                                as: "conversationDocuments",
                                attributes: ["id"],
                                where: {
                                    linkType: "conversation",
                                    tagType: "document",
                                    isDeleted: 0
                                },
                                required: false,
                                include: [
                                    {
                                        model: Document,
                                        as: "document",
                                        include: [
                                            {
                                                model: DocumentRead,
                                                as: "document_read",
                                                attributes: ["id"],
                                                required: false
                                            },
                                            {
                                                model: Users,
                                                as: "user",
                                                attributes: ["id", "username", "firstName", "lastName", "avatar"]
                                            }
                                        ],
                                        where: {
                                            isDeleted: 0
                                        },
                                        required: false
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: Workstream,
                        as: "noteWorkstream",
                        include: [
                            {
                                model: Projects,
                                as: "project"
                            }
                        ]
                    },
                    {
                        model: Tag,
                        as: "notesTagTask",
                        required: false,
                        where: {
                            linkType: "user",
                            tagType: "notes",
                            isDeleted: 0
                        },
                        include: [
                            {
                                model: Users,
                                as: "user"
                            }
                        ]
                    }
                ];
                async.parallel(
                    {
                        conversations: parallelCallback => {
                            Conversation.create({
                                comment: body.message,
                                usersId: body.userId,
                                linkType: "notes",
                                linkId: noteResult.id
                            }).then(res => {
                                const responseObj = res.toJSON();
                                NotesLastSeen.create({
                                    projectId: body.projectId,
                                    userId: body.userId,
                                    linkType: "conversation",
                                    linkId: responseObj.id
                                }).then(res => {
                                    if (filesStack.length > 0) {
                                        async.map(
                                            filesStack,
                                            (fileObj, mapCallback) => {
                                                func.uploadFile(_.omit(fileObj, ["id"]), response => {
                                                    if (response.Message == "Success") {
                                                        mapCallback(null, {
                                                            filename: fileObj.filename,
                                                            origin: fileObj.file.name,
                                                            Id: fileObj.id,
                                                            userId: body.userId
                                                        });
                                                    } else {
                                                        mapCallback(esponse.Message);
                                                    }
                                                });
                                            },
                                            async (err, results) => {
                                                const newDocs = _.map(results, ({ filename, origin, userId }) => {
                                                    return {
                                                        name: filename,
                                                        origin,
                                                        uploadedBy: userId,
                                                        type: "document",
                                                        status: "new"
                                                    };
                                                });
                                                const documentUpload = await Document.bulkCreate(newDocs).map(o => {
                                                    return o.toJSON();
                                                });
                                                const documentUploadResult = await _.map(documentUpload, ({ id }) => {
                                                    return { documentId: id, linkType: "project", linkId: body.projectId };
                                                });
                                                DocumentLink.bulkCreate(documentUploadResult).map(o => {
                                                    return o.toJSON();
                                                });

                                                const workstreamTag = _(documentUpload)
                                                    .map(({ id }) => {
                                                        return {
                                                            linkType: "workstream",
                                                            linkId: body.workstreamId,
                                                            tagType: "document",
                                                            tagTypeId: id
                                                        };
                                                    })
                                                    .value();

                                                const conversationTag = _(documentUpload)
                                                    .map(({ id }) => {
                                                        return {
                                                            linkType: "conversation",
                                                            linkId: responseObj.id,
                                                            tagType: "document",
                                                            tagTypeId: id
                                                        };
                                                    })
                                                    .value();

                                                Tag.bulkCreate([...conversationTag, ...workstreamTag]).then(o => {
                                                    parallelCallback(null, responseObj);
                                                });
                                            }
                                        );
                                    } else {
                                        parallelCallback(null, responseObj);
                                    }
                                });
                            });
                        },
                        tags: parallelCallback => {
                            const submitArray = _.map(userId, id => {
                                return {
                                    linkType: "user",
                                    linkId: id,
                                    tagType: "notes",
                                    tagTypeId: noteResult.id
                                };
                            });

                            Tag.bulkCreate(submitArray, { returning: true })
                                .map(response => {
                                    return response.toJSON();
                                })
                                .then(response => {
                                    parallelCallback(null, response);
                                });
                        }
                    },
                    async (err, { conversations }) => {

                        const userFindResult = await Users.findOne({ where: { id: body.userId } });

                        const sender = userFindResult.toJSON();

                        const receiver = body.users.map(e => {
                            return e.value;
                        });

                        await sendNotification({
                            sender: sender,
                            receiver: receiver,
                            notificationType: "messageSend",
                            notificationData: { conversations, note: noteResult },
                            projectId: body.projectId,
                            workstreamId: body.workstreamId
                        });

                        if (mentionedUsers.length > 0) {
                            await sendNotification({
                                sender: sender,
                                receiver: mentionedUsers,
                                notificationType: "messageMentioned",
                                notificationData: { conversations, note: noteResult },
                                projectId: body.projectId,
                                workstreamId: body.workstreamId
                            });
                        }

                        const options = {
                            include: getAssociation,
                            order: [["dateUpdated", "DESC"]]
                        };

                        Notes.findAll({
                            ...options,
                            where: {
                                id: noteResult.id
                            }
                        })
                            .map(mapObject => {
                                const responseObj = mapObject.toJSON();
                                notificationService.enqueue('FRONT_BROADCAST_NEW_NOTE', {
                                    ...responseObj,
                                    isStarred: 0
                                });
                                // socketIo.emit("FRONT_BROADCAST_NEW_NOTE", {
                                //     ...responseObj,
                                //     isStarred: 0
                                // });
                                return {
                                    ...responseObj,
                                    isStarred: 0
                                };
                            })
                            .then(resultArray => {
                                cb({ status: true, data: resultArray });
                            });
                    }
                );
            })
            .on("error", function (err) {
                cb({ status: false, error: "Upload error. Please try again later." });
            });

        form.parse(req);
    },
    comment: async (req, cb) => {
        try {
            const body = req.body;
            const bodyData = body.data;
            const conversation = await Conversation.create({
                comment: bodyData.comment,
                usersId: bodyData.usersId,
                linkType: bodyData.linkType,
                linkId: bodyData.linkId
            }).then(o => {
                const responseObj = o.toJSON();
                return Conversation.findOne({
                    where: {
                        id: responseObj.id
                    },
                    include: [
                        {
                            model: Users,
                            as: "users"
                        }
                    ]
                }).then(res => {
                    return res.toJSON();
                });
            });

            await NotesLastSeen.create({
                projectId: body.projectId,
                userId: bodyData.usersId,
                linkType: "conversation",
                linkId: conversation.id
            })

            /* COMMENT REPLIES NOTIFICATION ( IMPROVE LATER ) */
            const userFindResult = await Users.findOne({ where: { id: req.user.id } });

            const sender = userFindResult.toJSON();
            console.log(`here`)
            const receiver = await Conversation.findAll({
                where: {
                    linkType: bodyData.linkType,
                    linkId: bodyData.linkId,
                    usersId: { [Op.notIn]: [req.user.id] }
                },
                group: ["usersId"]
            }).map(response => {
                return response.toJSON().usersId;
            });

            if (bodyData.linkType === "task") {

                const taskFindResult = await Tasks.findOne({
                    include: {
                        model: Workstream,
                        as: "workstream"
                    },
                    where: {
                        id: bodyData.linkId
                    }
                })

                await sendNotification({
                    sender: sender,
                    receiver: receiver,
                    notificationType: "commentReplies",
                    notificationData: { task: taskFindResult.toJSON(), conversations: conversation },
                    projectId: taskFindResult.toJSON().projectId,
                    workstreamId: taskFindResult.toJSON().workstreamId,
                });
            }

            if (bodyData.linkType === "document") {
                await sendNotification({
                    sender: sender,
                    receiver: receiver,
                    notificationType: "commentReplies",
                    notificationData: { document: { id: bodyData.linkId } },
                    projectId: body.projectId
                });
            }


            /* TAGGED NOTIFICATION ( IMPROVE LATER )*/
            const taggedReceiver = _.filter(body.reminderList, taggedUserId => {
                return taggedUserId !== req.user.id;
            });

            if (taggedReceiver.length > 0) {

                if (bodyData.linkType === "task") {
                    const taskFindResult = await Tasks.findOne({
                        include: {
                            model: Workstream,
                            as: "workstream"
                        },
                        where: {
                            id: bodyData.linkId
                        }
                    })

                    await sendNotification({
                        sender: sender,
                        receiver: taggedReceiver,
                        notificationType: "taskTagged",
                        notificationData: { task: taskFindResult.toJSON() },
                        projectId: taskFindResult.toJSON().projectId,
                        workstreamId: taskFindResult.toJSON().workstreamId
                    });
                }
            }

            /*  Task Comment */
            if (bodyData.linkType === "task") {
                const taskFindResult = await Tasks.findOne({
                    include: [
                        {
                            model: Members,
                            as: "assignee",
                            where: {
                                memberType: 'assignedTo',
                                linkType: 'task',
                                isDeleted: 0,
                            }
                        },
                        {
                            model: Workstream,
                            as: "workstream"
                        }
                    ],
                    where: {
                        id: bodyData.linkId
                    }
                });

                const taskObj = taskFindResult.toJSON();

                const commentReceiver = req.user.id !== taskObj.assignee[0].userTypeLinkId ? taskObj.assignee[0].userTypeLinkId : "";

                if (commentReceiver) {
                    await sendNotification({
                        sender: sender,
                        receiver: commentReceiver,
                        notificationType: "taskAssignedComment",
                        notificationData: { task: taskObj },
                        projectId: body.projectId,
                        workstreamId: taskObj.workstreamId,
                    });
                }
            }

            /* Document Activity log */

            if (bodyData.linkType === "document") {
                const logData = {
                    linkType: bodyData.linkType,
                    linkId: bodyData.linkId,
                    usersId: bodyData.usersId,
                    actionType: "commented",
                    title: "commented on document",
                    projectId: body.projectId
                };
                await ActivityLogsDocument.create(logData);
            }

            cb({ status: true, data: _.omit(conversation, ["dateUpdated"]) });;
        } catch (error) {
            console.error(error);
            cb({ status: false, error: error });
        }
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
        form.on("field", function (name, field) {
            bodyField = field;
        })
            .on("file", function (field, file) {
                const date = new Date();
                const id = func.generatePassword(date.getTime() + file.name, "attachment");
                const filename = id + file.name.replace(/[^\w.]|_/g, "_");

                filesStack.push({
                    id,
                    file: file,
                    form: type,
                    filename: filename
                });
            })
            .on("end", async () => {
                const mentionedUsers = JSON.parse(bodyField).mentionedUsers;
                const body = _.omit(JSON.parse(bodyField), ["files", "mentionedUsers"]);

                async.parallel(
                    {
                        conversation: parallelCallback => {
                            try {
                                Conversation.create(body).then(res => {
                                    const responseObj = res.toJSON();
                                    if (filesStack.length > 0) {
                                        async.map(
                                            filesStack,
                                            (fileObj, mapCallback) => {
                                                func.uploadFile(_.omit(fileObj, ["id"]), response => {
                                                    if (response.Message == "Success") {
                                                        mapCallback(null, {
                                                            filename: fileObj.filename,
                                                            origin: fileObj.file.name,
                                                            Id: fileObj.id,
                                                            userId: body.usersId
                                                        });
                                                    } else {
                                                        mapCallback(esponse.Message);
                                                    }
                                                });
                                            },
                                            async (err, results) => {
                                                const newDocs = _.map(results, ({ filename, origin, userId }) => {
                                                    return {
                                                        name: filename,
                                                        origin,
                                                        uploadedBy: userId,
                                                        type: "document",
                                                        status: "new"
                                                    };
                                                });
                                                const documentUpload = await Document.bulkCreate(newDocs).map(o => {
                                                    return o.toJSON();
                                                });
                                                const documentUploadResult = await _.map(documentUpload, ({ id }) => {
                                                    return { documentId: id, linkType: "project", linkId: projectId };
                                                });
                                                DocumentLink.bulkCreate(documentUploadResult).map(o => {
                                                    return o.toJSON();
                                                });

                                                const workstreamTag = _(documentUpload)
                                                    .map(({ id }) => {
                                                        return {
                                                            linkType: "workstream",
                                                            linkId: body.workstreamId,
                                                            tagType: "document",
                                                            tagTypeId: id
                                                        };
                                                    })
                                                    .value();

                                                const conversationTag = _(documentUpload)
                                                    .map(({ id }) => {
                                                        return {
                                                            linkType: "conversation",
                                                            linkId: responseObj.id,
                                                            tagType: "document",
                                                            tagTypeId: id
                                                        };
                                                    })
                                                    .value();

                                                Tag.bulkCreate([...conversationTag, ...workstreamTag]).then(o => {
                                                    parallelCallback(null, responseObj);
                                                });
                                            }
                                        );
                                    } else {
                                        parallelCallback(null, responseObj);
                                    }
                                });
                            } catch (e) {
                                parallelCallback(e);
                            }
                        },
                        members: parallelCallback => {
                            Tag.findAll({
                                where: {
                                    tagType: "notes",
                                    tagTypeId: body.linkId,
                                    linkType: "user",
                                    linkId: {
                                        [Op.notIn]: [
                                            ..._.map(body.users, ({ value }) => {
                                                return value;
                                            }),
                                            body.usersId
                                        ]
                                    },
                                    isDeleted: 0
                                }
                            })
                                .map(o => {
                                    return { ...o.toJSON(), member_type: "old" };
                                })
                                .then(async responseArray => {
                                    if (responseArray.length > 0) {
                                        await Tag.update(
                                            { isDeleted: 1 },
                                            {
                                                where: {
                                                    tagType: "notes",
                                                    tagTypeId: body.linkId,
                                                    linkType: "user",
                                                    linkId: {
                                                        [Op.in]: _.map(responseArray, o => {
                                                            return o.linkId;
                                                        })
                                                    }
                                                }
                                            }
                                        );
                                    }

                                    const currentMembers = await Tag.findAll({
                                        where: {
                                            tagType: "notes",
                                            tagTypeId: body.linkId,
                                            linkType: "user",
                                            isDeleted: 0
                                        }
                                    }).map(o => {
                                        const responseObj = o.toJSON();
                                        return {
                                            value: responseObj.linkId
                                        };
                                    });

                                    const newMembers = _.differenceBy(body.users, currentMembers, "value");

                                    if (newMembers.length > 0) {
                                        const submitArray = _.map(newMembers, ({ value }) => {
                                            return {
                                                linkType: "user",
                                                linkId: value,
                                                tagType: "notes",
                                                tagTypeId: body.linkId
                                            };
                                        });

                                        Tag.bulkCreate(submitArray, { returning: true })
                                            .map(response => {
                                                return { ...response.toJSON(), member_type: "new" };
                                            })
                                            .then(response => {
                                                parallelCallback(null, { new_members: response, removed_members: responseArray });
                                            });
                                    } else {
                                        parallelCallback(null, { new_members: [], removed_members: responseArray });
                                    }
                                });
                        }
                    },
                    (err, { conversation, members }) => {
                        Conversation.findOne({
                            where: {
                                id: conversation.id
                            },
                            include: [
                                {
                                    model: Tag,
                                    as: "conversationDocuments",
                                    attributes: ["id"],
                                    where: {
                                        linkType: "conversation",
                                        tagType: "document",
                                        isDeleted: 0
                                    },
                                    required: false,
                                    include: [
                                        {
                                            model: Document,
                                            as: "document",
                                            include: [
                                                {
                                                    model: DocumentRead,
                                                    as: "document_read",
                                                    attributes: ["id"],
                                                    required: false
                                                },
                                                {
                                                    model: Users,
                                                    as: "user",
                                                    attributes: ["id", "username", "firstName", "lastName", "avatar"]
                                                }
                                            ],
                                            where: {
                                                isDeleted: 0
                                            },
                                            required: false
                                        }
                                    ]
                                },
                                {
                                    model: Users,
                                    as: "users"
                                },
                                {
                                    model: Notes,
                                    as: "conversationNotes",
                                    include: [
                                        {
                                            model: Workstream,
                                            as: "noteWorkstream",
                                            include: [
                                                {
                                                    model: Projects,
                                                    as: "project"
                                                }
                                            ]
                                        },
                                        {
                                            model: Tag,
                                            as: "notesTagTask",
                                            required: false,
                                            where: {
                                                linkType: "user",
                                                tagType: "notes",
                                                isDeleted: 0
                                            },
                                            include: [
                                                {
                                                    model: Users,
                                                    as: "user"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }).then(async res => {
                            const conversations = res.toJSON();

                            const userFindResult = await Users.findOne({ where: { id: body.usersId } });

                            const sender = userFindResult.toJSON();

                            const receiver = _.filter(body.users, usersObj => {
                                return usersObj.value !== sender.id;
                            }).map(usersObj => {
                                return usersObj.value;
                            });

                            await sendNotification({
                                sender: sender,
                                receiver: receiver,
                                notificationType: "messageSend",
                                notificationData: { conversations, note: { id: conversations.linkId } },
                                projectId: projectId,
                                workstreamId: conversations.conversationNotes.noteWorkstream ? conversations.conversationNotes.noteWorkstream.id : null,
                            });

                            const memberUser = _.map([...members.new_members, ...members.removed_members], ({ linkId, member_type }) => {
                                return { linkId, member_type };
                            });
                            // socketIo.emit("FRONT_BROADCAST_COMMENT_LIST", { result: conversations, members: memberUser });
                            notificationService.enqueue('FRONT_BROADCAST_COMMENT_LIST', { result: conversations, members: memberUser });

                            if (mentionedUsers.length > 0) {
                                await sendNotification({
                                    sender: sender,
                                    receiver: mentionedUsers,
                                    notificationType: "messageMentioned",
                                    notificationData: { conversations, note: { id: conversations.linkId } },
                                    projectId: projectId,
                                    workstreamId: conversations.conversationNotes.noteWorkstream ? conversations.conversationNotes.noteWorkstream.id : null,
                                });
                            }

                            cb({ status: true, data: conversations });
                        });
                    }
                );
            })
            .on("error", function (err) {
                cb({ status: false, error: "Upload error. Please try again later." });
            });

        form.parse(req);
    },
    seen: async (req, cb) => {
        const body = req.body;
        const conversationList = await Conversation.findAll({
            where: {
                linkType: "notes",
                linkId: body.noteId,
                id: {
                    [Op.notIn]: sequelize.literal(`(SELECT DISTINCT linkId FROM notes_last_seen WHERE userId=${body.usersId})`)
                }
            }
        }).map(mapObject => {
            return mapObject.toJSON();
        });
        if (conversationList.length > 0) {
            const seenStack = _.map(conversationList, ({ id }) => {
                return {
                    projectId: body.projectId,
                    linkType: "conversation",
                    linkId: id,
                    userId: body.usersId
                };
            });

            NotesLastSeen.bulkCreate(seenStack)
                .map(o => {
                    return o.toJSON();
                })
                .then(o => {
                    cb({ status: true, data: o });
                });
        } else {
            cb({ status: true, data: [] });
        }
    }
};

exports.put = {
    index: (req, cb) => {
        const body = req.body;
        const conversationId = req.params.id;

        Notes.update(body, { where: { id: conversationId } }).then(response => {
            Notes.findOne({
                where: {
                    id: conversationId
                }
            }).then(o => {
                cb({ status: true, data: o.toJSON() });
            });
        });
    },
    updateConversation: (req, cb) => {
        const body = req.body;
        const conversationId = req.params.id;

        Conversation.update(body, { where: { id: conversationId } }).then(() => {
            Conversation.findOne({
                where: {
                    id: conversationId
                }
            }).then(o => {
                cb({ status: true, data: o.toJSON() });
            });
        });
    }
};

exports.delete = {
    comment: (req, cb) => {
        const tablename = "conversation";
        const model = global.initModel(tablename);
        model.getData(tablename, { id: req.params.id }, {}, b => {
            if (b.data.length > 0) {
                model.deleteData(tablename, { id: req.params.id }, c => {
                    if (c.status) {
                        cb({ status: true, data: { id: req.params.id }, message: "Successfully deleted." });
                    } else {
                        if (c.error) {
                            cb({ status: false, data: { id: 0 }, message: c.error.sqlMessage });
                            return;
                        }

                        cb({ status: false, data: { id: 0 }, message: "Delete failed. Please try again later." });
                    }
                });
            } else {
                cb({ status: true, data: { id: req.params.id }, message: "Successfully deleted." });
            }
        });
    },
    documentTag: (req, cb) => {
        Tag.destroy({
            where: {
                id: req.params.id
            }
        })
            .then(res => {
                cb({ status: true, data: { id: req.params.id } });
            })
            .catch(error => {
                console.error(error);
                cb({ status: false, data: { id: req.params.id } });
            });
    }
};
