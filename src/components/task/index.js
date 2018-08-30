import React from "react"

import Header from "../partial/header"
import Form from "./form"
import List from "./list"
import _ from "lodash";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
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
            socket.emit("GET_TASK_DETAIL",id)
        }
    }

    render() {
        let { task, projectData} = this.props;
        let Component = <div>
                <h3>&nbsp;&nbsp;&nbsp;&nbsp;<a href={"/project/"+project} style={{color:"#000",textDecortion:"none"}}>{projectData.Selected.project}</a></h3>
                {
                    (_.isEmpty(task.Selected) == false) && <ul class="list-inline" style={{margin:"20px"}}>
                        <li style={{width:"60px"}}>&nbsp;&nbsp;<span class="fa fa-tag" title="tag"></span></li>
                        <li style={{width:"100x"}}>&nbsp;&nbsp;<span class="label label-success" style={{margin:"5px"}}>{task.Selected.workstream_workstream}</span></li>
                    </ul>
                }
                {task.FormActive == "List" &&
                    <List />
                }

                {task.FormActive == "Form" &&
                    <Form />
                }
            </div>
        return (
            <Header component={Component} page={"task"} />
        )
    }
}