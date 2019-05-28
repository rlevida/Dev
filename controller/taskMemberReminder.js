const _ = require("lodash");
const Sequelize = require("sequelize")
const Op = Sequelize.Op;
const models = require('../modelORM');
const { Members, Users, UsersRole, Roles, UsersTeam, Teams, TaskMemberReminder } = models;
const associationArray = [
    {
        model: Users,
        as: 'user',
        attributes: ["id", "firstName", "lastName", "username", "emailAddress", "userType"],
        include: [
            {
                model: UsersRole,
                as: 'user_role',
                include: [
                    {
                        model: Roles,
                        as: 'role'
                    }
                ]
            },
            {
                model: UsersTeam,
                as: 'users_team',
                include: [
                    {
                        model: Teams,
                        as: 'team'
                    }
                ]
            },
            {
                model: TaskMemberReminder,
                as: 'task_member_reminder',
                required: false
            }
        ]
    }
]

exports.get = {
    index: (req, cb) => {
    }
}

exports.post = {
    index: (req, cb) => {
        const body = req.body;
        const queryString = req.query;

        if (typeof queryString.taskId !== 'undefined' && queryString.taskId !== '') {
            _.find(_.find(associationArray, { as: 'user' }).include, { as: 'task_member_reminder' }).where = {
                taskId: queryString.taskId
            };
        }
        try {
            TaskMemberReminder
                .create(body)
                .then((res) => {
                    Members
                        .findOne({
                            where: { id: queryString.memberId },
                            include: associationArray
                        })
                        .then((findRes) => {
                            cb({ status: true, data: [findRes] })
                        })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.put = {
    index: (req, cb) => {
        const body = req.body;
        const queryString = req.query;
        const id = req.params.id;

        if (typeof queryString.taskId !== 'undefined' && queryString.taskId !== '') {
            _.find(_.find(associationArray, { as: 'user' }).include, { as: 'task_member_reminder' }).where = {
                taskId: queryString.taskId
            };
        }

        try {
            TaskMemberReminder
                .update(body, { where: { id: id } })
                .then((res) => {
                    Members
                        .findOne({
                            where: { id: queryString.memberId },
                            include: associationArray
                        })
                        .then((findRes) => {
                            cb({ status: true, data: [findRes] })
                        })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
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
            Members.update({ isDeleted: 1 },{ where: whereObj }).then((response) => {
                cb({ status: true, data: response });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}