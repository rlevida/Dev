import { combineReducers } from "redux"

import socket from "./socket"
import login from "./login"
import loggedUser from "./loggedUser"
import users from "./users"
import company from "./company"
import members from "./members"
import project from "./project"
import workstream from "./workstream"
import task from "./task"
import notes from "./notes"
import type from "./type"
import role from "./role"
import status from "./status"
import teams from "./teams"
import global from "./global"
import document from "./document"
import settings from "./settings"
import conversation from "./conversation"
import starred from "./starred"
import folder from "./folder"
import reminder from "./reminder"
import usersTeam from "./usersTeam"
import checklist from "./checklist"
import activityLog from "./activityLog"
import taskDependency from "./taskDependency"
import tasktimeLog from "./tasktimeLog"
import activityLogDocument from "./activityLogDocument"
import notification from "./notification"

export default combineReducers({
    socket,
    login,
    loggedUser,
    users,
    company,
    project,
    type,
    role,
    status,
    teams,
    workstream,
    members,
    global,
    document,
    workstream,
    task,
    notes,
    global,
    settings,
    conversation,
    starred,
    folder,
    reminder,
    usersTeam,
    checklist,
    activityLog,
    taskDependency,
    activityLogDocument,
    tasktimeLog,
    notification
})