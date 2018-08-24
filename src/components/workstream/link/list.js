import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../../globalComponents";
import moment from 'moment'

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
export default class List extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { workstream, projectData, dispatch , task } = this.props
        return <div>
            <div>
                <ul class="list-inline" style={{margin:"20px"}}>
                    <li class="list-inline-item"><a href="javascript:void(0)" onClick={() => dispatch({type:"SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "task" })}>List</a>&nbsp;&nbsp;</li>|
                    <li class="list-inline-item" style={{color:"gray"}}>Calendar&nbsp;&nbsp;</li>|
                    <li class="list-inline-item" style={{color:"gray"}}>Timeline&nbsp;&nbsp;</li>|
                    <li class="list-inline-item"><a href="javascript:void(0)" onClick={() => dispatch({type:"SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "member" })}>Members</a>&nbsp;&nbsp;</li>|
                    <li class="list-inline-item"><a href="javascript:void(0)" onClick={() => dispatch({type:"SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "document" })}>Documents</a>&nbsp;&nbsp;</li>|
                    <li class="list-inline-item" style={{color:"gray"}}>Conversation</li>
                </ul> 
                    <ul class="list-inline" style={{margin:"20px"}}>
                    <li style={{width:"40px"}}><span class="fa fa-circle" style={{color:"green"}}></span></li>
                    <li style={{width:"100px"}}>Status: {task.List.filter( e => { if(e.status == "Completed"){ return e} }).length } / {task.List.length}</li>
                    <li style={{width:"100px"}}>Type:&nbsp;&nbsp; <span class={ /* Project Based or Time Based */ workstream.Selected.typeId == 4 ? "fa fa-calendar" : "glyphicon glyphicon-time" } title={workstream.Selected.typeId == 4 ? "Project - Output base" : "Time based"}></span> </li>
                    <li style={{width:"60px"}}>&nbsp;&nbsp;<span class="fa fa-tag" title="tag"></span></li>
                    <li style={{width:"100x"}}>&nbsp;&nbsp;<span class="label label-success" style={{margin:"5px"}}>{workstream.Selected.workstream}</span></li>
                </ul>
                <ul  class="list-inline" style={{margin:"20px"}}>
                    <li>{workstream.Selected.projectDescription}</li>
                </ul>
            </div>
        </div>
    }
}