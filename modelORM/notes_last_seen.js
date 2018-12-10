/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    const NotesLastSeen = sequelize.define('notes_last_seen', {
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
        linkType: {
            type: DataTypes.ENUM('notes', 'conversation'),
            allowNull: true
        },
        linkId: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        userId: {
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
        }
    }, {
            tableName: 'notes_last_seen',
            timestamps: false
        });

    NotesLastSeen.associate = function (models) {

    }
    return NotesLastSeen;
};
