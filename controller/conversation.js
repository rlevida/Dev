const dbName = "notes";
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")
const sequence = require("sequence").Sequence;
const models = require('../modelORM');
const {
    Notes,
    Tag,
    Tasks,
    Conversation,
    Users,
    Starred
} = models;

const NotesInclude = [
    {
        model: Tag,
        where: {
            linkType: 'task', tagType: 'notes'
        },
        as: 'tag',
        required: false,
        include: [
            {
                model: Tasks,
                as: 'tagTask',
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
        const association = [{
            model: Tag,
            where: {
                linkType: 'task', tagType: 'notes'
            },
            as: 'tag',
            required: false,
            include: [
                {
                    model: Tasks,
                    as: 'tagTask',
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
        }];

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
                        isStarred: (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '' && (responseData.notes_starred).length > 0) ? responseData.notes_starred[0].isActive : 0
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
        let d = req.query
        let conversation = global.initModel("conversation")
        let filter = (typeof d.filter != "undefined") ? JSON.parse(d.filter) : {};
        conversation.getData("conversation", filter, {}, (c) => {
            if (c.status) {
                cb({ status: true, data: c.data })
                // socket.emit("FRONT_COMMENT_LIST",c.data)
            } else {
                cb({ status: false, error: c.error })
                // if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    }
}

exports.post = {
    index: (req, cb) => {
        defaultPost(dbName, req, (res) => {
            if (res.success) {
                Notes.findAll({
                    where: { id: res.data[0].id },
                    include: NotesInclude
                }).then((result)=>{
                    cb({ status:true, data:result })
                })
            } else {
                cb({ status: false, error: res.error })
            }
        })
    },
    comment: (req, cb) => {
        let conversation = global.initModel("conversation")
        let d = req.body;
        sequence.create().then((nextThen) => {
            if (typeof d.data.id != "undefined" && d.data.id != "") {
                cb({ status: false, message: "Data already exist." })
            } else {
                conversation.postData("conversation", d.data, (c) => {
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
    }
}

exports.put = {
    index : (req,cb) => {
        defaultPut(dbName,req,(res)=>{
            if(res.success) {
                Notes.findAll({
                    where: { id: req.params.id },
                    include: NotesInclude
                }).then((result)=>{
                    cb({ status:true, data:result })
                })
            } else {
                cb({ status:false, error:res.error })
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
}