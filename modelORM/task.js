/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => {
  const Tasks = sequelize.define('task', {
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
    task: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    workstreamId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('In Progress', 'For Approval', 'Completed', 'Rejected'),
      allowNull: true
    },
    typeId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    periodic: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    periodType: {
      type: DataTypes.ENUM('years', 'months', 'weeks', 'days'),
      allowNull: true
    },
    period: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    periodInstance: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: '0'
    },
    periodTask: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '1'
    },
    isDeleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    approvalRequired: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    approverId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    approvalDueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dateAdded: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    dateUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
      tableName: 'task',
      timestamps: false
    });

  Tasks.associate = function (models) {
    Tasks.belongsTo(models.Tag, {
      foreignKey: 'id'
    });
    Tasks.hasMany(models.TaskDependency, {
      as: 'task_dependency',
      foreignKey: 'taskId'
    });
    Tasks.hasMany(models.Members, {
      as: 'task_members',
      foreignKey: 'linkId'
    });
    Tasks.hasMany(models.TaskChecklist, {
      as: 'checklist',
      foreignKey: 'taskId'
    });
    Tasks.hasMany(models.Members, {
      foreignKey: 'linkId',
      as: 'assignee'
    })
    Tasks.hasMany(models.Members, {
      foreignKey: "linkId",
      as: 'follower'
    });
    Tasks.belongsTo(models.Workstream, {
      foreignKey: 'workstreamId',
      as: 'workstream'
    });
    Tasks.hasMany(models.TaskMemberReminder, {
      foreignKey: 'taskId',
      as: 'task_member_reminder'
    });
    Tasks.hasMany(models.Starred, {
      foreignKey: 'linkId',
      as: 'task_starred'
    });

  };

  return Tasks
};

