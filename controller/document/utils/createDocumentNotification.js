
const models = require("../../../modelORM");
const Sequelize = require("sequelize");
const { uniqBy, flatten } = require("lodash")
const Op = Sequelize.Op;
const { Tasks, Members, Users, UsersNotificationSetting } = models;

const sendNotification = require("../../sendNotification");

module.exports = async (params) => {
    const { documents, tagWorkstream, usersId, projectId, req } = { ...params }
    const workstreamIds = tagWorkstream.map(({ value }) => { return value });

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
                    notificationSocket: req.app.parent.io,
                    sender: req.user,
                    receiver: user.id,
                    notificationType: "fileNewUpload",
                    notificationData: { document: documentObj },
                    projectId, workstreamId,
                }
            });
            taskMemberNotification = [...taskMemberNotification, ...taskUsers]
        })
        return taskMemberNotification;
    })

    const documentTaskMemberNotificationData = uniqBy(flatten(findTaskMembersResult), "receiver");

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
                notificationSocket: req.app.parent.io,
                sender: req.user,
                receiver: user.id,
                notificationType: "fileNewUpload",
                notificationData: { document: documentObj },
                projectId: projectId,
                workstreamId: linkId,
            };
        })
        return taskWorkstreamMmbemrNotification
    })

    const workstreamDocumentNotificationData = uniqBy(flatten(findWorkstreamMemberResult), "receiver");

    const documentNotification = uniqBy([...workstreamDocumentNotificationData, documentTaskMemberNotificationData], "receiver")

    documentNotification.forEach(async notificationObj => {
        await sendNotification(notificationObj);
    })

    return;
}