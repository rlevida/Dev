
const models = require("../../../modelORM");
const Sequelize = require("sequelize");
const { uniqBy, flatten } = require("lodash")
const Op = Sequelize.Op;
const { Tasks, Members, Users, UsersNotificationSetting, Notification } = models;
const { notificationIncludes } = require("../../includes/notification");
const moment = require("moment");

// const notificationTemplate = global.notificationEmailTemplate();
// const func = global.initFunc();

module.exports = async (params) => {
    const { documents, tagWorkstream, usersId, projectId, req } = { ...params }
    const workstreamIds = tagWorkstream.map(({ value }) => { return value });
    let taskNotificationBulkCreateData = [], workstreamNotificationBulkCreateData = [];

    /* Task Members */

    const findTaskMembersResult = await Tasks.findAll({
        where: { workstreamId: workstreamIds },
        include: [
            {
                model: Members,
                as: "task_members",
                where: { linkType: "task", userTypeLinkId: { [Op.ne]: usersId } },
                include: [
                    {
                        model: Users,
                        as: "user",
                        required: true,
                        include: [
                            {
                                model: UsersNotificationSetting,
                                as: "notification_setting",
                                required: true,
                                where: { fileNewUpload: 1 }
                            }
                        ]
                    }
                ]
            }
        ]
    }).map(taskResponse => {
        const { projectId, workstreamId } = taskResponse.toJSON();
        let taskMemberNotification = [];

        documents.forEach((documentObj) => {
            const taskUsers = taskResponse.toJSON().task_members.map(({ user }) => {
                return {
                    projectId, workstreamId,
                    documentId: documentObj.id,
                    usersId: user.id,
                    createdBy: usersId,
                    type: "fileNewUpload",
                    message: "upload a new file",
                }
            });
            taskMemberNotification = [...taskMemberNotification, ...taskUsers]
        })
        return taskMemberNotification;
    })

    taskNotificationBulkCreateData = uniqBy(flatten(findTaskMembersResult), "usersId");

    /* Workstream Members */

    const findWorkstreamMemberResult = await Members.findAll({
        where: { linkId: workstreamIds, linkType: "workstream", userTypeLinkId: { [Op.ne]: usersId } },
        include: [
            {
                model: Users,
                as: "user",
                required: true,
                include: [
                    {
                        model: UsersNotificationSetting,
                        as: "notification_setting",
                        required: true,
                        where: { fileNewUpload: 1 }
                    }
                ]
            }
        ]
    }).map(memberResponse => {
        const { user, linkId } = { ...memberResponse.toJSON() }

        let taskWorkstreamMmbemrNotification = documents.map((documentObj) => {
            return {
                projectId: projectId,
                workstreamId: linkId,
                documentId: documentObj.id,
                usersId: user.id,
                createdBy: usersId,
                type: "fileNewUpload",
                message: "upload a new file",
            };
        })
        return taskWorkstreamMmbemrNotification
    })

    workstreamNotificationBulkCreateData = uniqBy(flatten(findWorkstreamMemberResult), "usersId");

    /* Notification */
    const notificationBulkCreateData = uniqBy([...workstreamNotificationBulkCreateData, ...taskNotificationBulkCreateData], "usersId")

    const notificationResult = await Notification.bulkCreate(notificationBulkCreateData)
        .map(notificationResponse => {
            return notificationResponse.toJSON().id;
        });

    const findNotificationResult = await Notification.findAll({
        where: { id: notificationResult },
        include: notificationIncludes()
    }).map(findNotificationResponse => {
        req.app.parent.io.emit("FRONT_NOTIFICATION", {
            ...findNotificationResponse.toJSON()
        });
        return {
            ...findNotificationResponse.toJSON(),
            user: findNotificationResponse.toJSON().to,
            notification_setting: findNotificationResponse.toJSON().to.notification_setting[0]
        };
    })

    findNotificationResult.forEach((notificationObj, ) => {
        const { notification_setting, to, message } = { ...notificationObj }
        const { receiveEmail } = { ...notification_setting }

        if (receiveEmail) {

            let html = "<p>" + message + "</p>";
            html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
            html += "<p>Message:<br>" + message + "</p>";
            html += `<p>Date:<br>${moment().format("LLL")}</p>`;

            const mailOptions = {
                from: '"no-reply" <no-reply@c_cfo.com>',
                to: `${to.emailAddress}`,
                subject: "[CLOUD-CFO]",
                html: html
            };

            global.emailtransport(mailOptions);

            // const htmlBody = notificationTemplate.fileUploadEmailNotification(notificationObj);
            // const mailOptions = func.MailOptions({ to: to.emailAddress, subject: "New files were uploaded", html: htmlBody, });
            // global.emailtransport(mailOptions);
        }
    })
    return;
}