const Sequelize = require('sequelize');
const sequelize = new Sequelize(
    process.env.CLOUD_CFO_DB, 
    process.env.CLOUD_CFO_DB_USER, 
    process.env.CLOUD_CFO_DB_PASSWORD, 
    {
        host: process.env.CLOUD_CFO_DB_HOST,
        dialect: 'mysql',
        operatorsAliases: false,
        logging:false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const ActivityLogs = require('./activity_logs')(sequelize, Sequelize.DataTypes);
const Document = require('./document')(sequelize, Sequelize.DataTypes);
const DocumentLink = require('./document_link')(sequelize, Sequelize.DataTypes);
const Folder = require('./folder')(sequelize, Sequelize.DataTypes);
const Members = require('./members')(sequelize, Sequelize.DataTypes);
const Projects = require('./project')(sequelize, Sequelize.DataTypes);
const Tag = require('./tag')(sequelize, Sequelize.DataTypes);
const Tasks = require('./task')(sequelize, Sequelize.DataTypes);
const TaskChecklist = require('./task_checklist')(sequelize, Sequelize.DataTypes);
const TaskDependency = require('./task_dependency')(sequelize, Sequelize.DataTypes);
const Users = require('./users')(sequelize, Sequelize.DataTypes);
const UsersRole = require('./users_role')(sequelize, Sequelize.DataTypes);
const Workstream = require('./workstream')(sequelize , Sequelize.DataTypes);
const Project = require('./project')(sequelize, Sequelize.DataTypes);
const Reminder = require('./reminder')(sequelize, Sequelize.DataTypes);
const Status = require('./status')(sequelize, Sequelize.DataTypes);
const Type = require('./type')(sequelize, Sequelize.DataTypes);

const models = {
    ActivityLogs,
    Document,
    DocumentLink,
    Folder,
    Members,
    Projects,
    Tag,
    Tasks,
    TaskChecklist,
    TaskDependency,
    Users,
    Workstream,
    Project,
    Reminder,
    Status,
    Type,
    UsersRole,
};

Object.keys(models).forEach((modelName) => {
    if ('associate' in models[modelName]) {
        models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;
// models.sequelize.sync();
module.exports = models;