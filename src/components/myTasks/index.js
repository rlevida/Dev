import React from "react";
import { connect } from "react-redux";

import MyTaskList from "./myTaskList";
import TaskForm from "../task/taskForm";

@connect((store) => {
    return {
        task: store.task,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
    }

    render() {
        const { task } = this.props;
        return (
            <div>
                {
                    (task.FormActive == "List") && <MyTaskList />
                }
                {
                    (task.FormActive == "Form") && <TaskForm />
                }
            </div>
        )
    }
}