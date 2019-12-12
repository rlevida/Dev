const moment = require("moment");
const func = global.initFunc();
const ejs = require("ejs");
const sendEmailNotification = require("../sendEmailNotification");

module.exports = async (params) => {
    const { emailNotificationData } = { ...params };

    emailNotificationData.forEach(async emailObj => {
        const {
            to, from, projectId, workstreamId, taskId,
            project_notification: { project },
            task_notification: { task, dueDate, task_approver },
            workstream_notification: { workstream }
        } = { ...emailObj };

        const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}`;
        const nameTo = func.toCapitalizeFirstLetter(to.firstName);
        const nameFrom = func.toCapitalizeFirstLetter(from.firstName);
        const html = await ejs.renderFile(`${__dirname}/../email-template/taskAssigned.ejs`,
            {
                data: {
                    ...params,
                    nameTo,
                    nameFrom,
                    url,
                    project,
                    workstream,
                    task,
                    task_approver,
                    dueDate,
                    projectId,
                    moment,
                }
            }
        );
        sendEmailNotification({ html, to: to.emailAddress, subject: "You have been assigned a new task" });
    })
    return;
}