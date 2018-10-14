const dbName = "conversation";
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
    },
    getConversationList : (req,cb) => {
            let d = req.query
            let conversation = global.initModel("conversation")
            let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
            conversation.getData("conversation", filter ,{},(c)=>{
                if(c.status) {
                    cb({ status: true , data: c.data })
                    // socket.emit("FRONT_COMMENT_LIST",c.data)
                }else{
                    cb({ status: false , error : c.error })
                    // if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
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