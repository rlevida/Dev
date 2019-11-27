const { filter } = require("lodash");
const models = require("../../modelORM");
const { Notification, UsersNotificationSetting, Projects, Users, Conversation } = models;

const { notificationIncludes } = require("../includes/notification");
const getNotificationMessage = require("./message");
const messageSendNotification = require("./template/messageSend");
const taskTaggedNotification = require("./template/taskTagged");
const filetaggedNotification = require("./template/fileTagged");

// const getNotificationSubject = require("./subject");

module.exports = async (params) => {
    try {
        const { receiver, sender, notificationType, notificationData, projectId = null, workstreamId = null, notificationSocket } = { ...params };

        const projectFindResult = await Projects.findOne({ where: { id: projectId, isDeleted: 0, isActive: true }, attributes: ["appNotification", "emailNotification"], raw: true });

        const message = await getNotificationMessage({ notificationType, sender, task: notificationData.task });

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
                from: sender,
                to: notificationSetting.notification_setting,
                messageSend: notificationSetting.messageSend,
                receiveEmail: notificationSetting.receiveEmail,
                usersId: notificationSetting.usersId,
                projectId: projectId,
                workstreamId: workstreamId,
                createdBy: sender.id,
                ...(notificationData.task ? { taskId: notificationData.task.id } : {}),
                ...(notificationData.note ? { noteId: notificationData.note.id } : {}),
                ...(notificationData.document ? { documentId: notificationData.document.id } : {}),
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

        // EMAIL NOTIFICATION

        const emailNotificationData = filter(usersNotificationSettingFindResult, nSetting => {
            return nSetting.receiveEmail === 1 && projectFindResult.emailNotification === 1;
        })

        switch (notificationType) {
            case "messageSend":
            case "messageMentioned":
                await messageSendNotification({ emailNotificationData });
                break;
            case "fileTagged":
                await filetaggedNotification({ emailNotificationData });
            case "taskTagged":
                await taskTaggedNotification({ emailNotificationData });
            case "commentReplies":
            default: break
        }

        return
    } catch (error) {
        console.log(error)
    }

    /* NEW SETUP */
    // const subject = getNotificationSubject({ notificationType })
    // let conversationResponse = [];
    // if (notificationType === "messageSend") {
    //     conversationsResponse = await Conversation.findAll({ where: { linkType: "notes", linkId: notificationData.note.id }, raw: true })
    // }
    // const subject = getNotificationSubject({ notificationType })

    // emailNotificationData.forEach((notificationObj) => {
    //     const { to } = { ...notificationObj }
    //     let htmlBody = ""

    //     if (notificationType === "messageSend") {
    //         htmlBody = notificationTemplate.messageMentionedEmailNotification({ ...notificationObj, conversations: conversationResponse });
    //     }

    //     const mailOptions = func.MailOptions({ to: to.emailAddress, subject: "You were mentioned in a message", html: htmlBody });
    //     global.emailtransport(mailOptions);
    // })

}