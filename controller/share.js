const sequence = require("sequence").Sequence
const Sequelize = require("sequelize")
const _ = require("lodash")
const Op = Sequelize.Op;
const models = require('../modelORM');
const {
    ActivityLogsDocument,
    Document,
    DocumentLink,
    Tag,
    Workstream,
    Tasks,
    Users,
    UsersRole,
    Share
} = models;

const documentAssociationFindAllStack = [
    {
        model: Tag,
        where: {
            linkType: 'workstream', tagType: 'document'
        },
        as: 'tagDocumentWorkstream',
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
            linkType: 'task', tagType: 'document'
        },
        as: 'tagDocumentTask',
        required: false,
        include: [{
            model: Tasks,
            as: 'tagTask',
        }],
    },
    {
        model: Users,
        as: 'user',
        attributes: ['firstName', 'lastName', 'phoneNumber', 'emailAddress']
    },
    {
        model: Share,
        as: 'share',
        include: [{
            model: Users,
            as: 'user',
            include: [{
                model: UsersRole,
                as: 'user_role',
            }]
        }],
    },
]

exports.get = {
    index: (req, cb) => {
        cb({ status: true, data: [] })
    },
    getById: (req, cb) => {
        cb({ status: true, data: [] })
    }
}

exports.post = {
    index: (req, cb) => {
        let body = req.body
        const { usersId, title, actionType, newDocument, oldDocument, projectId } = body
        const users = JSON.parse(body.users)
        body = _.omit(body, 'usersId', 'title', 'actionType', 'users', 'newDocument', 'oldDocument', 'projectId')

        sequence.create().then((nextThen) => {
            Share
                .destroy({ where: body })
                .then((res) => {
                    nextThen()
                })
        }).then((nextThen) => {
            async.map(users, (e, mapCallback) => {
                try {
                    let dataToSubmit = Object.assign({}, body)
                    dataToSubmit.userTypeLinkId = e.value;
                    dataToSubmit.usersType = 'users';
                    Share
                        .create(dataToSubmit)
                        .then((res) => {
                            mapCallback(null, res)
                        })
                } catch (err) {
                    mapCallback(err)
                }
            }, (err, mapCallbackResult) => {
                if (err) {
                    cb({ status: false, error: err })
                } else {
                    nextThen()
                }
            })
        }).then((nextThen) => {
            const whereObj = {
                ...(typeof body.shareType != 'undefined' && body.shareType != '') ? { type: body.shareType } : {},
                ...(typeof body.shareId != 'undefined' && body.shareId != '') ? { id: body.shareId } : {}
            }
            async.parallel({
                result: (parallelCallback) => {
                    try {
                        Document
                            .findOne({
                                where: whereObj,
                                include: documentAssociationFindAllStack,
                            })
                            .then((res) => {
                                let resToReturn = {
                                    ...res.toJSON(),
                                    tags: res.dataValues.tagDocumentWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                        .concat(res.dataValues.tagDocumentTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })),
                                    members: res.dataValues.share.map((e) => { return e.user }),
                                    share: JSON.stringify(res.dataValues.share.map((e) => { return { value: e.user.id, label: e.user.firstName } }))
                                }
                                parallelCallback(null, _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask"))
                            })
                    } catch (err) {
                        parallelCallback(err)
                    }
                },
                ActivityLogsDocument: (parallelCallback) => {
                    try {
                        let logData = {
                            projectId: projectId,
                            linkType: 'document',
                            linkId: body.shareId,
                            actionType: actionType,
                            usersId: usersId,
                            title: title,
                            old: oldDocument,
                            new: newDocument,
                        }
                        ActivityLogsDocument
                            .create(logData)
                            .then((c) => {
                                ActivityLogsDocument
                                    .findOne({
                                        where: { id: c.id },
                                        include: [{
                                            model: Users,
                                            as: 'user'
                                        }]
                                    })
                                    .then((findRes) => {
                                        parallelCallback(null, [findRes])
                                    })
                            })
                    } catch (err) {
                        parallelCallback(err)
                    }
                }
            }, (err, results) => {
                if (err) {
                    cb({ status: false, error: err })
                } else {
                    cb({ status: true, data: { result: results.result, activityLogs: results.ActivityLogsDocument } })
                }
            })
        })
    }
}

exports.put = {
    index: (req, cb) => {
        cb({ status: true, data: [] })
    }
}

exports.delete = {
    index: (req, cb) => {

        cb({ status: true, data: [] })
    }
}