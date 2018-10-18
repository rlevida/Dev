const async = require("async");
const _ = require("lodash");
const models = require('../modelORM');
const { TaskDependency, Tasks } = models;

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 2;
        const association = [
            {
                model: Tasks,
                as: 'task'
            }
        ];
        const whereObj = {
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { taskId: queryString.taskId } : {}
        };
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            ...(typeof queryString.includes != "undefined" && queryString.includes != "") ? { include: _.filter(association, (associationObj) => { return _.findIndex(queryString.includes, (includesObj) => { return includesObj == associationObj.as }) >= 0 }) } : {}
        };
        try {
            TaskDependency.findAll(
                { ...options, where: whereObj }
            ).map((mapObject) => {
                return mapObject.toJSON();
            }).then((resultArray) => {
                cb({ status: true, data: resultArray });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.post = {
    bulk: (req, cb) => {
        const association = [
            {
                model: Tasks,
                as: 'task'
            }
        ];
        const options = {
            ...(typeof req.body.includes != "undefined" && req.body.includes != "") ? { include: _.filter(association, (associationObj) => { return _.findIndex(req.body.includes, (includesObj) => { return includesObj == associationObj.as }) >= 0 }) } : {}
        };
        try {
            TaskDependency.bulkCreate(req.body.data).then(() => {
                TaskDependency.findAll({ ...options, where: { taskId: req.body.task_id } }).map((mapObject) => {
                    return mapObject.toJSON();
                }).then((resultArray) => {
                    cb({ status: true, data: resultArray });
                });
            })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}