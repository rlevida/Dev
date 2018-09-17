import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'
import Header from "../partial/header"
import DocumentStatus from "./documentStatus"
import Task from "./task"
import WorkstreamStatus from "../workstream/workstreamStatus"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        projectData: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { socket, projectData, dispatch } = this.props
        let Component = <div class="pd20">
            <h3 class="m0"><a href={"/project/" + project} style={{ color: "#000", textDecortion: "none" }}>{projectData.Selected.project}</a></h3>
            <div class="row pdl20 pdr20 mb20">
                <div class="col-md-8">
                    <h4 class="mt20 mb20">My Tasks</h4>
                    <a class="more" href={"/project/tasks/" + project}>+ More</a>
                    <Task />
                </div>
            </div>
            <div class="row pdl20 pdr20 mb20">
                <div class="col-md-6">
                    <h4 class="mt20 mb20">Workstreams</h4>
                    <a class="more" href={"/project/processes/" + project}> + More</a>
                    <WorkstreamStatus />
                </div>
            </div>
            <div class="row pdl20 pdr20">
                <div class="col-md-6">
                    <h4 class="mt20 mb20">Documents</h4>
                    <a class="more" href={"/project/documents/"+project}> + More</a>
                    <DocumentStatus />
                </div>
            </div>
        </div>
        return (
            <Header component={Component} page={"Project Dashboard"} />
        )
    }
}