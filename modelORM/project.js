/* jshint indent: 2 */
module.exports = (sequelize, DataTypes) => {
  const Projects = sequelize.define('projects', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    picture: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    project: {
      type: DataTypes.STRING(50),
      allowNull: false
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
    isActive: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '1'
    },
    isDeleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    remindOnDuedate: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    remindBeforeDuedate: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    color: {
      type: DataTypes.CHAR(50),
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
    }
  }, {
      tableName: 'project',
      timestamps: false
    });

  Projects.associate = function (models) {
    Projects.belongsTo(models.Users, {
      as: 'creator',
      foreignKey: 'createdBy'
    });
    Projects.hasMany(models.Members, {
      as: 'project_members',
      foreignKey: 'linkId'
    });
    Projects.hasMany(models.Notes, {
      as: 'project_notes',
      foreignKey: 'projectId'
    });
    Projects.belongsTo(models.Status, {
      as: 'status',
      foreignKey: 'statusId',
    });

    Projects.belongsTo(models.Type, {
      as: 'type',
      foreignKey: 'typeId'
    })

    Projects.hasMany(models.Members, {
      as: 'projectManager',
      foreignKey: 'linkId'
    })

    Projects.hasMany(models.Members, {
      as: 'members',
      foreignKey: 'linkId'
    })

    Projects.hasMany(models.Members, {
      as: 'team',
      foreignKey: 'linkId'
    })

    Projects.hasMany(models.Workstream, {
      as: 'workstream',
      foreignKey: 'projectId'
    })

    Projects.hasMany(models.Tasks, {
      as: 'taskActive',
      foreignKey: 'projectId'
    })

    Projects.hasMany(models.Tasks, {
      as: 'taskOverDue',
      foreignKey: 'projectId'
    })

    Projects.hasMany(models.Tasks, {
      as: 'taskDueToday',
      foreignKey: 'projectId'
    })

    Projects.hasMany(models.DocumentLink, {
      as: 'document_link',
      foreignKey: 'linkId'
    })

    Projects.hasMany(models.Tasks, {
      as: 'tasks',
      foreignKey: 'projectId'
    })
  };

  return Projects
};