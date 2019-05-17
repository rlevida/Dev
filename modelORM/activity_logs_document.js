/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => {
  const ActivityLogsDocument = sequelize.define('activity_logs_document', {
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
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    actionType: {
      type: DataTypes.ENUM('created', 'modified', 'deleted', 'moved', 'shared', 'duplicated', 'archived', 'uploaded', 'tagged', 'restored'),
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
      tableName: 'activity_logs_document',
      timestamps: false
    }
  );

  ActivityLogsDocument.associate = function (models) {
    ActivityLogsDocument.belongsTo(models.Users, {
      as: 'user',
      foreignKey: 'usersId',
    });
    ActivityLogsDocument.belongsTo(models.Document, {
      as: 'document',
      foreignKey: 'linkId',
    });
  };

  return ActivityLogsDocument;
};