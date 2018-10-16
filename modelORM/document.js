/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('document', {
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
      defaultValue: '0'
    },
    status: {
      type: DataTypes.ENUM('new','library','archived'),
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
      allowNull: true
    },
    dateUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'document',
    timestamps:false,
  });
};
