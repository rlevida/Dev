const async = require("async"),
    moment = require("moment"),
    _ = require("lodash"),
    CronJob = require("cron").CronJob;

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

/**
 *
 * Comment : Manage reminder for due today
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW
 *
 **/

var job = new CronJob(
    "0 0 * * *",
    function() {
        const models = require("../modelORM");
        const { Projects } = models;
        const startDay = moment()
                .subtract(1, "year")
                .startOf("day")
                .utc()
                .format("YYYY-MM-DD HH:mm"),
            endDay = moment()
                .subtract(1, "year")
                .endOf("day")
                .utc()
                .format("YYYY-MM-DD HH:mm");

        Projects.findAll({
            where: {
                isDeleted: 1,
                dateUpdated: { [Sequelize.Op.between]: [startDay, endDay] }
            },
            raw: true
        })
            .map(projectRet => {
                return projectRet.id;
            })
            .then(projectReturn => {
                console.log(projectReturn);
                if (projectReturn.length > 0) {
                    Projects.destroy({ where: { id: { [Sequelize.Op.in]: [projectReturn] } } }).then(() => {
                        return;
                    });
                } else {
                    return;
                }
            })
            .catch(err => {
                console.error(err);
            });
    },
    null,
    true,
    "Asia/Manila"
);
