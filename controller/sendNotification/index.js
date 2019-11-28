const { filter, omit } = require("lodash");
const models = require("../../modelORM");
const { Notification, UsersNotificationSetting, Projects, Users } = models;

const { notificationIncludes } = require("../includes/notification");
const getNotificationMessage = require("./message");
const messageSendNotification = require("./template/messageSend");
const taskTaggedNotification = require("./template/taskTagged");
const filetaggedNotification = require("./template/fileTagged");
const taskAssignedCommentNotification = require("./template/taskAssignedComment");
const taskAssignedNotification = require("./template/taskAssigned");
const fileNewUploadNotification = require("./template/fileNewUpload");
const taskFollowingCompletedNotification = require("./template/taskFollowingCompleted")
const taskMemberCompletedNotification = require("./template/taskMemberCompleted");
const taskApproverNotification = require("./template/taskApprover");
const taskBeforeDeadline = require("./template/taskBeforeDeadline");

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
                    as: "user_notification_setting",
                    required: false
                }
            ]
        }).map(notificationSettingResponse => {
            const notificationSetting = notificationSettingResponse.toJSON();

            return {
                notificationSetting,
                from: sender,
                to: notificationSetting.user_notification_setting,
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

        const appNotificationData = filter(usersNotificationSettingFindResult, notificationDataObj => {
            return notificationDataObj.notificationSetting[notificationType] === 1 && projectFindResult.appNotification === 1;
        }).map((notificationDataObj) => {
            return omit(notificationDataObj, ["notificationSetting"]);
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
            if (notificationSocket) {
                notificationSocket.emit("FRONT_NOTIFICATION", {
                    ...findNotificationRes.toJSON()
                });
            }
            return findNotificationRes.toJSON();
        })

        // EMAIL NOTIFICATION

        const emailNotificationData = filter(usersNotificationSettingFindResult, notificationDataObj => {
            return notificationDataObj.notificationSetting.receiveEmail === 1 && notificationDataObj.notificationSetting[notificationType] === 1 && projectFindResult.emailNotification === 1 && projectFindResult.appNotification === 1;
        }).map((notificationDataObj) => {
            return omit(notificationDataObj, ["notificationSetting"]);
        })

        if (emailNotificationData.length > 0) {
            switch (notificationType) {
                case "messageSend":
                case "messageMentioned":
                    await messageSendNotification({ emailNotificationData });
                    break;
                case "fileTagged":
                    await filetaggedNotification({ emailNotificationData });
                    break;
                case "taskTagged":
                    await taskTaggedNotification({ emailNotificationData });
                    break;
                case "commentReplies":
                case "taskAssignedComment":
                    await taskAssignedCommentNotification({ emailNotificationData });
                    break;
                case "taskAssigned":
                    await taskAssignedNotification({ emailNotificationData });
                    break;
                case "fileNewUpload":
                    await fileNewUploadNotification({ emailNotificationData });
                    break;
                case "taskFollowingCompleted":
                    await taskFollowingCompletedNotification({ emailNotificationData });
                    break;
                case "taskMemberCompleted":
                    await taskMemberCompletedNotification({ emailNotificationData });
                    break;
                case "taskApprover":
                    await taskApproverNotification({ emailNotificationData });
                case "taskBeforeDeadline":
                case "taskResponsibleBeforeDeadline":
                case "taskTeamLeaderDeadline":
                case "taskAssignedDeadline":
                case "taskResponsibleDeadline":
                case "taskFollowerDeadline":
                    await taskBeforeDeadline({ emailNotificationData });
                default: return
            }
        } else {
            return
        }
    } catch (error) {
        console.error(error)
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