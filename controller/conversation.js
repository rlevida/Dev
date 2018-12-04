const dbName = "notes";
const async = require('async')
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")
const sequence = require("sequence").Sequence;
const Sequelize = require("sequelize")
const Op = Sequelize.Op;
const models = require('../modelORM');
const {
    Notes,
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
            }
        ]
    },
    {
        model: Users,
        as: 'creator',
        required: false,
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

        try {
            Notes
                .findAll({
                    include: association
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
                })
                .then((res) => {
                    cb({ status: true, data: res })
                });
        } catch (err) {
            cb({ status: false, error: err })
        }
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

        Conversation
            .findAll({
                where: whereObj,
                include: [
                    {
                        model: Users,
                        as: 'users',
                    }
                ]
            })
            .then((res) => {
                cb({ status: true, data: res })
            })
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
    comment: (req, cb) => {
        let d = req.body;
        sequence.create().then((nextThen) => {
            if (typeof d.data.id != "undefined" && d.data.id != "") {
                cb({ status: false, message: "Data already exist." })
            } else {
                Conversation
                    .create(d.data)
                    .then((c) => {
                        Conversation.findAll({
                            where: { id: c.id },
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
            }
        }).then((nextThen, result) => {
            if (JSON.parse(d.reminderList).length) {
                async.map(JSON.parse(d.reminderList), (r, mapCallback) => {
                    async.parallel({
                        reminder: (parallelCallback) => {
                            let data = {
                                usersId: r.userId,
                                linkType: "task",
                                linkId: d.taskId,
                                type: 'Tag in Comment',
                                detail: `${d.username} metioned you on the task ${d.task} on ${d.workstream}`,
                                projectId: d.projectId,
                                createdBy: d.userId
                            }

                            Reminder
                                .create(data)
                                .then((res) => {
                                    Reminder
                                        .findAll({
                                            where: { usersId: r.userId, seen: 0 }
                                        })
                                        .then((findRes) => {
                                            parallelCallback(null, findRes)
                                        })
                                })
                        },
                        email: (parallelCallback) => {
                            const emailAddress = d.taskMembers.filter((e) => { return e.id == r.userId })[0].emailAddress
                            const mailOptions = {
                                from: '"no-reply" <no-reply@c_cfo.com>',
                                to: `${emailAddress}`,
                                subject: '[CLOUD-CFO]',
                                html: `<p>${d.username} metioned you on the task
                                            <a href="${ ((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}project/${d.projectId}/workstream/${d.workstreamId}?task=${d.taskId}" style="color:red">${d.task}</a>
                                            on ${d.workstream} 
                                        </p>`
                            }
                            global.emailtransport(mailOptions)
                            parallelCallback(null, '')
                        }
                    }, (err, { reminder }) => {
                        mapCallback(null, reminder)
                    })

                }, (err, mapCallbackResult) => {
                    socketIo.emit("BROADCAST_SOCKET", { type: "FRONT_REMINDER_LIST", data: mapCallbackResult[0] })
                    cb({ status: true, data: result })
                })
            } else {
                cb({ status: true, data: result })
            }
        })
    },
    notesTag: {

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