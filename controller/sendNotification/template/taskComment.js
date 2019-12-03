const moment = require("moment");
const func = global.initFunc();
const sendEmailNotification = require("../sendEmailNotification");

module.exports = async (params) => {
    const { emailNotificationData, type } = { ...params };

    emailNotificationData.forEach(emailObj => {
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
        const message = type === "taskTagged" ? `You have been mentioned in a <strong>${task}</strong>` : `${from.firstName} commented on a task assigned to you.`
        const html =
            `
    <body style='background-color: #2f51d0; font-family:  Arial; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.45em; margin: 0; padding: 50px; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%'>
        <table style="background-color: #fff; margin:auto; width:70%; padding:25px; color:#818181; border-radius:5px;">   
            <tr> 
                <td>     
                    <p>Hi ${to.firstName},</p>
                    <p>${message}<p>
                </td>
            </tr>
            <tr>
                <td>
                    <p style="margin:0"><strong>${project}</strong></p>
                    <p style="margin:0">Workstream: <strong>${workstream ? workstream : "NA"}</strong></p>
                    <p style="margin:0"><strong>${task}</strong></p>
                </td>
            </tr>
            <tr>
                <td>
                    <p>Comment:</p>
                    <table width="100%">
                        <tr style="background-color:#f6f6f6; margin-bottom:5px;">
                            <td style="padding:10px;">
                                ${func.MentionConvert(comment)}
                                <p style="margin: 0px !important; font-size: 11px !important; font-weight: 200 !important">
                                    Posted ${date} by ${from.firstName + " " + from.lastName}.
                                </p>
                            </td>
                        </tr>
                    </table>
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
                    <img src="cid:cloud-cfo-logo" alt="Cloud Cfo" height="70" width="70">
                    <p>***Please do not reply to this email***</p>
                </td>
            </tr>
        </table
    </body>
`;
        sendEmailNotification({ html, to: to.emailAddress, subject });
    })
    return;
}