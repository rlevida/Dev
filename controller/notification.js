const Sequelize = require("sequelize")
const models = require('../modelORM');
const {
    Notification,
    Users,
    Workstream,
    Tasks,
    Document
} = models;

exports.get = {
    index: (req, cb) => {
        const queryString = req.query
        const whereObj = {
            ...(typeof queryString.usersId != "undefined" && queryString.usersId != "") ? { usersId: parseInt(queryString.usersId) } : {},
        };

        try {
            Notification
                .findAll({
                    where: whereObj,
                    logging:true,
                    include: [
                        {
                            model: Users,
                            as: 'to',
                            required: false,
                            attributes: ["emailAddress", "firstName", "lastName"]
                        },
                        {
                            model: Users,
                            as: 'from',
                            required: false,
                            attributes: ["emailAddress", "firstName", "lastName"]
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
                .then((res) => {
                    cb({ status: true, data: res })
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
        try {
            Notification
                .update({ seen: 1 }, { where: { id: id } })
                .then((res) => {
                    Notification
                        .findOne({ where: { id: id } })
                        .then((findRes) => {
                            cb({ status: true, data: findRes })
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