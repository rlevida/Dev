const moment = require("moment")

module.exports = async (params) => {
    const { emailNotificationData } = { ...params };
    emailNotificationData.forEach(emailObj => {
        const { message, projectId, workstreamId, taskId, from, to } = { ...emailObj }
        let html = "<p>" + message + "</p>";
        html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
        html += `<p>Message:<br><strong>${from.firstName}  ${from.lastName}</strong> ${message}</p>`;
        html += ` <a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${
            global.site_url
            }account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
        html += `<p>Date:<br>${moment().format("LLL")}</p>`;

        const mailOptions = {
            from: '"no-reply" <no-reply@c_cfo.com>',
            to: `${to.emailAddress}`,
            subject: "[CLOUD-CFO]",
            html: html
        };
        global.emailtransport(mailOptions);
    });

    return;
}