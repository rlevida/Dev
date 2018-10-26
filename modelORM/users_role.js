/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const UsersRole = sequelize.define('users_role', {
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
    roleId: {
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
    tableName: 'users_role',
    timestamps: false
  });

  UsersRole.associate = (models) => {
    UsersRole.belongsTo(models.Roles, {
      as: 'role',
      foreignKey: 'roleId'
    });
  };

  return UsersRole;
};
