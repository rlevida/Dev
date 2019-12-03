const moment = require("moment");
const func = global.initFunc();
const sendEmailNotification = require("../sendEmailNotification");
const { orderBy } = require("lodash");

module.exports = async (params) => {
    const { emailNotificationData, conversations } = { ...params };

    emailNotificationData.forEach(emailObj => {
        const {
            to, from, projectId, noteId,
            workstream_notification,
            project_notification: { project },
            note_notification: { note },
        } = { ...emailObj }

        const userCommentHistory = conversations.slice(conversations.length - 4);
        const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${projectId}/messages?note-id=${noteId}`;

        const html =
            `<body style='background-color: #2f51d0; font-family:  Arial; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.45em; margin: 0; padding: 50px; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%'>
        <table style="background-color: #fff; margin:auto; width:90%; padding:25px; border-radius:5px;">      
            <tr>
                <td>
                    <p>Hi ${to.firstName},</p>
                    <p>${from.firstName} mentioned you in a message.<p>
                </td>
            </tr>
            <tr>
                <td>
                    <p style="margin:0"><strong>${project}</strong></p>
                    <p style="margin:0">Workstream: <strong>${workstream_notification ? workstream_notification.workstream : "NA"}</strong></p>
                    <p style="margin:0"><strong>${note}</strong></p>
                    
                </td>
            </tr>
            <tr>
                <td>
                    <p><strong>Message History: </strong></p>
                    <table width="100%">
                    ${
            orderBy(userCommentHistory, ["dateAdded"], ["desc"]).map(({ comment, dateAdded }) => {
                const duration = moment.duration(moment().diff(moment(dateAdded)));
                const date = duration.asDays() > 1 ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());
                return (
                    `
                                                        <tr style="background-color:#f6f6f6; margin-bottom:5px;">
                                                            <td style="padding:10px;">
                                                                ${func.MentionConvert(comment)}
                                                                <p style="margin:0; font-size: 11px !important; font-weight: 200 !important">Sent ${date}</p>
                                                            </td>
                                                        </tr>
                                                    `
                )
            }).join("")
            }
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding-top:30px; padding-bottom:30px;">
                    <table border="0" cellspacing="0" borderspacing="0" style="max-width:100px; border-radius:3px;">
                        <tr>
                            <td style="background-color: #7068d6; border-radius: 3px;text-align: center; border: solid 5px #7068d6; width: 100px;">
                                <a href="${url}" style="color: white; cursor: pointer;font-weight: 500; text-decoration:none;">View</a>
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
        sendEmailNotification({ html, to: to.emailAddress, subject: `You were mentioned in a message` });
    })
    return;
}