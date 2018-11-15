/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => {
  const ActivityLogs = sequelize.define('activity_logs', {
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
    linkType: {
      type: DataTypes.ENUM('project', 'workstream', 'task'),
      allowNull: true
    },
    linkId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    actionType: {
      type: DataTypes.ENUM('created', 'modified', 'deleted'),
      allowNull: true
    },
    old: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    new: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dateAdded: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    dateUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
    {
      timestamps: false
    }
  );

  ActivityLogs.associate = function (models) {
    ActivityLogs.belongsTo(models.Users, {
      as: 'user',
      foreignKey: 'usersId'
    });
  }

  return ActivityLogs;
};