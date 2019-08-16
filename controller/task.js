const async = require("async");
const _ = require("lodash");
const moment = require("moment");
const models = require("../modelORM");
const {
    ChecklistDocuments,
    Document,
    DocumentRead,
    TaskDependency,
    Tasks,
    Members,
    TaskChecklist,
    Workstream,
    Projects,
    Users,
    UsersRole,
    Roles,
    Sequelize,
    DocumentLink,
    ActivityLogs,
    Starred,
    Type,
    UsersTeam,
    Teams,
    Tag,
    sequelize,
    Notification,
    UsersNotificationSetting
} = models;

const func = global.initFunc();
const Op = Sequelize.Op;

const associationStack = [
    {
        model: Tag,
        as: "tag_task",
        required: false,
        where: { linkType: "task", isDeleted: 0 },
        include: [
            {
                model: Document,
                as: "document",
                include: [
                    {
                        model: DocumentRead,
                        as: "document_read",
                        attributes: ["id"],
                        required: false
                    },
                    {
                        model: Users,
                        as: "user",
                        attributes: ["id", "username", "firstName", "lastName", "avatar"]
                    }
                ]
            }
        ]
    },
    {
        model: Members,
        as: "task_members",
        required: false,
        where: { linkType: "task", isDeleted: 0 },
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
                    }
                ]
            }
        ]
    },
    {
        model: TaskDependency,
        as: "task_dependency",
        required: false,
        where: { isDeleted: 0 },
        include: [
            {
                model: Tasks,
                as: "task"
            }
        ]
    },
    {
        model: TaskDependency,
        as: "task_preceding",
        required: false,
        where: { isDeleted: 0 },
        include: [
            {
                model: Tasks,
                as: "pre_task"
            }
        ]
    },
    {
        model: Starred,
        as: "task_starred",
        where: { linkType: "task", isActive: 1 },
        required: false,
        include: [
            {
                model: Users,
                as: "user",
                attributes: ["id", "firstName", "lastName", "emailAddress"]
            }
        ]
    },
    {
        model: TaskChecklist,
        as: "checklist",
        where: { isDeleted: 0 },
        required: false,
        include: [
            {
                model: Users,
                as: "user",
                attributes: ["id", "firstName", "lastName", "emailAddress"]
            },
            {
                model: ChecklistDocuments,
                as: "tagDocuments",
                where: { isDeleted: 0 },
                required: false,
                include: [
                    {
                        model: Document,
                        as: "document",
                        include: [
                            {
                                model: DocumentRead,
                                as: "document_read",
                                attributes: ["id"],
                                required: false
                            },
                            {
                                model: Users,
                                as: "user",
                                attributes: ["id", "username", "firstName", "lastName", "avatar"]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        model: Workstream,
        as: "workstream",
        include: [
            {
                model: Projects,
                as: "project",
                required: false,
                include: [
                    {
                        model: Members,
                        as: "project_members",
                        required: false,
                        attributes: ["id", "linkId", "memberType"],
                        where: { linkType: "project" },
                        include: [
                            {
                                model: Users,
                                as: "user",
                                attributes: ["id", "firstName", "lastName", "emailAddress"]
                            }
                        ]
                    },
                    {
                        model: Type,
                        as: "type",
                        required: false,
                        attributes: ["type"]
                    }
                ]
            },
            {
                model: Members,
                as: "responsible",
                required: false,
                attributes: ["id", "linkId"],
                where: { linkType: "workstream", memberType: "responsible" },
                include: [
                    {
                        model: Users,
                        as: "user"
                    }
                ]
            }
        ]
    },
    {
        model: Members,
        as: "follower",
        required: false,
        attributes: ["userTypeLinkId"],
        where: { linkType: "task", memberType: "follower" }
    }
];

exports.get = {
    index: async (req, cb) => {
        const associationArray = [
            {
                model: Members,
                as: "task_members",
                required: false,
                where: { linkType: "task", isDeleted: 0 },
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
                            }
                        ]
                    }
                ]
            },
            {
                model: TaskDependency,
                as: "task_dependency",
                required: false,
                where: { isDeleted: 0 },
                include: [
                    {
                        model: Tasks,
                        as: "task",
                        attributes: ["id"]
                    }
                ]
            },
            {
                model: TaskDependency,
                as: "task_preceding",
                required: false,
                where: { isDeleted: 0 },
                include: [
                    {
                        model: Tasks,
                        as: "pre_task",
                        attributes: ["id"]
                    }
                ]
            },
            {
                model: Starred,
                as: "task_starred",
                where: { linkType: "task", isActive: 1 },
                required: false,
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: ["id", "firstName", "lastName", "emailAddress"]
                    }
                ]
            },
            {
                model: TaskChecklist,
                as: "checklist",
                where: { isDeleted: 0 },
                required: false,
                include: [
                    {
                        model: Users,
                        as: "user",
                        attributes: ["id", "firstName", "lastName", "emailAddress"]
                    },
                    {
                        model: ChecklistDocuments,
                        as: "tagDocuments",
                        where: { isDeleted: 0 },
                        required: false,
                        include: [
                            {
                                model: Document,
                                as: "document",
                                include: [
                                    {
                                        model: DocumentRead,
                                        as: "document_read",
                                        attributes: ["id"],
                                        required: false
                                    },
                                    {
                                        model: Users,
                                        as: "user",
                                        attributes: ["id", "username", "firstName", "lastName", "avatar"]
                                    }
                                ],
                                attributes: ["id"]
                            }
                        ],
                        attributes: ["id"]
                    }
                ],
                attributes: ["id"]
            },
            {
                model: Workstream,
                as: "workstream",
                include: [
                    {
                        model: Projects,
                        as: "project",
                        required: false,
                        include: [
                            {
                                model: Type,
                                as: "type",
                                required: false,
                                attributes: ["type"]
                            }
                        ],
                        attributes: ["id", "color"]
                    }
                ]
            }
        ];
        const queryString = req.query;
        const limit = typeof queryString.limit != "undefined" ? parseInt(queryString.limit) : 10;
        const status = typeof queryString.status != "undefined" ? JSON.parse(queryString.status) : "";
        let dueDate = "";

        if (typeof queryString.dueDate != "undefined" && queryString.dueDate != "") {
            if (Array.isArray(queryString.dueDate.value)) {
                dueDate = _.reduce(
                    queryString.dueDate,
                    function(obj, values) {
                        const arrValues = JSON.parse(values);
                        obj[Sequelize.Op[arrValues.opt]] = arrValues.value;
                        return obj;
                    },
                    {}
                );
            } else {
                dueDate = JSON.parse(queryString.dueDate);
            }
        }

        const whereObj = {
            ...(typeof queryString.isDeleted !== "undefined" && queryString.isDeleted !== "" ? { isDeleted: queryString.isDeleted } : { isDeleted: 0 }),
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "" ? { projectId: queryString.projectId } : {}),
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "" ? { workstreamId: queryString.workstreamId } : {}),
            ...(typeof queryString.task != "undefined" && queryString.task != ""
                ? {
                      [Sequelize.Op.and]: [
                          Sequelize.where(Sequelize.fn("lower", Sequelize.col("task.task")), {
                              [Sequelize.Op.like]: sequelize.fn("lower", `%${queryString.task}%`)
                          })
                      ]
                  }
                : {}),
            ...(status != ""
                ? {
                      status: {
                          ...(status.opt == "not"
                              ? {
                                    [Sequelize.Op.or]: {
                                        [Sequelize.Op[status.opt]]: status.value,
                                        [Sequelize.Op.eq]: null
                                    }
                                }
                              : {
                                    [Sequelize.Op.and]: {
                                        [Sequelize.Op[status.opt]]: status.value
                                    }
                                })
                      }
                  }
                : {}),
            ...(dueDate != "" && typeof queryString.view == "undefined"
                ? {
                      dueDate:
                          queryString.dueDate == "null"
                              ? null
                              : {
                                    ...(dueDate != "" && Array.isArray(dueDate)
                                        ? {
                                              [Sequelize.Op.or]: dueDate
                                          }
                                        : dueDate != "" && Array.isArray(dueDate.value)
                                        ? {
                                              [Sequelize.Op[dueDate.opt]]: _.map(dueDate.value, o => {
                                                  return moment(o, "YYYY-MM-DD")
                                                      .utc()
                                                      .format("YYYY-MM-DD HH:mm");
                                              })
                                          }
                                        : {
                                              [Sequelize.Op[dueDate.opt]]: moment(dueDate.value, "YYYY-MM-DD").format("YYYY-MM-DD HH:mm:ss")
                                          }),
                                    [Sequelize.Op.not]: null
                                }
                  }
                : {}),
            ...(typeof queryString.view != "undefined" && queryString.view == "calendar"
                ? {
                      [Sequelize.Op.or]: [
                          {
                              dueDate: {
                                  [Sequelize.Op[dueDate.opt]]: _.map(dueDate.value, o => {
                                      return moment(o, "YYYY-MM-DD")
                                          .utc()
                                          .format("YYYY-MM-DD HH:mm");
                                  })
                              }
                          },
                          {
                              startDate: {
                                  [Sequelize.Op[dueDate.opt]]: _.map(dueDate.value, o => {
                                      return moment(o, "YYYY-MM-DD")
                                          .utc()
                                          .format("YYYY-MM-DD HH:mm");
                                  })
                              }
                          }
                      ]
                  }
                : {}),
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "" ? { isActive: queryString.isActive } : {})
        };

        if (typeof queryString.type == "undefined" && (typeof queryString.assigned != "undefined" && queryString.assigned != "")) {
            whereObj[Sequelize.Op.and] = {
                id: {
                    [Sequelize.Op.in]: Sequelize.literal(
                        `(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.memberType ="assignedTo" AND members.userTypeLinkId = ${
                            queryString.assigned
                        } AND members.isDeleted = 0)`
                    )
                }
            };
        }

        if (typeof queryString.userId != "undefined" && queryString.userId != "") {
            let queryUserIds = Array.isArray(queryString.userId) ? `(${queryString.userId.join(",")})` : queryString.userId;
            let opOrArray = [];

            if (typeof queryString.type != "undefined") {
                const compareOpt = Array.isArray(queryString.userId) ? "IN" : "=";
                const ids = Array.isArray(queryString.userId) ? `(${queryString.userId.join(",")})` : queryString.userId;
                switch (queryString.type) {
                    case "assignedToMe":
                        opOrArray.push(
                            {
                                id: {
                                    [Sequelize.Op.in]: Sequelize.literal(
                                        `(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.memberType ="assignedTo" AND members.userTypeLinkId ${compareOpt} ${ids} AND members.isDeleted = 0)`
                                    )
                                }
                            },
                            {
                                approverId: queryString.userId
                            }
                        );
                        break;
                    case "forApproval":
                        opOrArray.push(
                            {
                                id: {
                                    [Sequelize.Op.in]: Sequelize.literal(
                                        `(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.memberType ="forApproval" AND members.userTypeLinkId ${compareOpt} ${ids} AND members.isDeleted = 0)`
                                    )
                                }
                            },
                            {
                                approverId: queryString.userId
                            }
                        );
                        break;
                    case "myTeam":
                        const teams = await Teams.findAll({ where: { teamLeaderId: queryUserIds, isDeleted: 0 } }).map(mapObject => {
                            const { id } = mapObject.toJSON();
                            return id;
                        });
                        const myProjects = await Members.findAll({
                            where: {
                                [Sequelize.Op.or]: [
                                    {
                                        linkType: "project",
                                        isDeleted: 0,
                                        usersType: "users",
                                        userTypeLinkId: queryUserIds
                                    },
                                    {
                                        linkType: "project",
                                        isDeleted: 0,
                                        usersType: "team",
                                        userTypeLinkId: teams
                                    }
                                ]
                            }
                        }).map(mapObject => {
                            const { linkId } = mapObject.toJSON();
                            return linkId;
                        });

                        if (teams.length > 0) {
                            const allTeams = await UsersTeam.findAll({
                                where: {
                                    teamId: teams,
                                    isDeleted: 0,
                                    ...(typeof queryString.assigned != "undefined" && queryString.assigned != "" ? { usersId: queryString.assigned } : {})
                                }
                            })
                                .map(mapObject => {
                                    const { usersId } = mapObject.toJSON();
                                    return usersId;
                                })
                                .filter(o => {
                                    return o != queryString.userId;
                                });

                            let myTeamQuery = "(";
                            myTeamQuery += `SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND task.projectId IN (${myProjects.join(
                                ","
                            )}) AND members.userTypeLinkId IN (${allTeams.join(",")}) AND members.userTypeLinkId <> ${queryString.userId} AND members.isDeleted = 0 AND members.memberType = "assignedTo"`;
                            myTeamQuery += ")";

                            opOrArray.push({
                                id: {
                                    [Sequelize.Op.in]: Sequelize.literal(myTeamQuery)
                                }
                            });
                        }
                        break;
                    case "following":
                        let followingQuery = "(";
                        followingQuery += `SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.userTypeLinkId ${compareOpt} ${ids} AND members.memberType = "follower" AND members.isDeleted=0`;

                        if (typeof queryString.assigned != "undefined" && queryString.assigned != "") {
                            followingQuery += ` AND task.id IN(
                                SELECT DISTINCT
                                    task.id
                                FROM
                                    task
                                LEFT JOIN members ON task.id = members.linkId
                                WHERE
                                    members.linkType = "task" AND members.userTypeLinkId = ${queryString.assigned} AND members.memberType = "assignedTo")`;
                        }

                        followingQuery += ")";
                        opOrArray.push({
                            id: {
                                [Sequelize.Op.in]: Sequelize.literal(followingQuery)
                            }
                        });
                        break;
                    default:
                }
            }

            whereObj[Sequelize.Op.or] = opOrArray;
        }

        if (typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "") {
            _.find(associationArray, { as: "task_starred" }).where = {
                linkType: "task",
                isActive: 1,
                usersId: queryString.starredUser,
                isDeleted: 0
            };
        }

        const options = {
            include: associationArray,
            ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {}),
            order: [["dueDate", "ASC"]]
        };
        async.parallel(
            {
                count: function(callback) {
                    try {
                        Tasks.findAndCountAll({ ..._.omit(options, ["offset", "limit"]), where: whereObj, distinct: true }).then(response => {
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
                result: function(callback) {
                    try {
                        Tasks.findAll({
                            where: whereObj,
                            ...options
                        })
                            .map(mapObject => {
                                const responseData = mapObject.toJSON();
                                const assignedTaskMembers = _.filter(responseData.task_members, member => {
                                    return member.memberType == "assignedTo";
                                });
                                const data = {
                                    ...responseData,
                                    assignedTo: assignedTaskMembers.length > 0 ? assignedTaskMembers[0].userTypeLinkId : "",
                                    isStarred: typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "" && responseData.task_starred.length > 0 ? responseData.task_starred[0].isActive : 0
                                };
                                return data;
                            })
                            .then(resultArray => {
                                callback(null, resultArray);
                            });
                    } catch (err) {
                        callback(err);
                    }
                }
            },
            function(err, results) {
                if (err != null) {
                    cb({ status: false, error: err });
                } else {
                    cb({ status: true, data: results });
                }
            }
        );
    },
    getById: (req, cb) => {
        const queryString = req.query;
        const associationArray = _.cloneDeep(associationStack);
        const whereObj = {
            id: req.params.id
        };

        if (typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "") {
            _.find(associationArray, { as: "task_starred" }).where = {
                linkType: "task",
                isDeleted: 0,
                usersId: queryString.starredUser
            };
        }
        const options = {
            include: associationArray
        };
        try {
            Tasks.findOne({ ...options, where: whereObj }).then(response => {
                if (response != null) {
                    const responseData = response.toJSON();
                    const assignedTaskMembers = _.filter(responseData.task_members, member => {
                        return member.memberType == "assignedTo";
                    });
                    cb({
                        status: true,
                        data: {
                            ...responseData,
                            assignedTo: assignedTaskMembers.length > 0 ? assignedTaskMembers[0].userTypeLinkId : "",
                            isStarred: typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "" && responseData.task_starred.length > 0 ? responseData.task_starred[0].isActive : 0
                        }
                    });
                } else {
                    cb({ status: false, error: "Task not found." });
                }
            });
        } catch (err) {
            cb({ status: false, error: err });
        }
    },
    getTaskList: (req, cb) => {
        let d = req.query;
        let task = global.initModel("task");
        let taskDependencies = global.initModel("task_dependency");
        let filter = typeof d.filter != "undefined" ? JSON.parse(d.filter) : {};
        task.getTaskList("task", filter, {}, c => {
            async.map(
                c.data,
                (o, mapCallback) => {
                    taskDependencies.getData("task_dependency", { taskId: o.id }, {}, results => {
                        mapCallback(null, { ...o, dependencies: results.data });
                    });
                },
                (err, result) => {
                    cb({ status: true, data: result });
                }
            );
        });
    },
    profileTask: async (req, cb) => {
        const queryString = req.query;
        Tasks.findAll({
            where: {
                isDeleted: 0,
                dueDate: {
                    [Op.between]: [
                        moment(queryString.date, "YYYY-MM-DD")
                            .startOf("month")
                            .utc()
                            .format("YYYY-MM-DD HH:mm"),
                        moment(queryString.date, "YYYY-MM-DD")
                            .endOf("month")
                            .utc()
                            .format("YYYY-MM-DD HH:mm")
                    ]
                }
            },
            include: [
                {
                    attributes: [],
                    model: Members,
                    as: "task_members",
                    required: true,
                    where: {
                        linkType: "task",
                        usersType: "users",
                        userTypeLinkId: queryString.userId,
                        isDeleted: 0,
                        memberType: "assignedTo"
                    }
                }
            ],
            attributes: [
                [models.sequelize.literal("COUNT(DISTINCT CASE WHEN task.id <> 0 THEN task.id END)"), "assigned_tasks"],
                [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status = "Completed" THEN task.id END)'), "on_time"],
                [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status = "For Approval" THEN task.id END)'), "for_approval"],
                [
                    models.sequelize.literal(
                        'COUNT(DISTINCT CASE WHEN task.status = "In Progress" AND task.dueDate = "' +
                            moment(queryString.date, "YYYY-MM-DD")
                                .utc()
                                .format("YYYY-MM-DD HH:mm") +
                            '" THEN task.id END)'
                    ),
                    "due_today"
                ],
                [
                    models.sequelize.literal(
                        'COUNT(DISTINCT CASE WHEN task.status = "In Progress" AND task.dueDate < "' +
                            moment(queryString.date, "YYYY-MM-DD")
                                .utc()
                                .format("YYYY-MM-DD HH:mm") +
                            '" THEN task.id END)'
                    ),
                    "issues"
                ]
            ]
        })
            .map(response => {
                return response.toJSON();
            })
            .then(response => {
                cb({ status: true, data: response });
            });
    },
    myTaskStatus: async (req, cb) => {
        const queryString = req.query;
        const teams = await Teams.findAll({ where: { teamLeaderId: queryString.userId, isDeleted: 0 } }).map(mapObject => {
            const { id } = mapObject.toJSON();
            return id;
        });
        const allTeams = await UsersTeam.findAll({ where: { teamId: teams, isDeleted: 0 } })
            .map(mapObject => {
                const { usersId } = mapObject.toJSON();
                return usersId;
            })
            .filter(o => {
                return o != queryString.userId;
            });

        async.parallel(
            {
                assigned_to_me: parallelCallback => {
                    try {
                        Tasks.findAll({
                            group: ["projectId"],
                            where: {
                                isDeleted: 0,
                                dueDate: {
                                    [Op.lte]: moment(queryString.date, "YYYY-MM-DD")
                                },
                                status: {
                                    [Op.ne]: "Completed"
                                }
                            },
                            include: [
                                {
                                    attributes: [],
                                    model: Members,
                                    as: "task_members",
                                    required: true,
                                    where: { linkType: "task", usersType: "users", userTypeLinkId: queryString.userId, isDeleted: 0, memberType: "assignedTo" }
                                }
                            ],
                            attributes: [
                                "projectId",
                                [
                                    models.sequelize.literal(
                                        'COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate < "' +
                                            moment(queryString.date, "YYYY-MM-DD")
                                                .utc()
                                                .format("YYYY-MM-DD HH:mm") +
                                            '" THEN task.id END)'
                                    ),
                                    "issues"
                                ],
                                [
                                    models.sequelize.literal(
                                        'COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate = "' +
                                            moment(queryString.date, "YYYY-MM-DD")
                                                .utc()
                                                .format("YYYY-MM-DD HH:mm") +
                                            '" THEN task.id END)'
                                    ),
                                    "due_today"
                                ]
                            ]
                        })
                            .map(response => {
                                return response.toJSON();
                            })
                            .then(response => {
                                parallelCallback(null, response);
                            });
                    } catch (err) {
                        parallelCallback(err);
                    }
                },
                following: parallelCallback => {
                    Tasks.findAll({
                        group: ["projectId"],
                        where: {
                            isDeleted: 0,
                            dueDate: {
                                [Op.lte]: moment(queryString.date, "YYYY-MM-DD")
                            },
                            status: {
                                [Op.ne]: "Completed"
                            }
                        },
                        include: [
                            {
                                attributes: [],
                                model: Members,
                                as: "task_members",
                                required: true,
                                where: { linkType: "task", usersType: "users", userTypeLinkId: queryString.userId, isDeleted: 0, memberType: "follower" }
                            }
                        ],
                        attributes: [
                            "projectId",
                            [
                                models.sequelize.literal(
                                    'COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate < "' +
                                        moment(queryString.date, "YYYY-MM-DD")
                                            .utc()
                                            .format("YYYY-MM-DD HH:mm") +
                                        '" THEN task.id END)'
                                ),
                                "issues"
                            ],
                            [
                                models.sequelize.literal(
                                    'COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate = "' +
                                        moment(queryString.date, "YYYY-MM-DD")
                                            .utc()
                                            .format("YYYY-MM-DD HH:mm") +
                                        '" THEN task.id END)'
                                ),
                                "due_today"
                            ]
                        ]
                    })
                        .map(response => {
                            return response.toJSON();
                        })
                        .then(response => {
                            parallelCallback(null, response);
                        });
                },
                team: parallelCallback => {
                    Tasks.findAll({
                        group: ["projectId"],
                        where: {
                            isDeleted: 0,
                            dueDate: {
                                [Op.lte]: moment(queryString.date, "YYYY-MM-DD")
                            },
                            status: {
                                [Op.ne]: "Completed"
                            }
                        },
                        include: [
                            {
                                attributes: [],
                                model: Members,
                                as: "task_members",
                                required: true,
                                where: { linkType: "task", usersType: "users", userTypeLinkId: allTeams, isDeleted: 0, memberType: "assignedTo" }
                            }
                        ],
                        attributes: [
                            "projectId",
                            [
                                models.sequelize.literal(
                                    'COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate < "' +
                                        moment(queryString.date, "YYYY-MM-DD")
                                            .utc()
                                            .format("YYYY-MM-DD HH:mm") +
                                        '" THEN task.id END)'
                                ),
                                "issues"
                            ],
                            [
                                models.sequelize.literal(
                                    'COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate = "' +
                                        moment(queryString.date, "YYYY-MM-DD")
                                            .utc()
                                            .format("YYYY-MM-DD HH:mm") +
                                        '" THEN task.id END)'
                                ),
                                "due_today"
                            ]
                        ]
                    })
                        .map(response => {
                            return response.toJSON();
                        })
                        .then(response => {
                            parallelCallback(null, response);
                        });
                }
            },
            (err, response) => {
                if (err != null) {
                    cb({ status: false, data: err });
                } else {
                    cb({ status: true, data: response });
                }
            }
        );
    },
    projectTaskStatus: async (req, cb) => {
        const queryString = req.query;
        const { projectId, date, userId = "", userRole = "" } = queryString;
        const currentDate = moment(date, "YYYY-MM-DD").format("YYYY-MM-DD HH:mm");
        let assignedTask = [];

        async.parallel(
            {
                task_due: parallelCallback => {
                    try {
                        Tasks.findAndCountAll({
                            where: {
                                dueDate: {
                                    [Op.eq]: currentDate
                                },
                                projectId,
                                status: "In Progress",
                                isDeleted: 0,
                                ...(userId != "" && queryString.userRole > 3
                                    ? {
                                          id: {
                                              [Op.in]: Sequelize.literal(
                                                  `(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.memberType ="assignedTo" AND members.userTypeLinkId = ${userId} AND members.isDeleted = 0)`
                                              )
                                          }
                                      }
                                    : {})
                            }
                        }).then(({ count }) => {
                            parallelCallback(null, count);
                        });
                    } catch (err) {
                        parallelCallback(err);
                    }
                },
                task_for_approval: parallelCallback => {
                    try {
                        Tasks.findAndCountAll({
                            where: {
                                status: "For Approval",
                                projectId,
                                isDeleted: 0,
                                ...(userId != "" && queryString.userRole > 3
                                    ? {
                                          id: {
                                              [Op.in]: Sequelize.literal(
                                                  `(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.memberType ="approver" AND members.userTypeLinkId = ${userId} AND members.isDeleted = 0)`
                                              )
                                          }
                                      }
                                    : {})
                            }
                        }).then(({ count }) => {
                            parallelCallback(null, count);
                        });
                    } catch (err) {
                        parallelCallback(err);
                    }
                },
                delayed_task: parallelCallback => {
                    try {
                        Tasks.findAndCountAll({
                            where: {
                                dueDate: {
                                    [Op.lt]: currentDate
                                },
                                status: "In Progress",
                                projectId,
                                isDeleted: 0,
                                ...(userId != "" && queryString.userRole > 3
                                    ? {
                                          id: {
                                              [Op.in]: Sequelize.literal(
                                                  `(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.memberType ="assignedTo" AND members.userTypeLinkId = ${userId} AND members.isDeleted = 0)`
                                              )
                                          }
                                      }
                                    : {})
                            }
                        }).then(({ count }) => {
                            parallelCallback(null, count);
                        });
                    } catch (err) {
                        parallelCallback(err);
                    }
                },
                new_files: parallelCallback => {
                    try {
                        DocumentLink.findAndCountAll({
                            where: {
                                linkType: "project",
                                linkid: projectId
                            },
                            include: [
                                {
                                    model: Document,
                                    as: "document",
                                    required: true,
                                    where: {
                                        status: "new",
                                        folderId: null,
                                        type: "document",
                                        isDeleted: 0,
                                        isArchived: 0,
                                        isActive: 1
                                    }
                                }
                            ]
                        }).then(({ count }) => {
                            parallelCallback(null, count);
                        });
                    } catch (err) {
                        parallelCallback(err);
                    }
                }
            },
            (err, response) => {
                if (err != null) {
                    cb({ status: false, data: err });
                } else {
                    cb({ status: true, data: response });
                }
            }
        );
    }
};

exports.post = {
    index: async (req, cb) => {
        const body = req.body;
        const options = {
            include: associationStack
        };
        try {
            const checkIfExistTask = await Tasks.findAll({
                where: {
                    task: body.task,
                    workstreamId: body.workstreamId,
                    isDeleted: 0
                }
            }).map(o => {
                return o.toJSON();
            });

            if (checkIfExistTask.length > 0) {
                cb({ status: false, error: "Task name already exists in the workstream selected." });
            } else {
                Tasks.create(_.omit(body, ["task_dependency", "dependency_type", "assignedTo", "dateUpdated"])).then(response => {
                    const newTaskResponse = response.toJSON();
                    ActivityLogs.create({
                        usersId: body.userId,
                        linkType: "task",
                        linkId: newTaskResponse.id,
                        actionType: "created",
                        new: JSON.stringify({ task: _.omit(newTaskResponse, ["dateAdded", "dateUpdated"]) }),
                        title: newTaskResponse.task
                    }).then(response => {
                        async.waterfall(
                            [
                                function(callback) {
                                    if (typeof body.periodic != "undefined" && body.periodic == 1) {
                                        const taskPromises = _.times(2, o => {
                                            return new Promise(resolve => {
                                                const nextDueDate = moment(body.dueDate)
                                                    .add(body.periodType, body.periodInstance * (o + 1))
                                                    .format("YYYY-MM-DD HH:mm:ss");
                                                const newPeriodTask = {
                                                    ...body,
                                                    dueDate: nextDueDate,
                                                    ...(body.startDate != null && body.startDate != ""
                                                        ? {
                                                              startDate: moment(body.startDate)
                                                                  .add(body.periodType, body.periodInstance * (o + 1))
                                                                  .format("YYYY-MM-DD HH:mm:ss")
                                                          }
                                                        : {}),
                                                    periodTask: newTaskResponse.id
                                                };

                                                Tasks.create(_.omit(newPeriodTask, ["task_dependency", "dependency_type", "assignedTo"])).then(response => {
                                                    const createTaskObj = response.toJSON();
                                                    ActivityLogs.create({
                                                        usersId: body.userId,
                                                        linkType: "task",
                                                        linkId: createTaskObj.id,
                                                        actionType: "created",
                                                        new: JSON.stringify({ task: _.omit(createTaskObj, ["dateAdded", "dateUpdated"]) }),
                                                        title: createTaskObj.task
                                                    }).then(response => {
                                                        resolve(createTaskObj);
                                                    });
                                                });
                                            });
                                        });
                                        Promise.all(taskPromises).then(values => {
                                            callback(null, [...[newTaskResponse], ...values]);
                                        });
                                    } else {
                                        callback(null, [newTaskResponse]);
                                    }
                                },
                                function(newTasksArgs, callback) {
                                    const taskAttrPromises = _.map(newTasksArgs, taskObj => {
                                        return new Promise(resolve => {
                                            async.parallel(
                                                {
                                                    task_dependency: parallelCallback => {
                                                        const taskDependencyPromise = _.map(body.task_dependency, taskDependencyObj => {
                                                            return new Promise(resolve => {
                                                                const dependentObj = {
                                                                    taskId: taskObj.id,
                                                                    dependencyType: body.dependency_type,
                                                                    linkTaskId: taskDependencyObj.value
                                                                };
                                                                TaskDependency.create(dependentObj).then(response => {
                                                                    resolve({ data: response.toJSON() });
                                                                });
                                                            });
                                                        });

                                                        Promise.all(taskDependencyPromise).then(values => {
                                                            parallelCallback(null, values);
                                                        });
                                                    },
                                                    members: parallelCallback => {
                                                        const members = [];
                                                        if (typeof body.assignedTo != "undefined" && body.assignedTo != "") {
                                                            members.push({ linkType: "task", linkId: taskObj.id, usersType: "users", userTypeLinkId: body.assignedTo, memberType: "assignedTo" });
                                                        }

                                                        if (typeof body.approverId != "undefined" && body.approverId != "") {
                                                            members.push({ linkType: "task", linkId: taskObj.id, usersType: "users", userTypeLinkId: body.approverId, memberType: "approver" });
                                                        }

                                                        if (members.length > 0) {
                                                            Members.bulkCreate(members).then(response => {
                                                                parallelCallback(null, response);
                                                            });
                                                        } else {
                                                            parallelCallback(null, {});
                                                        }
                                                    },
                                                    notification: parallelCallback => {
                                                        Users.findOne({
                                                            where: {
                                                                id: body.userId
                                                            }
                                                        }).then(o => {
                                                            const sender = o.toJSON();
                                                            UsersNotificationSetting.findAll({
                                                                where: { usersId: [body.assignedTo, body.approverId] },
                                                                include: [
                                                                    {
                                                                        model: Users,
                                                                        as: "notification_setting",
                                                                        required: false
                                                                    }
                                                                ]
                                                            })
                                                                .map(response => {
                                                                    return response.toJSON();
                                                                })
                                                                .then(response => {
                                                                    const notificationArr = _.filter(response, nSetting => {
                                                                        return nSetting.taskAssigned === 1 && body.assignedTo === nSetting.usersId;
                                                                    }).map(nSetting => {
                                                                        if (nSetting.taskAssigned === 1 && body.assignedTo === nSetting.usersId) {
                                                                            return {
                                                                                usersId: nSetting.usersId,
                                                                                projectId: body.projectId,
                                                                                taskId: taskObj.id,
                                                                                workstreamId: body.workstreamId,
                                                                                createdBy: body.userId,
                                                                                type: "taskAssigned",
                                                                                message: "Assigned a new task for you",
                                                                                emailAddress: nSetting.notification_setting.emailAddress,
                                                                                receiveEmail: nSetting.receiveEmail
                                                                            };
                                                                        }
                                                                    });

                                                                    Notification.bulkCreate(notificationArr)
                                                                        .map(notificationRes => {
                                                                            return notificationRes.id;
                                                                        })
                                                                        .then(notificationRes => {
                                                                            Notification.findAll({
                                                                                where: { id: notificationRes },
                                                                                include: [
                                                                                    {
                                                                                        model: Users,
                                                                                        as: "to",
                                                                                        required: false,
                                                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                                    },
                                                                                    {
                                                                                        model: Users,
                                                                                        as: "from",
                                                                                        required: false,
                                                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                                    },
                                                                                    {
                                                                                        model: Projects,
                                                                                        as: "project_notification",
                                                                                        required: false,
                                                                                        include: [
                                                                                            {
                                                                                                model: Type,
                                                                                                as: "type",
                                                                                                required: false,
                                                                                                attributes: ["type"]
                                                                                            }
                                                                                        ]
                                                                                    },
                                                                                    {
                                                                                        model: Document,
                                                                                        as: "document_notification",
                                                                                        required: false,
                                                                                        attributes: ["origin"]
                                                                                    },
                                                                                    {
                                                                                        model: Workstream,
                                                                                        as: "workstream_notification",
                                                                                        required: false,
                                                                                        attributes: ["workstream"]
                                                                                    },
                                                                                    {
                                                                                        model: Tasks,
                                                                                        as: "task_notification",
                                                                                        required: false,
                                                                                        attributes: ["task"]
                                                                                    }
                                                                                ]
                                                                            })
                                                                                .map(findNotificationRes => {
                                                                                    req.app.parent.io.emit("FRONT_NOTIFICATION", {
                                                                                        ...findNotificationRes.toJSON()
                                                                                    });
                                                                                    return findNotificationRes.toJSON();
                                                                                })
                                                                                .then(() => {
                                                                                    async.map(
                                                                                        notificationArr,
                                                                                        ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                                                            if (receiveEmail === 1) {
                                                                                                let html = "<p>" + message + "</p>";
                                                                                                html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
                                                                                                // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                                                                html += `<p>Message:<br><strong>${sender.firstName}  ${sender.lastName}</strong> ${message}</p>`;
                                                                                                html += ` <a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${
                                                                                                    global.site_url
                                                                                                }account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                                                                html += `<p>Date:<br>${moment().format("LLL")}</p>`;

                                                                                                const mailOptions = {
                                                                                                    from: '"no-reply" <no-reply@c_cfo.com>',
                                                                                                    to: `${emailAddress}`,
                                                                                                    subject: "[CLOUD-CFO]",
                                                                                                    html: html
                                                                                                };
                                                                                                global.emailtransport(mailOptions);
                                                                                            }
                                                                                            mapCallback(null);
                                                                                        },
                                                                                        err => {
                                                                                            parallelCallback(null);
                                                                                        }
                                                                                    );
                                                                                });
                                                                        });
                                                                });
                                                        });
                                                    }
                                                },
                                                (err, response) => {
                                                    resolve(response);
                                                }
                                            );
                                        });
                                    });

                                    Promise.all(taskAttrPromises).then(values => {
                                        callback(null, newTasksArgs);
                                    });
                                },
                                function(newTasksArgs) {
                                    Tasks.findAll({
                                        ...options,
                                        where: {
                                            id: {
                                                [Sequelize.Op.in]: _.map(newTasksArgs, o => {
                                                    return o.id;
                                                })
                                            }
                                        }
                                    })
                                        .map(mapObject => {
                                            return mapObject.toJSON();
                                        })
                                        .then(response => {
                                            async.parallel(
                                                {
                                                    projects: parallelCallback => {
                                                        Projects.update(
                                                            { dateUpdated: body.dateUpdated },
                                                            {
                                                                where: { id: response[0].projectId }
                                                            }
                                                        ).then(res => {
                                                            parallelCallback(null);
                                                        });
                                                    },
                                                    workstream: parallelCallback => {
                                                        Workstream.update(
                                                            { dateUpdated: body.dateUpdated },
                                                            {
                                                                where: { id: response[0].workstreamId }
                                                            }
                                                        ).then(res => {
                                                            parallelCallback(null);
                                                        });
                                                    }
                                                },
                                                () => {
                                                    cb({ status: true, data: response });
                                                }
                                            );
                                        });
                                }
                            ],
                            function(err, result) {
                                cb({ status: true, data: result.tasks });
                            }
                        );
                    });
                });
            }
        } catch (err) {
            cb({ status: false, error: err });
        }
    },
    document: (req, cb) => {
        const formidable = global.initRequire("formidable");
        const func = global.initFunc();
        const { projectId, workstreamId } = { ...req.query };
        let form = new formidable.IncomingForm();
        let files = [];
        let type = "upload";
        let checklistStack = [];
        let userId = "";
        let taskId = "";
        const filesStack = [];

        form.multiples = true;
        form.on("field", function(name, field) {
            if (name == "userId") {
                userId = field;
            } else if (name == "tagged") {
                checklistStack = JSON.parse(field);
            } else {
                taskId = field;
            }
        })
            .on("file", function(field, file) {
                const date = new Date();
                const id = func.generatePassword(date.getTime() + file.name, "attachment");
                const filename = id + file.name.replace(/[^\w.]|_/g, "_");

                filesStack.push({
                    id,
                    file: file,
                    form: type,
                    filename: filename
                });
            })
            .on("end", function() {
                async.map(
                    filesStack,
                    (fileObj, mapCallback) => {
                        func.uploadFile(_.omit(fileObj, ["id"]), response => {
                            if (response.Message == "Success") {
                                mapCallback(null, {
                                    filename: fileObj.filename,
                                    origin: fileObj.file.name,
                                    Id: fileObj.id,
                                    userId,
                                    taskId,
                                    checklist: checklistStack
                                });
                            } else {
                                mapCallback(esponse.Message);
                            }
                        });
                    },
                    async (err, results) => {
                        const newDocs = _.map(results, ({ filename, origin, userId }) => {
                            return {
                                name: filename,
                                origin,
                                uploadedBy: userId,
                                type: "document",
                                status: "new"
                            };
                        });

                        const documentUpload = await Document.bulkCreate(newDocs).map(o => {
                            return o.toJSON();
                        });
                        const documentUploadResult = await _.map(documentUpload, ({ id }) => {
                            return { documentId: id, linkType: "project", linkId: projectId };
                        });
                        await DocumentLink.bulkCreate(documentUploadResult).map(o => {
                            return o.toJSON();
                        });

                        let workstreamTag = _.map(documentUpload, ({ id }) => {
                            return {
                                linkType: "workstream",
                                linkId: workstreamId,
                                tagType: "document",
                                tagTypeId: id
                            };
                        });

                        if (checklistStack.length > 0) {
                            workstreamTag = [
                                ...workstreamTag,
                                ..._.map(documentUpload, ({ id }) => {
                                    return {
                                        linkType: "task",
                                        linkId: taskId,
                                        tagType: "document",
                                        tagTypeId: id
                                    };
                                })
                            ];
                        }

                        async.parallel(
                            {
                                tag: parallelCallback => {
                                    Tag.bulkCreate(workstreamTag).then(() => {
                                        parallelCallback(null);
                                    });
                                },
                                notification: parallelCallback => {
                                    try {
                                        Users.findOne({
                                            where: {
                                                id: userId
                                            }
                                        }).then(async o => {
                                            const sender = o.toJSON();
                                            const receiver = await Members.findAll({
                                                where: {
                                                    [Op.or]: [{ linkType: "workstream", linkId: workstreamId }, { linkType: "task", linkId: taskId }],
                                                    userTypeLinkId: { [Op.ne]: userId }
                                                }
                                            })
                                                .map(o => {
                                                    return o.userTypeLinkId;
                                                })
                                                .then(o => {
                                                    return _.union(o);
                                                });

                                            UsersNotificationSetting.findAll({
                                                where: { usersId: receiver },
                                                include: [
                                                    {
                                                        model: Users,
                                                        as: "notification_setting",
                                                        required: false
                                                    }
                                                ]
                                            })
                                                .map(response => {
                                                    return response.toJSON();
                                                })
                                                .then(response => {
                                                    async.map(
                                                        documentUpload,
                                                        (o, mapCallback) => {
                                                            const notificationArr = _.filter(response, nSetting => {
                                                                return nSetting.fileNewUpload === 1;
                                                            }).map(nSetting => {
                                                                return {
                                                                    usersId: nSetting.usersId,
                                                                    projectId: projectId,
                                                                    createdBy: o.uploadedBy,
                                                                    workstreamId: workstreamId,
                                                                    taskId: taskId,
                                                                    documentId: o.id,
                                                                    type: "fileNewUpload",
                                                                    message: "upload a new file",
                                                                    emailAddress: nSetting.notification_setting.emailAddress,
                                                                    receiveEmail: nSetting.receiveEmail
                                                                };
                                                            });
                                                            mapCallback(null, { notificationArr: notificationArr });
                                                        },
                                                        (err, nsResult) => {
                                                            const notificationArr = _.flatMapDeep(
                                                                nsResult.map(o => {
                                                                    return o.notificationArr;
                                                                })
                                                            );

                                                            Notification.bulkCreate(notificationArr)
                                                                .map(notificationRes => {
                                                                    return notificationRes.id;
                                                                })
                                                                .then(notificationRes => {
                                                                    Notification.findAll({
                                                                        where: { id: notificationRes },
                                                                        include: [
                                                                            {
                                                                                model: Users,
                                                                                as: "to",
                                                                                required: false,
                                                                                attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                            },
                                                                            {
                                                                                model: Users,
                                                                                as: "from",
                                                                                required: false,
                                                                                attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                            },
                                                                            {
                                                                                model: Projects,
                                                                                as: "project_notification",
                                                                                required: false,
                                                                                include: [
                                                                                    {
                                                                                        model: Type,
                                                                                        as: "type",
                                                                                        required: false,
                                                                                        attributes: ["type"]
                                                                                    }
                                                                                ]
                                                                            },
                                                                            {
                                                                                model: Document,
                                                                                as: "document_notification",
                                                                                required: false,
                                                                                attributes: ["origin"]
                                                                            },
                                                                            {
                                                                                model: Workstream,
                                                                                as: "workstream_notification",
                                                                                required: false,
                                                                                attributes: ["workstream"]
                                                                            },
                                                                            {
                                                                                model: Tasks,
                                                                                as: "task_notification",
                                                                                required: false,
                                                                                attributes: ["task"]
                                                                            }
                                                                        ]
                                                                    })
                                                                        .map(findNotificationRes => {
                                                                            req.app.parent.io.emit("FRONT_NOTIFICATION", {
                                                                                ...findNotificationRes.toJSON()
                                                                            });
                                                                            return findNotificationRes.toJSON();
                                                                        })
                                                                        .then(() => {
                                                                            async.map(
                                                                                notificationArr,
                                                                                ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                                                    if (receiveEmail === 1) {
                                                                                        let html = "<p>" + message + "</p>";
                                                                                        html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
                                                                                        // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                                                        html += `<p>Message:<br><strong>${sender.firstName}  ${sender.lastName}</strong> ${message}</p>`;
                                                                                        html += ` <a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${
                                                                                            global.site_url
                                                                                        }account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                                                        html += `<p>Date:<br>${moment().format("LLL")}</p>`;

                                                                                        const mailOptions = {
                                                                                            from: '"no-reply" <no-reply@c_cfo.com>',
                                                                                            to: `${emailAddress}`,
                                                                                            subject: "[CLOUD-CFO]",
                                                                                            html: html
                                                                                        };
                                                                                        global.emailtransport(mailOptions);
                                                                                    }
                                                                                    mapCallback(null);
                                                                                },
                                                                                () => {
                                                                                    parallelCallback(null);
                                                                                }
                                                                            );
                                                                        });
                                                                });
                                                        }
                                                    );
                                                });
                                        });
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }
                            },
                            () => {
                                if (checklistStack.length > 0) {
                                    const checklistTag = _(documentUpload)
                                        .map(responseObj => {
                                            return _.map(checklistStack, ({ value }) => {
                                                return {
                                                    taskId,
                                                    checklistId: value,
                                                    document: responseObj
                                                };
                                            });
                                        })
                                        .flatten()
                                        .value();

                                    const checklistPromise = _.map(checklistTag, ({ checklistId, document }) => {
                                        return new Promise(async (resolve, reject) => {
                                            let oldChecklist = await TaskChecklist.findOne({ where: { id: checklistId } }).then(response => {
                                                return response.toJSON();
                                            });
                                            let status = oldChecklist.isCompleted == 1 ? "Complete" : "Not Complete";
                                            let oldTaskChecklist = _.pick({ ...oldChecklist, status }, ["description", "type", "status"]);

                                            if (status == "Not Complete") {
                                                TaskChecklist.update({ isCompleted: 1 }, { where: { id: checklistId } })
                                                    .then(o => {
                                                        return TaskChecklist.findOne({ where: { id: checklistId } }).then(o => {
                                                            return o.toJSON();
                                                        });
                                                    })
                                                    .then(response => {
                                                        const updateResponse = response;
                                                        status = updateResponse.isCompleted == 1 ? "Complete" : "Not Complete";

                                                        const newObject = func.changedObjAttributes(_.pick({ ...updateResponse, status }, ["description", "type", "status"]), oldTaskChecklist);
                                                        const objectKeys = _.map(newObject, function(value, key) {
                                                            return key;
                                                        });
                                                        const bulkActivities = [
                                                            {
                                                                usersId: userId,
                                                                linkType: "checklist",
                                                                linkId: updateResponse.id,
                                                                actionType: "completed",
                                                                old: JSON.stringify({ checklist: _.pick(oldTaskChecklist, objectKeys) }),
                                                                new: JSON.stringify({ checklist: newObject }),
                                                                title: oldTaskChecklist.description
                                                            },
                                                            {
                                                                usersId: userId,
                                                                linkType: "document",
                                                                linkId: document.id,
                                                                actionType: "created",
                                                                new: JSON.stringify({ document: _.omit(document, ["dateAdded", "dateUpdated"]) }),
                                                                title: document.origin
                                                            }
                                                        ];

                                                        ActivityLogs.bulkCreate(bulkActivities)
                                                            .map(({ id }) => {
                                                                return id;
                                                            })
                                                            .then(activityResponse => {
                                                                return ActivityLogs.findAll({
                                                                    include: [
                                                                        {
                                                                            model: Users,
                                                                            as: "user",
                                                                            attributes: ["firstName", "lastName"]
                                                                        }
                                                                    ],
                                                                    where: { id: activityResponse }
                                                                });
                                                            })
                                                            .map(response => {
                                                                return response.toJSON();
                                                            })
                                                            .then(response => {
                                                                resolve({ checklist: updateResponse, activity_log: response });
                                                            });
                                                    });
                                            } else {
                                                resolve({ checklist: {}, activity_log: [] });
                                            }
                                        });
                                    });

                                    Promise.all(checklistPromise).then(function(values) {
                                        ChecklistDocuments.bulkCreate(
                                            _.map(checklistTag, o => {
                                                return { ..._.omit(o, ["document"]), documentId: o.document.id };
                                            })
                                        ).then(o => {
                                            TaskChecklist.findAll({
                                                where: {
                                                    id: _.map(checklistTag, o => {
                                                        return o.checklistId;
                                                    })
                                                },
                                                include: [
                                                    {
                                                        model: Users,
                                                        as: "user",
                                                        attributes: ["id", "firstName", "lastName", "emailAddress", "avatar"]
                                                    },
                                                    {
                                                        model: ChecklistDocuments,
                                                        as: "tagDocuments",
                                                        where: {
                                                            isDeleted: 0
                                                        },
                                                        include: [
                                                            {
                                                                model: Document,
                                                                as: "document",
                                                                include: [
                                                                    {
                                                                        model: DocumentRead,
                                                                        as: "document_read",
                                                                        attributes: ["id"],
                                                                        required: false
                                                                    },
                                                                    {
                                                                        model: Users,
                                                                        as: "user"
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            })
                                                .map(mapObject => {
                                                    return mapObject.toJSON();
                                                })
                                                .then(async o => {
                                                    const tags = await Tag.findAll({
                                                        where: {
                                                            linkType: "task",
                                                            linkId: taskId,
                                                            tagType: "document"
                                                        },
                                                        include: [
                                                            {
                                                                model: Document,
                                                                as: "document",
                                                                include: [
                                                                    {
                                                                        model: DocumentRead,
                                                                        as: "document_read",
                                                                        attributes: ["id"],
                                                                        required: false
                                                                    },
                                                                    {
                                                                        model: Users,
                                                                        as: "user"
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }).map(o => {
                                                        return o.toJSON();
                                                    });
                                                    cb({
                                                        status: true,
                                                        data: {
                                                            result: o,
                                                            type: "checklist",
                                                            tags,
                                                            activity_logs: _.flatten(
                                                                _.map(values, ({ activity_log }) => {
                                                                    return activity_log;
                                                                })
                                                            )
                                                        }
                                                    });
                                                });
                                        });
                                    });
                                } else {
                                    const taskTag = _.map(documentUpload, ({ id }) => {
                                        return {
                                            linkType: "task",
                                            linkId: taskId,
                                            tagType: "document",
                                            tagTypeId: id
                                        };
                                    });

                                    Tag.bulkCreate(taskTag)
                                        .map(o => {
                                            return o.toJSON();
                                        })
                                        .then(o => {
                                            Tag.findAll({
                                                where: {
                                                    linkType: "task",
                                                    linkId: taskId,
                                                    tagType: "document",
                                                    tagTypeId: _.map(taskTag, ({ tagTypeId }) => {
                                                        return tagTypeId;
                                                    })
                                                },
                                                include: [
                                                    {
                                                        model: Document,
                                                        as: "document",
                                                        include: [
                                                            {
                                                                model: DocumentRead,
                                                                as: "document_read",
                                                                attributes: ["id"],
                                                                required: false
                                                            },
                                                            {
                                                                model: Users,
                                                                as: "user"
                                                            }
                                                        ]
                                                    }
                                                ]
                                            })
                                                .map(o => {
                                                    return o.toJSON();
                                                })
                                                .then(o => {
                                                    const documentResponse = o;
                                                    const documentActivity = _.map(documentResponse, o => {
                                                        return new Promise(resolve => {
                                                            ActivityLogs.create({
                                                                usersId: userId,
                                                                linkType: "document",
                                                                linkId: o.document.id,
                                                                actionType: "created",
                                                                new: JSON.stringify({ document: _.omit(o.document, ["dateAdded", "dateUpdated"]) }),
                                                                title: o.document.origin
                                                            })
                                                                .then(response => {
                                                                    const responseObj = response.toJSON();
                                                                    return ActivityLogs.findOne({
                                                                        include: [
                                                                            {
                                                                                model: Users,
                                                                                as: "user",
                                                                                attributes: ["firstName", "lastName"]
                                                                            }
                                                                        ],
                                                                        where: { id: responseObj.id }
                                                                    });
                                                                })
                                                                .then(response => {
                                                                    const responseObj = response.toJSON();
                                                                    resolve(responseObj);
                                                                });
                                                        });
                                                    });

                                                    Promise.all(documentActivity).then(promiseResponse => {
                                                        cb({ status: true, data: { result: documentResponse, type: "document", activity_logs: promiseResponse } });
                                                    });
                                                });
                                        });
                                }
                            }
                        );
                    }
                );
            })
            .on("error", function(err) {
                cb({ status: false, error: "Upload error. Please try again later." });
            });

        form.parse(req);
    },
    documentActiveFile: (req, cb) => {
        const taskId = req.query.taskId;
        const userId = req.query.userId;
        const data = req.body.data;
        const tagWorkstream = JSON.parse(data.workstream);
        const tagTask = JSON.parse(data.task);
        const tagChecklist = JSON.parse(data.checklist);

        async.parallel(
            {
                tagWorkstream: parallelCallback => {
                    Tag.findAll({ where: { [Op.or]: tagWorkstream } })
                        .map(res => {
                            return res.toJSON();
                        })
                        .then(res => {
                            const tagWorkstreamBulk = tagWorkstream.filter(e => {
                                return !_.find(res, { tagTypeId: e.tagTypeId });
                            });

                            Tag.bulkCreate(tagWorkstreamBulk)
                                .map(tagResponse => {
                                    return tagResponse.toJSON();
                                })
                                .then(tagResponse => {
                                    parallelCallback(null, tagResponse);
                                });
                        });
                },
                tagTask: parallelCallback => {
                    Tag.findAll({ where: { [Op.or]: tagTask } })
                        .map(res => {
                            return res.toJSON();
                        })
                        .then(res => {
                            const tagTaskBulk = tagTask.filter(e => {
                                return !_.find(res, { tagTypeId: e.tagTypeId });
                            });

                            Tag.bulkCreate(tagTaskBulk)
                                .map(tagResponse => {
                                    return tagResponse.toJSON();
                                })
                                .then(tagResponse => {
                                    parallelCallback(null, tagTaskBulk);
                                });
                        });
                }
            },
            (err, { tagTask }) => {
                if (err) {
                    cb({ status: false, error: err });
                } else {
                    if (tagChecklist.length > 0) {
                        const documentId = tagTask.map(e => {
                            return e.tagTypeId;
                        });

                        Document.findAll({ where: { id: documentId }, raw: true }).then(docReturn => {
                            const checklistTag = _(docReturn)
                                .map(responseObj => {
                                    return _.map(tagChecklist, ({ value }) => {
                                        return {
                                            taskId,
                                            checklistId: value,
                                            document: responseObj
                                        };
                                    });
                                })
                                .flatten()
                                .value();

                            const checklistPromise = _.map(checklistTag, ({ checklistId, document }) => {
                                return new Promise(async (resolve, reject) => {
                                    let oldChecklist = await TaskChecklist.findOne({ where: { id: checklistId } }).then(response => {
                                        return response.toJSON();
                                    });
                                    let status = oldChecklist.isCompleted == 1 ? "Complete" : "Not Complete";
                                    let oldTaskChecklist = _.pick({ ...oldChecklist, status }, ["description", "type", "status"]);

                                    if (status == "Not Complete") {
                                        TaskChecklist.update({ isCompleted: 1 }, { where: { id: checklistId } })
                                            .then(o => {
                                                return TaskChecklist.findOne({ where: { id: checklistId } }).then(o => {
                                                    return o.toJSON();
                                                });
                                            })
                                            .then(response => {
                                                const updateResponse = response;
                                                status = updateResponse.isCompleted == 1 ? "Complete" : "Not Complete";

                                                const newObject = func.changedObjAttributes(_.pick({ ...updateResponse, status }, ["description", "type", "status"]), oldTaskChecklist);
                                                const objectKeys = _.map(newObject, function(value, key) {
                                                    return key;
                                                });
                                                const bulkActivities = [
                                                    {
                                                        usersId: userId,
                                                        linkType: "checklist",
                                                        linkId: updateResponse.id,
                                                        actionType: "completed",
                                                        old: JSON.stringify({ checklist: _.pick(oldTaskChecklist, objectKeys) }),
                                                        new: JSON.stringify({ checklist: newObject }),
                                                        title: oldTaskChecklist.description
                                                    },
                                                    {
                                                        usersId: userId,
                                                        linkType: "document",
                                                        linkId: document.id,
                                                        actionType: "created",
                                                        new: JSON.stringify({ document: _.omit(document, ["dateAdded", "dateUpdated"]) }),
                                                        title: document.origin
                                                    }
                                                ];

                                                ActivityLogs.bulkCreate(bulkActivities)
                                                    .map(({ id }) => {
                                                        return id;
                                                    })
                                                    .then(activityResponse => {
                                                        return ActivityLogs.findAll({
                                                            include: [
                                                                {
                                                                    model: Users,
                                                                    as: "user",
                                                                    attributes: ["firstName", "lastName"]
                                                                }
                                                            ],
                                                            where: { id: activityResponse }
                                                        });
                                                    })
                                                    .map(response => {
                                                        return response.toJSON();
                                                    })
                                                    .then(response => {
                                                        resolve({ checklist: updateResponse, activity_log: response });
                                                    });
                                            });
                                    } else {
                                        resolve({ checklist: {}, activity_log: [] });
                                    }
                                });
                            });

                            Promise.all(checklistPromise).then(function(values) {
                                ChecklistDocuments.bulkCreate(
                                    _.map(checklistTag, o => {
                                        return { ..._.omit(o, ["document"]), documentId: o.document.id };
                                    })
                                ).then(o => {
                                    TaskChecklist.findAll({
                                        where: {
                                            id: _.map(checklistTag, o => {
                                                return o.checklistId;
                                            })
                                        },
                                        include: [
                                            {
                                                model: Users,
                                                as: "user",
                                                attributes: ["id", "firstName", "lastName", "emailAddress", "avatar"]
                                            },
                                            {
                                                model: ChecklistDocuments,
                                                as: "tagDocuments",
                                                where: {
                                                    isDeleted: 0
                                                },
                                                include: [
                                                    {
                                                        model: Document,
                                                        as: "document",
                                                        include: [
                                                            {
                                                                model: DocumentRead,
                                                                as: "document_read",
                                                                attributes: ["id"],
                                                                required: false
                                                            },
                                                            {
                                                                model: Users,
                                                                as: "user"
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    })
                                        .map(mapObject => {
                                            return mapObject.toJSON();
                                        })
                                        .then(async o => {
                                            const tags = await Tag.findAll({
                                                where: {
                                                    linkType: "task",
                                                    linkId: taskId,
                                                    tagType: "document"
                                                },
                                                include: [
                                                    {
                                                        model: Document,
                                                        as: "document",
                                                        include: [
                                                            {
                                                                model: DocumentRead,
                                                                as: "document_read",
                                                                attributes: ["id"],
                                                                required: false
                                                            },
                                                            {
                                                                model: Users,
                                                                as: "user"
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }).map(o => {
                                                return o.toJSON();
                                            });
                                            cb({
                                                status: true,
                                                data: {
                                                    result: o,
                                                    type: "checklist",
                                                    tags,
                                                    activity_logs: _.flatten(
                                                        _.map(values, ({ activity_log }) => {
                                                            return activity_log;
                                                        })
                                                    )
                                                }
                                            });
                                        });
                                });
                            });
                        });
                    } else {
                        Tag.findAll({
                            where: { [Op.or]: tagTask },
                            include: [
                                {
                                    model: Document,
                                    as: "document",
                                    include: [
                                        {
                                            model: DocumentRead,
                                            as: "document_read",
                                            attributes: ["id"],
                                            required: false
                                        },
                                        {
                                            model: Users,
                                            as: "user"
                                        }
                                    ]
                                }
                            ]
                        })
                            .map(o => {
                                return o.toJSON();
                            })
                            .then(o => {
                                cb({ status: true, data: { result: o, type: "document" } });
                            });
                    }
                }
            }
        );
    }
};

exports.put = {
    index: (req, cb) => {
        const body = req.body;
        const updateBody = _.omit(body, ["id", "task_members", "task_dependency", "checklist", "workstream"]);
        const whereObj = {
            id: req.params.id
        };
        const options = {
            include: _.filter(associationStack, o => {
                return o.as == "workstream" || o.as == "task_members";
            })
        };

        try {
            async.parallel(
                {
                    task: parallelCallback => {
                        try {
                            Tasks.findOne({ ...options, where: whereObj }).then(async response => {
                                const responseObj = response.toJSON();
                                let checkIfExistTask = [];

                                if (responseObj.task != body.task) {
                                    checkIfExistTask = await Tasks.findAll({
                                        where: {
                                            task: body.task,
                                            workstreamId: body.workstreamId,
                                            id: {
                                                [Sequelize.Op.ne]: body.id
                                            },
                                            [Sequelize.Op.or]: [
                                                { periodTask: null },
                                                {
                                                    periodTask: {
                                                        [Sequelize.Op.ne]: body.id
                                                    }
                                                }
                                            ],
                                            isDeleted: 0
                                        }
                                    }).map(o => {
                                        return o.toJSON();
                                    });
                                }
                                if (checkIfExistTask.length > 0) {
                                    parallelCallback("Task name already exists in the workstream selected.");
                                } else {
                                    Tasks.findOne({ ...options, where: whereObj }).then(response => {
                                        const responseObj = response.toJSON();

                                        const currentTask = _(responseObj)
                                            .omit(["workstreamId", "approvalRequired", "approverId", "dateUpdated", "dateAdded", "periodic", "periodInstance", "periodTask"])
                                            .mapValues((objVal, objKey) => {
                                                if (objKey == "dueDate" || objKey == "startDate") {
                                                    return objVal != "" && objVal != null ? moment(objVal).format("YYYY-MM-DD") : "";
                                                } else if (objKey == "workstream") {
                                                    return responseObj.workstream.workstream;
                                                } else {
                                                    return objVal;
                                                }
                                            })
                                            .value();

                                        Tasks.update(updateBody, { where: { id: body.id } })
                                            .then(response => {
                                                return Tasks.findOne({ ...options, where: { id: body.id } });
                                            })
                                            .then(response => {
                                                const returnCallback = response => {
                                                    const updatedResponse = response.toJSON();
                                                    const updatedTask = _(updatedResponse)
                                                        .omit(["workstreamId", "approvalRequired", "approverId", "dateUpdated", "dateAdded", "periodic", "periodInstance", "periodTask"])
                                                        .mapValues((objVal, objKey) => {
                                                            if (objKey == "dueDate" || objKey == "startDate") {
                                                                return objVal != "" && objVal != null ? moment(objVal).format("YYYY-MM-DD") : "";
                                                            } else if (objKey == "workstream") {
                                                                return updatedResponse.workstream.workstream;
                                                            } else {
                                                                return objVal;
                                                            }
                                                        })
                                                        .value();
                                                    const newObject = func.changedObjAttributes(updatedTask, currentTask);
                                                    const objectKeys = _.map(newObject, function(value, key) {
                                                        return key;
                                                    });

                                                    parallelCallback(null, {
                                                        data: updatedResponse,
                                                        ...(_.isEmpty(newObject)
                                                            ? {}
                                                            : {
                                                                  logs: {
                                                                      old: JSON.stringify({ task_details: _.pick(currentTask, objectKeys) }),
                                                                      new: JSON.stringify({ task_details: newObject })
                                                                  }
                                                              })
                                                    });
                                                };
                                                if (responseObj.periodic == 0 && body.periodic == 1) {
                                                    const taskPromises = _.times(2, o => {
                                                        return new Promise(resolve => {
                                                            const nextDueDate = moment(body.dueDate)
                                                                .add(body.periodType, body.periodInstance * (o + 1))
                                                                .format("YYYY-MM-DD HH:mm:ss");
                                                            const newPeriodTask = {
                                                                ...body,
                                                                dueDate: nextDueDate,
                                                                ...(body.startDate != null && body.startDate != ""
                                                                    ? {
                                                                          startDate: moment(body.startDate)
                                                                              .add(body.periodType, body.periodInstance * (o + 1))
                                                                              .format("YYYY-MM-DD HH:mm:ss")
                                                                      }
                                                                    : {}),
                                                                periodTask: responseObj.id
                                                            };
                                                            Tasks.create(_.omit(newPeriodTask, ["id", "task_dependency", "dependency_type", "assignedTo", "workstream", "checklist"])).then(response => {
                                                                const createTaskObj = response.toJSON();
                                                                ActivityLogs.create({
                                                                    usersId: body.userId,
                                                                    linkType: "task",
                                                                    linkId: createTaskObj.id,
                                                                    actionType: "created",
                                                                    new: JSON.stringify({ task: _.omit(createTaskObj, ["dateAdded", "dateUpdated"]) }),
                                                                    title: createTaskObj.task
                                                                }).then(response => {
                                                                    resolve(createTaskObj);
                                                                });
                                                            });
                                                        });
                                                    });
                                                    Promise.all(taskPromises).then(values => {
                                                        const members = [];
                                                        _.map(values, taskObj => {
                                                            if (typeof body.assignedTo != "undefined" && body.assignedTo != "") {
                                                                members.push({ linkType: "task", linkId: taskObj.id, usersType: "users", userTypeLinkId: body.assignedTo, memberType: "assignedTo" });
                                                            }

                                                            if (typeof body.approverId != "undefined" && body.approverId != "") {
                                                                members.push({ linkType: "task", linkId: taskObj.id, usersType: "users", userTypeLinkId: body.approverId, memberType: "approver" });
                                                            }
                                                        });
                                                        Members.bulkCreate(members).then(() => {
                                                            returnCallback(response);
                                                        });
                                                    });
                                                } else {
                                                    returnCallback(response);
                                                }
                                            });
                                    });
                                }
                            });
                        } catch (err) {
                            parallelCallback(err);
                        }
                    },
                    period: parallelCallback => {
                        if (typeof body.periodic != "undefined" && body.periodic == 1) {
                            const taskId = body.periodTask == null ? body.id : body.periodTask;
                            Tasks.findAll({
                                ...options,
                                where: {
                                    periodTask: taskId,
                                    id: {
                                        [Sequelize.Op.gt]: body.id
                                    }
                                }
                            })
                                .map(mapObject => {
                                    return mapObject.toJSON();
                                })
                                .then(resultArray => {
                                    if (resultArray.length > 0) {
                                        const periodTaskPromise = _.map(resultArray, (periodTaskObj, index) => {
                                            const currentTask = _(periodTaskObj)
                                                .omit(["workstreamId", "dateUpdated", "dateAdded", "periodic", "periodInstance", "periodTask"])
                                                .mapValues((objVal, objKey) => {
                                                    if (objKey == "dueDate" || objKey == "startDate") {
                                                        return objVal != "" && objVal != null ? moment(objVal).format("YYYY-MM-DD") : "";
                                                    } else if (objKey == "workstream") {
                                                        return periodTaskObj.workstream.workstream;
                                                    } else {
                                                        return objVal;
                                                    }
                                                })
                                                .value();
                                            const nextDueDate = moment(body.dueDate)
                                                .add(body.periodType, body.periodInstance * (index + 1))
                                                .format("YYYY-MM-DD HH:mm:ss");
                                            const newPeriodTask = {
                                                ...updateBody,
                                                dueDate: nextDueDate,
                                                ...(body.startDate != null && body.startDate != ""
                                                    ? {
                                                          startDate: moment(body.startDate)
                                                              .add(body.periodType, body.periodInstance * (index + 1))
                                                              .format("YYYY-MM-DD HH:mm:ss")
                                                      }
                                                    : {})
                                            };

                                            return new Promise(resolve => {
                                                Tasks.update(_.omit(newPeriodTask, ["periodTask", "status"]), { where: { id: periodTaskObj.id } })
                                                    .then(response => {
                                                        return Tasks.findOne({ ...options, where: { id: periodTaskObj.id } });
                                                    })
                                                    .then(response => {
                                                        const updatedResponse = response.toJSON();
                                                        const updatedTask = _(updatedResponse)
                                                            .omit(["workstreamId", "dateUpdated", "dateAdded"])
                                                            .mapValues((objVal, objKey) => {
                                                                if (objKey == "dueDate" || objKey == "startDate") {
                                                                    return objVal != "" && objVal != null ? moment(objVal).format("YYYY-MM-DD") : "";
                                                                } else if (objKey == "workstream") {
                                                                    return updatedResponse.workstream.workstream;
                                                                } else {
                                                                    return objVal;
                                                                }
                                                            })
                                                            .value();

                                                        const newObject = func.changedObjAttributes(updatedTask, currentTask);
                                                        const objectKeys = _.map(newObject, function(_, key) {
                                                            return key;
                                                        });
                                                        resolve({
                                                            data: updatedResponse,
                                                            ...(_.isEmpty(newObject) == false
                                                                ? {
                                                                      logs: {
                                                                          old: JSON.stringify({ task_details: _.pick(currentTask, objectKeys) }),
                                                                          new: JSON.stringify({ task_details: newObject })
                                                                      }
                                                                  }
                                                                : {})
                                                        });
                                                    });
                                            });
                                        });
                                        Promise.all(periodTaskPromise).then(values => {
                                            parallelCallback(null, values);
                                        });
                                    } else {
                                        parallelCallback(null, []);
                                    }
                                });
                        } else {
                            parallelCallback(null, []);
                        }
                    }
                },
                (err, result) => {
                    if (err != null) {
                        cb({ status: false, error: err });
                    } else {
                        const { period, task } = result;
                        const allTask = period.concat(task);
                        const taskLogStack = _(allTask)
                            .filter(periodObj => {
                                return typeof periodObj.logs != "undefined";
                            })
                            .map(periodObj => {
                                const { logs, data } = periodObj;
                                return { usersId: body.userId, linkType: "task", linkId: data.id, actionType: "modified", old: logs.old, new: logs.new };
                            })
                            .value();

                        async.parallel(
                            {
                                members: parallelCallback => {
                                    const memberPromise = _.map(allTask, relatedTaskObj => {
                                        return new Promise(resolve => {
                                            Members.findAll({
                                                where: {
                                                    linkType: "task",
                                                    linkId: relatedTaskObj.data.id,
                                                    isDeleted: 0
                                                },
                                                include: [
                                                    {
                                                        model: Users,
                                                        as: "user",
                                                        attributes: ["id", "firstName", "lastName"]
                                                    }
                                                ]
                                            })
                                                .map(o => {
                                                    return o.toJSON();
                                                })
                                                .then(responseObj => {
                                                    const oldUserResponse = responseObj;

                                                    Members.update(
                                                        { isDeleted: 1 },
                                                        {
                                                            where: {
                                                                linkType: "task",
                                                                linkId: relatedTaskObj.data.id,
                                                                usersType: "users"
                                                            }
                                                        }
                                                    ).then(() => {
                                                        const members = [];
                                                        if (typeof body.assignedTo != "undefined" && body.assignedTo != "") {
                                                            members.push({ linkType: "task", linkId: relatedTaskObj.data.id, usersType: "users", userTypeLinkId: body.assignedTo, memberType: "assignedTo" });
                                                        }

                                                        if (typeof body.approverId != "undefined" && body.approverId != "") {
                                                            members.push({ linkType: "task", linkId: relatedTaskObj.data.id, usersType: "users", userTypeLinkId: body.approverId, memberType: "approver" });
                                                        }

                                                        if (members.length > 0) {
                                                            Members.bulkCreate(members)
                                                                .map(async response => {
                                                                    const responseObj = response.toJSON();
                                                                    const userDetails = await Users.findOne({
                                                                        where: {
                                                                            id: responseObj.userTypeLinkId
                                                                        }
                                                                    }).then(o => {
                                                                        return o.toJSON();
                                                                    });
                                                                    return { ..._.omit(responseObj, ["dateUpdated"]), user: userDetails };
                                                                })
                                                                .then(o => {
                                                                    const newAssigned = _.find(o, res => {
                                                                        return res.memberType == "assignedTo";
                                                                    });
                                                                    const newApprover = _.find(o, res => {
                                                                        return res.memberType == "approver";
                                                                    });
                                                                    const oldAssigned = _.find(oldUserResponse, res => {
                                                                        return res.memberType == "assignedTo";
                                                                    });
                                                                    const oldApprover = _.find(oldUserResponse, res => {
                                                                        return res.memberType == "approver";
                                                                    });

                                                                    const memberLogs = _([
                                                                        {
                                                                            old: oldAssigned,
                                                                            new: newAssigned,
                                                                            type: "assigned"
                                                                        },
                                                                        {
                                                                            old: oldApprover,
                                                                            new: newApprover,
                                                                            type: "approver"
                                                                        }
                                                                    ])
                                                                        .filter(o => {
                                                                            const oldUser = typeof o.old != "undefined" ? o.old.userTypeLinkId : 0;
                                                                            const newUser = typeof o.new != "undefined" ? o.new.userTypeLinkId : 0;
                                                                            return oldUser != newUser;
                                                                        })
                                                                        .map(o => {
                                                                            return {
                                                                                old:
                                                                                    o.old != "undefined" && _.isEmpty(o.old) == false
                                                                                        ? JSON.stringify({
                                                                                              [o.type]: o.old
                                                                                          })
                                                                                        : "",
                                                                                new:
                                                                                    o.new != "undefined" && _.isEmpty(o.new) == false
                                                                                        ? JSON.stringify({
                                                                                              [o.type]: o.new
                                                                                          })
                                                                                        : "",
                                                                                actionType: "modified",
                                                                                usersId: body.userId,
                                                                                linkType: "task",
                                                                                linkId: relatedTaskObj.data.id,
                                                                                title: _.isEmpty(o.new) ? (_.isEmpty(o.old) == false ? o.old.user.firstName + " " + o.old.user.lastName : "") : o.new.user.firstName + " " + o.new.user.lastName
                                                                            };
                                                                        })
                                                                        .value();
                                                                    resolve(memberLogs);
                                                                });
                                                        } else {
                                                            resolve(null);
                                                        }
                                                    });
                                                });
                                        });
                                    });

                                    Promise.all(memberPromise).then(values => {
                                        parallelCallback(null, _.flatten(values));
                                    });
                                }
                            },
                            (err, { members }) => {
                                async.parallel(
                                    {
                                        activity_logs: parallelCallback => {
                                            const allLogsStack = [...members, ...taskLogStack];
                                            ActivityLogs.bulkCreate(allLogsStack).then(response => {
                                                parallelCallback(null, response);
                                            });
                                        },
                                        tasks: parallelCallback => {
                                            Tasks.findAll({
                                                ...options,
                                                where: {
                                                    id: _.map(allTask, allTaskObj => {
                                                        return allTaskObj.data.id;
                                                    })
                                                }
                                            })
                                                .map(mapObject => {
                                                    return mapObject.toJSON();
                                                })
                                                .then(resultArray => {
                                                    parallelCallback(null, resultArray);
                                                });
                                        },
                                        project: parallelCallback => {
                                            Projects.update(
                                                {
                                                    dateUpdated: body.dateUpdated
                                                },
                                                {
                                                    where: { id: allTask[0].data.projectId }
                                                }
                                            ).then(res => {
                                                parallelCallback(null);
                                            });
                                        },
                                        workstream: parallelCallback => {
                                            Workstream.update(
                                                { dateUpdated: body.dateUpdated },
                                                {
                                                    where: { id: allTask[0].data.workstreamId }
                                                }
                                            ).then(res => {
                                                parallelCallback(null);
                                            });
                                        }
                                    },
                                    (err, response) => {
                                        cb({ status: true, data: response.tasks });
                                    }
                                );
                            }
                        );
                    }
                }
            );
        } catch (err) {
            cb({ status: false, error: err });
        }
    },
    status: (req, cb) => {
        const body = req.body;
        const options = {
            include: associationStack
        };

        try {
            async.parallel(
                {
                    periodic: parallelCallback => {
                        if (body.periodic == 1 && body.status == "Completed") {
                            const periodTaskId = body.periodTask == null ? body.id : body.periodTask;
                            Tasks.findAll({
                                ...options,
                                limit: 1,
                                where: {
                                    periodTask: periodTaskId
                                },
                                order: [["dueDate", "DESC"]]
                            })
                                .map(mapObject => {
                                    return mapObject.toJSON();
                                })
                                .then(resultArray => {
                                    const latestPeriodicTask = resultArray;
                                    const latestTaskDate = _.omit(latestPeriodicTask[0], ["status", "dateAdded", "dateUpdated"]);
                                    const nextDueDate = moment(latestTaskDate.dueDate)
                                        .add(latestTaskDate.periodType, latestTaskDate.periodInstance)
                                        .format("YYYY-MM-DD HH:mm:ss");
                                    const newPeriodTask = {
                                        ...latestTaskDate,
                                        id: "",
                                        dueDate: nextDueDate,
                                        periodTask: periodTaskId,
                                        ...(latestTaskDate.startDate != null && latestTaskDate.startDate != ""
                                            ? {
                                                  startDate: moment(latestTaskDate.startDate)
                                                      .add(latestTaskDate.periodType, latestTaskDate.periodInstance)
                                                      .format("YYYY-MM-DD HH:mm:ss")
                                              }
                                            : {}),
                                        status: "In Progress"
                                    };

                                    Tasks.create(newPeriodTask).then(response => {
                                        const createTaskObj = response.toJSON();
                                        const periodTaskMembers = _.map(latestPeriodicTask[0].task_members, membersObj => {
                                            return _.omit({ ...membersObj, linkId: createTaskObj.id }, ["id", "user", "dateAdded", "dateUpdated"]);
                                        });
                                        const periodTaskDependencies = _.map(latestPeriodicTask[0].task_dependency, dependencyObj => {
                                            return _.omit({ ...dependencyObj, taskId: createTaskObj.id }, ["id", "task", "dateAdded", "dateUpdated"]);
                                        });

                                        async.parallel(
                                            {
                                                members: parallelCallback => {
                                                    Members.bulkCreate(periodTaskMembers, { returning: true }).then(response => {
                                                        parallelCallback(null, response);
                                                    });
                                                },
                                                dependencies: parallelCallback => {
                                                    TaskDependency.bulkCreate(periodTaskDependencies, { returning: true }).then(response => {
                                                        parallelCallback(null, response);
                                                    });
                                                },
                                                activity_logs: parallelCallback => {
                                                    ActivityLogs.create({
                                                        usersId: body.userId,
                                                        linkType: "task",
                                                        linkId: createTaskObj.id,
                                                        actionType: "created",
                                                        new: JSON.stringify({ task: _.omit(createTaskObj, ["dateAdded", "dateUpdated"]) }),
                                                        title: createTaskObj.task
                                                    }).then(response => {
                                                        parallelCallback(null, response);
                                                    });
                                                }
                                            },
                                            (err, response) => {
                                                Tasks.findOne({ ...options, where: { id: createTaskObj.id } }).then(response => {
                                                    const newTask = response.toJSON();
                                                    parallelCallback(null, newTask);
                                                });
                                            }
                                        );
                                    });
                                });
                        } else {
                            parallelCallback(null, "");
                        }
                    },
                    status: parallelCallback => {
                        const { status } = body;
                        Tasks.findOne({ ...options, where: { id: body.id } }).then(response => {
                            const currentTask = _(response.toJSON())
                                .omit(["checklist", "tag_task", "dateUpdated", "dateAdded", "dateCompleted"])
                                .mapValues((objVal, objKey) => {
                                    if (objKey == "dueDate" || objKey == "startDate") {
                                        return objVal != "" && objVal != null ? moment(objVal).format("YYYY-MM-DD") : "";
                                    } else {
                                        return objVal;
                                    }
                                })
                                .value();

                            Tasks.update(
                                {
                                    status,
                                    dateCompleted: body.status == "Completed" ? moment(body.date).format("YYYY-MM-DD HH:mm:ss") : null
                                },
                                { where: { id: body.id } }
                            )
                                .then(response => {
                                    return Tasks.findOne({ ...options, where: { id: body.id } });
                                })
                                .then(response => {
                                    const updatedResponse = response.toJSON();
                                    const updatedTask = _(updatedResponse)
                                        .omit(["checklist", "tag_task", "dateUpdated", "dateAdded", "dateCompleted"])
                                        .mapValues((objVal, objKey) => {
                                            if (objKey == "dueDate" || objKey == "startDate") {
                                                return objVal != "" && objVal != null ? moment(objVal).format("YYYY-MM-DD") : "";
                                            } else {
                                                return objVal;
                                            }
                                        })
                                        .value();

                                    const newObject = func.changedObjAttributes(updatedTask, currentTask);
                                    const objectKeys = _.map(newObject, function(value, key) {
                                        return key;
                                    });

                                    async.parallel(
                                        {
                                            notificationFollower: statusParallelCallback => {
                                                try {
                                                    if (body.status === "Completed") {
                                                        Users.findOne({
                                                            where: {
                                                                id: body.userId
                                                            }
                                                        }).then(async o => {
                                                            const sender = o.toJSON();
                                                            const receiver = updatedResponse.follower.map(e => {
                                                                return e.userTypeLinkId;
                                                            });

                                                            UsersNotificationSetting.findAll({
                                                                where: { usersId: receiver },
                                                                include: [
                                                                    {
                                                                        model: Users,
                                                                        as: "notification_setting",
                                                                        required: false
                                                                    }
                                                                ]
                                                            })
                                                                .map(response => {
                                                                    return response.toJSON();
                                                                })
                                                                .then(async response => {
                                                                    const notificationArr = await _.filter(response, nSetting => {
                                                                        return nSetting.taskFollowingCompleted === 1;
                                                                    }).map(nSetting => {
                                                                        return {
                                                                            usersId: nSetting.usersId,
                                                                            createdBy: sender.id,
                                                                            projectId: updatedResponse.projectId,
                                                                            taskId: updatedResponse.id,
                                                                            workstreamId: updatedResponse.workstreamId,
                                                                            type: "taskFollowingCompleted",
                                                                            message: `Task ${updatedResponse.task} that you fallowed has been completed.`,
                                                                            emailAddress: nSetting.notification_setting.emailAddress,
                                                                            receiveEmail: nSetting.receiveEmail
                                                                        };
                                                                    });

                                                                    Notification.bulkCreate(notificationArr)
                                                                        .map(notificationRes => {
                                                                            return notificationRes.id;
                                                                        })
                                                                        .then(notificationRes => {
                                                                            Notification.findAll({
                                                                                where: { id: notificationRes },
                                                                                include: [
                                                                                    {
                                                                                        model: Users,
                                                                                        as: "to",
                                                                                        required: false,
                                                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                                    },
                                                                                    {
                                                                                        model: Users,
                                                                                        as: "from",
                                                                                        required: false,
                                                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                                    },
                                                                                    {
                                                                                        model: Projects,
                                                                                        as: "project_notification",
                                                                                        required: false,
                                                                                        include: [
                                                                                            {
                                                                                                model: Type,
                                                                                                as: "type",
                                                                                                required: false,
                                                                                                attributes: ["type"]
                                                                                            }
                                                                                        ]
                                                                                    },
                                                                                    {
                                                                                        model: Document,
                                                                                        as: "document_notification",
                                                                                        required: false,
                                                                                        attributes: ["origin"]
                                                                                    },
                                                                                    {
                                                                                        model: Workstream,
                                                                                        as: "workstream_notification",
                                                                                        required: false,
                                                                                        attributes: ["workstream"]
                                                                                    },
                                                                                    {
                                                                                        model: Tasks,
                                                                                        as: "task_notification",
                                                                                        required: false,
                                                                                        attributes: ["task"]
                                                                                    }
                                                                                ]
                                                                            })
                                                                                .map(findNotificationRes => {
                                                                                    req.app.parent.io.emit("FRONT_NOTIFICATION", {
                                                                                        ...findNotificationRes.toJSON()
                                                                                    });
                                                                                    return findNotificationRes.toJSON();
                                                                                })
                                                                                .then(() => {
                                                                                    async.map(
                                                                                        notificationArr,
                                                                                        ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                                                            if (receiveEmail === 1) {
                                                                                                let html = "<p>" + message + "</p>";
                                                                                                html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
                                                                                                // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                                                                html += `<p>Message:<br><strong>${sender.firstName}  ${sender.lastName}</strong> ${message}</p>`;
                                                                                                html += ` <a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${
                                                                                                    global.site_url
                                                                                                }account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                                                                html += `<p>Date:<br>${moment().format("LLL")}</p>`;

                                                                                                const mailOptions = {
                                                                                                    from: '"no-reply" <no-reply@c_cfo.com>',
                                                                                                    to: `${emailAddress}`,
                                                                                                    subject: "[CLOUD-CFO]",
                                                                                                    html: html
                                                                                                };
                                                                                                global.emailtransport(mailOptions);
                                                                                            }
                                                                                            mapCallback(null);
                                                                                        },
                                                                                        () => {
                                                                                            statusParallelCallback(null);
                                                                                        }
                                                                                    );
                                                                                });
                                                                        });
                                                                });
                                                        });
                                                    } else {
                                                        statusParallelCallback(null);
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            },
                                            notificationTeamLeader: statusParallelCallback => {
                                                try {
                                                    if (body.status === "Completed") {
                                                        Users.findOne({
                                                            where: {
                                                                id: body.userId
                                                            }
                                                        }).then(async o => {
                                                            const sender = o.toJSON();
                                                            const receiver = await UsersTeam.findAll({
                                                                where: { usersId: sender.id },
                                                                include: [
                                                                    {
                                                                        model: Teams,
                                                                        as: "team",
                                                                        required: false
                                                                    }
                                                                ]
                                                            })
                                                                .map(o => {
                                                                    return o.toJSON().team.teamLeaderId;
                                                                })
                                                                .then(o => {
                                                                    return o;
                                                                });

                                                            UsersNotificationSetting.findAll({
                                                                where: { usersId: _.union(receiver) },
                                                                include: [
                                                                    {
                                                                        model: Users,
                                                                        as: "notification_setting",
                                                                        required: false
                                                                    }
                                                                ]
                                                            })
                                                                .map(response => {
                                                                    return response.toJSON();
                                                                })
                                                                .then(async response => {
                                                                    let notificationArr = await _.filter(response, nSetting => {
                                                                        return nSetting.taskMemberCompleted === 1;
                                                                    }).map(nSetting => {
                                                                        return {
                                                                            usersId: nSetting.usersId,
                                                                            createdBy: sender.id,
                                                                            projectId: updatedResponse.projectId,
                                                                            taskId: updatedResponse.id,
                                                                            workstreamId: updatedResponse.workstreamId,
                                                                            type: "taskMemberCompleted",
                                                                            message: `Team member has completed a task ${updatedResponse.task}.`,
                                                                            emailAddress: nSetting.notification_setting.emailAddress,
                                                                            receiveEmail: nSetting.receiveEmail
                                                                        };
                                                                    });

                                                                    Notification.bulkCreate(notificationArr)
                                                                        .map(notificationRes => {
                                                                            return notificationRes.id;
                                                                        })
                                                                        .then(notificationRes => {
                                                                            Notification.findAll({
                                                                                where: { id: notificationRes },
                                                                                include: [
                                                                                    {
                                                                                        model: Users,
                                                                                        as: "to",
                                                                                        required: false,
                                                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                                    },
                                                                                    {
                                                                                        model: Users,
                                                                                        as: "from",
                                                                                        required: false,
                                                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                                    },
                                                                                    {
                                                                                        model: Projects,
                                                                                        as: "project_notification",
                                                                                        required: false,
                                                                                        include: [
                                                                                            {
                                                                                                model: Type,
                                                                                                as: "type",
                                                                                                required: false,
                                                                                                attributes: ["type"]
                                                                                            }
                                                                                        ]
                                                                                    },
                                                                                    {
                                                                                        model: Document,
                                                                                        as: "document_notification",
                                                                                        required: false,
                                                                                        attributes: ["origin"]
                                                                                    },
                                                                                    {
                                                                                        model: Workstream,
                                                                                        as: "workstream_notification",
                                                                                        required: false,
                                                                                        attributes: ["workstream"]
                                                                                    },
                                                                                    {
                                                                                        model: Tasks,
                                                                                        as: "task_notification",
                                                                                        required: false,
                                                                                        attributes: ["task"]
                                                                                    }
                                                                                ]
                                                                            })
                                                                                .map(findNotificationRes => {
                                                                                    req.app.parent.io.emit("FRONT_NOTIFICATION", {
                                                                                        ...findNotificationRes.toJSON()
                                                                                    });
                                                                                    return findNotificationRes.toJSON();
                                                                                })
                                                                                .then(() => {
                                                                                    async.map(
                                                                                        notificationArr,
                                                                                        ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                                                            if (receiveEmail === 1) {
                                                                                                let html = "<p>" + message + "</p>";
                                                                                                html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
                                                                                                // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                                                                html += `<p>Message:<br><strong>${sender.firstName}  ${sender.lastName}</strong> ${message}</p>`;
                                                                                                html += ` <a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${
                                                                                                    global.site_url
                                                                                                }account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                                                                html += `<p>Date:<br>${moment().format("LLL")}</p>`;

                                                                                                const mailOptions = {
                                                                                                    from: '"no-reply" <no-reply@c_cfo.com>',
                                                                                                    to: `${emailAddress}`,
                                                                                                    subject: "[CLOUD-CFO]",
                                                                                                    html: html
                                                                                                };
                                                                                                global.emailtransport(mailOptions);
                                                                                            }
                                                                                            mapCallback(null);
                                                                                        },
                                                                                        () => {
                                                                                            statusParallelCallback(null);
                                                                                        }
                                                                                    );
                                                                                });
                                                                        });
                                                                });
                                                        });
                                                    } else {
                                                        statusParallelCallback(null);
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            },
                                            notificationTaskForApproval: statusParallelCallback => {
                                                try {
                                                    if (body.status == "For Approval") {
                                                        Users.findOne({
                                                            where: {
                                                                id: body.userId
                                                            }
                                                        }).then(o => {
                                                            const sender = o.toJSON();
                                                            const receiver = updatedResponse.approverId;

                                                            UsersNotificationSetting.findAll({
                                                                where: { usersId: receiver },
                                                                include: [
                                                                    {
                                                                        model: Users,
                                                                        as: "notification_setting",
                                                                        required: false
                                                                    }
                                                                ]
                                                            })
                                                                .map(response => {
                                                                    return response.toJSON();
                                                                })
                                                                .then(async response => {
                                                                    const notificationArr = await _.filter(response, nSetting => {
                                                                        return nSetting.taskFollowingCompleted === 1;
                                                                    }).map(nSetting => {
                                                                        return {
                                                                            usersId: nSetting.usersId,
                                                                            createdBy: sender.id,
                                                                            projectId: updatedResponse.projectId,
                                                                            taskId: updatedResponse.id,
                                                                            workstreamId: updatedResponse.workstreamId,
                                                                            type: "taskApprover",
                                                                            message: "Needs your approval to complete a task",
                                                                            emailAddress: nSetting.notification_setting.emailAddress,
                                                                            receiveEmail: nSetting.receiveEmail
                                                                        };
                                                                    });

                                                                    Notification.bulkCreate(notificationArr)
                                                                        .map(notificationRes => {
                                                                            return notificationRes.id;
                                                                        })
                                                                        .then(notificationRes => {
                                                                            Notification.findAll({
                                                                                where: { id: notificationRes },
                                                                                include: [
                                                                                    {
                                                                                        model: Users,
                                                                                        as: "to",
                                                                                        required: false,
                                                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                                    },
                                                                                    {
                                                                                        model: Users,
                                                                                        as: "from",
                                                                                        required: false,
                                                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                                    },
                                                                                    {
                                                                                        model: Projects,
                                                                                        as: "project_notification",
                                                                                        required: false,
                                                                                        include: [
                                                                                            {
                                                                                                model: Type,
                                                                                                as: "type",
                                                                                                required: false,
                                                                                                attributes: ["type"]
                                                                                            }
                                                                                        ]
                                                                                    },
                                                                                    {
                                                                                        model: Document,
                                                                                        as: "document_notification",
                                                                                        required: false,
                                                                                        attributes: ["origin"]
                                                                                    },
                                                                                    {
                                                                                        model: Workstream,
                                                                                        as: "workstream_notification",
                                                                                        required: false,
                                                                                        attributes: ["workstream"]
                                                                                    },
                                                                                    {
                                                                                        model: Tasks,
                                                                                        as: "task_notification",
                                                                                        required: false,
                                                                                        attributes: ["task"]
                                                                                    }
                                                                                ]
                                                                            })
                                                                                .map(findNotificationRes => {
                                                                                    req.app.parent.io.emit("FRONT_NOTIFICATION", {
                                                                                        ...findNotificationRes.toJSON()
                                                                                    });
                                                                                    return findNotificationRes.toJSON();
                                                                                })
                                                                                .then(() => {
                                                                                    async.map(
                                                                                        notificationArr,
                                                                                        ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                                                            if (receiveEmail === 1) {
                                                                                                let html = "<p>" + message + "</p>";
                                                                                                html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
                                                                                                // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                                                                html += `<p>Message:<br><strong>${sender.firstName}  ${sender.lastName}</strong> ${message}</p>`;
                                                                                                html += ` <a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${
                                                                                                    global.site_url
                                                                                                }account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                                                                html += `<p>Date:<br>${moment().format("LLL")}</p>`;

                                                                                                const mailOptions = {
                                                                                                    from: '"no-reply" <no-reply@c_cfo.com>',
                                                                                                    to: `${emailAddress}`,
                                                                                                    subject: "[CLOUD-CFO]",
                                                                                                    html: html
                                                                                                };
                                                                                                global.emailtransport(mailOptions);
                                                                                            }
                                                                                            mapCallback(null);
                                                                                        },
                                                                                        () => {
                                                                                            statusParallelCallback(null);
                                                                                        }
                                                                                    );
                                                                                });
                                                                        });
                                                                });
                                                        });
                                                    } else {
                                                        statusParallelCallback(null);
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            },
                                            activity_logs: statusParallelCallback => {
                                                ActivityLogs.create({
                                                    usersId: body.userId,
                                                    linkType: "task",
                                                    linkId: body.id,
                                                    actionType: body.status == "Completed" ? "completed" : body.status == "Rejected" ? "rejected" : body.status == "In Progress" && currentTask.status == "For Approval" ? "approved" : "modified",
                                                    old: JSON.stringify({ task_status: _.pick(currentTask, objectKeys) }),
                                                    new: JSON.stringify({ task_status: newObject }),
                                                    title: updatedResponse.task,
                                                    notes: body.message
                                                })
                                                    .then(response => {
                                                        const responseObj = response.toJSON();
                                                        return ActivityLogs.findOne({
                                                            include: [
                                                                {
                                                                    model: Users,
                                                                    as: "user",
                                                                    attributes: ["firstName", "lastName"]
                                                                }
                                                            ],
                                                            where: { id: responseObj.id }
                                                        });
                                                    })
                                                    .then(response => {
                                                        const responseObj = response.toJSON();
                                                        const assignedTaskMembers = _.filter(updatedResponse.task_members, member => {
                                                            return member.memberType == "assignedTo";
                                                        });
                                                        const data = {
                                                            ...updatedResponse,
                                                            assignedTo: assignedTaskMembers.length > 0 ? assignedTaskMembers[0].userTypeLinkId : ""
                                                        };
                                                        statusParallelCallback(null, { task: data, activity_log: responseObj });
                                                    });
                                            }
                                        },
                                        (err, { activity_logs }) => {
                                            parallelCallback(null, activity_logs);
                                        }
                                    );
                                });
                        });
                    },
                    document: parallelCallback => {
                        async.parallel(
                            {
                                documents: parallelCallback => {
                                    ChecklistDocuments.findAll({
                                        where: { taskId: body.id }
                                    })
                                        .map(res => {
                                            return res.toJSON().documentId;
                                        })
                                        .then(o => {
                                            parallelCallback(null, o);
                                        });
                                },
                                tag: parallelCallback => {
                                    Tag.findAll({
                                        where: {
                                            linkType: "task",
                                            linkId: body.id,
                                            tagType: "document"
                                        }
                                    })
                                        .map(res => {
                                            return res.toJSON().tagTypeId;
                                        })
                                        .then(o => {
                                            parallelCallback(null, o);
                                        });
                                }
                            },
                            (err, data) => {
                                const documentId = _.uniq([...data.documents, ...data.tag]);
                                const updateBody = {
                                    isCompleted: body.status == "Completed" ? 1 : 0
                                };
                                Document.update(updateBody, { where: { id: documentId } }).then(documentRes => {
                                    parallelCallback(null, documentRes);
                                });
                            }
                        );
                    }
                },
                (err, { status, periodic }) => {
                    const statusStack = [status.task];
                    if (periodic != "") {
                        statusStack.push(periodic);
                    }

                    async.parallel(
                        {
                            projects: parallelCallback => {
                                Projects.update(
                                    { dateUpdated: body.dateUpdated },
                                    {
                                        where: { id: statusStack[0].projectId }
                                    }
                                ).then(res => {
                                    parallelCallback(null);
                                });
                            },
                            workstream: parallelCallback => {
                                Workstream.update(
                                    { dateUpdated: body.dateUpdated },
                                    {
                                        where: { id: statusStack[0].workstreamId }
                                    }
                                ).then(res => {
                                    parallelCallback(null);
                                });
                            }
                        },
                        () => {
                            cb({ status: true, data: { task: statusStack, activity_log: status.activity_log } });
                        }
                    );
                }
            );
        } catch (err) {
            cb({ status: false, error: err });
        }
    }
};

exports.delete = {
    index: (req, cb) => {
        const params = req.params;
        Tasks.update({ isDeleted: 1 }, { where: { id: params.id } }).then(() => {
            cb({ status: true, id: params.id });
        });
    },
    document: (req, cb) => {
        const params = req.params;
        const queryString = req.query;
        if (queryString.type == "Subtask Document") {
            ChecklistDocuments.update(
                { isDeleted: 1 },
                {
                    where: {
                        documentId: params.id
                    }
                }
            )
                .then(() => {
                    return ChecklistDocuments.findAll({ where: { documentId: params.id } }).map(o => {
                        return o.toJSON();
                    });
                })
                .then(async response => {
                    const checklistPromise = _.map(response, ({ checklistId }) => {
                        return new Promise(async (resolve, reject) => {
                            let oldChecklist = await TaskChecklist.findOne({ where: { id: checklistId } }).then(response => {
                                return response.toJSON();
                            });
                            let status = oldChecklist.isCompleted == 1 ? "Complete" : "Not Complete";
                            let oldTaskChecklist = _.pick({ ...oldChecklist, status }, ["description", "type", "status"]);

                            if (status == "Complete") {
                                TaskChecklist.update({ isCompleted: 0 }, { where: { id: checklistId } })
                                    .then(o => {
                                        return TaskChecklist.findOne({ where: { id: checklistId } }).then(o => {
                                            return o.toJSON();
                                        });
                                    })
                                    .then(response => {
                                        const updateResponse = response;
                                        status = updateResponse.isCompleted == 1 ? "Complete" : "Not Complete";

                                        const newObject = func.changedObjAttributes(_.pick({ ...updateResponse, status }, ["description", "type", "status"]), oldTaskChecklist);
                                        const objectKeys = _.map(newObject, function(value, key) {
                                            return key;
                                        });
                                        const bulkActivities = [
                                            {
                                                usersId: queryString.userId,
                                                linkType: "document",
                                                linkId: params.id,
                                                actionType: "deleted"
                                            },
                                            {
                                                usersId: queryString.userId,
                                                linkType: "checklist",
                                                linkId: updateResponse.id,
                                                actionType: "modified",
                                                old: JSON.stringify({ checklist: _.pick(oldTaskChecklist, objectKeys) }),
                                                new: JSON.stringify({ checklist: newObject }),
                                                title: oldTaskChecklist.description
                                            }
                                        ];

                                        ActivityLogs.bulkCreate(bulkActivities)
                                            .map(({ id }) => {
                                                return id;
                                            })
                                            .then(activityResponse => {
                                                return ActivityLogs.findAll({
                                                    include: [
                                                        {
                                                            model: Users,
                                                            as: "user",
                                                            attributes: ["firstName", "lastName"]
                                                        }
                                                    ],
                                                    where: { id: activityResponse }
                                                }).map(o => {
                                                    return o.toJSON();
                                                });
                                            })
                                            .then(responseObj => {
                                                resolve({ checklist: updateResponse, activity_log: responseObj });
                                            });
                                    });
                            } else {
                                resolve({ checklist: {}, activity_log: [] });
                            }
                        });
                    });
                    Promise.all(checklistPromise).then(function(values) {
                        cb({
                            status: true,
                            data: {
                                id: params.id,
                                activity_logs: _.flatten(
                                    _.map(values, ({ activity_log }) => {
                                        return activity_log;
                                    })
                                )
                            }
                        });
                    });
                });
        } else {
            async.parallel(
                {
                    tag: parallelCallback => {
                        Tag.update(
                            { isDeleted: 1 },
                            {
                                where: {
                                    tagType: "document",
                                    tagTypeId: params.id
                                }
                            }
                        ).then(response => {
                            parallelCallback(null);
                        });
                    },
                    document: parallelCallback => {
                        Document.update(
                            { isActive: 0 },
                            {
                                where: {
                                    id: params.id
                                }
                            }
                        ).then(() => {
                            ActivityLogs.create({
                                usersId: queryString.userId,
                                linkType: "document",
                                linkId: params.id,
                                actionType: "deleted"
                            })
                                .then(resultArray => {
                                    const responseObj = resultArray.toJSON();
                                    return ActivityLogs.findOne({
                                        include: [
                                            {
                                                model: Users,
                                                as: "user",
                                                attributes: ["firstName", "lastName"]
                                            }
                                        ],
                                        where: { id: responseObj.id }
                                    });
                                })
                                .then(o => {
                                    parallelCallback(null, o.toJSON());
                                });
                        });
                    }
                },
                (err, result) => {
                    cb({ status: true, data: { id: params.id, activity_logs: [result.document] } });
                }
            );
        }
    }
};
