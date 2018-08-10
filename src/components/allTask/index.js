import React from "react"

import Header from "../partial/header"
import Form from "./form"
import List from "./list"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        project: store.project,
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
        let { socket, task, project, dispatch } = this.props
        let Component = <div>
                <h3>&nbsp;&nbsp;&nbsp;&nbsp;{project.Selected.project}</h3>
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