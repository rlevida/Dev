const sendEmailNotification = require("../sendEmailNotification");

module.exports = async (params) => {
    const { emailNotificationData } = { ...params }

    emailNotificationData.forEach(emailObj => {
        const {
            to, projectId, workstreamId, taskId,
            project_notification: { project },
            workstream_notification: { workstream },
        } = { ...emailObj }
        const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?${taskId ? `task-id=${taskId}` : `tab=document`}`;
        const html =
            `
            <body style='background-color: #2f51d0; font-family:  Arial; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.45em; margin: 0; padding: 50px; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%'>
                <table style="background-color: #fff; margin:auto; width:70%; padding:25px; color:#818181; border-radius:5px;">   
                    <tr>
                        <td>
                            <p>Hi ${to.firstName},</p>
                            <p>New files have been uploaded for:</p>
                        </td>
                    </tr>    
                    <tr>
                        <td>
                            <p style="margin:0"><strong>${project}</strong></p>
                            <p style="margin:0">Workstream: <strong>${workstream ? workstream : "NA"}</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top:30px; padding-bottom:30px;">
                            <table border="0" cellspacing="0" borderspacing="0" style="width:100; max-width:100px; border-radius:3px;">
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
                            <img src="cid:cloud-cfo-logo" alt="Cloud Cfo" height="70px" width="70px">
                            <p>***Please do not reply to this email***</p>
                        </td>
                    </tr>
                </table>
            </body>
        `;
        sendEmailNotification({ html, to: to.emailAddress, subject: "New files were uploaded" });
    });
    return;
}