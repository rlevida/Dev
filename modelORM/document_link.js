/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  const DocumentLink = sequelize.define('document_link', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    documentId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    linkType: {
      type: DataTypes.ENUM('project', 'workstream', 'task', 'conversation'),
      allowNull: true
    },
    linkId: {
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
      tableName: 'document_link',
      timestamps: false
    });

  DocumentLink.associate = function (models) {

    DocumentLink.belongsTo(models.Document, {
      as: 'document',
      foreignKey: 'documentId'
    })

    DocumentLink.hasMany(models.Members, {
      as: 'members',
      foreignKey: 'linkId'
    })
  }
  return DocumentLink
};