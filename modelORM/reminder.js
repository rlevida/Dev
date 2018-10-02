/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reminder', {
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
    taskId: {
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
      type: DataTypes.ENUM('task','document'),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('For Approval','Task Rejected','Task Overdue','Task Due Today','Tag in Comment'),
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
    tableName: 'reminder'
  });
};
