/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  const UsersTeam = sequelize.define('users_team', {
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
    teamId: {
      type: DataTypes.BIGINT,
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
    tableName: 'users_team',
    timestamps: false
  });

  UsersTeam.associate = function (models) {
    UsersTeam.belongsTo(models.Users, {
      as: 'user',
      foreignKey: 'usersId',
    });
    UsersTeam.belongsTo(models.Teams, {
      as: 'team',
      foreignKey: 'teamId',
    });
    UsersTeam.belongsTo(models.Teams, {
      as: 'task_team_member',
      foreignKey: "teamId",
      targetKey: "id"
    })
    UsersTeam.hasMany(models.Members, {
      as: 'task_team_member_assigned',
      foreignKey: 'userTypeLinkId',
      sourceKey: 'usersId'
    })
  };

  return UsersTeam
};
