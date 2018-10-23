const async = require("async");
const moment = require('moment');
const sequence = require("sequence").Sequence;

const dbName = "project";
var {
    defaultGet,
    defaultGetId,
    defaultPost,
    defaultPut,
    defaultDelete
} = require("./")

const Sequelize = require("sequelize")
const Op = Sequelize.Op;

const models = require('../modelORM');

const {
    Document,
    DocumentLink,
    Members,
    Project,
    Status,
    Tag,
    Tasks,
    Type,
    Workstream,
} = models;

exports.get = {
    index: (req, cb) => {
        let d = req.query;
        let filter = (typeof d.filter != "undefined") ? JSON.parse(d.filter) : {};
        Project.
            findAll({
                raw:true,
                include: [
                    {
                        model: Type,
                        as: 'type',
                        required: false,
                        attributes: [] 
                    },
                    {
                        model: Members,
                        as: 'projectManager',
                        where: { memberType: 'project manager'},
                        required: false,
                        attributes: []
                    },
                    {
                        model: Tasks,
                        as: 'taskActive',
                        attributes: [],
                        required: false
                    },
                    {
                        model: Tasks,
                        as: 'taskOverDue',
                        where: Sequelize.where(Sequelize.fn('date', Sequelize.col('taskOverDue.dueDate')), '<', moment().format('YYYY-MM-DD 00:00:00')),
                        required: false,
                        attributes: []
                    },
                    {
                        model: Tasks,
                        as: 'taskDueToday',
                        where: Sequelize.where(Sequelize.fn('date', Sequelize.col('taskDueToday.dueDate')), '=', moment().format('YYYY-MM-DD 00:00:00')),
                        required: false,
                        attributes: []
                    }
                ],
                attributes: { 
                    include :[
                        [Sequelize.fn("COUNT", Sequelize.col("taskActive.id")), "taskActive"],
                        [Sequelize.fn("COUNT", Sequelize.col("taskOverDue.id")), "taskOverDue"],
                        [Sequelize.fn("COUNT", Sequelize.col("taskDueToday.id")), "taskDueToday"],
                        [Sequelize.col("projectManager.userTypeLinkId"), "projectManagerId"],
                        [Sequelize.col("type.type"), "type"]
                    ]
                },
                group: ['id']
            })
            .then(res => {
                cb({ status: true , data: res })
            })
            .catch(err => {
                cb({ status: false, error: err })
            })
    },
    getById: (req, cb) => {
        defaultGetById(dbName, req, (res) => {
            if (res.status) {
                cb({
                    status: true,
                    data: res.data
                })
            } else {
                cb({
                    status: false,
                    error: res.error
                })
            }
        })
    }
}

exports.post = {
    index: (req, cb) => {
        defaultPost(dbName, req, (res) => {
            if (res.success) {
                cb({
                    status: true,
                    data: res.data
                })
            } else {
                cb({
                    status: false,
                    error: res.error
                })
            }
        })
    }
}

exports.put = {
    index: (req, cb) => {
        defaultPut(dbName, req, (res) => {
            if (res.success) {
                cb({
                    status: true,
                    data: res.data
                })
            } else {
                cb({
                    status: false,
                    error: c.error
                })
            }
        })
    },
    archive: (req, cb) => {
        let dataToSubmit = req.body
        let id = req.params.id

        sequence.create().then((nextThen) => {
            Project.update({
                    ...dataToSubmit
                }, {
                    where: {
                        id: id
                    },
                })
                .then(res => {
                    nextThen(res)
                })
                .catch(err => {
                    cb({
                        status: false,
                        error: err
                    })
                })
        }).then((nextThen, result) => {
            Project.findById(result[0])
                .then(res => {
                    cb({
                        status: true,
                        data: res
                    })
                }).catch(err => {
                    cb({
                        status: false,
                        error: err
                    })
                })
        })
    }
}

