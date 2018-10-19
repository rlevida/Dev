const _ = require("lodash");
const { defaultPost, defaultPut, defaultDelete } = require("./");

const models = require('../modelORM');
const { Members, Users } = models;

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 2;
        const association = [
            {
                model: Users,
                as: 'user',
                attributes: ['firstName', 'lastName']
            }
        ]
        _.filter(association, (associationObj) => { 
            return _.findIndex((queryString.includes).split(','), (includesObj) => { return includesObj == associationObj.as }) >= 0 
        })
        const whereObj = {
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "") ? { linkType: queryString.linkType } : {},
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "") ? { linkId: queryString.linkId } : {},
            ...(typeof queryString.memberType != "undefined" && queryString.memberType != "") ? { memberType: queryString.memberType } : {},
            ...(typeof queryString.usersType != "undefined" && queryString.usersType != "") ? { usersType: queryString.usersType } : {},
        }
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            ...(typeof queryString.includes != "undefined" && queryString.includes != "") ? { include: _.filter(association, (associationObj) => { return _.findIndex((queryString.includes).split(','), (includesObj) => { return includesObj == associationObj.as }) >= 0 }) } : {}
        }

        try {
            Members.findAll(
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
    index: (req, cb) => {
        const association = [
            {
                model: Users,
                as: 'user',
                attributes: ['firstName', 'lastName']
            }
        ]
        const options = {
            ...(typeof req.body.includes != "undefined" && req.body.includes != "") ? { include: _.filter(association, (associationObj) => { return _.findIndex((req.body.includes).split(','), (includesObj) => { return includesObj == associationObj.as }) >= 0 }) } : {}
        }

        try {
            Members.create(req.body.data).then((response) => {
                Members.findOne({ ...options, where: { id: response.dataValues.id } }).then((response) => {
                    cb({ status: true, data: response.toJSON() });
                });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
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
        const queryString = req.query;
        const whereObj = {
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "") ? { linkType: queryString.linkType } : {},
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "") ? { linkId: queryString.linkId } : {},
            ...(typeof queryString.memberType != "undefined" && queryString.memberType != "") ? { memberType: queryString.memberType } : {},
            ...(typeof queryString.usersType != "undefined" && queryString.usersType != "") ? { usersType: queryString.usersType } : {},
        };
        const options = {
            raw: true
        };
        try {
            Members.destroy(
                { ...options, where: whereObj }
            ).then((response) => {
                cb({ status: true, data: response });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}