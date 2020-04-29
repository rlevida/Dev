const models = require('../modelORM');
const sequence = require("sequence").Sequence;
const _ = require("lodash");
const { TermsAndCondtions, Users, IpBlock, Teams, UsersTeam, Members, UsersRole, Session, Roles, Projects } = models;
const func = global.initFunc();

var updateIpBlock = (ipBlockData, ipAddress) => {
    let data = {};
    if (ipBlockData.length > 0) {
        data = ipBlockData[0];
        data.failedTimes = data.failedTimes + 1;
        data.dateFailed = new Date();
        IpBlock.update(data.toJSON(), { where: { id: data.id } }).then(res => {
            return;
        });
    } else {
        data = {
            ipAddress: ipAddress,
            failedTimes: 1,
            dateFailed: new Date()
        };
        IpBlock.create(data).then(res => {
            return;
        });
    }
};


exports.get = {
    index: async (req, cb) => {
        try {

            const termsAndCondtionsFindResult = await TermsAndCondtions.findOne({});
            cb({ status: true, data: termsAndCondtionsFindResult });
        } catch (error) {
            cb({ status: false, error: error })
        }
    }
}

exports.post = {
    index: async (req, cb) => {
        try {
            const { termsAndConditions, reset } = { ...req.body };
            const termsAndCondtionsCreateResult = await TermsAndCondtions.create({ termsAndConditions });
            if (reset) {
                if (reset) {
                    await Users.update({ termsAndConditions: -0 }, { where: { termsAndConditions: 1 } });
                }
            }
            cb({ status: true, data: termsAndCondtionsCreateResult });
        } catch (error) {
            cb({ status: false, error: error })
        }
    },
    user: async (req, cb) => {
        try {
            const body = req.body;
            if (typeof req.cookies["app.sid"] !== "undefined") {
                sequence
                    .create()
                    .then(nextThen => {
                        let ipBlockData = [],
                            failedTimes = 0,
                            dateFailed = new Date();
                        IpBlock.findAll({ where: { ipAddress: body.ipAddress } }).then(res => {
                            if (res.length > 0) {
                                ipBlockData = res;
                                failedTimes = ipBlockData[0].failedTimes;
                                dateFailed = new Date(res[0].dateFailed);
                            }
                            if (failedTimes < 5) {
                                nextThen(ipBlockData);
                            } else if (failedTimes >= 5 && dateFailed.getTime() + 30000 < new Date().getTime()) {
                                // blocking of ip by 3 sec
                                nextThen(ipBlockData);
                            } else {
                                cb({ status: false, data: res, message: "Your login attempts reached. Please try again in a few minutes." });
                            }
                        });
                    })
                    .then((nextThen, ipBlockData) => {
                        try {
                            Users.findOne({
                                where: { username: body.username },
                                include: [
                                    {
                                        model: UsersRole,
                                        as: "user_role",
                                        include: [
                                            {
                                                model: Roles,
                                                as: "role"
                                            }
                                        ]
                                    },
                                    {
                                        model: Members,
                                        as: "user_projects",
                                        where: { usersType: "users", linkType: "project" },
                                        required: false
                                    },
                                    {
                                        model: Teams,
                                        as: "team_as_teamLeader",
                                        where: { isDeleted: 0 },
                                        required: false
                                    },
                                    {
                                        model: UsersTeam,
                                        as: "users_team",
                                        where: { isDeleted: 0 },
                                        include: [
                                            {
                                                model: Teams,
                                                as: "team"
                                            }
                                        ],
                                        required: false
                                    }
                                ]
                            }).then(async res => {
                                if (res == null) {
                                    updateIpBlock(ipBlockData, body.ipAddress);
                                    cb({ status: false, message: "Incorrect username/password." });
                                } else {
                                    const response = res.toJSON();
                                    const { users_team, isActive } = response;

                                    if (!isActive) {
                                        updateIpBlock(ipBlockData, body.ipAddress);
                                        cb({ status: false, message: "Account is inactive. Please contact your administrator." });
                                    } else {
                                        const teamProject = await Members.findAll({
                                            where: {
                                                linkType: "project",
                                                usersType: "team",
                                                userTypeLinkId: _.map(users_team, ({ team }) => {
                                                    return team.id;
                                                }),
                                                isDeleted: 0
                                            }
                                        }).map(o => {
                                            return o.toJSON().linkId;
                                        });
                                        const userProject = await Members.findAll({
                                            where: {
                                                linkType: "project",
                                                usersType: "users",
                                                userTypeLinkId: response.id,
                                                isDeleted: 0
                                            }
                                        }).map(o => {
                                            return o.toJSON().linkId;
                                        });

                                        const allUserProjectIds = [...teamProject, ...userProject];
                                        const allUserProject = await Projects.findAll({
                                            where: {
                                                id: allUserProjectIds,
                                                isDeleted: 0,
                                                isActive: 1,
                                                ...(response.user_role[0].roleId > 4
                                                    ? {
                                                        typeId: 1
                                                    }
                                                    : {})
                                            }
                                        }).map(o => {
                                            const { id } = o.toJSON();
                                            return id;
                                        });

                                        if (allUserProject.length == 0 && response.user_role[0].roleId > 3) {
                                            cb({ status: false, message: "Your account has no assigned project. Your account's role requires a project to continue. For help, please contact the admin." });
                                        } else {
                                            const responseToReturn = {
                                                ...response,
                                                projectId: _.uniq(allUserProject),
                                                userRole: response.user_role[0].roleId,
                                                team: response.team_as_teamLeader.concat(
                                                    response.users_team.map(e => {
                                                        return e.team;
                                                    })
                                                )
                                            };
                                            nextThen(_.omit(responseToReturn, "team_as_teamLeader", "users_team"), ipBlockData);
                                        }
                                    }
                                }
                            });
                        } catch (err) {
                            if (err) {
                                cb({ status: false, message: "Something went wrong. Please try again." });
                            } else {
                                updateIpBlock(ipBlockData, body.ipAddress);
                                cb({ status: false, message: "Incorrect username/password." });
                            }
                        }
                    })
                    .then((nextThen, user, ipBlockData) => {

                        if (!user.salt || typeof user.salt == "undefined") {
                            updateIpBlock(ipBlockData, body.ipAddress);
                            cb({ status: false, message: "Incorrect username/password." });
                        }

                        // manage password hash here
                        var inputPassword = func.generatePassword(body.password, user.salt);
                        if (user.password == inputPassword) {
                            if (typeof req.cookies["app.sid"] === "undefined") {
                                // manage token if app.sid is not yet set by the server/mobile access directly to socket during login
                                const TokenGenerator = require("uuid-token-generator");
                                req.cookies["app.sid"] = new TokenGenerator(256).generate();
                            }
                            Session.findAll({ where: { usersId: user.id } }).then(res => {
                                if (ipBlockData.length > 0) {
                                    IpBlock.destroy({ where: { id: ipBlockData[0].id } }).then(destroyRes => { });
                                }
                                if (res.length == 0) {
                                    delete user.password;
                                    delete user.salt;
                                    Session.create({ usersId: user.id, session: req.cookies["app.sid"], data: JSON.stringify(user), dateAdded: new Date() }).then(createRes => {
                                        nextThen(user);
                                    });
                                } else {
                                    delete user.password;
                                    delete user.salt;
                                    Session.update(
                                        { session: req.cookies["app.sid"], data: JSON.stringify(user), dateAdded: new Date() },
                                        {
                                            where: { usersId: user.id }
                                        }
                                    ).then(updateRes => {
                                        nextThen(user);
                                    });
                                }
                            });
                        } else {
                            updateIpBlock(ipBlockData, body.ipAddress);
                            cb({ status: false, message: "Incorrect username/password." });
                        }
                    })
                    .then((nextThen, userDetails) => {
                        Users.update({ termsAndConditions: 1 }, { where: { id: userDetails.id } }).then(() => {
                            nextThen(userDetails)
                        })
                    }).then((nextThen, userDetails) => {
                        if (userDetails.userType == "External") {
                            try {
                                Members.findAll({ where: { userTypeLinkId: userDetails.id, linkType: "project" } }).then(res => {
                                    cb({ status: true, data: res, userDetails, type: userDetails.userType, message: "Successfully Login" });
                                });
                            } catch (err) {
                                cb({ status: false, error: err });
                            }
                        } else {
                            cb({ status: true, message: "Successfully Login", userDetails, type: userDetails.userType });
                        }
                    });
            } else {
                cb({ status: false, error: "Unathorized Access" })
            }
        } catch (error) {
            cb({ status: false, error: error })
        }
    }
}

exports.put = {
    index: async (req, cb) => {
        try {
            const { id } = { ...req.params }
            const { termsAndConditions, reset } = { ...req.body };
            const termsAndConditionsUpdateResult = await TermsAndCondtions.update({ termsAndConditions: termsAndConditions }, { where: { id } });
            if (reset) {
                await Users.update({ termsAndConditions: -0 }, { where: { termsAndConditions: 1 } });
            }
            cb({ status: true, data: termsAndConditionsUpdateResult });
        } catch (error) {
            cb({ status: false, error: error })
        }
    },

}