const moment = require("moment");
const ejs = require("ejs");
const func = global.initFunc();
const sendEmailNotification = require("../sendEmailNotification");

module.exports = async (params) => {
    const { emailNotificationData, type } = { ...params };

    emailNotificationData.forEach(async emailObj => {
        const {
            to, from, users_conversation,
            project_notification: { project },
            workstream_notification: { workstream },
            task_notification: { task },
            projectId, workstreamId, taskId,
        } = { ...emailObj }

        const { comment, dateAdded } = { ...users_conversation.slice(-1)[0] };
        const duration = moment.duration(moment().diff(moment(dateAdded)));
        const date = duration.asDays() > 1 ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());
        const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}`;
        const subject = type === "taskTagged" ? "You have been tagged in a comment" : type === "commentReplies" ? "There is an update on a comment you posted" : "You received a comment on a task assigned to you.";
        const message = type === "taskTagged" ? `You have been mentioned in a <strong>${task}</strong>` : `${from.firstName} commented on a task.`
        const nameTo = func.toCapitalizeFirstLetter(to.firstName);
        const html = await ejs.renderFile(`${__dirname}/../email-template/taskComment.ejs`,
            {
                data: {
                    ...params,
                    nameTo,
                    from,
                    message,
                    url,
                    func,
                    project,
                    workstream,
                    projectId,
                    moment,
                    date,
                    comments: comment,

                }
            }
        );
        sendEmailNotification({ html, to: to.emailAddress, subject });
    })
    return;
}