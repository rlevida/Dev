/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => {
  const TaskChecklist = sequelize.define('task_checklist', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    isCompleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    isDocument: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    isMandatory: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    taskId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    periodChecklist: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    documents: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    dateAdded: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    dateUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
    {
      timestamps: false,
      tableName: 'task_checklist'
    }
  );

  TaskChecklist.associate = function (models) {
    TaskChecklist.belongsTo(models.Users, {
      as: 'user',
      foreignKey: 'createdBy'
    });
  };

  return TaskChecklist;
};