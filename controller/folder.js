const dbName = "folder";
var {
    defaultPut,
    defaultDelete
} = require("./")
var sequence = require("sequence").Sequence;
const Sequelize = require("sequelize")

const models = require('../modelORM');
const {
    Folder,
    Tag,
    Tasks,
    Workstream,
    Users
} = models;

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const whereObj = {
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "") ? { projectId: queryString.projectId } : {},
        };

        try {
            Folder
                .findAll({
                    where: whereObj,
                    include: [
                        {
                            model: Tag,
                            as: 'tagFolderWorkstream',
                            where: { tagType: 'folder', linkType: 'workstream' },
                            include: [{
                                model: Workstream,
                                as: 'tagWorkstream'
                            }],
                            required: false
                        },
                        {
                            model: Tag,
                            as: 'tagFolderTask',
                            where: { tagType: 'folder', linkType: 'task' },
                            include: [{
                                model: Tasks,
                                as: 'tagTask'
                            }],
                            required: false
                        },
                        {
                            model: Users,
                            as: 'user',
                            attributes: ['firstName', 'lastName', 'phoneNumber', 'emailAddress']
                        }
                    ]
                })
                .map((res) => {
                    let resToReturn = {
                        ...res.dataValues,
                        tags:
                            res.dataValues.tagFolderWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                .concat(res.dataValues.tagFolderTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } }))
                    }
                    return resToReturn = _.omit(resToReturn, "tagFolderWorkstream", "tagFolderTask")
                })
                .then((res) => {
                    cb({ status: true, data: res })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
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
        const dataToSubmit = req.body
        const queryString = req.query
        const whereObj = {
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "") ? { projectId: queryString.projectId } : {},
        };
        try {
            Folder
                .create(dataToSubmit)
                .then(res => {
                    Folder
                        .findOne({
                            where: { ...whereObj, id: res.dataValues.id },
                            include: [
                                {
                                    model: Tag,
                                    as: 'tagFolderWorkstream',
                                    where: { tagType: 'folder', linkType: 'workstream' },
                                    include: [{
                                        model: Workstream,
                                        as: 'tagWorkstream'
                                    }],
                                    required: false
                                },
                                {
                                    model: Tag,
                                    as: 'tagFolderTask',
                                    where: { tagType: 'folder', linkType: 'task' },
                                    include: [{
                                        model: Tasks,
                                        as: 'tagTask'
                                    }],
                                    required: false
                                },
                                {
                                    model: Users,
                                    as: 'user',
                                    attributes: ['firstName', 'lastName', 'phoneNumber', 'emailAddress']
                                }
                            ]
                        })
                        .then((findRes) => {
                            let findResToReturn = {
                                ...findRes.dataValues,
                                tags: findRes.dataValues.tagFolderWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                    .concat(findRes.dataValues.tagFolderTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } }))
                            }
                            cb({ status: true, data: _.omit(findResToReturn, "tagFolderWorkstream", "tagFolderTask") })
                        })
                })
        } catch (err) {
            console.error(err)
            cb({ status: false, error: err })
        }
    },
    postFolderTag: (req, cb) => {
        const dataToSubmit = req.body;
        const queryString = req.query
        const whereObj = {
            ...(typeof queryString.tagTypeId != "undefined" && queryString.tagTypeId != "") ? { tagTypeId: queryString.tagTypeId } : {},
            ...(typeof queryString.tagType != "undefined" && queryString.tagType != "") ? { tagType: queryString.tagType } : {}
        };

        sequence.create().then((nextThen) => {
            Tag
                .destroy({
                    where: whereObj
                })
                .then(res => {
                    nextThen(dataToSubmit)
                })
        }).then((nextThen, data) => {
            if (JSON.parse(data.tags).length) {
                async.map(JSON.parse(data.tags), (e, mapCallback) => {
                    let tagData = {
                        linkType: e.value.split("-")[0],
                        linkId: e.value.split("-")[1],
                        tagType: "folder",
                        tagTypeId: data.id
                    }

                    try {
                        Tag.create(tagData)
                            .then(res => {
                                mapCallback(null, res)
                            })

                    } catch (err) {
                        mapCallback(res)
                    }

                }, (err, result) => {
                    if (err != null) {
                        cb({ status: false, error: err })
                    } else {
                        nextThen()
                    }
                })
            } else {
                nextThen()
            }
        }).then((nextThen, data) => {
            try {
                Folder
                    .findOne({
                        where: { id: queryString.tagTypeId },
                        include: [
                            {
                                model: Tag,
                                as: 'tagFolderWorkstream',
                                where: { tagType: 'folder', linkType: 'workstream' },
                                include: [{
                                    model: Workstream,
                                    as: 'tagWorkstream'
                                }],
                                required: false
                            },
                            {
                                model: Tag,
                                as: 'tagFolderTask',
                                where: { tagType: 'folder', linkType: 'task' },
                                include: [{
                                    model: Tasks,
                                    as: 'tagTask'
                                }],
                                required: false
                            }
                        ]
                    })
                    .then((res) => {
                        let resToReturn = {
                            ...res.dataValues,
                            tags:
                                res.dataValues.tagFolderWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                    .concat(res.dataValues.tagFolderTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } }))
                        }
                        cb({ status: true, data: _.omit(resToReturn, "tagFolderWorkstream", "tagFolderTask") })
                    })
            } catch (err) {
                cb({ status: false, error: err })
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
    folderTag: (req, cb) => {
        const dataToSubmit = req.body;
        const queryString = req.query
        const whereObj = {
            ...(typeof queryString.tagTypeId != "undefined" && queryString.tagTypeId != "") ? { tagTypeId: queryString.tagTypeId } : {},
            ...(typeof queryString.tagType != "undefined" && queryString.tagType != "") ? { tagType: queryString.tagType } : {}
        };

        sequence.create().then((nextThen) => {
            Tag
                .destroy({
                    where: whereObj
                })
                .then(res => {
                    nextThen(dataToSubmit)
                })
        }).then((nextThen, data) => {
            if (JSON.parse(data.tags).length) {
                async.map(JSON.parse(data.tags), (e, mapCallback) => {
                    let tagData = {
                        linkType: e.value.split("-")[0],
                        linkId: e.value.split("-")[1],
                        tagType: "folder",
                        tagTypeId: data.id
                    }

                    try {
                        Tag.create(tagData)
                            .then(res => {
                                mapCallback(null, res)
                            })

                    } catch (err) {
                        mapCallback(res)
                    }

                }, (err, result) => {
                    if (err != null) {
                        cb({ status: false, error: err })
                    } else {
                        nextThen()
                    }
                })
            } else {
                nextThen()
            }
        }).then((nextThen, data) => {
            try {
                Folder
                    .findOne({
                        where: { id: queryString.tagTypeId },
                        include: [
                            {
                                model: Tag,
                                as: 'tagFolderWorkstream',
                                where: { tagType: 'folder', linkType: 'workstream' },
                                include: [{
                                    model: Workstream,
                                    as: 'tagWorkstream'
                                }],
                                required: false
                            },
                            {
                                model: Tag,
                                as: 'tagFolderTask',
                                where: { tagType: 'folder', linkType: 'task' },
                                include: [{
                                    model: Tasks,
                                    as: 'tagTask'
                                }],
                                required: false
                            }
                        ]
                    })
                    .then((res) => {
                        let resToReturn = {
                            ...res.dataValues,
                            tags:
                                res.dataValues.tagFolderWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                    .concat(res.dataValues.tagFolderTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } }))
                        }
                        cb({ status: true, data: _.omit(resToReturn, "tagFolderWorkstream", "tagFolderTask") })
                    })
            } catch (err) {
                cb({ status: false, error: err })
            }
        })
    }
}

exports.delete = {
    index: (req, cb) => {
        defaultDelete(dbName, req, (res) => {
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