/ jshint indent: 2 /
module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('document', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    origin: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uploadedBy: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    folderId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('new', 'library', 'archived'),
      allowNull: true
    },
    isCompleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    documentNameCount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    attachmentId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
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
      timestamps: false,
      tableName: 'document'
    });

  Document.associate = function (models) {
    Document.hasMany(models.Tag, {
      as: 'tagDocumentWorkstream',
      foreignKey: 'tagTypeId',
    });
    Document.hasMany(models.Tag, {
      as: 'tagDocumentTask',
      foreignKey: 'tagTypeId',
    });
    Document.hasMany(models.Tag, {
      as: 'tagDocumentNotes',
      foreignKey: 'tagTypeId',
    });
    Document.belongsTo(models.Users, {
      as: 'user',
      foreignKey: 'uploadedBy',
    });
    Document.hasMany(models.Share, {
      as: 'share',
      foreignKey: 'shareId'
    })
    Document.hasMany(models.DocumentLink, {
      as: 'project_member',
      foreignKey: 'documentId'
    })
    Document.hasMany(models.Starred, {
      as: 'document_starred',
      foreignKey: 'linkId'
    })
    Document.belongsTo(models.Document, {
      as: 'document_folder',
      foreignKey: 'folderId'
    })
  };

  return Document;
};