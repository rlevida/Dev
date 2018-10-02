/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('members', {
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
    memberType: {
      type: DataTypes.ENUM('assignedTo','Follower','responsible','project manager'),
      allowNull: true
    },
    receiveNotification: {
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
  }, {
    tableName: 'members'
  });
};
