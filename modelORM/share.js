/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('share', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    usersType: {
      type: DataTypes.ENUM('users','team'),
      allowNull: true
    },
    userTypeLinkId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    linkType: {
      type: DataTypes.ENUM('project','workstream','task'),
      allowNull: true
    },
    linkId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    shareType: {
      type: DataTypes.ENUM('document','folder'),
      allowNull: true
    },
    shareId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    sharedBy: {
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
    tableName: 'share'
  });
};
