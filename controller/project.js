const async = require("async");
const moment = require("moment");
const sequence = require("sequence").Sequence;
const Sequelize = require("sequelize");
const _ = require("lodash");
const Op = Sequelize.Op;
const models = require("../modelORM");
const { TaskChecklist, ChecklistDocuments, Conversation, Document, DocumentLink, Members, Projects, Tag, Tasks, Teams, Type, Users, UsersTeam, UsersRole, Roles, Workstream, sequelize, Notes } = models;

function projectAuth(authObj) {
    const { user } = { ...authObj };
    switch (authObj.action) {
        case "get":
            if (user.user_role[0].roleId > 3 && typeof authObj.projectId !== "undefined" && authObj.projectId !== "undefined") {
                /* Check if a user is project member */
                hasAccess = _.find(user.user_projects, { linkId: parseInt(authObj.projectId) }) ? true : false;
            } else {
                hasAccess = true;
            }
            break;
        case "post":
            if (user.user_role[0].roleId === 3 && typeof authObj.projectId !== "undefined" && authObj.projectId !== "undefined") {
                /* Check if internal manager has access to the project */
                hasAccess = _.find(user.user_projects, { linkId: parseInt(authObj.projectId) }) ? true : false;
            } else if (user.user_role[0].roleId > 4 && typeof authObj.projectId !== "undefined" && authObj.projectId !== "undefined") {
                /* Check if a user has an access to the project */
                hasAccess = _.find(user.user_projects, { linkId: parseInt(authObj.projectId) }) ? true : false;
            } else if (user.user_role[0].roleId <= 4) {
                /* Internal users has access in creating of project */
                hasAccess = true;
            }
            break;
        default:
            break;
    }
    return hasAccess;
}



