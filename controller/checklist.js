const async = require('async')
const dbName = "checklist";
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
    getCheckList : (req,cb) => {
        let d = req.query
        let taskCheckList = global.initModel("task_checklist")
        let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
        let document = global.initModel("document");
        let tag = global.initModel("tag");
        taskCheckList.getData("task_checklist", filter, {}, (c) => {
            let documents = _(c.data)
                .filter((o) => { return o.documents != null && o.documents != "" })
                .map((o) => { return JSON.parse(o.documents) })
                .flattenDeep()
                .uniq()
                .value();
            async.parallel({
                documentData: (documentParallelCallback) => {
                    document.getData("document", {
                        id: { value: documents, condition: " IN " }
                    }, {}, (e) => {
                        if (e.status) {
                            documentParallelCallback(null, e.data)
                        } else {
                            documentParallelCallback(e.error.sqlMessage)
                        }
                    });
                },
                tags: (documentParallelCallback) => {
                    tag.getData("tag", {
                        tagTypeId: { value: documents, condition: " IN " },
                        linkType: "task",
                        linkId: { value: _.map((c.data), (o) => { return o.taskId }), condition: " IN " },
                    }, {}, (e) => {
                        if (e.status) {
                            documentParallelCallback(null, e.data)
                        } else {
                            documentParallelCallback(e.error.sqlMessage)
                        }
                    });
                }
            }, (err, result) => {
                if (err != null) {
                    cb({ status : false , error: err })
                    // socket.emit("RETURN_ERROR_MESSAGE", { message: "Error Fetching checklist data." })
                } else {
                    const documentList = _(result.documentData)
                        .map((o) => {
                            return {
                                id: o.id,
                                name: o.name,
                                origin: o.origin,
                                uploadedBy: o.uploadedBy,
                                status: o.status,
                                tags: JSON.stringify(_(result.tags)
                                    .filter((tag) => { return tag.tagTypeId == o.id })
                                    .map((tag) => { return { value: tag.linkType + "-" + tag.linkId } })),
                                type: o.type
                            }
                        })
                        .value();
                    const resultList = _.map(c.data, (checklist) => {
                        const documents = (checklist.documents != null && checklist.documents != "") ?
                            _(documentList).filter((doc) => {
                                return _.findIndex(JSON.parse(checklist.documents), (o) => { return o == doc.id }) >= 0
                            })
                                .map((o) => { return { ...(o), project: checklist.task_projectId } })
                                .value()
                            : []
                        return { ...checklist, documents }
                    })
                    cb({ status: true , data : resultList })
                    // socket.emit("FRONT_CHECK_LIST", resultList);
                }
            })
        });
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