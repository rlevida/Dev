/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
    const Session = sequelize.define(
        "session",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            session: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            usersId: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            data: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            expiredDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            dateAdded: {
                type: DataTypes.DATE,
                allowNull: true
            },
            dateUpdated: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
            }
        },
        {
            tableName: "session"
        }
    );
    Session.associate = function(models) {
        Session.belongsTo(models.Users, {
            as: "user",
            foreignKey: "usersId"
        });
    };
    return Session;
};
