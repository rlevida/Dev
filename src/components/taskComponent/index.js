import React from "react"
import { connect } from "react-redux"
import Header from "../partial/header"
import List from "./list"
import Form from "./form"

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
        let Component = <div class="panel panel-default">
                                    <div class="panel-heading">
                                        <h3 class="panel-title">Task</h3>
                                    </div>
                                    <div class="panel-body">
                                        <div className="col-lg-6 col-md-6 col-sm-12">
                                            <List />
                                        </div>
                                        <div class="col-lg-6 col-md-6 col-sm-12">
                                            <Form />
                                        </div>
                                    </div>
                                </div>

        return (
            <div>
                { (typeof workstreamId != "undefined") 
                    ? <Header component={Component} page={"task"} />
                    :   <div>
                            <div className={ task.FormActive == "View" ? "col-lg-6 col-md-6 col-sm-12"  : "col-lg-12 col-md-12 col-sm-12"}>
                                <List />
                            </div>
                            { (task.FormActive == "View") &&
                                <div class="col-lg-6 col-md-6 col-sm-12">
                                    <Form />
                                </div>
                            }
                        </div>
                }
            </div>
        )
    }
}