exports.get = {
    index: async (req, cb) => {
        // if (!req.user) {
        //     cb({ status: false, error: "Unauthorized Access" });
        // }

        const queryString = req.query;
        const limit = 25;
        const userId = req.user.id,
            userRole = req.user.user_role[0].roleId;
        let associationArray = [
            {
                model: Type,
                as: "type",
                required: false,
                attributes: ["type"]
            },
            {
                model: Workstream,
                as: "workstream",
                attributes: ["id"],
            },
            {
                model: Members,
                as: "projectManager",
                where: {
                    memberType: "project manager"
                },
                required: false,
                include: [
                    {
                        model: Users,
                        as: "user",
                        required: false,
                        attributes: ["id", "firstName", "lastName", "avatar"]
                    }
                ],
                attributes: ["id", "userTypeLinkId"]
            },
            {
                model: Members,
                as: "team",
                separate: true,
                where: {
                    usersType: "team",
                    linkType: "project",
                    isDeleted: 0
                },
                required: false,
                include: [
                    {
                        model: Teams,
                        as: "team",
                        required: false,
                        include: [
                            {
                                model: UsersTeam,
                                as: "users_team",
                                required: false,
                                include: [
                                    {
                                        model: Users,
                                        as: "user",
                                        required: false
                                    }
                                ],
                            }
                        ],
                    }
                ],
            },
        ];

        if (parseInt(queryString.hasMembers)) {
            associationArray.push({
                model: Members,
                as: "members",
                where: {
                    usersType: "users",
                    linkType: "project",
                    isDeleted: 0
                },
                required: false,
                attributes: ['userTypeLinkId', 'memberType', 'isActive']
            });
        } else {
            associationArray.push({
                model: DocumentLink,
                as: "document_link",
                where: {
                    linkType: "project"
                },
                required: false,
                include: [
                    {
                        model: Document,
                        as: "document",
                        where: {
                            folderId: null,
                            isDeleted: 0
                        },
                        required: false,
                        attributes: ["id"]
                    }
                ],
                attributes: ["id"]
            });
        }

        const options = {
            include: associationArray,
            order: [queryString.sort ? queryString.sort.split("-") : ["project", "ASC"]],
            ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {})
        };
        const whereObj = {
            ...(typeof queryString.id != "undefined" && queryString.id != "" ? { id: queryString.id.split(",") } : {}),
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "" ? { projectId: queryString.projectId } : {}),
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "" ? { workstreamId: queryString.workstreamId } : {}),
            ...(typeof queryString.typeId != "undefined" && queryString.typeId != "" && queryString.typeId !== "Inactive" ? { typeId: queryString.typeId } : {}),
            ...(typeof queryString.projectType != "undefined" && queryString.projectType != "" && queryString.typeId === "Inactive" ? { typeId: queryString.projectType } : {}),
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "" ? { isActive: queryString.isActive } : {}),
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "" ? { isDeleted: queryString.isDeleted } : { isDeleted: 0 }),
            ...(typeof queryString.project != "undefined" && queryString.project != ""
                ? {
                    [Sequelize.Op.and]: [
                        Sequelize.where(Sequelize.fn("lower", Sequelize.col("project")), {
                            [Sequelize.Op.like]: sequelize.fn("lower", `%${queryString.project}%`)
                        })
                    ]
                }
                : {})
        };
        if (typeof userId != "undefined" && userId != "" && (typeof userRole != "undefined" && userRole >= 3)) {
            const userTeam = await UsersTeam.findAll({
                where: {
                    usersId: userId
                }
            }).map(res => {
                return res.toJSON();
            });

            const projectMembers = await Members.findAll({
                where: {
                    [Op.or]: [
                        {
                            usersType: "users",
                            userTypeLinkId: userId,
                            linkType: "project",
                            isDeleted: 0
                        },
                        {
                            usersType: "team",
                            userTypeLinkId: _.map(userTeam, o => {
                                return o.teamId;
                            }),
                            linkType: "project",
                            isDeleted: 0
                        }
                    ]
                }
            }).map(res => {
                return res.toJSON();
            });

            if (userRole > 4 && typeof queryString.typeId == "undefined") {
                whereObj["typeId"] = 1;
            }

            whereObj[Sequelize.Op.or] = [
                {
                    id: _(projectMembers)
                        .uniqBy("linkId")
                        .map(o => {
                            return o.linkId;
                        })
                        .value()
                },
                {
                    createdBy: userId
                }
            ];
        }
        if (typeof queryString.projectProgress != "undefined" && queryString.projectProgress != "" && queryString.typeId !== "Inactive") {
            switch (queryString.projectProgress) {
                case "All":
                    whereObj["isDeleted"] = [0];
                    whereObj["isActive"] = [1];
                    break;
                case "On Time":
                    whereObj["id"] = {
                        [Op.and]: {
                            [Op.in]: Sequelize.literal(`(SELECT DISTINCT workstream.projectId
                                FROM
                                    workstream
                                LEFT JOIN
                                    task
                                ON task.workstreamId = workstream.id AND workstream.isDeleted = 0
                                WHERE task.dueDate >= "${moment(queryString.dueDate, "YYYY-MM-DD")
                                    .utc()
                                    .format("YYYY-MM-DD HH:mm")}"
                                OR task.dueDate IS NULL
                                OR task.status = "Completed"
                                AND task.isDeleted = 0
                                )`),
                            [Op.notIn]: Sequelize.literal(`(SELECT DISTINCT
                                workstream.projectId
                            FROM
                                workstream
                            LEFT JOIN
                                task
                            ON task.workstreamId = workstream.id AND workstream.isDeleted = 0
                            WHERE task.dueDate < "${moment(queryString.dueDate, "YYYY-MM-DD")
                                    .utc()
                                    .format("YYYY-MM-DD HH:mm")}"
                            AND (task.status != "Completed" OR task.status IS NULL) AND task.isDeleted = 0
                            )`)
                        }
                    };
                    break;
                case "Issues":
                    whereObj["id"] = {
                        [Op.in]: Sequelize.literal(`(SELECT DISTINCT
                            workstream.projectId
                        FROM
                            workstream
                        LEFT JOIN
                            task
                        ON task.workstreamId = workstream.id AND workstream.isDeleted = 0
                        WHERE task.dueDate < "${moment(queryString.dueDate, "YYYY-MM-DD")
                                .utc()
                                .format("YYYY-MM-DD HH:mm")}"
                        AND (task.status != "Completed" OR task.status IS NULL) AND task.isDeleted = 0
                    )`)
                    };
                    break;
                default:
            }
        }

        if (queryString.typeId === "Inactive") {
            whereObj["isActive"] = [0];
        }

        async.parallel(
            {
                count: function (callback) {
                    try {
                        Projects.findAndCountAll({ ..._.omit(options, ["offset", "limit"]), where: whereObj, distinct: true }).then(response => {
                            const pageData = {
                                total_count: response.count,
                                ...(typeof queryString.page != "undefined" && queryString.page != "" ? { current_page: response.count > 0 ? _.toNumber(queryString.page) : 0, last_page: _.ceil(response.count / limit) } : {})
                            };
                            callback(null, pageData);
                        });
                    } catch (err) {
                        callback(err);
                    }
                },
                result: function (callback) {
                    try {
                        Projects.findAll({
                            ...options,
                            where: whereObj
                        })
                            .map(async res => {
                                const responseObj = res.toJSON();
                                const documentCount = _.filter(responseObj.document_link, ({ document }) => {
                                    return document != null;
                                }).length;
                                const projectUserMembers = _(responseObj.members)
                                    .map(o => {
                                        return o.userTypeLinkId;
                                    })
                                    .filter(o => {
                                        return o != null;
                                    })
                                    .uniq()
                                    .value();
                                const memberList = await Users.findAll({
                                    where: {
                                        id: projectUserMembers
                                    },
                                    attributes: ["id", "firstName", "lastName", "avatar", "emailAddress"]
                                }).map(o => {
                                    const userResponse = o.toJSON();
                                    const membersResponse = _.find(responseObj.members, { userTypeLinkId: userResponse.id })
                                    return {
                                        ...userResponse,
                                        member_id: membersResponse.id,
                                        isActive: membersResponse.isActive
                                    };
                                });

                                let projectManagerId = "";

                                if (responseObj.members) {
                                    projectManagerId = responseObj.members.filter(e => {
                                        return e.memberType === "project manager";
                                    })[0].userTypeLinkId;
                                }

                                const resToReturn = {
                                    ...responseObj,
                                    projectManagerId: projectManagerId ? projectManagerId : "",
                                    newDocuments: documentCount,
                                    members: memberList
                                };
                                return _.omit(resToReturn, "projectManager", "document_link");
                            })
                            .then(res => {
                                callback(null, res);
                            });
                    } catch (err) {
                        callback(err);
                    }
                }
            },
            async (err, results) => {
                if (err != null) {
                    cb({ status: false, error: err });
                } else {
                    const projectResults = results.result;
                    const projectIds = _.map(projectResults, projectResult => {
                        return projectResult.id;
                    });
                    const dueDate = queryString.dueDate || new Date();
                    const startMonth = moment()
                        .startOf("year")
                        .utc()
                        .format("YYYY-MM-DD HH:mm");
                    const endMonth = moment(dueDate, "YYYY-MM-DD")
                        .endOf("month")
                        .utc()
                        .format("YYYY-MM-DD HH:mm");

                    try {
                        const projectCompletionStack = await Tasks.findAll({
                            group: ["projectId"],
                            where: {
                                isDeleted: 0,
                                projectId: projectIds,
                                ...(typeof queryString.dueDate != "undefined" && queryString.dueDate != ""
                                    ? {
                                        dueDate: {
                                            [Op.between]: [startMonth, endMonth]
                                        }
                                    }
                                    : {})
                            },
                            attributes: [
                                "projectId",
                                [models.sequelize.literal("COUNT(DISTINCT CASE WHEN task.id <> 0 AND task.isDeleted = 0 THEN task.id END)"), "total_tasks"],
                                [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status = "Completed" AND task.isDeleted = 0 THEN task.id END)'), "completed"],
                                [
                                    models.sequelize.literal(
                                        'COUNT(DISTINCT CASE WHEN task.dueDate < "' +
                                        moment(dueDate, "YYYY-MM-DD")
                                            .utc()
                                            .format("YYYY-MM-DD HH:mm") +
                                        '" AND task.status = "In Progress" AND task.isDeleted = 0 THEN task.id END)'
                                    ),
                                    "issues"
                                ],
                                [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status = "For Approval" AND task.isDeleted = 0 THEN task.id END)'), "for_approval"],
                                [
                                    models.sequelize.literal(
                                        'COUNT(DISTINCT CASE WHEN task.dueDate = "' +
                                        moment(dueDate, "YYYY-MM-DD")
                                            .utc()
                                            .format("YYYY-MM-DD HH:mm") +
                                        '" AND task.status = "In Progress" AND task.isDeleted = 0 THEN task.id END)'
                                    ),
                                    "due_today"
                                ]
                            ]
                        }).map(response => {
                            return response.toJSON();
                        });
                        const projectStack = _.map(projectResults, obj => {
                            const completionRate = _.find(projectCompletionStack, { projectId: obj.id });
                            return {
                                ...obj,
                                numberOfTasks: typeof completionRate != "undefined" ? completionRate.total_tasks : 0,
                                completion_rate: {
                                    tasks_due_today: {
                                        value: typeof completionRate != "undefined" ? (completionRate.due_today / completionRate.total_tasks) * 100 : 0,
                                        color: "#f6dc64",
                                        count: typeof completionRate != "undefined" ? completionRate.due_today : 0
                                    },
                                    tasks_for_approval: {
                                        value: typeof completionRate != "undefined" ? (completionRate.for_approval / completionRate.total_tasks) * 100 : 0,
                                        color: "#ff754a",
                                        count: typeof completionRate != "undefined" ? completionRate.for_approval : 0
                                    },
                                    delayed_task: {
                                        value: typeof completionRate != "undefined" ? (completionRate.issues / completionRate.total_tasks) * 100 : 0,
                                        color: "#f9003b",
                                        count: typeof completionRate != "undefined" ? completionRate.issues : 0
                                    },
                                    completed: {
                                        value: typeof completionRate != "undefined" ? (completionRate.completed / completionRate.total_tasks) * 100 : 0,
                                        color: "#00e589",
                                        count: typeof completionRate != "undefined" ? completionRate.completed : 0
                                    }
                                }
                            };
                        });
                        cb({ status: true, data: { ...results, result: projectStack } });
                    } catch (err) {
                        cb({ status: false, error: err });
                    }
                }
            }
        );
    },
    getById: async (req, cb) => {
        // if (!projectAuth({ user: req.user, projectId: req.params.id, action: "get" }) || !req.params.id) {
        //     cb({ status: false, error: "Unauthorized Access" });
        //     return;
        // }

        const id = req.params.id,
            queryString = req.query;
        let associationIncludes = [],
            hasInfo = parseInt(queryString.info) ? true : false;

        if (hasInfo) {
            associationIncludes = [
                {
                    model: Type,
                    as: "type",
                    required: false,
                    attributes: ["type"]
                },
                {
                    model: Users,
                    as: "creator",
                    required: true,
                    attributes: ["id", "firstName", "lastName", "avatar"]
                },
                {
                    model: Members,
                    as: "projectManager",
                    where: {
                        memberType: "project manager"
                    },
                    required: false,
                    include: [
                        {
                            model: Users,
                            as: "user",
                            required: false,
                            attributes: ["id", "firstName", "lastName", "avatar"]
                        }
                    ],
                    attributes: ["id", "userTypeLinkId"]
                },
                {
                    model: Members,
                    as: "members",
                    where: {
                        usersType: "users",
                        linkType: "project",
                        isDeleted: 0
                    },
                    required: false,
                    attributes: ["id", "userTypeLinkId", 'isActive']
                },
                {
                    model: Members,
                    as: "team",
                    where: {
                        usersType: "team",
                        linkType: "project",
                        isDeleted: 0
                    },
                    required: false,
                    include: [
                        {
                            model: Teams,
                            as: "team",
                            required: false,
                            include: [
                                {
                                    model: UsersTeam,
                                    as: "users_team",
                                    required: false,
                                    include: [
                                        {
                                            model: Users,
                                            as: "user",
                                            required: false
                                        }
                                    ],
                                    attributes: ["id"]
                                }
                            ],
                            attributes: ["id"]
                        }
                    ],
                    attributes: ["id", 'isActive']
                }
            ];
        }
        try {
            Projects.findOne({
                include: associationIncludes,
                where: { id: id, ...(queryString.action && queryString.action === "edit" ? {} : { isActive: 1 }) }
            }).then(async res => {
                if (res) {
                    const responseObj = res.toJSON();
                    let projectUserMembers = [];
                    let memberList = [];
                    if (hasInfo) {
                        projectUserMembers = _(responseObj.members)
                            .map(o => {
                                return o.userTypeLinkId;
                            })
                            .filter(o => {
                                return o != null;
                            })
                            .uniq()
                            .value();
                        memberList = await Users.findAll({
                            where: {
                                id: projectUserMembers
                            },
                            attributes: ["id", "firstName", "lastName", "avatar", "emailAddress"]
                        }).map(o => {
                            const userResponse = o.toJSON();
                            const projectMembersResponse = _.find(responseObj.members, { userTypeLinkId: userResponse.id })
                            return {
                                ...userResponse,
                                member_id: projectMembersResponse.id,
                                isActive: projectMembersResponse.isActive
                            };
                        });
                    }

                    const resToReturn = {
                        ...responseObj,
                        projectManagerId: hasInfo && responseObj.projectManager.length > 0 ? responseObj.projectManager[0].userTypeLinkId : "",
                        members: memberList
                    };
                    cb({ status: true, data: resToReturn });
                } else {
                    cb({ status: true }); // TO HANDLE STATUS CODE
                }
            });
        } catch (err) {
            cb({ status: false, error: err });
        }
    },
    getByType: async (req, cb) => {
        const queryString = req.query;
        if (queryString.typeId && req.user && req.user.user_role[0].roleId) {
            const userId = req.user.id;
            const userRole = req.user.user_role[0].roleId;
            const limit = 5;
            const options = {
                include: [
                    {
                        model: Type,
                        as: "type",
                        required: false,
                        attributes: ["type"]
                    }
                ],
                ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * parseInt(queryString.page) - limit, limit } : {})
            };
            const whereObj = {
                ...{ isDeleted: 0 },
                ...{ isActive: 1 },
                ...(typeof queryString.typeId != "undefined" && queryString.typeId != "" ? { typeId: parseInt(queryString.typeId) } : {})
            };

            if (typeof userId != "undefined" && userId != "" && (typeof userRole != "undefined" && userRole >= 3)) {
                const userTeam = await UsersTeam.findAll({
                    where: {
                        usersId: userId
                    }
                }).map(res => {
                    return res.toJSON();
                });
                const projectMembers = await Members.findAll({
                    where: {
                        [Op.or]: [
                            {
                                usersType: "users",
                                userTypeLinkId: userId,
                                linkType: "project",
                                isDeleted: 0
                            },
                            {
                                usersType: "team",
                                userTypeLinkId: _.map(userTeam, o => {
                                    return o.teamId;
                                }),
                                linkType: "project",
                                isDeleted: 0
                            }
                        ]
                    }
                }).map(res => {
                    return res.toJSON();
                });

                if (userRole > 4 && typeof queryString.typeId == "undefined") {
                    whereObj["typeId"] = 1;
                }

                whereObj[Sequelize.Op.or] = [
                    {
                        id: _(projectMembers)
                            .uniqBy("linkId")
                            .map(o => {
                                return o.linkId;
                            })
                            .value()
                    },
                    {
                        createdBy: userId
                    }
                ];
            }

            async.parallel(
                {
                    count: function (callback) {
                        try {
                            Projects.findAndCountAll({ where: whereObj }).then(response => {
                                const pageData = {
                                    total_count: response.count,
                                    ...(typeof queryString.page != "undefined" && queryString.page != "" ? { current_page: response.count > 0 ? parseInt(queryString.page) : 0, last_page: _.ceil(response.count / limit) } : {})
                                };
                                callback(null, pageData);
                            });
                        } catch (err) {
                            callback(err);
                        }
                    },
                    result: function (callback) {
                        try {
                            Projects.findAll({
                                ...options,
                                where: whereObj
                            }).then(res => {
                                callback(null, res);
                            });
                        } catch (err) {
                            callback(err);
                        }
                    }
                },
                (err, results) => {
                    if (err) {
                        cb({ status: false, message: "Something went wrong." });
                    } else {
                        cb({ status: true, data: { ...results } });
                    }
                }
            );
        } else {
            cb({ status: false, error: "Unauthorized Access" });
        }
    },
    getProjectMembers: async (req, cb) => {
        const queryString = req.query;

        // if (!projectAuth({ user: req.user, projectId: queryString.linkId, action: "get" }) || !queryString.linkType || !queryString.linkId) {
        //     cb({ status: false, error: "Unauthorized Access" });
        //     return;
        // }

        const whereObj = {
            linkType: queryString.linkType,
            linkId: queryString.linkId,
            ...(typeof queryString.usersType != "undefined" && queryString.usersType != ""
                ? { usersType: queryString.usersType }
                : {}),
            ...(typeof queryString.isActive != "undefined" && queryString.isAcive != ''
                ? { isActive: queryString.isActive }
                : {}),
            isDeleted: 0
        };

        try {
            const memberList = await Members.findAll({
                where: whereObj
            }).map(o => {
                return o.toJSON();
            });

            const userMembers = _.filter(memberList, o => {
                return o.usersType == "users";
            });
            const teamMembers = _.filter(memberList, o => {
                return o.usersType == "team";
            });
            async.parallel(
                {
                    users: parallelCallback => {
                        const userIds = _.map(userMembers, o => {
                            return o.userTypeLinkId;
                        });
                        parallelCallback(null, userIds);
                    },
                    team_users: parallelCallback => {
                        const teamIds = _.map(teamMembers, o => {
                            return o.userTypeLinkId;
                        });
                        async.parallel(
                            {
                                team_leaders: parallelCallback => {
                                    Teams.findAll({
                                        where: {
                                            id: teamIds
                                        }
                                    })
                                        .map(o => {
                                            return o.toJSON();
                                        })
                                        .then(res => {
                                            const teamLeadUserIds = _.map(res, o => {
                                                return o.teamLeaderId;
                                            });
                                            parallelCallback(null, teamLeadUserIds);
                                        });
                                },
                                team_members: parallelCallback => {
                                    UsersTeam.findAll({
                                        where: {
                                            teamId: teamIds
                                        }
                                    })
                                        .map(o => {
                                            return o.toJSON();
                                        })
                                        .then(res => {
                                            const teamUserIds = _.map(res, o => {
                                                return o.usersId;
                                            });
                                            parallelCallback(null, teamUserIds);
                                        });
                                }
                            },
                            (err, res) => {
                                const returnStack = [...res.team_leaders, ...res.team_members];
                                parallelCallback(null, returnStack);
                            }
                        );
                    }
                },
                async (err, results) => {
                    let userMemberIds = _.uniq([...results.users, ...results.team_users]);
                    if ((typeof queryString.project_type != "undefined" && queryString.project_type != "") || (typeof queryString.memberType != "undefined" && queryString.memberType != "")) {
                        userMemberIds = await UsersRole.findAll({
                            where: {
                                ...((typeof queryString.project_type != "undefined" && queryString.project_type == "Client") || (typeof queryString.memberType != "undefined" && queryString.memberType == "approver")
                                    ? {
                                        roleId: {
                                            [Op.notIn]: [4, 6]
                                        }
                                    }
                                    : {}),
                                ...(typeof queryString.project_type != "undefined" && queryString.project_type == "Private"
                                    ? {
                                        roleId: {
                                            [Op.lte]: 4
                                        }
                                    }
                                    : {}),
                                ...(typeof queryString.project_type != "undefined" && queryString.project_type == "Client" && typeof queryString.memberType != "undefined" && queryString.memberType == "responsible"
                                    ? {
                                        roleId: {
                                            [Op.lte]: 3
                                        }
                                    }
                                    : {}),
                                usersId: userMemberIds
                            }
                        }).map(o => {
                            const { usersId } = o.toJSON();
                            return usersId;
                        });
                    }
                    Users.findAll({
                        where: {
                            id: userMemberIds,
                            ...(typeof queryString.memberName != "undefined" && queryString.memberName != ""
                                ? {
                                    [Op.or]: [
                                        Sequelize.where(Sequelize.fn("lower", Sequelize.col("users.firstName")), {
                                            [Sequelize.Op.like]: sequelize.fn("lower", `%${queryString.memberName}%`)
                                        }),
                                        Sequelize.where(Sequelize.fn("lower", Sequelize.col("users.lastName")), {
                                            [Sequelize.Op.like]: sequelize.fn("lower", `%${queryString.memberName}%`)
                                        }),
                                        Sequelize.where(Sequelize.fn("lower", Sequelize.col("users.username")), {
                                            [Sequelize.Op.like]: sequelize.fn("lower", `%${queryString.memberName}%`)
                                        })
                                    ]
                                }
                                : {}),
                            ...(typeof queryString.userType != "undefined" && queryString.userType != ""
                                ? {
                                    userType: queryString.userType
                                }
                                : {})
                        },
                        include: [
                            {
                                model: Teams,
                                separate: true,
                                as: "team_as_teamLeader",
                                where: {
                                    isDeleted: 0
                                },
                                required: false
                            },
                            {
                                model: UsersRole,
                                separate: true,
                                as: "user_role",
                                include: [
                                    {
                                        model: Roles,
                                        as: "role"
                                    }
                                ],
                                required: false
                            },
                            {
                                model: UsersTeam,
                                as: "users_team",
                                separate: true,
                                where: {
                                    isDeleted: 0
                                },
                                include: [
                                    {
                                        model: Teams,
                                        as: "team",
                                        where: {
                                            isDeleted: 0
                                        }
                                    }
                                ],
                                required: false
                            }
                        ]
                    })
                        .map(o => {
                            const responseObj = o.toJSON();
                            const userTeams = _.map(responseObj.users_team, o => {
                                return o.team;
                            });
                            const teamArray = [...userTeams, ...responseObj.team_as_teamLeader];
                            const memberByTeam = _.filter(teamArray, o => {
                                const checkIndex = _.findIndex(teamMembers, teamMember => {
                                    return teamMember.userTypeLinkId == o.id;
                                });
                                return checkIndex >= 0;
                            });
                            return {
                                ...responseObj,
                                team: _.uniqBy(teamArray, o => {
                                    return o.id;
                                }),
                                memberByTeam
                            };
                        })
                        .then(res => {
                            cb({
                                status: true,
                                data: res
                            });
                        });
                }
            );
        } catch (err) {
            cb({
                status: false,
                error: err
            });
        }
    },
    getProjectTeams: async (req, cb) => {
        const queryString = req.query;

        // if (!projectAuth({ user: req.user, projectId: queryString.linkId, action: "get" }) || !queryString.linkType || !queryString.linkId) {
        //     cb({ status: false, error: "Unauthorized Access" });
        //     return;
        // }

        const whereObj = {
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != ""
                ? {
                    linkType: queryString.linkType
                }
                : {}),
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != ""
                ? {
                    linkId: queryString.linkId
                }
                : {}),
            ...(typeof queryString.usersType != "undefined" && queryString.usersType != ""
                ? {
                    usersType: queryString.usersType
                }
                : {})
        };

        try {
            Members.findAll({
                where: whereObj,
                include: [
                    {
                        model: Teams,
                        as: "team",
                        include: [
                            {
                                model: Users,
                                as: "teamLeader"
                            },
                            {
                                model: UsersTeam,
                                as: "users_team",
                                include: [
                                    {
                                        model: Users,
                                        as: "user",
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
                                                model: UsersTeam,
                                                as: "team",
                                                include: [
                                                    {
                                                        model: Teams,
                                                        as: "team"
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }).then(res => {
                cb({
                    status: true,
                    data: res
                });
            });
        } catch (err) {
            cb({
                status: false,
                error: err
            });
        }
    }
};

exports.post = {
    index: async (req, cb) => {
        let d = { ...req.body, picture: "https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/production/project_pictures/default.png", color: typeof req.body.color !== "undefined" ? req.body.color : "#fff" };
        if (req.body.project && req.body.projectManagerId && req.body.typeId && req.body.color) {
            // const hasAccess = await projectAuth({ user: req.user, action: "post" });
            // if (!hasAccess) {
            //     cb({ status: false, error: "Unauthorized Access" });
            //     return;
            // }
            sequence
                .create()
                .then(nextThen => {
                    if (d.typeId !== 3) {
                        Projects.findAll({
                            where: { project: d.project }
                        }).then(res => {
                            if (res.length) {
                                cb({ status: true, data: { error: true, message: "Project name aleady exists." } });
                            } else {
                                nextThen();
                            }
                        });
                    } else {
                        Projects.findAll({
                            where: { project: d.project, typeId: d.typeId, createdBy: d.createdBy }
                        }).then(res => {
                            if (res.length) {
                                cb({ status: true, data: { error: true, message: "Project name aleady exists." } });
                            } else {
                                nextThen();
                            }
                        });
                    }
                })
                .then(nextThen => {
                    Projects.create(d).then(res => {
                        nextThen(res);
                    });
                })
                .then((nextThen, result) => {
                    const workstreamData = {
                        projectId: result.dataValues.id,
                        workstream: "Default Workstream",
                        typeId: 4,
                        color: "#7ed321"
                    };

                    Workstream.create(workstreamData).then(res => {
                        nextThen({ project_result: result.toJSON(), workstream_result: res.toJSON() });
                    });
                })
                .then((nextThen, { project_result, workstream_result }) => {
                    let result = project_result;
                    let projectMembersData = [
                        {
                            linkId: result.id,
                            linkType: "project",
                            usersType: "users",
                            userTypeLinkId: d.projectManagerId,
                            memberType: "project manager"
                        },
                        {
                            linkId: workstream_result.id,
                            linkType: "workstream",
                            usersType: "users",
                            userTypeLinkId: d.projectManagerId,
                            memberType: "responsible"
                        }
                    ];
                    if (result.typeId === 3) {
                        projectMembersData.push({
                            linkId: result.id,
                            linkType: "project",
                            memberType: "assignedTo",
                            userTypeLinkId: d.projectManagerId,
                            usersType: "users"
                        })
                    }
                    Members.bulkCreate(projectMembersData).then(res => {
                        Members.findAll({
                            where: {
                                [Op.or]: [
                                    {
                                        linkId: result.id,
                                        linkType: "project",
                                        usersType: "users",
                                        userTypeLinkId: d.projectManagerId,
                                        memberType: "project manager"
                                    }
                                ]
                            },
                            include: [
                                {
                                    model: Users,
                                    as: "user",
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
                                            model: UsersTeam,
                                            as: "team"
                                        }
                                    ]
                                }
                            ]
                        })
                            .map(mapObject => {
                                return mapObject.toJSON();
                            })
                            .then(findRes => {
                                nextThen(result, findRes);
                            });
                    });
                })
                .then((nextThen, project, members) => {
                    Projects.findOne({
                        where: { id: project.id },
                        include: [
                            {
                                model: Type,
                                as: "type",
                                required: false
                            },
                            {
                                model: Members,
                                as: "projectManager",
                                where: {
                                    memberType: "project manager"
                                },
                                required: false,
                                attributes: []
                            },
                            {
                                model: Tasks,
                                as: "taskActive",
                                attributes: [],
                                required: false
                            },
                            {
                                model: Tasks,
                                as: "taskOverDue",
                                where: {
                                    dueDate: { [Op.lt]: moment.utc().format("YYYY-MM-DD") },
                                    status: {
                                        [Op.or]: {
                                            [Op.not]: "Completed",
                                            [Op.eq]: null
                                        }
                                    }
                                },
                                required: false,
                                attributes: []
                            },
                            {
                                model: Tasks,
                                as: "taskDueToday",
                                where: Sequelize.where(Sequelize.fn("date", Sequelize.col("taskDueToday.dueDate")), "=", moment().format("YYYY-MM-DD 00:00:00")),
                                required: false,
                                attributes: []
                            }
                        ]
                    }).then(res => {
                        cb({ status: true, data: { project: { ...res.toJSON(), projectManagerId: d.projectManagerId }, members: members } });
                    });
                });
        } else {
            cb({ status: false, error: "Unauthorized Access" });
        }
    },
    projectMember: async (req, cb) => {
        const queryString = req.query;
        const { usersType, userTypeLinkId, linkType, linkId, memberType } = { ...req.body };

        if (usersType && userTypeLinkId && linkType && linkId && memberType && queryString.projectType) {
            // const hasAccess = await projectAuth({ user: req.user, projectId: linkId, action: "post" });
            // if (!hasAccess) {
            //     cb({ status: false, error: "Unauthorized Access" });
            //     return;
            // }

            let projectType = queryString.projectType;

            if (usersType == "users") {
                try {
                    Members.create(req.body).then(res => {
                        Members.findOne({
                            where: req.body,
                            include: [
                                {
                                    model: Users,
                                    as: "user",
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
                                            model: UsersTeam,
                                            as: "team"
                                        }
                                    ]
                                }
                            ]
                        }).then(findRes => {
                            cb({
                                status: true,
                                data: [findRes]
                            });
                        });
                        return null;
                    });
                } catch (err) {
                    cb({
                        status: false,
                        error: err
                    });
                }
            } else {
                async.waterfall(
                    [
                        function (callback) {
                            try {
                                UsersTeam.findAll({
                                    where: {
                                        teamId: userTypeLinkId
                                    },
                                    include: [
                                        {
                                            model: Users,
                                            as: "user"
                                        }
                                    ]
                                })
                                    .map(res => {
                                        return { id: res.usersId, userType: res.user.toJSON().userType };
                                    })
                                    .then(res => {
                                        callback(null, res);
                                    });
                            } catch (err) {
                                callback(err);
                            }
                        },
                        function (users, callback) {
                            try {
                                if (projectType && projectType === "Internal") {
                                    const isExternalUser = _.find(users, { userType: "External" });
                                    if (isExternalUser) {
                                        cb({
                                            status: true,
                                            data: {
                                                hasError: true,
                                                message: "Unable to add team, Please make sure the members of this team are Internal users only"
                                            }
                                        });
                                    } else {
                                        const usersId = users.map(({ id }) => {
                                            return id;
                                        });
                                        callback(null, usersId);
                                    }
                                } else {
                                    const usersId = users.map(({ id }) => {
                                        return id;
                                    });
                                    callback(null, usersId);
                                }
                            } catch (err) {
                                callback(err);
                            }
                        },
                        function (userIds, callback) {
                            try {
                                Members.update(
                                    { isDeleted: 1 },
                                    {
                                        where: {
                                            userTypeLinkId: userIds,
                                            usersType: "users",
                                            linkType: "project",
                                            linkId: linkId,
                                            memberType: { [Op.ne]: "project manager" }
                                        }
                                    }
                                ).then(res => {
                                    callback(null, res);
                                    return null;
                                });
                            } catch (err) {
                                callback(err);
                            }
                        },
                        function (usersIds, callback) {
                            try {
                                Members.create(req.body).then(res => {
                                    callback(null, res.dataValues.id);
                                    return null;
                                });
                            } catch (err) {
                                callback(err);
                            }
                        },
                        function (teamId, callback) {
                            try {
                                Members.findOne({
                                    where: {
                                        id: teamId
                                    },
                                    include: [
                                        {
                                            model: Teams,
                                            as: "team",
                                            include: [
                                                {
                                                    model: Users,
                                                    as: "teamLeader"
                                                },
                                                {
                                                    model: UsersTeam,
                                                    as: "users_team",
                                                    include: [
                                                        {
                                                            model: Users,
                                                            as: "user",
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
                                                                    model: UsersTeam,
                                                                    as: "team"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }).then(findRes => {
                                    callback(null, findRes);
                                    return null;
                                });
                            } catch (err) {
                                callback(err);
                            }
                        }
                    ],
                    function (err, result) {
                        if (err != null) {
                            cb({
                                status: false,
                                error: err
                            });
                        } else {
                            cb({
                                status: true,
                                data: [result]
                            });
                        }
                    }
                );
            }
        } else {
            cb({ status: false, error: "Unauthorized Access" });
        }
    },
    upload: async (req, cb) => {
        if (req.query.projectId) {
            // const hasAccess = await projectAuth({ user: req.user, projectId: req.query.projectId, action: "post" });
            // if (!hasAccess) {
            //     cb({ status: false, error: "Unauthorized Access" });
            //     return;
            // }

            const formidable = global.initRequire("formidable");
            const func = global.initFunc();
            let form = new formidable.IncomingForm();
            let files = [];
            let type = "project_pictures";
            let projectId = "";

            form.multiples = false;
            files.push(
                new Promise((resolve, reject) => {
                    form.on("field", function (name, field) {
                        projectId = field;
                    }).on("file", function (field, file) {
                        const date = new Date();
                        const Id = func.generatePassword(date.getTime() + file.name, "attachment");
                        const filename = Id + file.name.replace(/[^\w.]|_/g, "_");
                        func.uploadFile(
                            {
                                file: file,
                                form: type,
                                filename: filename
                            },
                            response => {
                                if (response.Message == "Success") {
                                    resolve({
                                        filename: filename,
                                        origin: file.name,
                                        Id: Id,
                                        projectId
                                    });
                                } else {
                                    reject();
                                }
                            }
                        );
                    });
                })
            );

            Promise.all(files).then(e => {
                if (e.length > 0) {
                    const { filename, projectId } = e[0];
                    Projects.update({ picture: filename }, { where: { id: projectId } }).then(res => {
                        cb({ status: true, data: filename });
                    });
                } else {
                    cb({ status: false, data: [] });
                }
            });
            // log any errors that occur
            form.on("error", function (err) {
                cb({ status: false, error: "Upload error. Please try again later." });
            });
            form.parse(req);
        } else {
            cb({ status: false, error: "Unauthorized Access" });
        }
    }
};

exports.put = {
    index: async (req, cb) => {
        if (req.params.id) {
            // const hasAccess = await projectAuth({ user: req.user, projectId: req.params.id, action: "post" });
            // if (!hasAccess) {
            //     cb({ status: false, error: "Unauthorized Access" });
            //     return;
            // }

            const id = req.params.id,
                dataToSubmit = req.body;

            sequence
                .create()
                .then(nextThen => {
                    if (dataToSubmit.typeId !== 3) {
                        Projects.findAll({
                            raw: true,
                            where: { project: dataToSubmit.project },
                            order: [["projectNameCount", "DESC"]]
                        }).then(res => {
                            if (res.length) {
                                let existingData = res.filter(f => f.id == id);
                                if (existingData.length == 0) {
                                    dataToSubmit.projectNameCount = res[0].projectNameCount + 1;
                                }
                                nextThen();
                            } else {
                                dataToSubmit.projectNameCount = 0;
                                nextThen();
                            }
                        });
                    } else {
                        Projects.findAll({
                            raw: true,
                            where: { project: dataToSubmit.project, createdBy: dataToSubmit.updatedBy },
                            order: [["projectNameCount", "DESC"]]
                        }).then(res => {
                            if (res.length) {
                                cb({ status: true, data: { error: true, message: "Project name aleady exists." } });
                            } else {
                                nextThen();
                            }
                        });
                    }
                })
                .then(nextThen => {
                    Projects.update(_.omit(dataToSubmit, ["updatedBy"]), {
                        where: { id: id }
                    }).then(res => {
                        nextThen(res);
                    });
                })
                .then(async (nextThen, result) => {
                    const currentProjectManager = await Members.findOne({
                        where: { linkType: "project", linkId: id, usersType: "users", memberType: "project manager" }
                    }).then(o => {
                        return o.toJSON();
                    });

                    if (dataToSubmit.projectManagerId != currentProjectManager.userTypeLinkId) {
                        await Members.update(
                            { memberType: "assignedTo" },
                            {
                                where: {
                                    linkType: "project",
                                    linkId: id,
                                    usersType: "users",
                                    userTypeLinkId: currentProjectManager.userTypeLinkId,
                                    memberType: "project manager"
                                }
                            }
                        );
                    }
                    Members.destroy({
                        where: { linkType: "project", linkId: id, usersType: "users", memberType: "project manager" }
                    }).then(res => {
                        nextThen(result);
                    });
                })
                .then((nextThen, result) => {
                    if (dataToSubmit.projectManagerId != "") {
                        Members.create({ linkType: "project", linkId: id, usersType: "users", memberType: "project manager", userTypeLinkId: dataToSubmit.projectManagerId }).then(res => {
                            Members.findAll({
                                where: { id: res.dataValues.id },
                                include: [
                                    {
                                        model: Users,
                                        as: "user",
                                        include: [
                                            {
                                                model: UsersRole,
                                                as: "user_role"
                                            },
                                            {
                                                model: UsersTeam,
                                                as: "team"
                                            }
                                        ]
                                    }
                                ]
                            }).then(findRes => {
                                nextThen(findRes);
                            });
                        });
                    } else {
                        nextThen([]);
                    }
                })
                .then((nextThen, members) => {
                    Projects.findOne({
                        where: { id: id },
                        include: [
                            {
                                model: Type,
                                as: "type",
                                required: false
                            },
                            {
                                model: Members,
                                as: "projectManager",
                                where: {
                                    memberType: "project manager"
                                },
                                required: false,
                                attributes: []
                            },
                            {
                                model: Tasks,
                                as: "taskActive",
                                attributes: [],
                                required: false
                            },
                            {
                                model: Tasks,
                                as: "taskOverDue",
                                where: Sequelize.where(Sequelize.fn("date", Sequelize.col("taskOverDue.dueDate")), "<", moment().format("YYYY-MM-DD 00:00:00")),
                                required: false,
                                attributes: []
                            },
                            {
                                model: Tasks,
                                as: "taskDueToday",
                                where: Sequelize.where(Sequelize.fn("date", Sequelize.col("taskDueToday.dueDate")), "=", moment().format("YYYY-MM-DD 00:00:00")),
                                required: false,
                                attributes: []
                            }
                        ]
                    }).then(res => {
                        cb({ status: true, data: { project: { ...res.toJSON() }, members: members } });
                    });
                });
        } else {
            cb({ status: false, error: "Unauthorized Access" });
        }
    },
    archive: async (req, cb) => {
        const dataToSubmit = req.body;
        const id = req.params.id;

        try {
            Projects.update(
                { ...dataToSubmit },
                {
                    where: {
                        id: id
                    }
                }
            ).then(res => {
                cb({
                    status: true,
                    data: id
                });
            });
        } catch (err) {
            cb({
                status: false,
                error: err
            });
        }
    },
    projectMember: (req, cb) => {
        let d = req.body;
        let filter = d.filter;
        try {
            Members.update(d.data, {
                where: filter
            }).then(res => {
                cb({
                    status: true,
                    data: res
                });
            });
        } catch (err) {
            cb({
                status: false,
                error: err
            });
        }
    },
    projectMemberStatus: async (req, cb) => {
        let body = req.body;

        const memberId = req.params.id;

        if (body.isActive === 0) {

            const checkMember = await Members.findOne({ where: { id: memberId } }).then(o => {
                return o.toJSON();
            });

            const projectId = req.query.project_id;
            const taskList = await Tasks.findAll({ where: { projectId, isDeleted: 0 } }).map(o => {
                return o.toJSON();
            });


            if (checkMember.usersType == "team") {
                const usersTeam = await UsersTeam.findAll({ where: { teamId: checkMember.userTypeLinkId, isDeleted: 0 } }).map(o => {
                    return o.toJSON();
                });
                const userIdStack = _.map(usersTeam, o => {
                    return o.usersId;
                });
                const teamMemberList = await Members.findAll({
                    where: {
                        [Op.or]: [
                            {
                                memberType: "assignedTo",
                                linkType: "task",
                                linkId: _.map(taskList, ({ id }) => {
                                    return id;
                                }),
                                usersType: "users",
                                userTypeLinkId: userIdStack,
                                isDeleted: 0
                            },
                            {
                                memberType: "approver",
                                linkType: "task",
                                linkId: _.map(taskList, ({ id }) => {
                                    return id;
                                }),
                                usersType: "users",
                                userTypeLinkId: userIdStack,
                                isDeleted: 0
                            },
                            {
                                memberType: "responsible",
                                linkType: "workstream",
                                linkId: _.map(taskList, ({ workstreamId }) => {
                                    return workstreamId;
                                }),
                                usersType: "users",
                                userTypeLinkId: userIdStack,
                                isDeleted: 0
                            }
                        ]
                    }
                }).map(o => {
                    return o.toJSON();
                });
                if (teamMemberList.length > 0) {
                    const taskCount = await Tasks.findAll({
                        group: ["status"],
                        where: {
                            isDeleted: 0,
                            id: _(teamMemberList)
                                .filter(({ linkType }) => {
                                    return linkType == "task";
                                })
                                .map(({ linkId }) => {
                                    return linkId;
                                })
                                .value()
                        },
                        attributes: ["status", [models.sequelize.literal("COUNT(*)"), "count"]]
                    }).map(response => {
                        return response.toJSON();
                    });

                    if (
                        _.filter(taskCount, ({ status }) => {
                            return status == "Completed";
                        }).length > 0
                    ) {
                        cb({ status: false, error: "The user(s) have already completed task for this project. Removal of his membership not allowed." });
                    } else if (
                        _.filter(taskCount, ({ status }) => {
                            return status == "In Progress";
                        }).length > 0
                    ) {
                        cb({ status: false, error: "The user(s) are currently assigned to an open task. Please re-assign the task first before removing the user from the project membership." });
                    } else {
                        cb({ status: false, error: "The user(s) are workstream responsible. Please change the responsible of the workstreams before removing the user from the project membership." });
                    }
                } else {
                    Members.update(
                        { isAcive: 0 },
                        {
                            where: {
                                [Op.or]: [
                                    { id: memberId },
                                    {
                                        memberType: "follower",
                                        linkType: "task",
                                        linkId: _.map(taskList, ({ id }) => {
                                            return id;
                                        }),
                                        usersType: "users",
                                        userTypeLinkId: userIdStack,
                                        isDeleted: 0
                                    }
                                ]
                            }
                        }
                    ).then(res => {
                        cb({ status: true, data: res });
                    });
                }
            } else {
                console.log(checkMember)
                const userMemberList = await Members.findAll({
                    where: {
                        [Op.or]: [
                            {
                                memberType: "assignedTo",
                                linkType: "task",
                                linkId: _.map(taskList, ({ id }) => {
                                    return id;
                                }),
                                usersType: "users",
                                userTypeLinkId: checkMember.userTypeLinkId,
                                isDeleted: 0
                            },
                            {
                                memberType: "approver",
                                linkType: "task",
                                linkId: _.map(taskList, ({ id }) => {
                                    return id;
                                }),
                                usersType: "users",
                                userTypeLinkId: checkMember.userTypeLinkId,
                                isDeleted: 0
                            },
                            {
                                memberType: "responsible",
                                linkType: "workstream",
                                linkId: _.map(taskList, ({ workstreamId }) => {
                                    return workstreamId;
                                }),
                                usersType: "users",
                                userTypeLinkId: checkMember.userTypeLinkId,
                                isDeleted: 0
                            }
                        ]
                    }
                }).map(o => {
                    return o.toJSON();
                });

                if (userMemberList.length > 0) {

                    const taskCount = await Tasks.findAll({
                        group: ["status"],
                        where: {
                            isDeleted: 0,
                            id: _(userMemberList)
                                .filter(({ linkType }) => {
                                    return linkType == "task";
                                })
                                .map(({ linkId }) => {
                                    return linkId;
                                })
                                .value()
                        },
                        attributes: ["status", [models.sequelize.literal("COUNT(*)"), "count"]]
                    }).map(response => {
                        return response.toJSON();
                    });

                    if (
                        _.filter(taskCount, ({ status }) => {
                            return status == "Completed";
                        }).length > 0
                    ) {
                        cb({ status: false, error: "This user has already completed task for this project. Removal of his membership not allowed." });
                    } else if (
                        _.filter(taskCount, ({ status }) => {
                            return status == "In Progress";
                        }).length > 0
                    ) {
                        cb({ status: false, error: "The user is currently assigned to an open task. Please re-assign the task first before removing the user from the project membership." });
                    } else {
                        cb({ status: false, error: "The user is a workstream responsible. Please change the responsible of the workstream before removing the user from the project membership." });
                    }

                } else {
                    Members.update(
                        { isActive: 0 },
                        {
                            where: {
                                [Op.or]: [
                                    { id: memberId },
                                    {
                                        memberType: "follower",
                                        linkType: "task",
                                        linkId: _.map(taskList, ({ id }) => {
                                            return id;
                                        }),
                                        usersType: "users",
                                        userTypeLinkId: checkMember.userTypeLinkId,
                                        isDeleted: 0
                                    }
                                ]
                            }
                        }
                    ).then(res => {
                        cb({ status: true, data: res });
                    });
                }
            }
        } else {
            Members.update(body, {
                where: { id: memberId }
            }).then(res => {
                cb({
                    status: true,
                    data: res
                })
            })
        }
    }
};

exports.delete = {
    index: async (req, cb) => {
        /* Temporary removed */
        cb({ status: false, error: "Unauthorized Access" });
        return;

        let d = req.params;

        try {
            const workstreamIds = await Workstream.findAll({ where: { projectId: d.id } }).map(o => {
                return o.id;
            });
            const taskIds = await Tasks.findAll({ where: { projectId: d.id } }).map(o => {
                return o.id;
            });
            const documentIds = await DocumentLink.findAll({ where: { linkType: "project", linkId: d.id } }).map(o => {
                return o.id;
            });

            async.parallel(
                {
                    projects: parallelCallback => {
                        Projects.destroy({
                            where: {
                                id: d.id
                            }
                        })
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    },
                    workstreams: parallelCallback => {
                        Workstream.destroy({
                            where: {
                                projectId: d.id
                            }
                        })
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    },
                    tasks: parallelCallback => {
                        Tasks.destroy({
                            where: {
                                projectId: d.id
                            }
                        })
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    },
                    notes: parallelCallback => {
                        Notes.destroy({
                            where: {
                                workstreamId: workstreamIds
                            }
                        })
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    },
                    checklist: parallelCallback => {
                        TaskChecklist.destroy({
                            where: {
                                taskId: taskIds
                            }
                        })
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    },
                    checklist_document: parallelCallback => {
                        ChecklistDocuments.destroy({
                            where: {
                                taskId: taskIds
                            }
                        })
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    },
                    conversation: parallelCallback => {
                        Conversation.destroy({
                            where: {
                                linkType: "task",
                                linkid: taskIds
                            }
                        })
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    },
                    members: parallelCallback => {
                        Members.update(
                            { isDeleted: 1 },
                            {
                                where: {
                                    [Op.or]: [
                                        {
                                            linkType: "project",
                                            linkId: d.id
                                        },
                                        {
                                            linkType: "workstream",
                                            linkId: workstreamIds
                                        },
                                        {
                                            linkType: "task",
                                            linkId: taskIds
                                        }
                                    ]
                                }
                            }
                        )
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    },
                    documents: parallelCallback => {
                        Document.destroy({
                            where: {
                                id: documentIds
                            }
                        })
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    },
                    documentLinks: parallelCallback => {
                        DocumentLink.destroy({
                            where: {
                                linkType: "project",
                                linkId: d.id
                            }
                        })
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    },
                    documentTags: parallelCallback => {
                        Tag.destroy({
                            where: {
                                tagType: "document",
                                tagTypeId: documentIds
                            }
                        })
                            .then(res => {
                                parallelCallback(null, res);
                            })
                            .catch(err => {
                                parallelCallback(err);
                            });
                    }
                },
                err => {
                    if (err != null) {
                        throw err;
                    } else {
                        cb({
                            status: true,
                            data: d.id
                        });
                    }
                }
            );
        } catch (error) {
            cb({
                status: false,
                data: error
            });
        }
    },
    deleteProjectMember: async (req, cb) => {
        const memberId = req.params.id;
        const checkMember = await Members.findOne({ where: { id: memberId } }).then(o => {
            return o.toJSON();
        });
        const projectId = req.query.project_id;
        const taskList = await Tasks.findAll({ where: { projectId, isDeleted: 0 } }).map(o => {
            return o.toJSON();
        });

        if (checkMember.usersType == "team") {
            const usersTeam = await UsersTeam.findAll({ where: { teamId: checkMember.userTypeLinkId, isDeleted: 0 } }).map(o => {
                return o.toJSON();
            });
            const userIdStack = _.map(usersTeam, o => {
                return o.usersId;
            });
            const teamMemberList = await Members.findAll({
                where: {
                    [Op.or]: [
                        {
                            memberType: "assignedTo",
                            linkType: "task",
                            linkId: _.map(taskList, ({ id }) => {
                                return id;
                            }),
                            usersType: "users",
                            userTypeLinkId: userIdStack,
                            isDeleted: 0
                        },
                        {
                            memberType: "approver",
                            linkType: "task",
                            linkId: _.map(taskList, ({ id }) => {
                                return id;
                            }),
                            usersType: "users",
                            userTypeLinkId: userIdStack,
                            isDeleted: 0
                        },
                        {
                            memberType: "responsible",
                            linkType: "workstream",
                            linkId: _.map(taskList, ({ workstreamId }) => {
                                return workstreamId;
                            }),
                            usersType: "users",
                            userTypeLinkId: userIdStack,
                            isDeleted: 0
                        }
                    ]
                }
            }).map(o => {
                return o.toJSON();
            });
            if (teamMemberList.length > 0) {
                const taskCount = await Tasks.findAll({
                    group: ["status"],
                    where: {
                        isDeleted: 0,
                        id: _(teamMemberList)
                            .filter(({ linkType }) => {
                                return linkType == "task";
                            })
                            .map(({ linkId }) => {
                                return linkId;
                            })
                            .value()
                    },
                    attributes: ["status", [models.sequelize.literal("COUNT(*)"), "count"]]
                }).map(response => {
                    return response.toJSON();
                });

                if (
                    _.filter(taskCount, ({ status }) => {
                        return status == "Completed";
                    }).length > 0
                ) {
                    cb({ status: false, error: "The user(s) have already completed task for this project. Removal of his membership not allowed." });
                } else if (
                    _.filter(taskCount, ({ status }) => {
                        return status == "In Progress";
                    }).length > 0
                ) {
                    cb({ status: false, error: "The user(s) are currently assigned to an open task. Please re-assign the task first before removing the user from the project membership." });
                } else {
                    cb({ status: false, error: "The user(s) are workstream responsible. Please change the responsible of the workstreams before removing the user from the project membership." });
                }
            } else {
                Members.update(
                    { isDeleted: 1 },
                    {
                        where: {
                            [Op.or]: [
                                { id: memberId },
                                {
                                    memberType: "follower",
                                    linkType: "task",
                                    linkId: _.map(taskList, ({ id }) => {
                                        return id;
                                    }),
                                    usersType: "users",
                                    userTypeLinkId: userIdStack,
                                    isDeleted: 0
                                }
                            ]
                        }
                    }
                ).then(res => {
                    cb({ status: true, data: memberId });
                });
            }
        } else {
            const userMemberList = await Members.findAll({
                where: {
                    [Op.or]: [
                        {
                            memberType: "assignedTo",
                            linkType: "task",
                            linkId: _.map(taskList, ({ id }) => {
                                return id;
                            }),
                            usersType: "users",
                            userTypeLinkId: checkMember.userTypeLinkId,
                            isDeleted: 0
                        },
                        {
                            memberType: "approver",
                            linkType: "task",
                            linkId: _.map(taskList, ({ id }) => {
                                return id;
                            }),
                            usersType: "users",
                            userTypeLinkId: checkMember.userTypeLinkId,
                            isDeleted: 0
                        },
                        {
                            memberType: "responsible",
                            linkType: "workstream",
                            linkId: _.map(taskList, ({ workstreamId }) => {
                                return workstreamId;
                            }),
                            usersType: "users",
                            userTypeLinkId: checkMember.userTypeLinkId,
                            isDeleted: 0
                        }
                    ]
                }
            }).map(o => {
                return o.toJSON();
            });
            if (userMemberList.length > 0) {
                const taskCount = await Tasks.findAll({
                    group: ["status"],
                    where: {
                        isDeleted: 0,
                        id: _(userMemberList)
                            .filter(({ linkType }) => {
                                return linkType == "task";
                            })
                            .map(({ linkId }) => {
                                return linkId;
                            })
                            .value()
                    },
                    attributes: ["status", [models.sequelize.literal("COUNT(*)"), "count"]]
                }).map(response => {
                    return response.toJSON();
                });

                if (
                    _.filter(taskCount, ({ status }) => {
                        return status == "Completed";
                    }).length > 0
                ) {
                    cb({ status: false, error: "This user has already completed task for this project. Removal of his membership not allowed." });
                } else if (
                    _.filter(taskCount, ({ status }) => {
                        return status == "In Progress";
                    }).length > 0
                ) {
                    cb({ status: false, error: "The user is currently assigned to an open task. Please re-assign the task first before removing the user from the project membership." });
                } else {
                    cb({ status: false, error: "The user is a workstream responsible. Please change the responsible of the workstream before removing the user from the project membership." });
                }
            } else {
                Members.update(
                    { isDeleted: 1 },
                    {
                        where: {
                            [Op.or]: [
                                { id: memberId },
                                {
                                    memberType: "follower",
                                    linkType: "task",
                                    linkId: _.map(taskList, ({ id }) => {
                                        return id;
                                    }),
                                    usersType: "users",
                                    userTypeLinkId: checkMember.userTypeLinkId,
                                    isDeleted: 0
                                }
                            ]
                        }
                    }
                ).then(res => {
                    cb({ status: true, data: memberId });
                });
            }
        }
    }
};
