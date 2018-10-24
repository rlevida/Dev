/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const Roles = sequelize.define('role', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    roleType: {
      type: DataTypes.ENUM('Internal','External'),
      allowNull: true
    },
    role: {
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
    tableName: 'role',
    timestamps: false
  });

  return Roles
};
