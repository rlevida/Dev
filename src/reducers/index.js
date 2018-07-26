import { combineReducers } from "redux"

import socket from "./socket"
import login from "./login"
import loggedUser from "./loggedUser"
import users from "./users"
import company from "./company"
import members from "./members"
import project from "./project"
import workstream from "./workstream"
import type from "./type"
import role from "./role"
import status from "./status"
import teams from "./teams"
import global from "./global"
import document from "./document"

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
    global
})