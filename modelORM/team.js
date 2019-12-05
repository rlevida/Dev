/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  const Teams = sequelize.define('team', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    teamLeaderId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    usersId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    team: {
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
    }
  }, {
    tableName: 'team',
    timestamps: false
  });

  Teams.associate = function (models) {
    Teams.hasMany(models.UsersTeam, {
      as: 'users_team',
      foreignKey: 'teamId',
    });
    Teams.belongsTo(models.Users, {
      as: 'teamLeader',
      foreignKey: 'teamLeaderId'
    })
    Teams.hasMany(models.Members, {
      as: 'memberTeam',
      foreignKey: 'userTypeLinkId'
    })
    Teams.hasMany(models.Members, {
      as: 'teamProjects',
      foreignKey: 'userTypeLinkId'
    });
    Teams.belongsTo(models.Users, {
      as: 'task_team_leader',
      foreignKey: "teamLeaderId",
      targetKey: "id"
    })
    Teams.hasMany(models.UsersTeam, {
      as: 'task_team_member',
      foreignKey: "teamId",
      sourceKey: "id",
    })
  };

  return Teams;
};
