const dbName = "type";
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
        defaultPost(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            }else{
                cb({ status:false, error:res.error })
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