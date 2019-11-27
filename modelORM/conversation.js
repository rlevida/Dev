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
      tableName: 'conversation',
      charset: 'utf8mb4'
    });

  Conversation.associate = function (models) {
    Conversation.belongsTo(models.Notes, {
      as: 'conversationNotes',
      foreignKey: 'linkId',
    });
    Conversation.hasMany(models.Tag, {
      as: 'conversationDocuments',
      foreignKey: 'linkId',
    });
    Conversation.belongsTo(models.Users, {
      as: 'users',
      foreignKey: 'usersId',
    });
    Conversation.hasMany(models.NotesLastSeen, {
      as: 'seenComments',
      foreignKey: 'linkId'
    })
    Conversation.hasOne(models.Notification, {
      as: "conversation_notification",
      foreignKey: "id"
    });
    Conversation.belongsTo(models.Users, {
      as: 'users_conversation',
      foreignKey: 'usersId',
    });
  }

  return Conversation;
};
