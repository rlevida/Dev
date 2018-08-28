import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'
import Header from "../partial/header"
import Form from "./form"
import List from "./list"
import Link from "./link"
import WorkstreamDocumentViewer from "./workstreamDocumentViewer"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        projectData: store.project,
        loggedUser: store.loggedUser,
        task : store.task
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
    }

    render() {
        let { workstream, projectData, dispatch , task } = this.props
        let Component = <div>
                <h3>&nbsp;&nbsp;&nbsp;&nbsp;<a href={"/project/"+project} style={{color:"#000",textDecortion:"none"}}>{projectData.Selected.project}</a></h3>
                { (workstream.FormActive == "Form" && typeof workstream.Selected.id != "undefined") &&
                    <Link/>
                } 
               
                {workstream.FormActive == "List" &&
                    <List />
                }

                {workstream.FormActive == "Form" &&
                    <Form />
                }
                
                {workstream.FormActive == "WorkstreamDocumentViewer" &&
                    <WorkstreamDocumentViewer/>
                }
            </div>
        return (
            <Header component={Component} page={"Workstream"} />
        )
    }
}