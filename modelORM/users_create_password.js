/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    const UsersCreatePassword = sequelize.define('users_create_password', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      usersId: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      hash: {
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
        tableName: 'users_create_password'
      });
  
    return UsersCreatePassword;
  };
  