/* jshint indent: 2 */
module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define(
        "users",
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            firstName: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            lastName: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            phoneNumber: {
                type: DataTypes.STRING(20),
                allowNull: true
            },
            companyId: {
                type: DataTypes.BIGINT,
                allowNull: true
            },
            username: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            password: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            salt: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            userType: {
                type: DataTypes.ENUM("Internal", "External"),
                allowNull: true
            },
            avatar: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            emailAddress: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            dateAdded: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
            },
            dateUpdated: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
            },
            isActive: {
                type: DataTypes.INTEGER(1),
                allowNull: true,
                defaultValue: "1"
            },
            isDeleted: {
                type: DataTypes.INTEGER(1),
                allowNull: true,
                defaultValue: "0"
            },
            termsAndConditions: {
                type: DataTypes.INTEGER(1),
                allowNull: true,
                defaultValue: "0"
            },
            company: {
                type: DataTypes.STRING(50),
                allowNull: true
            }
        },
        {
            timestamps: false
        }
    );

    Users.associate = models => {
        Users.hasOne(models.Session, {
            as: "user",
            foreignKey: "usersId"
        });
        Users.hasMany(models.Members, {
            as: "members",
            foreignKey: "userTypeLinkId"
        });

        Users.hasMany(models.UsersRole, {
            as: "user_role",
            foreignKey: "usersId"
        });
        Users.hasMany(models.UsersTeam, {
            as: "users_team",
            foreignKey: "usersId"
        });
        Users.hasMany(models.UsersTeam, {
            as: "team",
            foreignKey: "usersId"
        });
        Users.hasMany(models.Members, {
            as: "projectId",
            foreignKey: "userTypeLinkId"
        });

        Users.hasMany(models.Members, {
            as: "user_projects",
            foreignKey: "userTypeLinkId"
        });

        Users.hasMany(models.Teams, {
            as: "team_as_teamLeader",
            foreignKey: "teamLeaderId"
        });

        Users.hasMany(models.TaskMemberReminder, {
            as: "task_member_reminder",
            foreignKey: "usersId"
        });
        Users.hasMany(models.UsersNotificationSetting, {
            as: "notification_setting",
            foreignKey: "usersId"
        });
        Users.hasOne(models.Notification, {
            as: "from",
            foreignKey: "createdBy"
        });
        Users.hasOne(models.Notification, {
            as: "to",
            foreignKey: "usersId"
        });
        Users.hasOne(models.Session, {
            as: "session",
            foreignKey: "usersId"
        });
        Users.hasMany(models.Tasks, {
            as: "task_approver",
            foreignKey: "approverId"
        })
        Users.hasMany(models.Members, {
            as: "task_assigned",
            sourceKey: "id",
            foreignKey: "userTypeLinkId"
        })
        Users.hasMany(models.Members, {
            as: 'task_follower',
            sourceKey: "id",
            foreignKey: "userTypeLinkId"
        })
        Users.hasMany(models.Teams, {
            as: 'task_team_leader',
            sourceKey: "id",
            foreignKey: "teamLeaderId"
        })
        Users.hasMany(models.Members, {
            as: "task_responsible",
            sourceKey: "id",
            foreignKey: "userTypeLinkId"
        })
        Users.hasOne(models.UsersNotificationSetting, {
            as: "user_notification_setting",
            sourceKey: "id",
            foreignKey: "usersId"
        })
        Users.hasMany(models.Conversation, {
            as: "users_conversation",
            foreignKey: "usersId"
        });
    };

    return Users;
};
