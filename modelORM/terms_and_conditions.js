/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => {
    const TermsAndConditions = sequelize.define(
        "terms_and_conditions",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            termsAndConditions: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            dateAdded: {
                type: DataTypes.DATE,
                defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
            },
            dateUpdated: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
            }
        },
        {
            tableName: "terms_and_conditions",
            timestamps: false
        }
    );
    return TermsAndConditions;
};
