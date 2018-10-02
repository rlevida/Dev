/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('task_rejected', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    taskId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    workstreamId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    reminderId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    approverId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    approvalDueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    message: {
      type: DataTypes.STRING(50),
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
    tableName: 'task_rejected'
  });
};
