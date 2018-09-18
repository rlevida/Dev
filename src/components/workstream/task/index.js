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
            <div class="row">
                <div className={(task.FormActive == "Form") ? "col-lg-6 col-md-6 col-sm-12" : "col-lg-12"}>
                    <List />
                </div>
                {
                    (task.FormActive == "Form") && <div class="col-lg-6 col-md-6 col-sm-12">
                        <Form />
                    </div>
                }
            </div>
        )
    }
}