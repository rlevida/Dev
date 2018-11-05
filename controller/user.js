const dbName = "users";
var {
    defaultGet,
    defaultGetId,
    defaultPost,
    defaultPut,
    defaultDelete
} = require("./")

const models = require('../modelORM');
const {
    Users,
    UsersRole,
    UsersTeam
} = models;

exports.get = {
    index: (req, cb) => {

        Users.findAll({
                include: [
                    {
                        model: UsersRole,
                        as: 'user_role',
                        attributes: ['roleId']
                    },
                    {
                        model: UsersTeam,
                        as: 'team'
                    }
                ],
                attributes: ['id','username','firstName','lastName','emailAddress','phoneNumber','avatar','isActive','userType'],
            })
            .then((res) => {
                cb({ status: true, data: res })
            })
            .catch((err) => {
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