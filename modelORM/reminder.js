/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  const Reminder = sequelize.define('reminder', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    reminderDetail: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    usersId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    seen: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    linkId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    linkType: {
      type: DataTypes.ENUM('task', 'document'),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('Task For Approval', 'Task Rejected', 'Task Overdue', 'Task Due Today', 'Tag in Comment'),
      allowNull: true
    },
    createdBy: {
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
    }
  }, {
      tableName: 'reminder',
      timestamps: false
    });

  Reminder.associate = (models) => {
    Reminder.belongsTo(models.Users, {
      as: 'user',
      foreignKey: 'createdBy'
    });
    Reminder.belongsTo(models.Workstream, {
      as: 'workstream',
      foreignKey: 'linkId'
    });
    Reminder.belongsTo(models.Tasks, {
      as: 'task',
      foreignKey: 'linkId'
    })
  };
  return Reminder
};
