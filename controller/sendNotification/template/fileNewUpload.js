const { orderBy } = require("lodash");
const ejs = require("ejs");
const func = global.initFunc();
const sendEmailNotification = require("../sendEmailNotification");

module.exports = async (params) => {
    const { emailNotificationData } = { ...params }
    emailNotificationData.forEach(async emailObj => {
        const {
            to, projectId, workstreamId, taskId,
            project_notification: { project },
            workstream_notification: { workstream },
        } = { ...emailObj }

        const name = func.toCapitalizeFirstLetter(to.firstName);
        const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?${taskId ? `task-id=${taskId}` : `tab=document`}`;
        const html = await ejs.renderFile(`${__dirname}/../email-template/fileNewUpload.ejs`,
            {
                data: {
                    ...params,
                    name,
                    url,
                    func,
                    orderBy,
                    project,
                    workstream,
                    projectId,
                    workstreamId,
                    taskId
                }
            }
        );
        sendEmailNotification({ html, to: to.emailAddress, subject: "New files were uploaded" });
    });
    return;
}