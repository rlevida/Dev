const models = require("../../modelORM");
const { filter } = require("lodash");
const { Notification, UsersNotificationSetting, Projects, Users } = models;

const { notificationIncludes } = require("../includes/notification");

module.exports = async (params) => {
    const { req, receiver, sender, notificationType, notificationData, requestBody, notificationSocket } = { ...params };

    const projectFindResult = await Projects.findOne({ where: { id: requestBody.projectId, isDeleted: 0, isActive: true }, attributes: ["appNotification", "emailNotification"], raw: true });

    let message = "";

    switch (notificationType) {
        case "messageSend":
            message = `${sender.firstName} sent you a message`;
            break;
        default:
            break
    }

    const usersNotificationSettingFindResult = await UsersNotificationSetting.findAll({
        where: { usersId: receiver },
        include: [
            {
                model: Users,
                as: "notification_setting",
                required: false
            }
        ]
    }).map(notificationSettingResponse => {
        const notificationSetting = notificationSettingResponse.toJSON();
        return {
            messageSend: notificationSetting.messageSend,
            receiveEmail: notificationSetting.receiveEmail,
            usersId: notificationSetting.usersId,
            projectId: requestBody.projectId,
            workstreamId: requestBody.workstreamId,
            createdBy: sender.id,
            ...(notificationData.note ? { noteId: notificationData.note.id } : {}),
            ...(notificationData.conversations ? { conversationId: notificationData.conversations.id } : {}),
            type: notificationType,
            message: message,
        }
    })

    const appNotificationData = filter(usersNotificationSettingFindResult, nSetting => {
        return nSetting.messageSend === 1 && projectFindResult.appNotification === 1;
    })

    // APP NOTIFICATION
    const notificationBulkCreateResult = await Notification.bulkCreate(appNotificationData)
        .map(notificationRes => {
            return notificationRes.id;
        })

    await Notification.findAll({
        where: { id: notificationBulkCreateResult },
        include: notificationIncludes()
    }).map(findNotificationRes => {
        notificationSocket.emit("FRONT_NOTIFICATION", {
            ...findNotificationRes.toJSON()
        });
        return findNotificationRes.toJSON();
    })

    return true


    // EMAIL NOTIFICATION


    // const emailNotificationData = _.filter(notificationSettingResponse, nSetting => {
    //     return nSetting.receiveEmail === 1 && projectFindResult.emailNotificationData === 1
    // })

    // async.map(
    //     notificationArr,
    //     ({ emailAddress, message, receiveEmail, projectId, noteId }, mapCallback) => {
    //         if (receiveEmail === 1) {
    //             let html = "<p>" + message + "</p>";
    //             html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
    //             // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
    //             html += `<p>Message:<br><strong>${sender.firstName}  ${sender.lastName}</strong> ${message}</p>`;
    //             html += `<a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${global.site_url}account#/projects/${projectId}/messages?note-id=${noteId}">Click here</a>`;
    //             html += `<p>Date:<br>${moment().format("LLL")}</p>`;
    //             const mailOptions = {
    //                 from: '"no-reply" <no-reply@c_cfo.com>',
    //                 to: `${emailAddress}`,
    //                 subject: "[CLOUD-CFO]",
    //                 html: html
    //             };
    //             global.emailtransport(mailOptions);
    //         }
    //         mapCallback(null);
    //     },
    //     () => {
    //         parallelCallback(null);
    //     }
    // );

}