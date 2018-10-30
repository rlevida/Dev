module.exports = (sequelize, DataTypes) => {
  const Tags = sequelize.define('tag', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    indicator: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    linkType: {
      type: DataTypes.ENUM('user', 'workstream', 'task', 'conversation', 'document', 'others'),
      allowNull: true
    },
    linkId: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    tagType: {
      type: DataTypes.ENUM('user', 'workstream', 'task', 'conversation', 'document', 'folder'),
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    isCompleted: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '0'
    },
    tagTypeId: {
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
      timestamps: false,
      tableName: 'tag'
    });

  Tags.associate = function (models) {

    Tags.belongsTo(models.Document, {
      as: 'document',
      foreignKey: 'tagTypeId'
    });

    Tags.belongsTo(models.Workstream, {
      as: 'tagWorkstream',
      foreignKey: 'linkId',
    });

    Tags.belongsTo(models.Tasks, {
      as: 'tagTask',
      foreignKey: 'linkId',
    })

    Tags.belongsTo(models.Workstream, {
      as: 'workstream',
      foreignKey: 'linkId',
    });
  };

  return Tags;
};