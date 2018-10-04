import React from "react"
import Header from "../partial/header"
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

    componentDidMount(){
        let { socket } = this.props;
        socket.emit("GET_TASK_DETAIL",{ id : taskId })
    }

    render() {
        let { socket, task, project, dispatch } = this.props
        let Component = 
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">Workstream {workstreamId}</h3>
            </div>
            <div class="panel-body">
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
            </div>
        </div>
        return (
            <Header component={Component} page={"Task"} />
        )
    }
}