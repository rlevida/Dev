
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
    // process.env.CLOUD_CFO_DB,
    // process.env.CLOUD_CFO_DB_USER,
    // process.env.CLOUD_CFO_DB_PASSWORD,
    'cloud_cfo',
    'root',
    '',
    {
        host: 'localhost',
        dialect: 'mysql',
        operatorsAliases: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        logging: false
    }
);
const ActivityLog = require('./activity_log');
const models = {
    ActivityLog,

};


Object.keys(models).forEach((modelName) => {
    if ('associate' in models[modelName]) {
        models[modelName].associate(models);
    }
    models[modelName] = models[modelName](sequelize, Sequelize.DataTypes)
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;
module.exports = models;