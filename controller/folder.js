const dbName = "folder";
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")
var sequence = require("sequence").Sequence;

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
    },
    postFolderTag : (req,cb) => {
        let d = req.body
        let tag = global.initModel("tag")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
            sequence.create().then((nextThen) => {
                tag.deleteData("tag",filter,(c)=>{
                    if(c.status){
                        nextThen(d.data)
                    }
                })
            }).then((nextThen,data) => {
                let hasError = false , errorMessage = "" , tempResData = []
                if(JSON.parse(data.tags).length){
                    JSON.parse(data.tags).map( e => {
                        let tagData = { linkType : e.value.split("-")[0], linkId : e.value.split("-")[1] , tagType : "folder" , tagTypeId : data.id }
                            tempResData.push( new Promise((resolve,reject) => {
                                tag.postData("tag",tagData,(res) =>{
                                    if(res.status){
                                        resolve(res)
                                    }else{
                                        hasError = true
                                        reject()
                                    }
                                })
                            }))
                    })
                    Promise.all(tempResData).then((values)=>{
                        cb({ status:true, data: [] })
                    })
                }else{
                    cb({ status:true, data: [] })
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