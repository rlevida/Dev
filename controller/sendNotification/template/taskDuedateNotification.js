const moment = require("moment");
const { orderBy } = require("lodash");
const ejs = require("ejs");
const func = global.initFunc();
const sendEmailNotification = require("../sendEmailNotification");

module.exports = async (params) => {
    const { firstName, subject, memberType, message, receiver, icons } = { ...params };
    const name = func.toCapitalizeFirstLetter(firstName)
    const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/my-tasks?tab=${memberType || "assignedToMe"}`
    const html = await ejs.renderFile(`${__dirname}/../email-template/taskDuedate.ejs`,
        {
            data: {
                ...params,
                name: name,
                url: url,
                message: message,
                func: func,
                moment: moment,
                orderBy: orderBy
            }
        }
    );
    sendEmailNotification({ html, to: receiver, subject, icons });
    return;
}