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
    }

    render() {
        let { socket, task, project, dispatch } = this.props

        return (
            <div>
                <List />

                {task.FormActive == "Form" &&
                    <Form />
                }
            </div>
        )
    }
}