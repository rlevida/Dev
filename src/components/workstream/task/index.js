import React from "react"

import List from "./list"
import Form from "./form"

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

        return (
            <div>
                {task.FormActive == "List" &&
                    <List />
                }

                {task.FormActive == "Form" &&
                    <Form />
                }
            </div>
        )
    }
}