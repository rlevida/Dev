import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'
import Global from "./global"
import Auth from "./auth"
import Users from "./users"
import Company from "./company"
import Project from "./project"

export default class Socket extends React.Component {
    render() {
        return <div>
                    <Global />
                    <Auth />
                    <Users />
                    <Company />
                    <Project />
                </div>
    }
}