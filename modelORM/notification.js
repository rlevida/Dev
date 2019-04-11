/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    const Notification = sequelize.define('notification', {
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
        noteId:{
            type: DataTypes.BIGINT,
            allowNull: true
        },
        message: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM('taskAssigned', "taskApprover", 'taskTagged', 'fileNewUpload', 'messageSend', 'commentReplies', 'taskDeadline', 'taskMemberCompleted', 'taskFollowingCompleted', 'taskTeamDeadline', 'taskFollowingDeadline'),
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
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
    }, {
            tableName: 'notification',
            timestamps: false
        });
    Notification.associate = (models) => {
        Notification.belongsTo(models.Users, {
            as: 'from',
            foreignKey: 'createdBy'
        })
        Notification.belongsTo(models.Users, {
            as: 'to',
            foreignKey: 'usersId'
        })
        Notification.belongsTo(models.Tasks, {
            as: 'task_notification',
            foreignKey: 'taskId'
        })
        Notification.belongsTo(models.Document, {
            as: 'document_notification',
            foreignKey: 'documentId'
        })
        Notification.belongsTo(models.Workstream, {
            foreignKey: 'workstreamId',
            as: 'workstream_notification'
        });
    }
    return Notification;
};
