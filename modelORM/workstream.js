/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  const Workstream = sequelize.define('workstream', {
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
    workstream: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    projectName: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    projectDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    numberOfHours: {
      type: DataTypes.BIGINT,
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
      tableName: 'workstream',
      timestamps: false
    });

  Workstream.associate = function (models) {
    Workstream.belongsTo(models.Projects, {
      foreignKey: 'projectId',
      as: "project"
    });

    Workstream.hasMany(models.Tag, {
      foreignKey: 'linkId',
      as: "tag"
    });

    Workstream.hasMany(models.Members, {
      foreignKey: 'linkId',
      as: "responsible"
    });

    Workstream.hasMany(models.Tasks, {
      foreignKey: 'workstreamId',
      as: 'task'
    })

    Workstream.hasMany(models.Tasks, {
      foreignKey: "workstreamId",
      as: "taskDueToday"
    })

    Workstream.hasMany(models.Tasks, {
      foreignKey: "workstreamId",
      as: "taskOverDue"
    })
  };

  return Workstream;
};
