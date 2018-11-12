const dbName = "reminder";
// var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")
const Sequelize = require("sequelize")
const models = require('../modelORM');
const {
    Reminder,
    Users,
    Workstream
} = models;

exports.get = {
    index: (req, cb) => {
        const queryString = req.query
        const whereObj = {
            ...(typeof queryString.usersId != "undefined" && queryString.usersId != "") ? { usersId: queryString.usersId } : {},
        };
        try {
            Reminder
                .findAll({
                    where: whereObj,
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
                .map((res) => {
                    const resToReturn = {
                        ...res.dataValues,
                        createdByName: `${res.dataValues.user.firstName} ${res.dataValues.user.lastName}`,
                        workstreamId: res.dataValues.workstream != null ? res.dataValues.workstream.id : ''
                    }
                    return _.omit(resToReturn, "user", "workstream")
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
            Reminder
                .create(body)
                .then((res) => {
                    Reminder
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
                            const resToReturn = {
                                ...res.dataValues,
                                createdByName: `${findRes.dataValues.user.firstName} ${findRes.dataValues.user.lastName}`,
                                workstreamId: findRes.dataValues.workstream.id
                            }

                            cb({ status: true, data: [_.omit(resToReturn, "user", "workstream")] })
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
            Reminder
                .update({ seen: 1 }, { where: { id: id } })
                .then((res) => {
                    Reminder
                        .findOne({ where: { id: id } })

                    cb({})
                })
        } catch (err) {
            console.log(err)
        }
        // defaultPut(dbName,req,(res)=>{
        //     if(res.success){
        //         cb({ status:true, data:res.data })
        //     } else {
        //         cb({ status:false, error:c.error })
        //     }
        // })
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