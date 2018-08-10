import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'
import Header from "../partial/header"
import DocumentStatus from "./documentStatus"
import Task from "./task"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        project: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
    }

    render() {
        let { socket, project, dispatch } = this.props
        let Component = <div>
                <h3>&nbsp;&nbsp;&nbsp;&nbsp;{project.Selected.project}</h3>
                <div class="row">
                    <Task />
                </div>
                <div class="row">
                    <DocumentStatus/>
                </div>
                
            </div>
        return (
            <Header component={Component} page={"Project"} />
        )
    }
}