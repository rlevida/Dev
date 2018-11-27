/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const Notes = sequelize.define('notes', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    privacyType: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    isStarred: {
      type: DataTypes.INTEGER(4),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    isClosed: {
      type: DataTypes.INTEGER(4),
      allowNull: true,
      defaultValue: 0
    },
    specificClient: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    accessType: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: 'INTERNAL_ONLY'
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
    Notes.hasMany(models.Tag, {
      as: 'tag',
      foreignKey: 'tagTypeId',
    })
    Notes.hasMany(models.Conversation, {
      as: 'comments',
      foreignKey: 'linkId',
    })
    Notes.belongsTo(models.Users, {
      as: 'creator',
      foreignKey: 'createdBy',
    })
  }

  return Notes;
};
