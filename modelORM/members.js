/* jshint indent: 2 */
module.exports = (sequelize, DataTypes) => {
  const Members = sequelize.define('members', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    usersType: {
      type: DataTypes.ENUM('users', 'team'),
      allowNull: true
    },
    userTypeLinkId: {
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
    memberType: {
      type: DataTypes.ENUM('assignedTo', 'follower', 'responsible', 'project manager', 'approver'),
      allowNull: true
    },
    receiveNotification: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '1'
    },
    isDeleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    isActive: {
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
      timestamps: false
    }
  );

  Members.associate = function (models) {
    Members.belongsTo(models.Users, {
      as: 'user',
      foreignKey: 'userTypeLinkId'
    });
    Members.belongsTo(models.Projects, {
      as: 'memberProject',
      foreignKey: 'linkId',
    });
    Members.belongsTo(models.UsersRole, {
      as: 'role',
      foreignKey: 'userTypeLinkId'
    });
    Members.belongsTo(models.Teams, {
      as: 'team',
      foreignKey: 'userTypeLinkId'
    })
    Members.hasMany(models.Tasks, {
      as: 'memberTaskAssigned',
      sourceKey: "linkId",
      foreignKey: "id"
    })
    Members.hasMany(models.Tasks, {
      as: "memberTaskResponsible",
      sourceKey: "linkId",
      foreignKey: 'workstreamId',
    });
    Members.hasMany(models.Tasks, {
      as: "memberTaskFollower",
      sourceKey: "linkId",
      foreignKey: "id",
    })
    Members.belongsTo(models.Users, {
      as: 'task_assigned',
      foreignKey: "userTypeLinkId",
      targetKey: "id"
    })
    Members.belongsTo(models.Users, {
      as: 'task_follower',
      foreignKey: "userTypeLinkId",
      targetKey: "id"
    })
    Members.hasMany(models.Tasks, {
      as: 'assigned_task',
      sourceKey: "linkId",
      foreignKey: "id",
    })
    Members.hasMany(models.Tasks, {
      as: 'follower_task',
      sourceKey: "linkId",
      foreignKey: "id",
    })
    Members.belongsTo(models.UsersTeam, {
      as: 'task_team_member_assigned',
      foreignKey: 'userTypeLinkId',
      targetKey: 'usersId'
    })
    Members.belongsTo(models.Users, {
      as: 'task_responsible',
      foreignKey: 'userTypeLinkId',
      targetKey: 'id'
    })
    Members.hasMany(models.Tasks, {
      as: 'responsible_task',
      sourceKey: "linkId",
      foreignKey: 'workstreamId'
    })
    Members.belongsTo(models.Users, {
      as: "member_assigned_to_task",
      foreignKey: "linkId",
      targetKey: "id"
    })
  };

  return Members;
};