exports.delete = {
    index: (req, cb) => {
        let d = req.params
        
            async.waterfall([
               function (callback){
                    async.parallel({
                        projects: (parallelCallback) => {
                            Project
                                .findAll({ where: {id: d.id}})
                                .map((res) => {
                                    return res.id
                                })
                                .then((res) => {
                                    parallelCallback(null,res)
                                })
                                .catch((err) => {
                                    parallelCallback(null,"")
                                })
                        },
                        workstreams: (parallelCallback) => {
                            Workstream
                                .findAll({ where: { projectId: d.id }})
                                .map((res) => {
                                    return res.id
                                })
                                .then((res) => {
                                    parallelCallback(null,res)
                                }).catch((err) => {
                                    parallelCallback(null,"")
                                })
                        },
                        tasks: (parallelCallback) => {
                            Tasks
                                .findAll({ where: { projectId: d.id}})
                                .map((res) => {
                                    return res.id
                                })
                                .then((res) => {
                                    parallelCallback(null,res)
                                })
                                .catch((err) => {
                                    parallelCallback(null,"")
                                })
                        },
                        documents: (parallelCallback) => {
                            DocumentLink
                                .findAll({ where : { linkType: 'project' , linkId : d.id }})
                                .map((res) => {
                                    return res.documentId
                                })
                                .then((res) => {
                                    parallelCallback(null,res)
                                })
                                .catch((err) => {
                                    parallelCallback(null,"")
                                })
                        }
                    },(err,parallelCallbackResult) => {
                        callback(null,parallelCallbackResult)
                    })
               },
               function( result , callback ){
                    async.parallel({
                        projects: (parallelCallback) => {
                            if(result.projects.length > 0){
                                Project
                                    .destroy({ where: { id: result.projects }})
                                    .then((res) => {
                                        parallelCallback(null,res)
                                    })
                                    .catch((err) => {
                                        parallelCallback(null,"")
                                    })
                            }else{
                                parallelCallback(null,"")
                            }
                        },  
                        workstreams : (parallelCallback) => {
                            if(result.workstreams.length > 0 ){
                                Workstream
                                    .destroy({ where: { id: result.workstreams }})
                                    .then((res) =>{
                                        parallelCallback(null,res)
                                    })
                                    .catch((err) => {
                                        console.log(`workstream`,err)
                                        parallelCallback(null,"")
                                    })
                            }else{
                                parallelCallback(null,"")
                            }
                        },
                        tasks: (parallelCallback) => {
                            if(result.tasks.length > 0){
                                Tasks
                                    .destroy({ where: { id: result.tasks }})
                                    .then((res) => {
                                        parallelCallback(null,res)
                                    })
                                    .catch((err) => {
                                        console.log(`task`,err)
                                        parallelCallback(null,"")
                                    })
                            }else{
                                parallelCallback(null,"")
                            }
                        },
                        members: (parallelCallback) => {
                            Members
                                .destroy({ 
                                    where: { 
                                        [Op.or] : [
                                            { linkType: 'project', linkId: d.id } , 
                                            { linkType: 'workstream', linkId: { [Op.or] : result.workstreams }},
                                            { linkType: 'task', linkId: {[Op.or] : result.tasks }}
                                        ]
                                    }
                                })
                                .then((res) => {
                                    parallelCallback(null,res)
                                })
                                .catch((err) => {
                                    console.log(`members`,err)
                                    parallelCallback(null,"")
                                })                        
                        },
                        documents: (parallelCallback) => {
                            if(result.documents.length > 0){
                                Document
                                    .destroy({ where: { id: result.documents }})
                                    .then((res) => {
                                        parallelCallback(null,res)
                                    })
                                    .catch((err) => {
                                        console.log(`documents`,err)
                                        parallelCallback(null,"")
                                    })
                            }else{
                                parallelCallback(null,"")
                            }
                        },
                        documentLinks: (parallelCallback) => {
                            if(result.documents.length > 0){
                                DocumentLink
                                    .destroy({ where : { linkType: 'project' , linkId: result.projects }})
                                    .then((res) => {
                                        parallelCallback(null,res)
                                    })
                                    .catch((err) => {
                                        console.log(`documentLinks`,err)
                                        parallelCallback(null,"")
                                    })
                            }else{
                                parallelCallback(null,"")
                            }
                        },
                        documentTags: (parallelCallback) => {
                            if(result.documents.length > 0){
                                Tag
                                    .destroy({ where : { tagType: 'document', tagTypeId : result.documents }})
                                    .then((res) => {
                                        parallelCallback(null,res)
                                    })
                                    .catch((err) => {
                                        console.log(`documentTag`,err)
                                        parallelCallback(null,"")
                                    })
                            }else{
                                parallelCallback(null,"")
                            }
                        }
                    },(err, parallelCallbackResult) => {
                        callback(null,parallelCallbackResult)
                    })
               }
            ], function (error, result) {
                cb({ status: true , data : d.id })
            });
    }
}