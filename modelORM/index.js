const Sequelize = require('sequelize');
const sequelize = new Sequelize(
    process.env.CLOUD_CFO_DB,
    process.env.CLOUD_CFO_DB_USER,
    process.env.CLOUD_CFO_DB_PASSWORD, {
        host: 'localhost',
        dialect: 'mysql',
        operatorsAliases: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
    }
);

const ActivityLog = require('./activity_log')(sequelize , Sequelize.DataTypes);
const Document = require('./document')(sequelize , Sequelize.DataTypes);
const DocumentLink = require('./document_link')(sequelize , Sequelize.DataTypes);
const Tag = require('./tag')(sequelize , Sequelize.DataTypes);
const Folder = require('./folder')(sequelize , Sequelize.DataTypes);
const Workstream = require('./workstream')(sequelize , Sequelize.DataTypes);
const Task = require('./task')(sequelize , Sequelize.DataTypes);
const models = {
    ActivityLog,
    Tag,
    Document,
    DocumentLink,
    Workstream,
    Task,
    Folder
};
Object.keys(models).forEach((modelName) => {
    if ('associate' in models[modelName]) {
        models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;
module.exports = models;