const { filter, omit } = require("lodash");
const socketIo = global.socketIo();
const models = require("../../modelORM");
const { Notification, UsersNotificationSetting, Projects, Users, Conversation } = models;

const { notificationIncludes } = require("../includes/notification");
const getNotificationMessage = require("./message");
const messageSendNotification = require("./template/messageSend");
const messageMentionedNotification = require("./template/messageMentioned");
const filetaggedNotification = require("./template/fileTagged");
const taskComment = require("./template/taskComment");
const taskAssignedNotification = require("./template/taskAssigned");
const fileNewUploadNotification = require("./template/fileNewUpload");
const taskFollowingCompletedNotification = require("./template/taskFollowingCompleted")
const taskMemberCompletedNotification = require("./template/taskMemberCompleted");
const taskApproverNotification = require("./template/taskApprover");
const taskBeforeDeadline = require("./template/taskBeforeDeadline");
const notificationService = require('../../service/NotificationService');


// const getNotificationSubject = require("./subject");

module.exports = async (params) => {
    try {
        const { receiver, sender, notificationType, notificationData, projectId = null, workstreamId = null, notificationApproverType } = { ...params };

        const projectFindResult = await Projects.findOne({ where: { id: projectId, isDeleted: 0, isActive: true }, attributes: ["appNotification", "emailNotification"], raw: true });

        const message = await getNotificationMessage({ notificationType, sender, task: notificationData.task, notificationApproverType });

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

        const notificationFindResult = await Notification.findAll({
            where: { id: notificationBulkCreateResult },
            include: notificationIncludes()
        }).map(findNotificationRes => {
            notificationService.enqueue('FRONT_BROADCAST_NOTIFICATION', findNotificationRes.toJSON());
            // socketIo.emit("FRONT_BROADCAST_NOTIFICATION", {
            //     ...findNotificationRes.toJSON()
            // });
            return {
                ...findNotificationRes.toJSON(),
                users_conversation: findNotificationRes.toJSON().from.users_conversation,
            }
        })

        // EMAIL NOTIFICATION

        const emailNotificationData = filter(notificationFindResult, notificationDataObj => {
            return notificationDataObj.to.notification_setting[0].receiveEmail === 1 && notificationDataObj.to.notification_setting[0][notificationType] === 1 && projectFindResult.emailNotification === 1 && projectFindResult.appNotification === 1;
        }).map((notificationDataObj) => {
            return omit(notificationDataObj, ["notification_setting"]);
        })

        if (emailNotificationData.length > 0) {

            switch (notificationType) {
                case "messageSend":
                    await messageSendNotification({ emailNotificationData });
                    break;
                case "messageMentioned":
                    const conversationsResponse = await Conversation.findAll({ where: { linkType: "notes", linkId: notificationData.note.id }, raw: true })
                    await messageMentionedNotification({ emailNotificationData, conversations: conversationsResponse })
                    break;
                case "fileTagged":
                    await filetaggedNotification({ emailNotificationData });
                    break;
                case "taskTagged":
                case "commentReplies":
                case "taskAssignedComment":
                    await taskComment({ emailNotificationData, type: notificationType });
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
                    await taskApproverNotification({ emailNotificationData, type: notificationApproverType });
                    break;
                case "taskBeforeDeadline":
                case "taskResponsibleBeforeDeadline":
                case "taskDeadline":
                case "taskTeamLeaderDeadline":
                case "taskAssignedDeadline":
                case "taskResponsibleDeadline":
                case "taskFollowerDeadline":
                    await taskBeforeDeadline({ emailNotificationData });
                    break;
                default: return
            }
        } else {
            return
        }
    } catch (error) {
        console.error(error);
        return;
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
