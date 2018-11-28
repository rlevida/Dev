/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  const Starred = sequelize.define('starred', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    usersId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    linkType: {
      type: DataTypes.ENUM('project','workstream','task','document','conversation'),
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
    tableName: 'starred'
  });

  Starred.associate = function (models) {
    Starred.belongsTo(models.Users, {
      foreignKey: 'usersId',
      as: 'user'
    });
    Starred.belongsTo(models.Tasks, {
      as:'task',
      foreignKey: 'linkId'
    });
    Starred.belongsTo(models.Notes, {
      as:'notes',
      foreignKey: 'linkId'
    })
    Starred.belongsTo(models.Document, {
      as:'document',
      foreignKey: 'linkId'
    })
  }

  return Starred;
};
