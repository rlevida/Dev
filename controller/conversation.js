const dbName = "notes";
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")
const models = require('../modelORM');
const {
    Notes,
    Tag,
    Tasks,
    Conversation,
    Users
} = models;

exports.get = {
    index : (req,cb) => {
        const queryString = req.query;
        
        try {
            Notes
                .findAll({
                    include : [{
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
                    }
                ]
                })
                .then((res) => {
                    cb({ status: true, data: res })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
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