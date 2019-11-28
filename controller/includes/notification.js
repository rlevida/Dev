/* MODELS */
const models = require("../../modelORM");
const {
    Notes,
    Tasks,
    Workstream,
    Conversation,
    Users,
    Document,
    Projects,
    UsersNotificationSetting,
    Type,
} = models;

/* INCLUDES */
const { noteIncludes } = require("./note")

exports.notificationIncludes = notificationIncludes = (params) => {
    const { conversations } = { ...params };
    return [
        {
            model: Users,
            as: "to",
            required: false,
            attributes: ["emailAddress", "firstName", "lastName", "avatar"],
            include: [
                {
                    model: UsersNotificationSetting,
                    as: "notification_setting"
                }
            ]
        },
        {
            model: Users,
            as: "from",
            required: false,
            attributes: ["emailAddress", "firstName", "lastName", "avatar"],
            include: [{
                model: Conversation,
                as: "users_conversation",
                attributes: ["comment", "dateAdded"],
                where: {
                    ...(conversations ? { linkType: conversations.linkType } : {})
                }
            }]
        },
        {
            model: Projects,
            as: "project_notification",
            required: false,
            include: [
                {
                    model: Type,
                    as: "type",
                    required: false,
                    attributes: ["type"]
                }
            ]
        },
        {
            model: Document,
            as: "document_notification",
            required: false,
            attributes: ["origin"]
        },
        {
            model: Workstream,
            as: "workstream_notification",
            required: false,
            attributes: ["workstream"]
        },
        {
            model: Tasks,
            as: "task_notification",
            required: false,
            include: [{
                model: Users,
                as: "task_approver"
            }]
        },
        {
            model: Notes,
            as: "note_notification",
            required: false,
            include: noteIncludes()
        },
        {
            model: Conversation,
            as: "conversation_notification",
            required: false
        }
    ]
}