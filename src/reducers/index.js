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
    global,
    settings,
    conversation,
    starred,
    folder,
    reminder,
    usersTeam,
    checklist
})