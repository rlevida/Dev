const async = require("async");
const _ = require("lodash");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const models = require("../modelORM");
const { ActivityLogsDocument, Users, Document } = models;

const associationStack = [
    {
        model: Users,
        as: "user"
    },
    {
        model: Document,
        as: "document",
        attributes: ["id", "origin", "documentNameCount"]
    }
];

exports.post = (req, cb) => {
    try {
        ActivityLogs.create(req.body).then(response => {
            cb({ status: true, data: response });
        });
    } catch (err) {
        cb({ status: false, error: err });
    }
};

exports.get = {
    index: (req, cb) => {
        const limit = 10;
        const queryString = req.query;
        let whereObj = {
            ...(typeof queryString.projectId !== "undefined" && queryString.projectId !== "" ? { projectId: queryString.projectId } : {}),
            ...(typeof queryString.userType != "undefined" && queryString.userType == "External" && typeof queryString.userId != "undefined" && queryString.userId != ""
                ? {
                      [Op.or]: [
                          {
                              linkId: {
                                  [Op.in]: Sequelize.literal(`(SELECT DISTINCT shareId FROM share where userTypeLinkId = ${queryString.userId})`)
                              }
                          },
                          {
                              linkId: {
                                  [Op.in]: Sequelize.literal(`(SELECT DISTINCT document.id FROM document LEFT JOIN share ON document.folderId = share.shareId where share.shareType = 'folder' AND share.userTypeLinkId = ${queryString.userId} )`)
                              }
                          },
                          {
                              linkId: {
                                  [Op.in]: Sequelize.literal(`(SELECT DISTINCT document.id FROM document WHERE uploadedBy = ${queryString.userId})`)
                              }
                          }
                      ]
                  }
                : {}),
            ...(typeof queryString.search !== "undefined" && queryString.search !== ""
                ? {
                      [Op.or]: [{ new: { [Op.like]: `%${queryString.search}%` } }, { old: { [Op.like]: `%${queryString.search}%` } }]
                  }
                : {})
        };

        if (typeof queryString.uploadedBy !== "undefined" && queryString.uploadedBy !== "") {
            _.find(associationStack, { as: "user" }).where = {
                [Op.or]: [{ emailAddress: { [Op.like]: `%${queryString.uploadedBy}%` } }]
            };
            _.find(associationStack, { as: "user" }).required = true;
        } else {
            delete _.find(associationStack, { as: "user" }).required;
            delete _.find(associationStack, { as: "user" }).where;
        }

        const options = {
            ...(typeof queryString !== "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {}),
            order: [["dateAdded", "DESC"]]
        };

        async.parallel(
            {
                result: parallelCallback => {
                    try {
                        ActivityLogsDocument.findAll({
                            ...options,
                            where: whereObj,
                            include: associationStack
                        }).then(res => {
                            parallelCallback(null, res);
                        });
                    } catch (err) {
                        cb({ status: false, error: err });
                    }
                },
                count: parallelCallback => {
                    ActivityLogsDocument.findAndCountAll({
                        ...options,
                        where: whereObj,
                        include: [
                            {
                                model: Users,
                                as: "user"
                            }
                        ]
                    }).then(res => {
                        const pageData = {
                            total_count: res.count,
                            ...(typeof queryString.page !== "undefined" && queryString.page !== "" ? { current_page: res.count > 0 ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {})
                        };
                        parallelCallback(null, pageData);
                    });
                }
            },
            (err, results) => {
                if (err) {
                    cb({ status: false, error: err });
                } else {
                    cb({ status: true, data: results });
                }
            }
        );
    }
};
