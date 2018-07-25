import { combineReducers } from "redux"

import socket from "./socket"
import login from "./login"
import loggedUser from "./loggedUser"
import users from "./users"
import company from "./company"
import project from "./project"
import type from "./type"
import status from "./status"
import global from "./global"

export default combineReducers({
    socket,
    login,
    loggedUser,
    users,
    company,
    project,
    type,
    status,
    global
})