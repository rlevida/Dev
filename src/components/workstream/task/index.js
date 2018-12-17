import React from "react"
import { connect } from "react-redux"
import List from "./list"
import Form from "./form"

@connect((store) => {
    return {
        task: store.task,
        project: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    render() {
        let { task, dispatch } = this.props
        return (
            <div>
                <div className={ task.FormActive == "View" ? "col-lg-6 col-md-6 col-sm-12"  : "col-lg-12 col-md-12 col-sm-12"}>
                    <List />
                </div>
                {(task.FormActive == "View") &&
                    <div class="col-lg-6 col-md-6 col-sm-12">
                        <a style={{ float: "right", color: "#000" }} onClick={() => dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "" })}><i class="fa fa-times fa-lg"></i></a>
                        <Form />
                    </div>
                }
            </div>
        )
    }
}