/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    project: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    statusId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    typeId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    projectType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    tinNo: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    companyAddress: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    classification: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    projectNameCount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    createdBy: {
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
    isActive: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '1'
    },
    isDeleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    }
  }, {
    tableName: 'project'
  });
};