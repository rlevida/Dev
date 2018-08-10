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
        let Component = <div>
                <h3>&nbsp;&nbsp;&nbsp;&nbsp;<a href={"/project/"+project} style={{color:"#000",textDecortion:"none"}}>{projectData.Selected.project}</a></h3>
                <div class="row">
                    <Task />
                </div>
                <div class="row">
                    <div class="col-md-8" style={{padding:"35px"}}>
                        <h3>Workstream</h3><a style={{float:"right"}}  href={"/project/processes/"+project}>+ More</a>
                        <WorkstreamStatus />
                    </div>
                </div>
                <div class="row"  style={{padding:"20px"}}>
                    <DocumentStatus/>
                </div>
                
            </div>
        return (
            <Header component={Component} page={"Project"} />
        )
    }
}