/* jshint indent: 2 */
module.exports = (sequelize, DataTypes) => {
    const TaskMemberReminder = sequelize.define('task_member_reminder', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        taskId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        usersId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        defaultNotification: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        },
        emailNotification: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        },
        dateAdded: {
            type: DataTypes.DATE,
            allowNull: true
        },
        dateUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
    },
        {
            tableName: 'task_member_reminder',
            timestamps: false
        });

    TaskMemberReminder.associate = function (models) {
        TaskMemberReminder.belongsTo(models.Users, {
            foreignKey: 'usersId',
            as: 'user'
        });
    };

    return TaskMemberReminder;
};