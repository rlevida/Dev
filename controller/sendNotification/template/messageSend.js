const moment = require("moment");
const func = global.initFunc();
const sendEmailNotification = require("../sendEmailNotification");
const ejs = require("ejs");

module.exports = async (params) => {
    const { emailNotificationData } = { ...params }
    emailNotificationData.forEach(async emailObj => {
        const {
            to, from, projectId, noteId,
            project_notification: { project },
            conversation_notification: { comment, dateAdded },
            note_notification: { note },
            workstream_notification: { workstream }
        } = { ...emailObj }

        const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${projectId}/messages?note-id=${noteId}`;
        const duration = moment.duration(moment().diff(moment(dateAdded)));
        const date = duration.asDays() > 1 ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());
        const nameTo = func.toCapitalizeFirstLetter(to.firstName);
        const nameFrom = func.toCapitalizeFirstLetter(from.firstName);
        const html = await ejs.renderFile(`${__dirname}/../email-template/messageSend.ejs`,
            {
                data: {
                    ...params,
                    nameTo,
                    nameFrom,
                    from,
                    url,
                    func,
                    project,
                    workstream,
                    projectId,
                    note,
                    moment,
                    date,
                    comments: comment,

                }
            }
        );
        sendEmailNotification({ html, to: to.emailAddress, subject: "You received a new message" });
    });
    return;
}