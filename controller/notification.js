const Sequelize = require("sequelize")
const models = require('../modelORM');
const {
    Notification,
    Users,
    Workstream,
    Tasks,
    Document,
    Notes,
    Conversation,
    Tag,
    Projects
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

const NotificationInclude = [
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

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 10;
        const whereObj = {
            ...(typeof queryString.usersId != "undefined" && queryString.usersId != "") ? { usersId: parseInt(queryString.usersId) } : {},
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "") ? { isDeleted: queryString.isDeleted } : {},
            // ...(typeof queryString.isRead != "undefined" && queryString.isRead != "") ? { isRead: queryString.isRead } : {},
            ...(typeof queryString.isArchived != "undefined" && queryString.isArchived != "") ? { isArchived: queryString.isArchived } : {},
        };
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            order: [['dateAdded', 'DESC']]
        };

        const notesAssociation = [
            {
                model: Conversation,
                as: 'comments',
                required: false
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

        try {
            async.parallel({
                count: (parallelCallback) => {
                    Notification
                        .findAndCountAll({
                            ...options,
                            where: whereObj,
                        })
                        .then((res) => {
                            const pageData = {
                                total_count: res.count,
                                ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (res.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {}
                            }
                            parallelCallback(null, pageData)
                        })
                },
                result: (parallelCallback) => {
                    Notification
                        .findAll({
                            ...options,
                            where: whereObj,
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
                                    required: false
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
                                    include: notesAssociation
                                },
                                {
                                    model: Conversation,
                                    as: 'conversation_notification',
                                    required: false,
                                }

                            ]
                        })
                        .then((res) => {
                            parallelCallback(null, res)
                        })
                }
            }, (err, results) => {
                cb({ status: true, data: results })
            })

        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    count: (req, cb) => {
        const queryString = req.query
        const whereObj = {
            ...(typeof queryString.usersId != "undefined" && queryString.usersId != "") ? { usersId: parseInt(queryString.usersId) } : {},
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "") ? { isDeleted: queryString.isDeleted } : {},
            ...(typeof queryString.isRead != "undefined" && queryString.isRead != "") ? { isRead: queryString.isRead } : {},
        };
        try {
            Notification
                .findAndCountAll({
                    where: whereObj,
                })
                .then((res) => {
                    cb({ status: true, data: { count: res.count } })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.post = {
    index: (req, cb) => {
        const body = req.body
        try {
            Notification
                .create(body)
                .then((res) => {
                    Notification
                        .findOne({
                            where: { id: res.dataValues.id },
                            include: [
                                {
                                    model: Users,
                                    as: 'user'
                                },
                                {
                                    model: Workstream,
                                    as: 'workstream'
                                }
                            ]
                        })
                        .then((findRes) => {

                            cb({ status: true, data: findRes })
                        })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.put = {
    index: (req, cb) => {
        const id = req.params.id
        const body = req.body
        const notificationStack = _.cloneDeep(NotificationInclude)
        try {
            Notification
                .update(body, { where: { id: id } })
                .then((res) => {
                    Notification
                        .findOne({
                            where: { id: id },
                            include: notificationStack
                        })
                        .then((findRes) => {
                            cb({ status: true, data: findRes })
                        })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    archive: (req, cb) => {
        const id = req.params.id.split(",");
        const body = req.body;
        const queryString = req.query;
        const limit = 10;
        const notificationStack = _.cloneDeep(NotificationInclude);
        const whereObj = {
            ...(typeof queryString.usersId != "undefined" && queryString.usersId != "") ? { usersId: parseInt(queryString.usersId) } : {},
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "") ? { isDeleted: queryString.isDeleted } : {},
            ...(typeof queryString.isRead != "undefined" && queryString.isRead != "") ? { isRead: queryString.isRead } : {},
            ...(typeof queryString.isArchived != "undefined" && queryString.isArchived != "") ? { isArchived: queryString.isArchived } : {},
        };

        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            order: [['dateUpdated', 'DESC'], ['isRead', 'DESC']]
        };

        try {
            Notification
                .update(body, { where: { id: id } })
                .then((res) => {
                    async.parallel({
                        count: (parallelCallback) => {
                            Notification
                                .findAndCountAll({
                                    ...options,
                                    where: whereObj,
                                })
                                .then((res) => {
                                    const pageData = {
                                        total_count: res.count,
                                        ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (res.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {}
                                    }
                                    parallelCallback(null, pageData)
                                })
                        },
                        result: (parallelCallback) => {
                            Notification
                                .findAll({
                                    ...options,
                                    where: whereObj,
                                    include: notificationStack

                                })
                                .then((res) => {
                                    parallelCallback(null, res)
                                })
                        }
                    }, (err, results) => {
                        cb({ status: true, data: results })
                    })

                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.delete = {
    index: (req, cb) => {
        // defaultDelete(dbName,req,(res)=>{
        //     if(res.success){
        //         cb({ status:true, data:res.data })
        //     } else {
        //         cb({ status:false, error:res.error })
        //     }
        // })
    }
}