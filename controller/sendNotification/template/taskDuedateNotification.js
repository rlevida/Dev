const moment = require("moment");
const { orderBy } = require("lodash");
const func = global.initFunc();
const sendEmailNotification = require("../sendEmailNotification");

module.exports = async (params) => {
    const { firstName, subject, tasks, memberType, message, receiver, icons } = { ...params };
    const name = func.toCapitalizeFirstLetter(firstName)

    const url = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/my-tasks?tab=${memberType || "assignedToMe"}`

    const html = `
    <body style='background-color: #2f51d0; font-family:  Arial; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.45em; margin: 0; padding: 50px; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%'>
        <table style="background-color: #fff; margin:auto; width:90%; padding:25px; border-radius:5px;">
            <tr> 
                <td>
                    <p>Hi ${name},</p>
                    <p>${message}:<p>
                </td>
            </tr>
            <tr>
                <td>
                    <table style="width:100%; table-layout: fixed;">
                        <thead>
                            <tr style="font-size: .90em!important;">
                                <th style="letter-spacing; text-align: center; padding: .625em; white-space: pre-wrap; word-wrap: break-word;">TASK NAME</th>
                                <th style="letter-spacing; text-align: center; padding: .625em; white-space: pre-wrap; word-wrap: break-word;">DEADLINE</th>
                                <th style="letter-spacing; text-align: center; padding: .625em; white-space: pre-wrap; word-wrap: break-word;">TIME REMAINING</th>
                                <th style="letter-spacing; text-align: center; padding: .625em; white-space: pre-wrap; word-wrap: break-word;">NAME</th>
                                <th style="letter-spacing; text-align: center; padding: .625em; white-space: pre-wrap; word-wrap: break-word;">PROJECT</th>
                            </tr>
                        </thead>
                            <tbody>
                                ${
        orderBy(tasks, ["dueDate"], ["desc"]).map((userTask) => {
            const { task_project, task, dueDate } = { ...userTask }
            const remainingDays = func.daysRemaining(dueDate);
            const taskAsssigned = `${func.toCapitalizeFirstLetter(userTask.assignee[0].user.firstName)} ${func.toCapitalizeFirstLetter(userTask.assignee[0].user.lastName)}`
            const taskUrl = `${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${userTask.projectId}/workstreams/${userTask.workstreamId}?task-id=${userTask.id}`;
            const projectName = `${task_project.project.substring(0, 10)}${task_project.project.length > 10 ? "..." : ""}`
            const taskName = `${task.substring(0, 12)}${task.length > 12 ? "..." : ""}`
            return (
                `
                                            <tr>
                                                <td style="font-size: .90em!important; text-align: center; padding: .500em; white-space: pre-wrap; word-wrap: break-word;"><a title="${task}" style=""href="${taskUrl}" style=" text-decoration:none; margin:0;">${taskName}</a></td>
                                                <td style="font-size: .90em!important; text-align: center; padding: .500em; white-space: pre-wrap; word-wrap: break-word;"><p style="margin:0;">${moment(userTask.dueDate).format("MMMM DD, YYYY")}</p></td>
                                                <td style="font-size: .90em!important; text-align: center; padding: .500em; white-space: pre-wrap; word-wrap: break-word;"><p style="margin:0;">${Math.abs(remainingDays)} ${remainingDays < 0 ? "days delayed" : "day"}</p></td>
                                                <td style="font-size: .90em!important; text-align: center; padding: .500em; white-space: pre-wrap; word-wrap: break-word;"><p style="margin:0;">${taskAsssigned}</p></td>
                                                <td style="font-size: .90em!important; text-align: center; padding: .500em; white-space: pre-wrap; word-wrap: break-word;"><p title="${task_project.project}" style="-webkit-border-radius: 10px; -moz-border-radius: 10px; border-radius: 10px; margin:0; border: solid 5px ${task_project.color}; background-color:${task_project.color};"><img src=${`cid:${task_project.type.type == "Client" ? "client-project-icon" : task_project.type.type == "Private" ? "private-project-icon" : "internal-project-icon"}`} height="12" width="12">&nbsp;&nbsp;<font style="color:#fff">${projectName}</font></p></td>
                                            </tr>
                                            `
            )
        }).join("")
        }
                            </tbody>
                    </table>
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
                    <p style="margin:0;">Thanks,</p>
                    <p style="margin:0">CloudCfo Team</p>
                    <img src="cid:cloud-cfo-logo" alt="Cloud Cfo" height="70" width="70">
                    <p>***Please do not reply to this email***</p>
                </td>
            </tr>
        </table>
    </body>
    `;

    sendEmailNotification({ html, to: receiver, subject, icons });
}