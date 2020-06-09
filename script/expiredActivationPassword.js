const CronJob = require("cron").CronJob;
const models = require("../modelORM");
const Sequelize = require("sequelize");
const { UsersCreatePassword } = models;
/**
 *
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW
 *
 **/

var job = new CronJob(
    "*/15 * * * * *",
    async () => {
        try {
            await UsersCreatePassword.destroy({
                where: {
                    [Sequelize.Op.and]: [
                        Sequelize.literal(`dateUpdated < NOW() + INTERVAL -1 HOUR`),
                    ]
                },
            })
        } catch (err) {
            console.error(err)
        }
    },
    null,
    true,
    "Asia/Manila"
);

