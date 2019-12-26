const moment = require("moment");
const ejs = require("ejs");
const func = global.initFunc();
const sendEmailNotification = require("./sendEmailNotification");

module.exports = async (params) => {
    const { emailNotificationData, type } = { ...params };

    emailNotificationData.forEach(async emailObj => {
        const {
            to, projectId, workstreamId, taskId,
            project_notification: { project },
            task_notification: { task, dueDate },
            workstream_notification: { workstream }
        } = { ...emailObj };

        const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}`;
        const subject = type === "approver" ? "You have been assigned as an approver" : "Needs your approval to complete a task";
        const nameTo = func.toCapitalizeFirstLetter(to.firstName);
        const html = await ejs.renderFile(`${__dirname}/email-template/taskApprover.ejs`,
            {
                data: {
                    ...params,
                    nameTo,
                    url,
                    project,
                    workstream,
                    task,
                    dueDate,
                    projectId,
                    moment,
                    type
                }
            }
        );
        sendEmailNotification({ html, to: to.emailAddress, subject });
    })
    return
}