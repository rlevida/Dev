/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => {
    const TaskTimeLogs = sequelize.define('task_time_logs', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        time: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: '0'
        },
        period: {
            type: DataTypes.ENUM('days', 'weeks', 'hours', 'minutes'),
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        taskId: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        usersId: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        dateAdded: {
            type: DataTypes.DATE,
            allowNull: true
        }
    });

    TaskTimeLogs.associate = function (models) {
        TaskTimeLogs.belongsTo(models.Tasks, {
            as: 'task',
            foreignKey: 'taskId'
        });
        TaskTimeLogs.belongsTo(models.Users, {
            as: 'user',
            foreignKey: 'usersId'
        });
    };

    return TaskTimeLogs;
};
