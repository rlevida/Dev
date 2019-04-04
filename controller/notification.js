const Sequelize = require("sequelize")
const models = require('../modelORM');
const {
    Notification,
    Users,
    Workstream,
    Tasks
} = models;

exports.get = {
    index: (req, cb) => {
        const queryString = req.query
        const whereObj = {
            ...(typeof queryString.usersId != "undefined" && queryString.usersId != "") ? { usersId: queryString.usersId } : {},
        };
        try {
            Notification
                .findAll({
                    where: whereObj,
                    include: [
                        {
                            model: Users,
                            as: 'user'
                        },
                        {
                            model: Tasks,
                            as: 'task'
                        },
                    ]
                })
                .map((res) => {
                    res.toJSON();
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