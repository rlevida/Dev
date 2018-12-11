/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  const Conversation = sequelize.define('conversation', { // note this is a comment
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    usersId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    linkType: {
      type: DataTypes.ENUM('project', 'workstream', 'task', 'notes'),
      allowNull: true
    },
    linkId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    status: {
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
    isDeleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    }
  }, {
      tableName: 'conversation'
    });

  Conversation.associate = function (models) {
    Conversation.belongsTo(models.Users, {
      as: 'users',
      foreignKey: 'usersId',
    });
    Conversation.hasMany(models.NotesLastSeen, {
      as: 'seenComments',
      foreignKey: 'linkId'
    })
  }

  return Conversation;
};
