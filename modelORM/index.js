
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
    process.env.CLOUD_CFO_DB,
    process.env.CLOUD_CFO_DB_USER,
    process.env.CLOUD_CFO_DB_PASSWORD,
    {
        host: process.env.CLOUD_CFO_DB_HOST,
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
const ActivityLog = require('./activity_logs')(sequelize, Sequelize.DataTypes);
const Members = require('./members')(sequelize, Sequelize.DataTypes);
const Users = require('./users')(sequelize, Sequelize.DataTypes);
const Tasks = require('./task')(sequelize, Sequelize.DataTypes);
const TaskDependency = require('./task_dependency')(sequelize, Sequelize.DataTypes);
const models = {
    ActivityLog,
    Members,
    Users,
    Tasks,
    TaskDependency
};

Object.keys(models).forEach((modelName) => {
    if ('associate' in models[modelName]) {
        models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;
models.sequelize.sync();
module.exports = models;