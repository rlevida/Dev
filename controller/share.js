const dbName = "share";
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")

exports.get = {
    index : (req,cb) => {
        defaultGet(dbName,req,(res)=>{
            if(res.status){
                cb({ status:true, data:res.data })
            }else{
                cb({ status:false, error:res.error })
            }
        })
    },
    getById : (req,cb) => {
        defaultGetById(dbName,req,(res)=>{
            if(res.status){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:res.error })
            }
        })
    }
}

exports.post = {
    index : (req,cb) => {
        let d = req.body
        let users = JSON.parse(d.users)
        let tempResData = [] ;
        let share = global.initModel("share")
            delete d.users
            users.map( e =>{
                tempResData.push( new Promise((resolve,reject) => {
                    let data = Object.assign({},d)
                        data.userTypeLinkId = e.value
                        data.usersType = "users"
                        share.postData(dbName,data,(c)=>{
                            if(c.status){
                                resolve()
                            }else{
                                reject();
                            }
                        })
                }))
            })
            Promise.all(tempResData).then((values)=>{
                let resData = []
                if(values.length){
                    cb({ status:true, data:values })
                }
            })
    }
}

exports.put = {
    index : (req,cb) => {
        defaultPut(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:c.error })
            }
        })
    }
}

exports.delete =  {
    index : (req,cb) => {
        defaultDelete(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:res.error })
            }
        })
    }
}