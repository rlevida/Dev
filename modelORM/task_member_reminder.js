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
        receiveNotification: {
            type: DataTypes.INTEGER(1),
            allowNull: true,
            defaultValue: '1'
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
        }
    );

    return TaskMemberReminder;
};