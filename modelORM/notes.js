/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  const Notes = sequelize.define('notes', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    workstreamId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    privacyType: {
      type: DataTypes.ENUM('Private', 'Public'),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.INTEGER(4),
      allowNull: true,
      defaultValue: 0
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
    }
  }, {
      tableName: 'notes',
      timestamps: false
    });

  Notes.associate = function (models) {
    Notes.belongsTo(models.Workstream, {
      as: 'noteWorkstream',
      foreignKey: 'workstreamId',
    });
    Notes.hasMany(models.Tag, {
      as: 'notesTagTask',
      foreignKey: 'tagTypeId',
    });
    Notes.hasMany(models.Conversation, {
      as: 'comments',
      foreignKey: 'linkId',
    });
    Notes.belongsTo(models.Users, {
      as: 'creator',
      foreignKey: 'createdBy',
    });
    Notes.hasMany(models.Starred, {
      foreignKey: 'linkId',
      as: 'notes_starred'
    });
    Notes.hasMany(models.Tag, {
      as: 'documentTags',
      foreignKey: 'linkId',
    })
    Notes.hasOne(models.Notification, {
      as: 'note_notification',
      foreignKey: 'id'
    })
  }
  return Notes;
};
