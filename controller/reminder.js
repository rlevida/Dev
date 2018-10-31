const dbName = "reminder";
// var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")
const Sequelize = require("sequelize")
const models = require('../modelORM');
const {
    Reminder
} = models;

exports.get = {
    index: (req, cb) => {
        // defaultGet(dbName,req,(res)=>{
        //     if(res.status){
        //         cb({ status:true, data:res.data })
        //     }else{
        //         cb({ status:false, error:res.error })
        //     }
        // })
    },
    getById: (req, cb) => {
        // defaultGetById(dbName,req,(res)=>{
        //     if(res.status){
        //         cb({ status:true, data:res.data })
        //     } else {
        //         cb({ status:false, error:res.error })
        //     }
        // })
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
                        .findOne({ where: { id: res.dataValues.id } })
                        .then((findRes) => {
                            cb({ status: true, data: [findRes] })
                        })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.put = {
    index: (req, cb) => {
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