module.exports = (sequelize, DataTypes) => {
    const DocumentRead = sequelize.define('document_read', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        usersId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        documentId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        isDeleted: {
            type: DataTypes.INTEGER(1),
            allowNull: true,
            defaultValue: 0
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
            tableName: 'document_read'
        });
    DocumentRead.associate = function (models) {
        DocumentRead.belongsTo(models.Document, {
            as: 'document',
            foreignKey: 'documentId'
        });
    }
    return DocumentRead;
};