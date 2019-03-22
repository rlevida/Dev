module.exports = (sequelize, DataTypes) => {
    const ChecklistDocuments = sequelize.define('checklist_documents', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        taskId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        documentId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        checklistId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        dateAdded: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        isDeleted: {
            type: DataTypes.INTEGER(1),
            allowNull: true,
            defaultValue: '0'
        },
        dateUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
    }, {
            timestamps: false,
            tableName: 'checklist_documents'
        });
    ChecklistDocuments.associate = function (models) {
        ChecklistDocuments.belongsTo(models.Document, {
            as: 'document',
            foreignKey: 'documentId'
        });
        ChecklistDocuments.belongsTo(models.TaskChecklist, {
            as: 'tagChecklist',
            foreignKey: 'checklistId'
        });
    }
    return ChecklistDocuments;
};