const dbName = "share";
var { defaultGet, defaultPut, defaultDelete } = require("./")
const Sequelize = require("sequelize")
const Op = Sequelize.Op;
const models = require('../modelORM');
const {
    Document,
    Tag,
    DocumentLink,
    Workstream,
    Tasks,
    Users,
    Share
} = models;

exports.get = {
    index: (req, cb) => {
        defaultGet(dbName, req, (res) => {
            if (res.status) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: res.error })
            }
        })
    },
    getById: (req, cb) => {
        defaultGetById(dbName, req, (res) => {
            if (res.status) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: res.error })
            }
        })
    }
}

exports.post = {
    index: (req, cb) => {
        let body = req.body
        let users = JSON.parse(body.users)
        delete body.users

        async.map(users, (e, mapCallback) => {
            try {
                let dataToSubmit = Object.assign({}, body)
                dataToSubmit.userTypeLinkId = e.value;
                dataToSubmit.usersType = 'users';

                Share
                    .create(dataToSubmit)
                    .then((res) => {
                        cb({ status: true, data: res })
                    })

            } catch (err) {
                mapCallback(err)
            }
        }, (err, mapCallbackResult) => {
            console.log(err)
        })
        // users.map( e =>{
        //     tempResData.push( new Promise((resolve,reject) => {
        //         let data = Object.assign({},d)
        //             data.userTypeLinkId = e.value
        //             data.usersType = "users"
        //             share.postData(dbName,data,(c)=>{
        //                 if(c.status){
        //                     resolve()
        //                 }else{
        //                     reject();
        //                 }
        //             })
        //     }))
        // })
        // Promise.all(tempResData).then((values)=>{
        //     let resData = []
        //     if(values.length){
        //         cb({ status:true, data:values })
        //     }
        // })
    }
}

exports.put = {
    index: (req, cb) => {
        defaultPut(dbName, req, (res) => {
            if (res.success) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: c.error })
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
    }
}