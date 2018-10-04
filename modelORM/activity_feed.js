/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('activity_feed', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    invokerUserId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    linkType: {
      type: DataTypes.ENUM('project','workstream','task','conversation'),
      allowNull: true
    },
    linkId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    data: {
      type: DataTypes.TEXT,
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
    tableName: 'activity_feed'
  });
};