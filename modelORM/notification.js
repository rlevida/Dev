/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
    const Notification = sequelize.define(
        "notification",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            usersId: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            projectId: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            workstreamId: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            taskId: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            documentId: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            noteId: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            conversationId: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            message: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            type: {
                type: DataTypes.ENUM(
                    "taskAssigned",
                    "taskAssignedComment",
                    "taskApprover",
                    "taskTagged",
                    "fileNewUpload",
                    "messageSend",
                    "messageMentioned",
                    "commentReplies",
                    "taskDeadline",
                    "taskBeforeDeadline",
                    "taskMemberCompleted",
                    "taskFollowingCompleted",
                    "taskTeamDeadline",
                    "taskFollowingDeadline",
                    "taskApproved",
                    "taskResponsibleDeadLine",
                    "taskResponsibleBeforeDeadline",
                    "fileTagged"
                ),
                allowNull: true
            },
            isActive: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            isArchived: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            createdBy: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            isDeleted: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            isRead: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            dateAdded: {
                type: DataTypes.DATE,
                allowNull: true
            },
            dateUpdated: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
            }
        },
        {
            tableName: "notification",
            timestamps: false
        }
    );
    Notification.associate = models => {
        Notification.belongsTo(models.Users, {
            as: "from",
            foreignKey: "createdBy"
        });
        Notification.belongsTo(models.Users, {
            as: "to",
            foreignKey: "usersId"
        });
        Notification.belongsTo(models.Tasks, {
            as: "task_notification",
            foreignKey: "taskId"
        });
        Notification.belongsTo(models.Document, {
            as: "document_notification",
            foreignKey: "documentId"
        });
        Notification.belongsTo(models.Workstream, {
            foreignKey: "workstreamId",
            as: "workstream_notification"
        });
        Notification.belongsTo(models.Notes, {
            foreignKey: "noteId",
            as: "note_notification"
        });
        Notification.belongsTo(models.Conversation, {
            foreignKey: "conversationId",
            as: "conversation_notification"
        });
        Notification.belongsTo(models.Projects, {
            foreignKey: "projectId",
            as: "project_notification"
        });
    };
    return Notification;
};
