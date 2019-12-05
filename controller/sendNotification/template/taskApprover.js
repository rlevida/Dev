const moment = require("moment");
const sendEmailNotification = require("../sendEmailNotification");

module.exports = async (params) => {
    const { emailNotificationData, type } = { ...params };

    emailNotificationData.forEach(emailObj => {
        const {
            to, projectId, workstreamId, taskId,
            project_notification: { project },
            task_notification: { task, dueDate },
            workstream_notification: { workstream }
        } = { ...emailObj };

        const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}`;
        const subject = type === "approver" ? "You have been assigned as an approver" : "Needs your approval to complete a task";

        const html =
            `
            <body style='background-color: #2f51d0; font-family:  Arial; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.45em; margin: 0; padding: 50px; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%'>
                <table style="background-color: #fff; margin:auto; width:90%; padding:25px; border-radius:5px;">    
                    <tr>
                        <td>
                            <p>Hi ${to.firstName},</p>
                            ${ type === "approval" ? `<p>Needs your approval in a task.</p>` : ""}
                            ${ type === "approver" ? `<p>You have been assigned as an approver of a task.</p>` : ""}
                        </td>
                    </tr>
                    <tr>
                        <td style="margin-bottom:30px">
                            <p style="margin:0"><strong>${project}</strong></p>
                            <p style="margin:0">Workstream: <strong>${workstream ? workstream : "NA"}</strong></p>
                            <p style="margin:30px 0 0 0"><strong>${task}</strong></p>
                            <p style="margin:0">Due Date: <strong>${moment(dueDate).format("MMMM DD, YYYY")}</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top:30px; padding-bottom:30px;">
                            <table border="0" cellspacing="0" borderspacing="0" style="max-width:100px; border-radius:3px;">
                                <tr>
                                    <td style="background-color: #7068d6; border-radius: 3px;text-align: center; border: solid 5px #7068d6; width: 100px;">
                                        <a href="${url}" style="color: white; cursor: pointer;font-weight: 500; text-decoration:none"">View</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>    
                    <tr>    
                        <td>            
                            <p style="margin:0">Thanks,</p>
                            <p style="margin:0">CloudCfo Team</p>
                            <img src="cid:cloud-cfo-logo" alt="Cloud Cfo" height="70" width="70">
                            <p>***Please do not reply to this email***</p>
                        </td>
                    </tr>
                </table>
            </body>
        `;
        sendEmailNotification({ html, to: to.emailAddress, subject });
    })
    return
}