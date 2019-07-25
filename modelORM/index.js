const Sequelize = require("sequelize");
const sequelize = new Sequelize(process.env.CLOUD_CFO_DB, process.env.CLOUD_CFO_DB_USER, process.env.CLOUD_CFO_DB_PASSWORD, {
    host: process.env.CLOUD_CFO_DB_HOST,
    dialect: "mysql",
    dialectOptions: {
        timezone: "UTC",
        charset: "utf8mb4"
    },
    operatorsAliases: false,
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: false
    }
});

const ActivityLogs = require("./activity_logs")(sequelize, Sequelize.DataTypes);
const ActivityLogsDocument = require("./activity_logs_document")(sequelize, Sequelize.DataTypes);
const ChecklistDocuments = require("./checklist_documents")(sequelize, Sequelize.DataTypes);
const Conversation = require("./conversation")(sequelize, Sequelize.DataTypes);
const Document = require("./document")(sequelize, Sequelize.DataTypes);
const DocumentLink = require("./document_link")(sequelize, Sequelize.DataTypes);
const DocumentRead = require("./document_read")(sequelize, Sequelize.DataTypes);
const IpBlock = require("./ip_block")(sequelize, Sequelize.DataTypes);
const Folder = require("./folder")(sequelize, Sequelize.DataTypes);
const Members = require("./members")(sequelize, Sequelize.DataTypes);
const Notes = require("./notes")(sequelize, Sequelize.DataTypes);
const NotesLastSeen = require("./notes_last_seen")(sequelize, Sequelize.DataTypes);
const Projects = require("./project")(sequelize, Sequelize.DataTypes);
const Tag = require("./tag")(sequelize, Sequelize.DataTypes);
const Tasks = require("./task")(sequelize, Sequelize.DataTypes);
const TaskChecklist = require("./task_checklist")(sequelize, Sequelize.DataTypes);
const TaskDependency = require("./task_dependency")(sequelize, Sequelize.DataTypes);
const TaskTimeLogs = require("./task_time_logs")(sequelize, Sequelize.DataTypes);
const Teams = require("./team")(sequelize, Sequelize.DataTypes);
const Users = require("./users")(sequelize, Sequelize.DataTypes);
const UsersRole = require("./users_role")(sequelize, Sequelize.DataTypes);
const UsersTeam = require("./users_team")(sequelize, Sequelize.DataTypes);
const UserForgotPassword = require("./users_forgot_password")(sequelize, Sequelize.DataTypes);
const Workstream = require("./workstream")(sequelize, Sequelize.DataTypes);
const Reminder = require("./reminder")(sequelize, Sequelize.DataTypes);
const Roles = require("./role")(sequelize, Sequelize.DataTypes);
const Share = require("./share")(sequelize, Sequelize.DataTypes);
const Status = require("./status")(sequelize, Sequelize.DataTypes);
const TaskMemberReminder = require("./task_member_reminder")(sequelize, Sequelize.DataTypes);
const Type = require("./type")(sequelize, Sequelize.DataTypes);
const Session = require("./session")(sequelize, Sequelize.DataTypes);
const Starred = require("./starred")(sequelize, Sequelize.DataTypes);
const UsersNotificationSetting = require("./users_notification_setting")(sequelize, Sequelize.DataTypes);
const Notification = require("./notification.js")(sequelize, Sequelize.DataTypes);
const UsersCreatePassword = require("./users_create_password")(sequelize, Sequelize.DataTypes);

const models = {
    ActivityLogs,
    ActivityLogsDocument,
    ChecklistDocuments,
    Conversation,
    Document,
    DocumentLink,
    DocumentRead,
    IpBlock,
    Folder,
    Members,
    Notes,
    NotesLastSeen,
    Projects,
    Tag,
    Tasks,
    TaskChecklist,
    TaskDependency,
    TaskMemberReminder,
    TaskTimeLogs,
    Teams,
    Users,
    Workstream,
    Reminder,
    Roles,
    Share,
    Status,
    Type,
    UsersRole,
    UsersTeam,
    UserForgotPassword,
    Session,
    Starred,
    UsersNotificationSetting,
    Notification,
    UsersCreatePassword
};

Object.keys(models).forEach(modelName => {
    if ("associate" in models[modelName]) {
        models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;
// models.sequelize.sync();
module.exports = models;
