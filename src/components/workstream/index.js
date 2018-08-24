import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'
import Header from "../partial/header"
import Form from "./form"
import List from "./list"
import WorkstreamDocumentViewer from "./workstreamDocumentViewer"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        projectData: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
        this.editData = this.editData.bind(this)
    }

    editData(id) {
        let { socket, dispatch } = this.props
        if(id == ""){
            dispatch({type:"SET_workspace_FORM_ACTIVE", FormActive: "Form" })
        }else{
            socket.emit("GET_WORKSTREAM_DETAIL",id)
        }
    }

    render() {
        let { socket, workstream, projectData, dispatch } = this.props
        let Component = <div>
                <h3>&nbsp;&nbsp;&nbsp;&nbsp;<a href={"/project/"+project} style={{color:"#000",textDecortion:"none"}}>{projectData.Selected.project}</a></h3>
                {
                    (typeof workstream.Selected.id != "undefined") && 
                    <ul class="list-inline" style={{margin:"20px"}}>
                        <li class="list-inline-item"><a href="javascript:void(0)" onClick={() => dispatch({type:"SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "task" })}>List</a>&nbsp;&nbsp;</li>|
                        <li class="list-inline-item" style={{color:"gray"}}>Calendar&nbsp;&nbsp;</li>|
                        <li class="list-inline-item" style={{color:"gray"}}>Timeline&nbsp;&nbsp;</li>|
                        <li class="list-inline-item"><a href="javascript:void(0)" onClick={() => dispatch({type:"SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "member" })}>Members</a>&nbsp;&nbsp;</li>|
                        <li class="list-inline-item"><a href="javascript:void(0)" onClick={() => dispatch({type:"SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "document" })}>Documents</a>&nbsp;&nbsp;</li>|
                        <li class="list-inline-item" style={{color:"gray"}}>Conversation</li>
                    </ul> 
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