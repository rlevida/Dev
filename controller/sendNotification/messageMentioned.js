const moment = require("moment");
const { orderBy } = require("lodash");
const ejs = require("ejs");
const sendEmailNotification = require("./sendEmailNotification");
const func = global.initFunc();

module.exports = async (params) => {
    const { emailNotificationData, conversations } = { ...params };

    emailNotificationData.forEach(async emailObj => {
        const {
            to, from, projectId, noteId,
            workstream_notification: { workstream },
            project_notification: { project },
            note_notification: { note },
        } = { ...emailObj }

        const userCommentHistory = conversations.slice(conversations.length - 4);
        const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${projectId}/messages?note-id=${noteId}`;
        const nameTo = func.toCapitalizeFirstLetter(to.firstName);
        const nameFrom = func.toCapitalizeFirstLetter(from.firstName);
        const html = await ejs.renderFile(`${__dirname}/email-template/messageMentioned.ejs`,
            {
                data: {
                    ...params,
                    nameTo,
                    nameFrom,
                    url,
                    func,
                    orderBy,
                    project,
                    workstream,
                    projectId,
                    note,
                    moment,
                    comments: userCommentHistory,

                }
            }
        );
        sendEmailNotification({ html, to: to.emailAddress, subject: `You were mentioned in a message` });
    })
    return;
}