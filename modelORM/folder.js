/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  const Folder = sequelize.define('folder', {
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
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    parentId: {
      type: DataTypes.BIGINT,
      allowNull: true
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
    },
    isDeleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    isFolder: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '1'
    },
    type: {
      type: DataTypes.ENUM('new', 'library', 'archived'),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
      tableName: 'folder',
      timestamps: false
    });

  Folder.associate = function (models) {

    Folder.hasMany(models.Tag, {
      as: 'tagFolderWorkstream',
      foreignKey: 'tagTypeId',
    });

    Folder.hasMany(models.Tag, {
      as: 'tagFolderTask',
      foreignKey: 'tagTypeId',
    });

    Folder.belongsTo(models.Users, {
      as: 'user',
      foreignKey: 'createdBy',
    });
    
  };

  return Folder;
};

