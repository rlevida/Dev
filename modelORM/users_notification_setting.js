/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    const UsersNotificationSetting = sequelize.define('users_notification_setting', {
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
        taskAssigned: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        taskTagged: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        fileNewUpload: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        messageSend: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        commentReplies: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        taskDeadline: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        taskMemberCompleted: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        taskFollowingCompleted: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        taskTeamDeadline: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        taskFollowingDeadline: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        receiveEmail: {
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
            tableName: 'users_notification_setting',
            timestamps: false
        });

    UsersNotificationSetting.associate = (models) => {
        UsersNotificationSetting.hasOne(models.Users, {
            as: 'notification_setting',
            foreignKey: 'id'
        })
    }

    return UsersNotificationSetting;
};
