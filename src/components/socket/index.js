import React from "react"

import Global from "./global"
import Auth from "./auth"
import Users from "./users"
import Company from "./company"
import Project from "./project"
import Type from "./type"
import Status from "./status"
import Role from "./role"
import Team from "./teams"
import Workstream from "./workstream"
import Member from "./member"
import Document from "./document"

export default class Socket extends React.Component {
    render() {
        return <div>
                    <Global />
                    <Auth />
                    <Users />
                    <Company />
                    <Project />
                    <Status />
                    <Type />
                    <Role />
                    <Team />
                    <Workstream />
                    <Member />
                    <Document/>
                </div>
    }
}